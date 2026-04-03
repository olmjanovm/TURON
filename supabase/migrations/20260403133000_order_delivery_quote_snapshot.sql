begin;

alter table public.orders
  add column if not exists delivery_distance_meters integer,
  add column if not exists delivery_eta_minutes integer,
  add column if not exists delivery_fee_rule_code text,
  add column if not exists delivery_fee_base_amount numeric(12,2),
  add column if not exists delivery_fee_extra_amount numeric(12,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_distance_non_negative'
  ) then
    alter table public.orders
      add constraint orders_delivery_distance_non_negative
      check (delivery_distance_meters is null or delivery_distance_meters >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_eta_non_negative'
  ) then
    alter table public.orders
      add constraint orders_delivery_eta_non_negative
      check (delivery_eta_minutes is null or delivery_eta_minutes >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_fee_rule_code_not_blank'
  ) then
    alter table public.orders
      add constraint orders_delivery_fee_rule_code_not_blank
      check (delivery_fee_rule_code is null or btrim(delivery_fee_rule_code) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_fee_base_non_negative'
  ) then
    alter table public.orders
      add constraint orders_delivery_fee_base_non_negative
      check (delivery_fee_base_amount is null or delivery_fee_base_amount >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_fee_extra_non_negative'
  ) then
    alter table public.orders
      add constraint orders_delivery_fee_extra_non_negative
      check (delivery_fee_extra_amount is null or delivery_fee_extra_amount >= 0);
  end if;
end
$$;

create index if not exists idx_orders_delivery_quote_snapshot
  on public.orders(created_at desc, delivery_fee_rule_code);

commit;
