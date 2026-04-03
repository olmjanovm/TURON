do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'courier_assignment_event_type_enum'
  ) then
    create type public.courier_assignment_event_type_enum as enum (
      'ASSIGNED',
      'ACCEPTED',
      'ARRIVED_AT_RESTAURANT',
      'PICKED_UP',
      'DELIVERING',
      'ARRIVED_AT_DESTINATION',
      'DELIVERED',
      'CANCELLED',
      'PROBLEM_REPORTED'
    );
  end if;
end $$;

create table if not exists public.courier_assignment_events (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.courier_assignments(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_id uuid not null references public.users(id) on delete restrict,
  event_type public.courier_assignment_event_type_enum not null,
  event_at timestamptz not null default now(),
  payload jsonb,
  actor_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_courier_assignment_events_assignment_event_at
  on public.courier_assignment_events (assignment_id, event_at desc);

create index if not exists idx_courier_assignment_events_order_event_at
  on public.courier_assignment_events (order_id, event_at desc);

create index if not exists idx_courier_assignment_events_courier_event_at
  on public.courier_assignment_events (courier_id, event_at desc);

create index if not exists idx_courier_assignment_events_type_event_at
  on public.courier_assignment_events (event_type, event_at desc);
