-- Live generation progress + push notification tokens

alter table public.plan_jobs
  add column if not exists progress jsonb;

alter table public.profiles
  add column if not exists push_token text;
