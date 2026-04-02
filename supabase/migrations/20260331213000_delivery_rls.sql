begin;

create or replace function public.current_app_user_id()
returns uuid
language plpgsql
stable
as $$
declare
  claim_value text;
begin
  claim_value := coalesce(
    auth.jwt() ->> 'app_user_id',
    auth.jwt() ->> 'user_id',
    auth.jwt() ->> 'sub'
  );

  if claim_value is not null and btrim(claim_value) <> '' then
    begin
      return claim_value::uuid;
    exception
      when others then null;
    end;
  end if;

  begin
    return auth.uid();
  exception
    when others then
      return null;
  end;
end;
$$;

create or replace function public.current_app_role()
returns public.user_role_enum
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claim_value text;
  looked_up_role public.user_role_enum;
begin
  claim_value := upper(coalesce(
    auth.jwt() ->> 'app_role',
    auth.jwt() ->> 'user_role',
    ''
  ));

  if claim_value in ('CUSTOMER', 'ADMIN', 'COURIER') then
    return claim_value::public.user_role_enum;
  end if;

  select u.role
  into looked_up_role
  from public.users u
  where u.id = public.current_app_user_id();

  return looked_up_role;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'ADMIN'::public.user_role_enum;
$$;

create or replace function public.is_courier()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'COURIER'::public.user_role_enum;
$$;

create or replace function public.can_update_own_user(
  target_id uuid,
  target_telegram_id bigint,
  target_role public.user_role_enum,
  target_is_active boolean
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = public.current_app_user_id()
      and target_id = u.id
      and target_telegram_id = u.telegram_id
      and target_role = u.role
      and target_is_active = u.is_active
  );
$$;

create or replace function public.can_read_order(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = target_order_id
      and (
        o.user_id = public.current_app_user_id()
        or o.courier_id = public.current_app_user_id()
        or exists (
          select 1
          from public.courier_assignments ca
          where ca.order_id = o.id
            and ca.courier_id = public.current_app_user_id()
        )
      )
  );
$$;

create or replace function public.can_read_address(target_address_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.addresses a
    where a.id = target_address_id
      and (
        a.user_id = public.current_app_user_id()
        or exists (
          select 1
          from public.orders o
          where o.address_id = a.id
            and public.can_read_order(o.id)
            and public.is_courier()
        )
      )
  );
$$;

create or replace function public.can_update_own_notification(
  target_id uuid,
  target_user_id uuid,
  target_role public.user_role_enum,
  target_type public.notification_type_enum,
  target_title text,
  target_message text,
  target_related_order_id uuid,
  target_created_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.notifications n
    where n.id = target_id
      and n.user_id = public.current_app_user_id()
      and target_user_id = n.user_id
      and target_role = n.role_target
      and target_type = n.type
      and target_title = n.title
      and target_message = n.message
      and target_related_order_id is not distinct from n.related_order_id
      and target_created_at = n.created_at
  );
$$;

alter table public.users enable row level security;
alter table public.addresses enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.courier_assignments enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists users_select_own on public.users;
drop policy if exists users_update_own_profile on public.users;
drop policy if exists addresses_select_owned_or_delivery on public.addresses;
drop policy if exists addresses_insert_own on public.addresses;
drop policy if exists addresses_update_own on public.addresses;
drop policy if exists menu_categories_select_active on public.menu_categories;
drop policy if exists menu_items_select_active_available on public.menu_items;
drop policy if exists orders_select_self_or_assigned on public.orders;
drop policy if exists order_items_select_via_accessible_order on public.order_items;
drop policy if exists courier_assignments_select_own on public.courier_assignments;
drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own_read_state on public.notifications;

-- Users may read only their own profile row from the client.
create policy users_select_own
on public.users
for select
to authenticated
using (id = public.current_app_user_id());

-- Users may update only their own profile while keeping security-sensitive columns immutable.
create policy users_update_own_profile
on public.users
for update
to authenticated
using (id = public.current_app_user_id())
with check (public.can_update_own_user(id, telegram_id, role, is_active));

-- Users may read their own saved addresses, and couriers may read delivery addresses for orders assigned to them.
create policy addresses_select_owned_or_delivery
on public.addresses
for select
to authenticated
using (public.can_read_address(id));

-- Users may create addresses only for themselves.
create policy addresses_insert_own
on public.addresses
for insert
to authenticated
with check (user_id = public.current_app_user_id());

-- Users may update only their own addresses.
create policy addresses_update_own
on public.addresses
for update
to authenticated
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

-- Authenticated app users may browse only active categories directly from the client.
create policy menu_categories_select_active
on public.menu_categories
for select
to authenticated
using (is_active = true);

-- Authenticated app users may browse only active and currently available menu items directly from the client.
create policy menu_items_select_active_available
on public.menu_items
for select
to authenticated
using (
  is_active = true
  and availability_status = 'AVAILABLE'::public.menu_item_availability_enum
);

-- Customers may read their own orders, and couriers may read orders assigned to them.
create policy orders_select_self_or_assigned
on public.orders
for select
to authenticated
using (public.can_read_order(id));

-- Customers and couriers may read order line items only when the parent order is visible to them.
create policy order_items_select_via_accessible_order
on public.order_items
for select
to authenticated
using (public.can_read_order(order_id));

-- Couriers may read only their own assignment rows.
create policy courier_assignments_select_own
on public.courier_assignments
for select
to authenticated
using (courier_id = public.current_app_user_id());

-- Users may read only notifications targeted to themselves and their active role.
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (
  user_id = public.current_app_user_id()
  and role_target = public.current_app_role()
);

-- Users may only update their own notifications, effectively allowing read-state changes while preserving message payload integrity.
create policy notifications_update_own_read_state
on public.notifications
for update
to authenticated
using (user_id = public.current_app_user_id())
with check (
  public.can_update_own_notification(
    id,
    user_id,
    role_target,
    type,
    title,
    message,
    related_order_id,
    created_at
  )
);

-- No direct client policy is created for promo_codes.
-- Promo validation and promo administration must go through backend service role logic.

-- No direct client insert/update/delete policies are created for orders.
-- Order creation, status transitions, pricing, promo application, and payment synchronization must go through backend service role logic.

-- No direct client update policy is created for courier_assignments.
-- Courier operational state changes must go through backend service role logic so stage transitions remain validated server-side.

-- No direct client policy is created for payments.
-- Payment rows carry sensitive provider metadata and must be accessed only through backend service role logic.

-- No direct client policy is created for audit_logs.
-- Audit logs are intended to be written and read through backend service role logic to preserve integrity and minimize exposure.

commit;
