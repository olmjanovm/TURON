begin;

alter table public.menu_categories
  add column if not exists icon_url text;

alter table public.menu_items
  add column if not exists old_price numeric(12,2),
  add column if not exists weight_text text,
  add column if not exists badge_text text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_new boolean not null default false,
  add column if not exists is_popular boolean not null default false,
  add column if not exists is_discounted boolean not null default false,
  add column if not exists discount_percent integer,
  add column if not exists sort_order integer not null default 0;

alter table public.order_items
  add column if not exists image_url_snapshot text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_old_price_non_negative'
  ) then
    alter table public.menu_items
      add constraint menu_items_old_price_non_negative
      check (old_price is null or old_price >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_discount_percent_range'
  ) then
    alter table public.menu_items
      add constraint menu_items_discount_percent_range
      check (discount_percent is null or discount_percent between 1 and 99);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_sort_order_non_negative'
  ) then
    alter table public.menu_items
      add constraint menu_items_sort_order_non_negative
      check (sort_order >= 0);
  end if;
end
$$;

create index if not exists idx_menu_items_category_active_sort
  on public.menu_items(category_id, is_active, availability_status, sort_order, created_at desc);

commit;
