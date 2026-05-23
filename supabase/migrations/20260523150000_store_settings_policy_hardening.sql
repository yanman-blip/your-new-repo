-- Harden store_settings write access:
-- - Anonymous/public clients can write only search analytics rows.
-- - Admin-authenticated users can manage all keys.

alter table public.store_settings enable row level security;

drop policy if exists "store_settings_public_insert" on public.store_settings;
create policy "store_settings_public_insert"
  on public.store_settings
  for insert
  with check (key = 'search_analytics');

drop policy if exists "store_settings_public_update" on public.store_settings;
create policy "store_settings_public_update"
  on public.store_settings
  for update
  using (key = 'search_analytics')
  with check (key = 'search_analytics');

drop policy if exists "store_settings_admin_insert" on public.store_settings;
create policy "store_settings_admin_insert"
  on public.store_settings
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "store_settings_admin_update" on public.store_settings;
create policy "store_settings_admin_update"
  on public.store_settings
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "store_settings_admin_delete" on public.store_settings;
create policy "store_settings_admin_delete"
  on public.store_settings
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));
