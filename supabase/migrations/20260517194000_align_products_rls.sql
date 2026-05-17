-- Align product RLS with role checks used by app auth (user_roles / has_role)
-- and keep compatibility with environments that only have profiles.role.

-- Admin-role resolver that works across both schema variants.
create or replace function public.is_admin(_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _is_admin boolean := false;
begin
  if _user_id is null then
    return false;
  end if;

  -- Preferred path: user_roles table (newer schema)
  if to_regclass('public.user_roles') is not null then
    -- If has_role helper exists, use it.
    if to_regprocedure('public.has_role(uuid, public.app_role)') is not null then
      select public.has_role(_user_id, 'admin'::public.app_role) into _is_admin;
      if coalesce(_is_admin, false) then
        return true;
      end if;
    else
      -- Fallback direct check when enum/helper differs.
      execute $$
        select exists (
          select 1
          from public.user_roles ur
          where ur.user_id = $1
            and lower(ur.role::text) = 'admin'
        )
      $$
      into _is_admin
      using _user_id;

      if coalesce(_is_admin, false) then
        return true;
      end if;
    end if;
  end if;

  -- Legacy path: profiles.role column
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    execute $$
      select exists (
        select 1
        from public.profiles p
        where p.id = $1
          and lower(p.role::text) = 'admin'
      )
    $$
    into _is_admin
    using _user_id;

    if coalesce(_is_admin, false) then
      return true;
    end if;
  end if;

  return false;
end;
$$;

alter table public.products enable row level security;

drop policy if exists "products_public_select" on public.products;
drop policy if exists "products_admin_insert" on public.products;
drop policy if exists "products_admin_update" on public.products;
drop policy if exists "products_admin_delete" on public.products;
drop policy if exists "Anyone can view published products" on public.products;
drop policy if exists "Admins can manage products" on public.products;

create policy "products_public_select"
on public.products
for select
using (is_published = true or public.is_admin(auth.uid()));

create policy "products_admin_insert"
on public.products
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "products_admin_update"
on public.products
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "products_admin_delete"
on public.products
for delete
to authenticated
using (public.is_admin(auth.uid()));
