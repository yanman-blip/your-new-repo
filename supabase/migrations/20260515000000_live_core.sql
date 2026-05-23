-- Live core schema for Joy's Closet
-- Run with: supabase db push

create extension if not exists "pgcrypto";

-- Profiles / roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- Products managed by admin
create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  price numeric(12,2) not null,
  image text not null,
  is_published boolean not null default true,
  payload jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders (payload keeps current app structure flexible)
create table if not exists public.orders (
  id text primary key,
  status text not null,
  payment_method text not null,
  fulfillment text not null,
  subtotal numeric(12,2) not null,
  delivery_fee numeric(12,2) not null,
  tax numeric(12,2) not null,
  total numeric(12,2) not null,
  proof_file_name text,
  payload jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Profile policies
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Product policies
drop policy if exists "products_public_select" on public.products;
create policy "products_public_select"
on public.products
for select
using (is_published = true or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
on public.products
for insert
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
on public.products
for update
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
on public.products
for delete
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

-- Order policies
drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select"
on public.orders
for select
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "orders_customer_insert" on public.orders;
create policy "orders_customer_insert"
on public.orders
for insert
with check (
  auth.uid() is not null
  and (
    created_by is null
    or created_by = auth.uid()
  )
);

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
on public.orders
for update
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
on public.orders
for delete
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects
for select
using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
on storage.objects
for insert
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
on storage.objects
for update
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
on storage.objects
for delete
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);
