-- Keep RLS ownership checks stable per statement instead of reevaluating auth.uid() per row.
-- Safe to rerun: policies are replaced in place.
drop policy if exists "Players can read their own profile" on public.profiles;
create policy "Players can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Players can update their own profile" on public.profiles;
create policy "Players can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Players can manage their own save" on public.player_save;
create policy "Players can manage their own save"
  on public.player_save for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
