-- Date journal: one post-date entry per plan (rating + note + photos)

create table if not exists public.date_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.date_plans (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  note text,
  photo_urls jsonb not null default '[]',
  entry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id)
);

alter table public.date_journal_entries enable row level security;

drop policy if exists "Users can view own journal entries" on public.date_journal_entries;
create policy "Users can view own journal entries"
  on public.date_journal_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own journal entries" on public.date_journal_entries;
create policy "Users can create own journal entries"
  on public.date_journal_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own journal entries" on public.date_journal_entries;
create policy "Users can update own journal entries"
  on public.date_journal_entries for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own journal entries" on public.date_journal_entries;
create policy "Users can delete own journal entries"
  on public.date_journal_entries for delete
  using (auth.uid() = user_id);

drop trigger if exists date_journal_entries_set_updated_at on public.date_journal_entries;
create trigger date_journal_entries_set_updated_at
  before update on public.date_journal_entries
  for each row execute function public.set_updated_at();

-- Journal photo storage: public-read bucket, users manage only their own folder

insert into storage.buckets (id, name, public)
values ('date-photos', 'date-photos', true)
on conflict (id) do nothing;

drop policy if exists "Date photo public read" on storage.objects;
create policy "Date photo public read"
  on storage.objects for select
  using (bucket_id = 'date-photos');

drop policy if exists "Users upload own date photos" on storage.objects;
create policy "Users upload own date photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'date-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own date photos" on storage.objects;
create policy "Users update own date photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'date-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own date photos" on storage.objects;
create policy "Users delete own date photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'date-photos' and (storage.foldername(name))[1] = auth.uid()::text);
