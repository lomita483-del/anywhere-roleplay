alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists public.admin_commands (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  command text not null check (command in ('teleport','freeze','unfreeze','invisible','visible','levitate','land','fly','stop_fly','spawn_vehicle','spawn_npc','remove_npc')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

create index if not exists admin_commands_target_pending_idx
  on public.admin_commands(target_user_id, created_at desc)
  where acknowledged_at is null;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
drop policy if exists "Users can see their own admin grant" on public.admin_users;
create policy "Users can see their own admin grant"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.admin_users to authenticated;

alter table public.admin_commands enable row level security;

drop policy if exists "Admins can read all player profiles" on public.profiles;
create policy "Admins can read all player profiles"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));


drop policy if exists "Admins can read admin commands" on public.admin_commands;
create policy "Admins can read admin commands"
  on public.admin_commands for select to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can issue admin commands" on public.admin_commands;
create policy "Admins can issue admin commands"
  on public.admin_commands for insert to authenticated
  with check (created_by = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));

drop policy if exists "Players can read commands addressed to them" on public.admin_commands;
create policy "Players can read commands addressed to them"
  on public.admin_commands for select to authenticated
  using (target_user_id = (select auth.uid()));

drop policy if exists "Players can acknowledge commands addressed to them" on public.admin_commands;
create policy "Players can acknowledge commands addressed to them"
  on public.admin_commands for update to authenticated
  using (target_user_id = (select auth.uid()))
  with check (target_user_id = (select auth.uid()));

grant select, insert, update on public.admin_commands to authenticated;
