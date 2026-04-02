begin;

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role_enum as enum ('CUSTOMER', 'ADMIN', 'COURIER');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.language_enum as enum ('UZ', 'RU', 'EN');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.menu_item_availability_enum as enum (
    'AVAILABLE',
    'TEMPORARILY_UNAVAILABLE',
    'OUT_OF_STOCK'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.promo_discount_type_enum as enum ('PERCENTAGE', 'FIXED_AMOUNT');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.order_status_enum as enum (
    'PENDING',
    'PREPARING',
    'READY_FOR_PICKUP',
    'DELIVERING',
    'DELIVERED',
    'CANCELLED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_method_enum as enum (
    'CASH',
    'MANUAL_TRANSFER',
    'EXTERNAL_PAYMENT'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_status_enum as enum (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.courier_assignment_status_enum as enum (
    'ASSIGNED',
    'ACCEPTED',
    'PICKED_UP',
    'DELIVERING',
    'DELIVERED',
    'REJECTED',
    'CANCELLED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.notification_type_enum as enum (
    'INFO',
    'SUCCESS',
    'WARNING',
    'ERROR',
    'ORDER_STATUS_UPDATE',
    'PROMO_CAMPAIGN',
    'ADMIN_NOTICE'
  );
exception
  when duplicate_object then null;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null,
  full_name text not null,
  phone text,
  role public.user_role_enum not null default 'CUSTOMER',
  language public.language_enum not null default 'UZ',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_telegram_id_key unique (telegram_id),
  constraint users_full_name_not_blank check (btrim(full_name) <> ''),
  constraint users_phone_not_blank check (phone is null or btrim(phone) <> '')
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  address_text text not null,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  note text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint addresses_label_not_blank check (btrim(label) <> ''),
  constraint addresses_address_text_not_blank check (btrim(address_text) <> ''),
  constraint addresses_latitude_range check (latitude between -90 and 90),
  constraint addresses_longitude_range check (longitude between -180 and 180)
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name_uz text not null,
  name_ru text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_categories_slug_key unique (slug),
  constraint menu_categories_name_uz_not_blank check (btrim(name_uz) <> ''),
  constraint menu_categories_name_ru_not_blank check (btrim(name_ru) <> ''),
  constraint menu_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint menu_categories_sort_order_non_negative check (sort_order >= 0)
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete restrict,
  name_uz text not null,
  name_ru text not null,
  description_uz text,
  description_ru text,
  price numeric(12,2) not null,
  image_url text,
  is_active boolean not null default true,
  availability_status public.menu_item_availability_enum not null default 'AVAILABLE',
  stock_quantity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_name_uz_not_blank check (btrim(name_uz) <> ''),
  constraint menu_items_name_ru_not_blank check (btrim(name_ru) <> ''),
  constraint menu_items_price_non_negative check (price >= 0),
  constraint menu_items_stock_non_negative check (stock_quantity is null or stock_quantity >= 0)
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  discount_type public.promo_discount_type_enum not null,
  discount_value numeric(12,2) not null,
  min_order_amount numeric(12,2) not null default 0,
  usage_limit integer,
  used_count integer not null default 0,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_codes_code_key unique (code),
  constraint promo_codes_code_format check (code = upper(btrim(code)) and code ~ '^[A-Z0-9_-]+$'),
  constraint promo_codes_title_not_blank check (btrim(title) <> ''),
  constraint promo_codes_discount_value_positive check (discount_value > 0),
  constraint promo_codes_min_order_amount_non_negative check (min_order_amount >= 0),
  constraint promo_codes_usage_limit_positive check (usage_limit is null or usage_limit > 0),
  constraint promo_codes_used_count_non_negative check (used_count >= 0),
  constraint promo_codes_used_count_within_limit check (usage_limit is null or used_count <= usage_limit),
  constraint promo_codes_valid_window check (expires_at is null or expires_at >= starts_at),
  constraint promo_codes_percentage_limit check (
    discount_type <> 'PERCENTAGE'::public.promo_discount_type_enum
    or discount_value <= 100
  )
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  address_id uuid not null references public.addresses(id) on delete restrict,
  courier_id uuid references public.users(id) on delete set null,
  promo_code_id uuid references public.promo_codes(id) on delete set null,
  order_number bigint generated by default as identity,
  status public.order_status_enum not null default 'PENDING',
  subtotal numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  payment_method public.payment_method_enum not null,
  payment_status public.payment_status_enum not null default 'PENDING',
  note text,
  customer_latitude numeric(10,7) not null,
  customer_longitude numeric(10,7) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_order_number_key unique (order_number),
  constraint orders_subtotal_non_negative check (subtotal >= 0),
  constraint orders_discount_non_negative check (discount_amount >= 0),
  constraint orders_delivery_fee_non_negative check (delivery_fee >= 0),
  constraint orders_total_non_negative check (total_amount >= 0),
  constraint orders_discount_leq_subtotal check (discount_amount <= subtotal),
  constraint orders_total_formula check ((subtotal - discount_amount + delivery_fee) = total_amount),
  constraint orders_customer_latitude_range check (customer_latitude between -90 and 90),
  constraint orders_customer_longitude_range check (customer_longitude between -180 and 180)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name_snapshot text not null,
  item_price_snapshot numeric(12,2) not null,
  quantity integer not null,
  total_price numeric(12,2) not null,
  created_at timestamptz not null default now(),
  constraint order_items_name_not_blank check (btrim(item_name_snapshot) <> ''),
  constraint order_items_price_non_negative check (item_price_snapshot >= 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_total_non_negative check (total_price >= 0),
  constraint order_items_total_formula check (total_price = item_price_snapshot * quantity)
);

create table if not exists public.courier_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_id uuid not null references public.users(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivering_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  status public.courier_assignment_status_enum not null default 'ASSIGNED',
  eta_minutes integer,
  distance_meters integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courier_assignments_eta_non_negative check (eta_minutes is null or eta_minutes >= 0),
  constraint courier_assignments_distance_non_negative check (distance_meters is null or distance_meters >= 0),
  constraint courier_assignments_accept_after_assign check (accepted_at is null or accepted_at >= assigned_at),
  constraint courier_assignments_pickup_after_accept check (
    picked_up_at is null or (accepted_at is not null and picked_up_at >= accepted_at)
  ),
  constraint courier_assignments_delivering_after_pickup check (
    delivering_at is null or (picked_up_at is not null and delivering_at >= picked_up_at)
  ),
  constraint courier_assignments_delivered_after_delivering check (
    delivered_at is null or (delivering_at is not null and delivered_at >= delivering_at)
  ),
  constraint courier_assignments_cancel_after_assign check (
    cancelled_at is null or cancelled_at >= assigned_at
  ),
  constraint courier_assignments_terminal_timestamps check (
    not (delivered_at is not null and cancelled_at is not null)
  )
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method_enum not null,
  status public.payment_status_enum not null default 'PENDING',
  amount numeric(12,2) not null,
  provider text,
  provider_transaction_id text,
  admin_verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_order_id_key unique (order_id),
  constraint payments_amount_non_negative check (amount >= 0),
  constraint payments_provider_not_blank check (provider is null or btrim(provider) <> ''),
  constraint payments_provider_transaction_not_blank check (
    provider_transaction_id is null or btrim(provider_transaction_id) <> ''
  ),
  constraint payments_rejection_reason_not_blank check (
    rejection_reason is null or btrim(rejection_reason) <> ''
  ),
  constraint payments_admin_verification_consistency check (
    admin_verified_by is null or verified_at is not null
  ),
  constraint payments_completed_has_trace check (
    status <> 'COMPLETED'::public.payment_status_enum
    or verified_at is not null
    or provider_transaction_id is not null
  ),
  constraint payments_rejection_requires_terminal_status check (
    rejection_reason is null
    or status in ('FAILED'::public.payment_status_enum, 'CANCELLED'::public.payment_status_enum)
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role_target public.user_role_enum not null,
  type public.notification_type_enum not null,
  title text not null,
  message text not null,
  related_order_id uuid references public.orders(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_title_not_blank check (btrim(title) <> ''),
  constraint notifications_message_not_blank check (btrim(message) <> '')
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  actor_role public.user_role_enum,
  action_type text not null,
  entity_type text not null,
  entity_id text not null,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_type_not_blank check (btrim(action_type) <> ''),
  constraint audit_logs_entity_type_not_blank check (btrim(entity_type) <> ''),
  constraint audit_logs_entity_id_not_blank check (btrim(entity_id) <> '')
);

create index if not exists idx_users_role_active on public.users(role, is_active);
create index if not exists idx_users_created_at on public.users(created_at desc);

create index if not exists idx_addresses_user_id on public.addresses(user_id);
create index if not exists idx_addresses_user_created_at on public.addresses(user_id, created_at desc);
create unique index if not exists ux_addresses_default_per_user
  on public.addresses(user_id)
  where is_default;

create index if not exists idx_menu_categories_active_sort
  on public.menu_categories(is_active, sort_order, created_at);

create index if not exists idx_menu_items_category_active
  on public.menu_items(category_id, is_active, availability_status);
create index if not exists idx_menu_items_active_price
  on public.menu_items(is_active, availability_status, price);

create index if not exists idx_promo_codes_active_window
  on public.promo_codes(is_active, starts_at, expires_at);

create index if not exists idx_orders_user_status_created_at
  on public.orders(user_id, status, created_at desc);
create index if not exists idx_orders_courier_status_created_at
  on public.orders(courier_id, status, created_at desc);
create index if not exists idx_orders_payment_status
  on public.orders(payment_status);
create index if not exists idx_orders_promo_code_id
  on public.orders(promo_code_id);
create index if not exists idx_orders_created_at
  on public.orders(created_at desc);

create index if not exists idx_order_items_order_id
  on public.order_items(order_id);
create index if not exists idx_order_items_menu_item_id
  on public.order_items(menu_item_id);

create index if not exists idx_courier_assignments_courier_status_assigned_at
  on public.courier_assignments(courier_id, status, assigned_at desc);
create index if not exists idx_courier_assignments_order_id
  on public.courier_assignments(order_id);
create unique index if not exists ux_courier_assignments_one_active_per_order
  on public.courier_assignments(order_id)
  where status in (
    'ASSIGNED'::public.courier_assignment_status_enum,
    'ACCEPTED'::public.courier_assignment_status_enum,
    'PICKED_UP'::public.courier_assignment_status_enum,
    'DELIVERING'::public.courier_assignment_status_enum
  );

create index if not exists idx_payments_status_created_at
  on public.payments(status, created_at desc);
create unique index if not exists ux_payments_provider_transaction_id
  on public.payments(provider_transaction_id)
  where provider_transaction_id is not null;

create index if not exists idx_notifications_user_read_created_at
  on public.notifications(user_id, is_read, created_at desc);
create index if not exists idx_notifications_related_order_id
  on public.notifications(related_order_id);

create index if not exists idx_audit_logs_actor_created_at
  on public.audit_logs(actor_user_id, created_at desc);
create index if not exists idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists idx_audit_logs_action_type_created_at
  on public.audit_logs(action_type, created_at desc);

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_addresses_set_updated_at on public.addresses;
create trigger trg_addresses_set_updated_at
before update on public.addresses
for each row
execute function public.set_updated_at();

drop trigger if exists trg_menu_categories_set_updated_at on public.menu_categories;
create trigger trg_menu_categories_set_updated_at
before update on public.menu_categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_menu_items_set_updated_at on public.menu_items;
create trigger trg_menu_items_set_updated_at
before update on public.menu_items
for each row
execute function public.set_updated_at();

drop trigger if exists trg_promo_codes_set_updated_at on public.promo_codes;
create trigger trg_promo_codes_set_updated_at
before update on public.promo_codes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_orders_set_updated_at on public.orders;
create trigger trg_orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists trg_courier_assignments_set_updated_at on public.courier_assignments;
create trigger trg_courier_assignments_set_updated_at
before update on public.courier_assignments
for each row
execute function public.set_updated_at();

drop trigger if exists trg_payments_set_updated_at on public.payments;
create trigger trg_payments_set_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

create or replace function public.sync_promo_code_used_count()
returns trigger
language plpgsql
as $$
declare
  affected_promo_ids uuid[];
  promo_id uuid;
begin
  affected_promo_ids := array_remove(
    array[
      case when TG_OP <> 'DELETE' then new.promo_code_id else null end,
      case when TG_OP <> 'INSERT' then old.promo_code_id else null end
    ],
    null
  );

  if affected_promo_ids is null or array_length(affected_promo_ids, 1) is null then
    return null;
  end if;

  foreach promo_id in array affected_promo_ids loop
    update public.promo_codes
    set used_count = (
      select count(*)::integer
      from public.orders o
      where o.promo_code_id = promo_id
        and o.status <> 'CANCELLED'::public.order_status_enum
    )
    where id = promo_id;
  end loop;

  return null;
end;
$$;

drop trigger if exists trg_orders_sync_promo_code_usage on public.orders;
create trigger trg_orders_sync_promo_code_usage
after insert or update or delete on public.orders
for each row
execute function public.sync_promo_code_used_count();

update public.promo_codes p
set used_count = (
  select count(*)::integer
  from public.orders o
  where o.promo_code_id = p.id
    and o.status <> 'CANCELLED'::public.order_status_enum
);

commit;
