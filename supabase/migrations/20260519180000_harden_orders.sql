-- Order hardening: prevent proof-file reuse, enforce a valid status state
-- machine, and add indexes used by the admin dashboard/orders queries.

-- ---------------------------------------------------------------------------
-- 1) Prevent the same payment-proof filename from being attached to more than
--    one order. Path is randomised at upload time, so any collision implies
--    deliberate reuse (fraud or replay). Partial index so guest orders
--    without a proof are unaffected.
-- ---------------------------------------------------------------------------
create unique index if not exists orders_proof_file_name_unique
  on public.orders (proof_file_name)
  where proof_file_name is not null;

-- ---------------------------------------------------------------------------
-- 2) Indexes used by the admin dashboard, recent-activity feed, and account
--    orders list. Cheap to add, large win once order count grows.
-- ---------------------------------------------------------------------------
create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_user_id_idx
  on public.orders (user_id)
  where user_id is not null;

create index if not exists orders_status_idx
  on public.orders (status);

-- Products are queried by is_published in fetchCustomProducts and by
-- updated_at desc for the "most recent first" sort.
create index if not exists products_published_updated_idx
  on public.products (is_published, updated_at desc);

-- ---------------------------------------------------------------------------
-- 3) Status state machine. Any status change must follow one of the valid
--    transitions defined here. Same-to-same is allowed (idempotent retry).
-- ---------------------------------------------------------------------------
create or replace function public.enforce_order_status_transition()
returns trigger
language plpgsql
as $$
declare
  allowed boolean := false;
begin
  -- No status change → nothing to check.
  if new.status is null or new.status = old.status then
    return new;
  end if;

  case old.status
    when 'draft' then
      allowed := new.status in ('order_placed', 'awaiting_proof');
    when 'order_placed' then
      allowed := new.status in ('awaiting_proof', 'awaiting_delivery_payment', 'paid');
    when 'awaiting_proof' then
      allowed := new.status in ('awaiting_admin_approval', 'order_placed');
    when 'awaiting_admin_approval' then
      allowed := new.status in ('paid', 'awaiting_proof');
    when 'awaiting_delivery_payment' then
      allowed := new.status in ('paid');
    when 'paid' then
      -- Paid is terminal. Block accidental rollback / double-approval.
      allowed := false;
    else
      allowed := false;
  end case;

  if not allowed then
    raise exception 'Invalid order status transition: % → %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enforce_status_transition on public.orders;

create trigger orders_enforce_status_transition
  before update of status on public.orders
  for each row
  execute function public.enforce_order_status_transition();
