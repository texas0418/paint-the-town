/**
 * Date Plan Service
 *
 * - generatePlans(): calls the generate-date-plan Edge Function (Claude + web
 *   search) and returns real-venue plans matching the user's taste profile.
 * - CRUD for saved plans in the date_plans table.
 */

import { supabase } from '@/lib/supabase';
import { Json } from '@/lib/database.types';
import {
  DatePlan,
  DestinationSuggestion,
  GeneratedPlan,
  GeneratePlanRequest,
  PlanProgress,
  PlanStop,
  TasteProfile,
} from '@/types/planner';

interface DatePlanRow {
  id: string;
  user_id: string;
  title: string;
  city: string;
  plan_date: string | null;
  start_time: string | null;
  total_budget: number | null;
  estimated_cost: number | null;
  status: DatePlan['status'];
  source: DatePlan['source'];
  vibe: string | null;
  items: Json;
  created_at: string;
  shared_with_partner: boolean;
}

function rowToPlan(row: DatePlanRow): DatePlan {
  return {
    id: row.id,
    ownerId: row.user_id,
    title: row.title,
    city: row.city,
    planDate: row.plan_date,
    startTime: row.start_time,
    totalBudget: row.total_budget,
    estimatedCost: row.estimated_cost,
    status: row.status,
    source: row.source,
    vibe: row.vibe,
    stops: Array.isArray(row.items) ? (row.items as unknown as PlanStop[]) : [],
    createdAt: row.created_at,
    sharedWithPartner: row.shared_with_partner,
  };
}

const JOB_POLL_INTERVAL_MS = 5000;
const JOB_TIMEOUT_MS = 8 * 60 * 1000;

async function waitForJob(
  jobId: string,
  onProgress?: (progress: PlanProgress) => void
): Promise<unknown> {
  const deadline = Date.now() + JOB_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, JOB_POLL_INTERVAL_MS));
    const { data, error } = await supabase
      .from('plan_jobs')
      .select('status, plans, error, progress')
      .eq('id', jobId)
      .single();
    if (error) throw new Error(`Failed to check plan status: ${error.message}`);
    if (data.progress && onProgress) {
      onProgress(data.progress as unknown as PlanProgress);
    }
    if (data.status === 'done') return data.plans;
    if (data.status === 'error') {
      throw new Error(data.error ?? 'Plan generation failed. Please try again.');
    }
  }
  throw new Error('Plan generation timed out. Please try again.');
}

type VenueSignalSets = { avoid: Set<string>; loved: Set<string>; disliked: Set<string> };

/**
 * Folds one past plan's stops into the loved/disliked/avoid sets. The evening-level
 * journal rating is applied first so an explicit per-stop thumb always overrides it.
 */
function applyPlanSignals(
  stops: PlanStop[],
  rating: number | undefined,
  status: string | null | undefined,
  sets: VenueSignalSets
): void {
  // Places from scheduled/completed plans are "been there" — don't repeat.
  const beenThere = status === 'scheduled' || status === 'completed';
  for (const stop of stops) {
    if (!stop?.venueName) continue;
    const name = stop.venueName;
    if (rating != null && rating >= 5) sets.loved.add(name);
    if (rating != null && rating <= 2) sets.disliked.add(name);
    if (stop.feedback === 'up') {
      sets.loved.add(name);
      sets.disliked.delete(name);
    }
    if (stop.feedback === 'down') {
      sets.disliked.add(name);
      sets.loved.delete(name);
    }
    if (beenThere) sets.avoid.add(name);
  }
}

/**
 * Taste memory: venues from past plans, so new suggestions never repeat places
 * the user has been, and thumbs up/down verdicts steer future picks. Journal
 * ratings add a whole-evening signal — an unforgettable night endorses all
 * its venues, a bad one warns against them — but explicit per-stop thumbs
 * always win over the evening-level inference.
 */
async function getVenueHistory(): Promise<{
  avoidVenues: string[];
  lovedVenues: string[];
  dislikedVenues: string[];
}> {
  const empty = { avoidVenues: [], lovedVenues: [], dislikedVenues: [] };
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const [{ data }, { data: journalRows }] = await Promise.all([
      supabase
        .from('date_plans')
        .select('id, status, items')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('date_journal_entries')
        .select('plan_id, rating')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);
    const ratingByPlan = new Map<string, number>();
    for (const j of journalRows ?? []) ratingByPlan.set(j.plan_id, j.rating);

    const sets: VenueSignalSets = { avoid: new Set(), loved: new Set(), disliked: new Set() };
    for (const row of data ?? []) {
      const stops = (Array.isArray(row.items) ? row.items : []) as unknown as PlanStop[];
      applyPlanSignals(stops, ratingByPlan.get(row.id), row.status, sets);
    }
    return {
      avoidVenues: [...sets.avoid].slice(0, 40),
      lovedVenues: [...sets.loved].slice(0, 20),
      dislikedVenues: [...sets.disliked].slice(0, 20),
    };
  } catch (e) {
    console.error('Failed to gather venue history:', e);
    return empty;
  }
}

/** For "I don't know where to go": 3 destination suggestions matched to the profile. */
export async function suggestDestinations(
  request: GeneratePlanRequest
): Promise<DestinationSuggestion[]> {
  const { data, error } = await supabase.functions.invoke('generate-date-plan', {
    body: { ...request, mode: 'suggest_destinations' },
  });
  if (error) throw new Error(`Destination search failed: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  if (!data?.jobId) throw new Error('Destination search did not start. Please try again.');
  const result = await waitForJob(data.jobId as string);
  return (result as DestinationSuggestion[]) ?? [];
}

export async function generatePlans(
  request: GeneratePlanRequest,
  onProgress?: (progress: PlanProgress) => void
): Promise<GeneratedPlan[]> {
  const history = await getVenueHistory();
  const { data, error } = await supabase.functions.invoke('generate-date-plan', {
    body: { ...request, ...history },
  });

  if (error) {
    throw new Error(`Plan generation failed: ${error.message}`);
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  if (!data?.jobId) {
    throw new Error('Plan generation did not start. Please try again.');
  }

  const rawPlans = await waitForJob(data.jobId as string, onProgress);

  const plans = ((rawPlans as unknown[]) ?? []) as Array<
    Omit<GeneratedPlan, 'planDate' | 'totalBudget' | 'source'> & { estimatedCost: number }
  >;

  return plans.map((p) => ({
    ...p,
    planDate: request.date ?? null,
    totalBudget: request.budget,
    source: 'ai' as const,
    stops: (p.stops ?? []).sort((a, b) => a.order - b.order),
  }));
}

export async function savePlan(plan: GeneratedPlan): Promise<DatePlan> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('date_plans')
    .insert({
      user_id: user.id,
      title: plan.title,
      city: plan.city,
      plan_date: plan.planDate,
      start_time: plan.startTime,
      total_budget: plan.totalBudget,
      estimated_cost: plan.estimatedCost,
      source: plan.source,
      vibe: plan.vibe,
      items: plan.stops as unknown as Json,
      status: 'saved',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save plan: ${error.message}`);
  return rowToPlan(data as DatePlanRow);
}

export async function listPlans(): Promise<DatePlan[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('date_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load plans: ${error.message}`);
  return ((data ?? []) as DatePlanRow[]).map(rowToPlan);
}

export async function getPlan(id: string): Promise<DatePlan | null> {
  const { data, error } = await supabase.from('date_plans').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to load plan: ${error.message}`);
  return data ? rowToPlan(data as DatePlanRow) : null;
}

export async function updatePlanTitle(id: string, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Give your date a name first.');
  const { error } = await supabase.from('date_plans').update({ title: trimmed }).eq('id', id);
  if (error) throw new Error(`Failed to rename plan: ${error.message}`);
}

export async function updatePlanStatus(id: string, status: DatePlan['status']): Promise<void> {
  const { error } = await supabase.from('date_plans').update({ status }).eq('id', id);
  if (error) throw new Error(`Failed to update plan: ${error.message}`);
}

/** Per-plan opt-in partner sharing (default off, so surprises stay secret). */
export async function updatePlanSharing(id: string, shared: boolean): Promise<void> {
  const { error } = await supabase
    .from('date_plans')
    .update({ shared_with_partner: shared })
    .eq('id', id);
  if (error) throw new Error(`Failed to update sharing: ${error.message}`);
}

/** Plans the linked partner has shared (RLS returns only shared ones). */
export async function listPartnerPlans(partnerId: string): Promise<DatePlan[]> {
  const { data, error } = await supabase
    .from('date_plans')
    .select('*')
    .eq('user_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to load partner plans: ${error.message}`);
  return ((data ?? []) as DatePlanRow[]).map(rowToPlan);
}

/** Persist edited stops (swaps, feedback) and refresh the estimated cost. */
export async function updatePlanStops(id: string, stops: PlanStop[]): Promise<void> {
  const estimatedCost = stops.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
  const { error } = await supabase
    .from('date_plans')
    .update({ items: stops as unknown as Json, estimated_cost: estimatedCost })
    .eq('id', id);
  if (error) throw new Error(`Failed to update plan: ${error.message}`);
}

/** Swap one stop of a plan for a fresh AI-picked venue. */
export async function replaceStop(params: {
  city: string;
  date: string | null;
  budget: number | null;
  profile: TasteProfile;
  stop: PlanStop;
  planVenues: string[];
  notes?: string;
}): Promise<PlanStop> {
  const history = await getVenueHistory();
  const { data, error } = await supabase.functions.invoke('generate-date-plan', {
    body: {
      mode: 'replace_stop',
      city: params.city,
      date: params.date ?? undefined,
      budget: params.budget ?? 100,
      profile: params.profile,
      stop: params.stop,
      planVenues: params.planVenues,
      notes: params.notes,
      ...history,
    },
  });
  if (error) throw new Error(`Swap failed: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  if (!data?.jobId) throw new Error('Swap did not start. Please try again.');

  const stop = (await waitForJob(data.jobId as string)) as PlanStop;
  if (!stop?.venueName) throw new Error('Could not find a replacement. Please try again.');
  return { ...stop, order: params.stop.order, day: params.stop.day };
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from('date_plans').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete plan: ${error.message}`);
}

export type SubscriptionTier = 'trial' | 'basic' | 'premium';

export interface PlanQuota {
  tier: SubscriptionTier;
  /** Convenience: any paying tier. */
  isPaid: boolean;
  monthlyUsed: number;
  monthlyLimit: number;
  dailyUsed: number;
  dailyLimit: number;
}

/**
 * Mirrors the server-side caps in the generate-date-plan edge function's
 * quota.ts (keep the two in sync). Pricing model: 1 lifetime trial date →
 * Basic $9.99 (3/mo) → Premium $19.99 (15/mo, 5/day, vacations). Counts
 * full plan generations only — quick searches and swaps have their own
 * server-side bucket.
 */
export async function getPlanQuota(): Promise<PlanQuota> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();
  const rawTier = profileRow?.subscription_tier;
  const tier: SubscriptionTier =
    rawTier === 'premium' ? 'premium' : rawTier === 'basic' ? 'basic' : 'trial';
  const limits = tier === 'premium' ? { monthly: 15, daily: 5 } : { monthly: 3, daily: 3 };

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const dayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();

  const countSince = async (since: string) => {
    const { count } = await supabase
      .from('plan_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'error')
      .gte('created_at', since)
      .in('request->>mode', ['plan_for_me', 'single', 'vacation']);
    return count ?? 0;
  };

  // Trial: the "month" is a lifetime of exactly one date.
  if (tier === 'trial') {
    const lifetimeUsed = await countSince('1970-01-01T00:00:00.000Z');
    return {
      tier,
      isPaid: false,
      monthlyUsed: Math.min(lifetimeUsed, 1),
      monthlyLimit: 1,
      dailyUsed: Math.min(lifetimeUsed, 1),
      dailyLimit: 1,
    };
  }

  const [monthlyUsed, dailyUsed] = await Promise.all([
    countSince(monthStart),
    countSince(dayStart),
  ]);

  return {
    tier,
    isPaid: true,
    monthlyUsed,
    monthlyLimit: limits.monthly,
    dailyUsed,
    dailyLimit: limits.daily,
  };
}
