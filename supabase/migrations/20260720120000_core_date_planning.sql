-- Core date-planning schema: taste profile fields + saved date plans
-- W4nder core loop: taste profile -> AI suggestions -> scheduled plan

-- 1. Extend user_preferences with the taste profile
alter table public.user_preferences
  add column if not exists food_loves text[] default '{}',
  add column if not exists food_dislikes text[] default '{}',
  add column if not exists activity_loves text[] default '{}',
  add column if not exists activity_dislikes text[] default '{}',
  add column if not exists music_genres text[] default '{}',
  add column if not exists drinks text[] default '{}',
  add column if not exists venue_style text default 'both' check (venue_style in ('indoor', 'outdoor', 'both')),
  add column if not exists date_budget numeric default 150,
  add column if not exists home_city text;

-- upsert-by-user requires uniqueness on user_id
create unique index if not exists user_preferences_user_id_key
  on public.user_preferences (user_id);

-- 2. Saved / generated date plans
create table if not exists public.date_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  city text not null,
  plan_date date,
  start_time text,
  total_budget numeric,
  estimated_cost numeric,
  status text not null default 'saved' check (status in ('saved', 'scheduled', 'completed', 'cancelled')),
  source text not null default 'ai' check (source in ('ai', 'custom')),
  vibe text,
  -- Ordered stops: [{order, time, duration_minutes, category, name, venue_name,
  --   address, description, estimated_cost, url, why_it_matches}]
  items jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists date_plans_user_id_idx on public.date_plans (user_id, created_at desc);

alter table public.date_plans enable row level security;

drop policy if exists "Users can view own date plans" on public.date_plans;
create policy "Users can view own date plans"
  on public.date_plans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own date plans" on public.date_plans;
create policy "Users can insert own date plans"
  on public.date_plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own date plans" on public.date_plans;
create policy "Users can update own date plans"
  on public.date_plans for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own date plans" on public.date_plans;
create policy "Users can delete own date plans"
  on public.date_plans for delete
  using (auth.uid() = user_id);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists date_plans_set_updated_at on public.date_plans;
create trigger date_plans_set_updated_at
  before update on public.date_plans
  for each row execute function public.set_updated_at();
