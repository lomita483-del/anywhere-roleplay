alter table public.profiles
  add column if not exists background jsonb not null default '{}'::jsonb,
  add column if not exists needs jsonb not null default '{"hunger":100,"energy":100,"health":100,"stress":8,"hygiene":100}'::jsonb,
  add column if not exists skills jsonb not null default '{"driving":1,"trading":1,"repairs":1,"hustling":1,"negotiation":1}'::jsonb,
  add column if not exists reputation jsonb not null default '{"score":0,"tier":"Newcomer"}'::jsonb,
  add column if not exists character_traits jsonb not null default '[]'::jsonb;

alter table public.vehicles
  add column if not exists fuel_level numeric(5,2) not null default 100,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.housing (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  house_type text not null,
  rent_due timestamptz,
  has_generator boolean not null default false,
  has_solar boolean not null default false,
  stored_cash bigint not null default 0 check (stored_cash >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null,
  earnings bigint not null default 0 check (earnings >= 0),
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

create index if not exists housing_owner_id_idx on public.housing(owner_id);
create index if not exists jobs_history_player_completed_idx on public.jobs_history(player_id, completed_at desc);
create index if not exists vehicles_owner_id_idx on public.vehicles(owner_id);

alter table public.housing enable row level security;
alter table public.jobs_history enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='housing' and policyname='Players can read their own housing') then
    create policy "Players can read their own housing" on public.housing for select to authenticated using ((select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='housing' and policyname='Players can create their own housing') then
    create policy "Players can create their own housing" on public.housing for insert to authenticated with check ((select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='housing' and policyname='Players can update their own housing') then
    create policy "Players can update their own housing" on public.housing for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='jobs_history' and policyname='Players can read their own job history') then
    create policy "Players can read their own job history" on public.jobs_history for select to authenticated using ((select auth.uid()) = player_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='jobs_history' and policyname='Players can create their own job history') then
    create policy "Players can create their own job history" on public.jobs_history for insert to authenticated with check ((select auth.uid()) = player_id);
  end if;
end $$;

grant select, insert, update on public.housing to authenticated;
grant select, insert on public.jobs_history to authenticated;