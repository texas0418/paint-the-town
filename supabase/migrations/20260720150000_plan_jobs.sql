-- Async plan-generation jobs: the edge function returns a job id immediately
-- and writes the result here when Claude finishes (avoids the 150s gateway cap).

create table if not exists public.plan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'done', 'error')),
  request jsonb not null default '{}',
  plans jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plan_jobs_user_idx on public.plan_jobs (user_id, created_at desc);

alter table public.plan_jobs enable row level security;

drop policy if exists "Users can view own plan jobs" on public.plan_jobs;
create policy "Users can view own plan jobs"
  on public.plan_jobs for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own plan jobs" on public.plan_jobs;
create policy "Users can insert own plan jobs"
  on public.plan_jobs for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own plan jobs" on public.plan_jobs;
create policy "Users can update own plan jobs"
  on public.plan_jobs for update using (auth.uid() = user_id);

drop trigger if exists plan_jobs_set_updated_at on public.plan_jobs;
create trigger plan_jobs_set_updated_at
  before update on public.plan_jobs
  for each row execute function public.set_updated_at();
