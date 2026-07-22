// revenuecat-webhook — Supabase Edge Function
//
// Receives RevenueCat webhook events and writes the authoritative subscription
// tier to profiles.subscription_tier / subscription_expires_at. This is the ONLY
// writer of that column — the app never sets it (a client write would be
// spoofable). RevenueCat's app_user_id is our Supabase auth user id (the app
// calls Purchases.logIn(user.id)).
//
// Config:
//   - RevenueCat dashboard → Integrations → Webhooks: point at this function's URL
//     and set an Authorization header value; store the same value as the
//     REVENUECAT_WEBHOOK_AUTH secret here.
//   - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// Secrets: supabase secrets set REVENUECAT_WEBHOOK_AUTH=<shared-secret>

import { createClient } from 'npm:@supabase/supabase-js@2';

type Tier = 'trial' | 'basic' | 'premium';

interface RcEvent {
  type: string;
  app_user_id?: string;
  aliases?: string[];
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
}

// Events that grant/refresh access vs. end it. CANCELLATION (auto-renew off) and
// BILLING_ISSUE keep access until the sub actually expires, so they are ignored.
const GRANTING = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
  'TRANSFER',
]);
const REVOKING = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Our Supabase user id is a UUID; RevenueCat anonymous ids are not. */
function resolveUserId(event: RcEvent): string | null {
  const candidates = [event.app_user_id, ...(event.aliases ?? [])];
  return candidates.find((id) => typeof id === 'string' && UUID_RE.test(id)) ?? null;
}

/** Returns the tier + expiry to persist, or null when the event is a no-op. */
function resolveTier(event: RcEvent): { tier: Tier; expiresAt: string | null } | null {
  if (REVOKING.has(event.type)) return { tier: 'trial', expiresAt: null };
  if (!GRANTING.has(event.type)) return null;
  const ents = event.entitlement_ids ?? [];
  const tier: Tier = ents.includes('premium')
    ? 'premium'
    : ents.includes('basic')
      ? 'basic'
      : 'trial';
  if (tier === 'trial') return null; // granting event with no known entitlement
  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
  return { tier, expiresAt };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!expected || req.headers.get('Authorization') !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  let event: RcEvent;
  try {
    event = (await req.json())?.event ?? {};
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const userId = resolveUserId(event);
  const resolved = resolveTier(event);
  // Always 200 so RevenueCat doesn't retry no-op events (cancellations, etc.).
  if (!userId || !resolved) return new Response('ok', { status: 200 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: resolved.tier,
      subscription_expires_at: resolved.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[revenuecat-webhook] update failed', { userId, type: event.type, error });
    return new Response('error', { status: 500 });
  }
  console.log('[revenuecat-webhook] set tier', { userId, type: event.type, tier: resolved.tier });
  return new Response('ok', { status: 200 });
});
