begin;

create table if not exists public.courier_operational_status (
  courier_id uuid primary key references public.users(id) on delete cascade,
  is_online boolean not null default false,
  is_accepting_orders boolean not null default false,
  last_online_at timestamptz,
  last_offline_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint courier_operational_status_accepting_requires_online check (
    not is_accepting_orders or is_online
  )
);

create index if not exists idx_courier_operational_status_online_accepting
  on public.courier_operational_status(is_online, is_accepting_orders, updated_at desc);

insert into public.courier_operational_status (
  courier_id,
  is_online,
  is_accepting_orders,
  last_online_at,
  updated_at
)
select
  u.id,
  true,
  true,
  now(),
  now()
from public.users u
where u.role = 'COURIER'::public.user_role_enum
  and u.is_active = true
on conflict (courier_id) do nothing;

drop trigger if exists trg_courier_operational_status_set_updated_at on public.courier_operational_status;
create trigger trg_courier_operational_status_set_updated_at
before update on public.courier_operational_status
for each row
execute function public.set_updated_at();

alter table public.courier_operational_status enable row level security;

drop policy if exists courier_operational_status_select_own on public.courier_operational_status;

create policy courier_operational_status_select_own
on public.courier_operational_status
for select
to authenticated
using (courier_id = public.current_app_user_id());

commit;
