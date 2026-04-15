alter table if exists public.promo_codes
  add column if not exists is_first_order_only boolean not null default false;
