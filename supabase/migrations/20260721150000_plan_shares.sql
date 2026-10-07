-- Receive the date: tokenized share links. Recipients (no account) resolve a
-- token to spoiler-free plan details through a security-definer RPC; the
-- table itself stays owner-only.

create table if not exists public.plan_shares (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  plan_id uuid not null references public.date_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'surprise' check (kind in ('surprise')),
  created_at timestamptz not null default now(),
  unique (plan_id, kind)
);

alter table public.plan_shares enable row level security;

drop policy if exists "Users can view own plan shares" on public.plan_shares;
create policy "Users can view own plan shares"
  on public.plan_shares for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own plan shares" on public.plan_shares;
create policy "Users can create own plan shares"
  on public.plan_shares for insert
  with check (auth.uid() = user_id and exists (
    select 1 from public.date_plans p where p.id = plan_id and p.user_id = auth.uid()
  ));

drop policy if exists "Users can update own plan shares" on public.plan_shares;
create policy "Users can update own plan shares"
  on public.plan_shares for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own plan shares" on public.plan_shares;
create policy "Users can delete own plan shares"
  on public.plan_shares for delete
  using (auth.uid() = user_id);

-- Spoiler-free resolver for recipients: day, be-ready time, stop count, and
-- the planner's first name. Never venues, city, or costs.
create or replace function public.get_shared_plan(share_token text)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'plannerName', coalesce(nullif(split_part(pr.full_name, ' ', 1), ''), 'Someone'),
    'planDate', p.plan_date,
    'startTime', p.start_time,
    'stopCount', coalesce(jsonb_array_length(p.items), 0)
  )
  from plan_shares s
  join date_plans p on p.id = s.plan_id
  left join profiles pr on pr.id = s.user_id
  where s.token = share_token
$$;

grant execute on function public.get_shared_plan(text) to anon, authenticated;

-- From 2026-10-30 Supabase stops auto-granting Data API roles on new tables
-- (existing tables keep their grants). Restate what the auto-grant gave
-- production so fresh environments (supabase db reset, preview branches)
-- behave identically. RLS policies remain the actual access control.
grant select, insert, update, delete on public.plan_shares to anon, authenticated, service_role;
