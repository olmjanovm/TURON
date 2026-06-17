begin;

-- Kuryer transporti: navigatsiya chizig'i routingMode'i shunga qarab tanlanadi
-- (auto = mashina, bicycle = skuter/velosiped, pedestrian = piyoda).
alter table if exists public.users
  add column if not exists vehicle_mode text not null default 'auto';

commit;
