/**
 * Usage-cap logic, extracted pure so it can be tested without burning
 * generations. index.ts supplies the DB counts; everything else — tier
 * parsing, buckets, windows, and the verdict — lives here.
 *
 * Pricing model (2026-07-21, Simon): no free plan. One lifetime trial date
 * for unsubscribed users, then Basic $9.99/mo = 3 dates/month, Premium
 * $19.99/mo = 15/month (5/day) + multi-day vacations. Caps sized against
 * measured API cost (~$0.40-0.50/generation on Sonnet 5 builders).
 *
 * The client mirrors these numbers in services/datePlanService.ts
 * (getPlanQuota) — keep the two in sync.
 */

/** Full plan generations — the expensive bucket. */
export const PLAN_MODES = ['plan_for_me', 'single', 'vacation'];
/** Cheap calls (destination search, stop swap) share their own bucket. */
export const LIGHT_MODES = ['suggest_destinations', 'replace_stop'];

export type Tier = 'trial' | 'basic' | 'premium';

export interface QuotaLimits {
  monthly: number;
  daily: number;
}

export interface QuotaBucket {
  modeFilter: string[];
  label: string;
  isSuggestion: boolean;
}

export function bucketForMode(mode: unknown): QuotaBucket {
  const isSuggestion = LIGHT_MODES.includes(String(mode));
  return {
    isSuggestion,
    modeFilter: isSuggestion ? LIGHT_MODES : PLAN_MODES,
    label: isSuggestion ? 'quick searches' : 'plans',
  };
}

/**
 * Missing profile / 'free' / anything unrecognized = trial (the safe,
 * cheap default). Only explicit 'basic' and 'premium' unlock paid caps.
 */
export function tierFor(profileRow: { subscription_tier?: string | null } | null): Tier {
  const t = profileRow?.subscription_tier;
  if (t === 'premium') return 'premium';
  if (t === 'basic') return 'basic';
  return 'trial';
}

/** Monthly/daily caps for the paid buckets; trial is handled by lifetime count. */
export function limitsForTier(tier: Tier): QuotaLimits {
  if (tier === 'premium') return { monthly: 15, daily: 5 };
  return { monthly: 3, daily: 3 }; // basic, and trial's light-bucket allowance
}

/** UTC month/day window starts, as ISO strings for created_at comparison. */
export function windowStarts(now: Date): { monthStart: string; dayStart: string } {
  return {
    monthStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    dayStart: new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    ).toISOString(),
  };
}

export type QuotaVerdict =
  | { allowed: true }
  | { allowed: false; error: string; premiumRequired?: boolean; subscriptionRequired?: boolean };

/**
 * The gate itself. Vacation mode fans out one generation per day — a 10-day
 * trip costs dollars, not cents — so it stays Premium-only. Trial users get
 * exactly one lifetime plan generation; quick searches for trial users share
 * the Basic-sized bucket so destination browsing still works as an upsell.
 */
export function checkQuota(params: {
  mode: unknown;
  tier: Tier;
  monthlyUsed: number;
  dailyUsed: number;
  /** All-time plan generations; only consulted for trial users. */
  lifetimeUsed?: number;
}): QuotaVerdict {
  const { mode, tier, monthlyUsed, dailyUsed, lifetimeUsed = 0 } = params;
  const { label, isSuggestion } = bucketForMode(mode);
  const limits = limitsForTier(tier);

  if (String(mode) === 'vacation' && tier !== 'premium') {
    return {
      allowed: false,
      error: 'Multi-day trip planning is a Premium feature. Upgrade to plan vacations.',
      premiumRequired: true,
    };
  }
  if (tier === 'trial' && !isSuggestion) {
    if (lifetimeUsed >= 1) {
      return {
        allowed: false,
        error:
          "Your free trial date is used — hope it was a good one. Subscribe to keep planning.",
        subscriptionRequired: true,
      };
    }
    return { allowed: true };
  }
  if (monthlyUsed >= limits.monthly) {
    return {
      allowed: false,
      error: `You've used all ${limits.monthly} ${label} for this month${tier === 'basic' ? ' on the Basic plan' : ''}. Your limit resets on the 1st.`,
    };
  }
  if (dailyUsed >= limits.daily) {
    return {
      allowed: false,
      error: `Daily limit reached (${limits.daily} ${label}). Try again tomorrow.`,
    };
  }
  return { allowed: true };
}
