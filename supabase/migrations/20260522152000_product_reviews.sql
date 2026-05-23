create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  fit text not null check (fit in ('True to size', 'Small', 'Large')),
  size_label text not null,
  review_text text not null,
  photos jsonb not null default '[]'::jsonb,
  helpful_count int not null default 0,
  verified_purchase boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_reviews_product_id_created_at_idx
  on public.product_reviews (product_id, created_at desc);

alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews_public_select" on public.product_reviews;
create policy "product_reviews_public_select"
on public.product_reviews
for select
using (true);

drop policy if exists "product_reviews_public_insert" on public.product_reviews;
create policy "product_reviews_public_insert"
on public.product_reviews
for insert
with check (
  rating between 1 and 5
  and fit in ('True to size', 'Small', 'Large')
  and coalesce(array_length(ARRAY(select jsonb_array_elements_text(photos)), 1), 0) <= 6
  and helpful_count = 0
  and verified_purchase = false
);

drop policy if exists "product_reviews_admin_update" on public.product_reviews;
create policy "product_reviews_admin_update"
on public.product_reviews
for update
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);
