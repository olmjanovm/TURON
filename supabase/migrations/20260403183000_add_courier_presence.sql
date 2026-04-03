create table if not exists public.courier_presence (
  courier_id uuid primary key references public.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  heading double precision,
  speed_kmh double precision,
  remaining_distance_km double precision,
  remaining_eta_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courier_presence_order_idx
  on public.courier_presence(order_id, updated_at desc);

create index if not exists courier_presence_updated_idx
  on public.courier_presence(updated_at desc);

create or replace function public.set_courier_presence_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_courier_presence_updated_at on public.courier_presence;

create trigger trg_courier_presence_updated_at
before update on public.courier_presence
for each row
execute function public.set_courier_presence_updated_at();
