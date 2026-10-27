create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Hustler',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_save (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select, insert, update, delete on public.player_save to authenticated;
grant all on public.player_save to service_role;

alter table public.profiles enable row level security;
alter table public.player_save enable row level security;

create policy "Players can read their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Players can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Players can manage their own save"
  on public.player_save for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger player_save_touch_updated_at before update on public.player_save
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Hustler'))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
