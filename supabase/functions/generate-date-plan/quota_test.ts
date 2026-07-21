// deno test supabase/functions/generate-date-plan/quota_test.ts
//
// The quota gate guards real API spend (~$0.47/generation), so every branch
// is pinned here — including the exact user-facing copy, which the app's
// error surfaces rely on.
//
// Pricing model under test: 1 lifetime trial date → Basic $9.99 (3/mo) →
// Premium $19.99 (15/mo, 5/day, vacations).

import { assertEquals } from 'jsr:@std/assert';
import {
  LIGHT_MODES,
  PLAN_MODES,
  bucketForMode,
  checkQuota,
  limitsForTier,
  tierFor,
  windowStarts,
} from './quota.ts';

Deno.test('plan modes and light modes are disjoint buckets', () => {
  for (const m of PLAN_MODES) assertEquals(LIGHT_MODES.includes(m), false);
  assertEquals(bucketForMode('plan_for_me'), {
    isSuggestion: false,
    modeFilter: PLAN_MODES,
    label: 'plans',
  });
  assertEquals(bucketForMode('replace_stop'), {
    isSuggestion: true,
    modeFilter: LIGHT_MODES,
    label: 'quick searches',
  });
  // Unknown/missing modes count against the expensive bucket, never the free one.
  assertEquals(bucketForMode(undefined).isSuggestion, false);
  assertEquals(bucketForMode('anything_else').isSuggestion, false);
});

Deno.test('tier parsing: only explicit basic/premium unlock paid caps', () => {
  assertEquals(tierFor(null), 'trial');
  assertEquals(tierFor({ subscription_tier: 'free' }), 'trial');
  assertEquals(tierFor({ subscription_tier: null }), 'trial');
  assertEquals(tierFor({ subscription_tier: 'basic' }), 'basic');
  assertEquals(tierFor({ subscription_tier: 'premium' }), 'premium');
  // Unrecognized tiers are trial — the safe, cheap default.
  assertEquals(tierFor({ subscription_tier: 'jetsetter' }), 'trial');
});

Deno.test('limits match the pricing model', () => {
  assertEquals(limitsForTier('basic'), { monthly: 3, daily: 3 });
  assertEquals(limitsForTier('premium'), { monthly: 15, daily: 5 });
  assertEquals(limitsForTier('trial'), { monthly: 3, daily: 3 });
});

Deno.test('window starts are UTC and roll over correctly', () => {
  const midMonth = windowStarts(new Date('2026-07-21T15:30:00Z'));
  assertEquals(midMonth.monthStart, '2026-07-01T00:00:00.000Z');
  assertEquals(midMonth.dayStart, '2026-07-21T00:00:00.000Z');

  const nye = windowStarts(new Date('2026-12-31T23:59:59Z'));
  assertEquals(nye.monthStart, '2026-12-01T00:00:00.000Z');
  assertEquals(nye.dayStart, '2026-12-31T00:00:00.000Z');

  const newYear = windowStarts(new Date('2027-01-01T00:00:00Z'));
  assertEquals(newYear.monthStart, '2027-01-01T00:00:00.000Z');
  assertEquals(newYear.dayStart, '2027-01-01T00:00:00.000Z');
});

Deno.test('trial: exactly one lifetime plan generation', () => {
  const base = { mode: 'plan_for_me', tier: 'trial' as const, monthlyUsed: 0, dailyUsed: 0 };
  assertEquals(checkQuota({ ...base, lifetimeUsed: 0 }), { allowed: true });
  assertEquals(checkQuota({ ...base, lifetimeUsed: 1 }), {
    allowed: false,
    error: 'Your free trial date is used — hope it was a good one. Subscribe to keep planning.',
    subscriptionRequired: true,
  });
  // Missing lifetime count defaults to 0 (allowed) — index.ts must pass it.
  assertEquals(checkQuota({ ...base }), { allowed: true });
});

Deno.test('trial: quick searches use the basic-sized bucket, not the lifetime gate', () => {
  const base = { mode: 'suggest_destinations', tier: 'trial' as const, lifetimeUsed: 99 };
  assertEquals(checkQuota({ ...base, monthlyUsed: 2, dailyUsed: 2 }), { allowed: true });
  const capped = checkQuota({ ...base, monthlyUsed: 3, dailyUsed: 0 });
  assertEquals(capped, {
    allowed: false,
    error: "You've used all 3 quick searches for this month. Your limit resets on the 1st.",
  });
});

Deno.test('basic: 3/month with Basic-plan copy', () => {
  const base = { mode: 'plan_for_me', tier: 'basic' as const, dailyUsed: 0 };
  assertEquals(checkQuota({ ...base, monthlyUsed: 2 }), { allowed: true });
  assertEquals(checkQuota({ ...base, monthlyUsed: 3 }), {
    allowed: false,
    error: "You've used all 3 plans for this month on the Basic plan. Your limit resets on the 1st.",
  });
});

Deno.test('premium: monthly cap 15, daily cap 5', () => {
  const base = { mode: 'single', tier: 'premium' as const };
  assertEquals(checkQuota({ ...base, monthlyUsed: 14, dailyUsed: 4 }), { allowed: true });
  assertEquals(checkQuota({ ...base, monthlyUsed: 15, dailyUsed: 0 }), {
    allowed: false,
    error: "You've used all 15 plans for this month. Your limit resets on the 1st.",
  });
  assertEquals(checkQuota({ ...base, monthlyUsed: 5, dailyUsed: 5 }), {
    allowed: false,
    error: 'Daily limit reached (5 plans). Try again tomorrow.',
  });
});

Deno.test('monthly cap is checked before daily cap', () => {
  const verdict = checkQuota({ mode: 'single', tier: 'premium', monthlyUsed: 15, dailyUsed: 5 });
  assertEquals(verdict.allowed, false);
  if (!verdict.allowed) assertEquals(verdict.error.includes('this month'), true);
});

Deno.test('vacation mode is premium-only for every other tier', () => {
  const expectBlocked = {
    allowed: false,
    error: 'Multi-day trip planning is a Premium feature. Upgrade to plan vacations.',
    premiumRequired: true,
  };
  assertEquals(
    checkQuota({ mode: 'vacation', tier: 'trial', monthlyUsed: 0, dailyUsed: 0, lifetimeUsed: 0 }),
    expectBlocked
  );
  assertEquals(
    checkQuota({ mode: 'vacation', tier: 'basic', monthlyUsed: 0, dailyUsed: 0 }),
    expectBlocked
  );
  assertEquals(checkQuota({ mode: 'vacation', tier: 'premium', monthlyUsed: 0, dailyUsed: 0 }), {
    allowed: true,
  });
});
