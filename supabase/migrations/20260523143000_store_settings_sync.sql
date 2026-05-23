-- Shared key-value settings table for storefront-managed config that needs
-- cross-device persistence (merchandising controls, search analytics, etc.).
create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

-- Public read so storefront can hydrate shared settings.
drop policy if exists "store_settings_public_select" on public.store_settings;
create policy "store_settings_public_select"
  on public.store_settings
  for select
  using (true);

-- Public writes are intentionally allowed because search analytics events are
-- recorded from anonymous shoppers.
drop policy if exists "store_settings_public_insert" on public.store_settings;
create policy "store_settings_public_insert"
  on public.store_settings
  for insert
  with check (true);

drop policy if exists "store_settings_public_update" on public.store_settings;
create policy "store_settings_public_update"
  on public.store_settings
  for update
  using (true)
  with check (true);

create index if not exists store_settings_updated_at_idx
  on public.store_settings (updated_at desc);

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.update_updated_at_column();
