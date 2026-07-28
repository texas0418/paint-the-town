// delete-account — Supabase Edge Function
//
// Permanently deletes the calling user's account (App Store Guideline 5.1.1(v)).
// The caller must be signed in: supabase.functions.invoke attaches the user's
// JWT, we resolve it to a user id, then delete via the admin API. Every public
// table (profiles, user_preferences, date_plans, plan_jobs, date_journal_entries,
// plan_shares, partner_links, anniversaries) has ON DELETE CASCADE from
// auth.users — verified against the live catalog 2026-07-27 — so one admin
// delete wipes all personal data. api_usage keeps only per-job token counts
// (no user column). Avatar files aren't FK-covered, so they're removed first.
//
// Secrets: SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are
// injected automatically.

import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return new Response('Unauthorized', { status: 401 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(jwt);
  if (userError || !user) return new Response('Unauthorized', { status: 401 });

  // Avatar files live under avatars/<uid>/ and have no FK — remove explicitly.
  try {
    const { data: files } = await admin.storage.from('avatars').list(user.id);
    if (files?.length) {
      await admin.storage.from('avatars').remove(files.map((f) => `${user.id}/${f.name}`));
    }
  } catch (e) {
    // Non-fatal: the account deletion below is what matters for 5.1.1(v).
    console.error('[delete-account] avatar cleanup failed', { userId: user.id, e: String(e) });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error('[delete-account] deleteUser failed', { userId: user.id, error: error.message });
    return new Response(JSON.stringify({ error: 'Account deletion failed. Please try again.' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  console.log('[delete-account] deleted', { userId: user.id });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});
