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
}

function rowToPlan(row: DatePlanRow): DatePlan {
  return {
    id: row.id,
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

/**
 * Taste memory: venues from past plans, so new suggestions never repeat places
 * the user has been, and thumbs up/down verdicts steer future picks.
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

    const { data } = await supabase
      .from('date_plans')
      .select('status, items')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(25);

    const avoid = new Set<string>();
    const loved = new Set<string>();
    const disliked = new Set<string>();
    for (const row of data ?? []) {
      const stops = (Array.isArray(row.items) ? row.items : []) as unknown as PlanStop[];
      for (const stop of stops) {
        if (!stop?.venueName) continue;
        if (stop.feedback === 'up') loved.add(stop.venueName);
        if (stop.feedback === 'down') disliked.add(stop.venueName);
        // Places from scheduled/completed plans are "been there" — don't repeat.
        if (row.status === 'scheduled' || row.status === 'completed') {
          avoid.add(stop.venueName);
        }
      }
    }
    return {
      avoidVenues: [...avoid].slice(0, 40),
      lovedVenues: [...loved].slice(0, 20),
      dislikedVenues: [...disliked].slice(0, 20),
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

export async function updatePlanStatus(id: string, status: DatePlan['status']): Promise<void> {
  const { error } = await supabase.from('date_plans').update({ status }).eq('id', id);
  if (error) throw new Error(`Failed to update plan: ${error.message}`);
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
