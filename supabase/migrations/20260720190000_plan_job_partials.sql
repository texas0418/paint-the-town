-- Distributed vacation generation: long trips fan out one edge-function
-- invocation per day; each appends its result here atomically.

alter table public.plan_jobs
  add column if not exists partial jsonb not null default '[]';

create or replace function public.append_partial(job_id uuid, item jsonb)
returns integer
language sql
volatile
as $$
  update public.plan_jobs
  set partial = partial || jsonb_build_array(item)
  where id = job_id
  returning jsonb_array_length(partial);
$$;
