begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- Bug fix (2026-06-23). ILDIZ SABAB: `orders.address_id` ustunida DB darajasida
-- FOREIGN KEY constraint UMUMAN YO'Q edi (schema drift — schema `onDelete: Restrict`
-- deydi, lekin DB'da hech qachon yaratilmagan). Natijada manzillar bemalol HARD
-- o'chirilib, ularga bog'liq buyurtmalar YETIM qolardi (45/142 order). Prisma'da
-- `Order.deliveryAddress` MAJBURIY relation bo'lgani uchun u null qaytarsa
-- `PrismaClientUnknownRequestError` → 500. Bu bitta ildiz quyidagi 3 bug'ni keltirib
-- chiqargan:
--   #1 manzilni o'chirish "ishlamaydi" (aslida o'chardi, lekin FK yo'qligi sabab
--      orphan qolardi),
--   #2 buyurtmani bekor qilib bo'lmaydi (order detail 500 → sahifa ochilmaydi),
--   #4 admin sahifada data kelmaydi (ro'yxat query'lari ham deliveryAddress include
--      qiladi → bitta orphan butun ro'yxatni 500 qiladi).
--
-- YECHIM: (a) soft-delete (deleted_at) — manzillar endi HARD o'chirilmaydi, FK doim
-- yaroqli; (b) mavjud 45 orphan order uchun manzil qatorini buyurtma snapshot
-- koordinatasidan tiklaymiz (yashirin = deleted_at to'ldirilgan); (c) FK'ni
-- ON DELETE SET NULL bilan qo'shamiz (kelajakda biror manzil baribir HARD
-- o'chirilsa, order.address_id null bo'ladi va serializer koordinata snapshot'iga
-- qaytadi — hech qachon 500 bo'lmaydi). Schema'da ham relation optional + SetNull.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Soft-delete ustuni
alter table public.addresses
  add column if not exists deleted_at timestamptz;

-- 2) Yetim buyurtmalar uchun yo'qolgan manzilларни tiklaymiz (yashirin).
--    Koordinata buyurtma snapshot'idan (customer_latitude/longitude) olinadi.
insert into public.addresses
  (id, user_id, label, address_text, latitude, longitude, is_default, created_at, updated_at, deleted_at)
select distinct on (o.address_id)
  o.address_id,
  o.user_id,
  'Saqlangan manzil',
  'Eski buyurtma manzili (oʻchirilgan)',
  o.customer_latitude,
  o.customer_longitude,
  false,
  o.created_at,
  now(),
  now()
from public.orders o
left join public.addresses a on a.id = o.address_id
where o.address_id is not null
  and a.id is null
order by o.address_id, o.created_at desc
on conflict (id) do nothing;

-- 3) address_id'ni nullable qilamiz (ON DELETE SET NULL FK shuni talab qiladi)
alter table public.orders
  alter column address_id drop not null;

-- 4) Yetishmagan FK constraint — ON DELETE SET NULL (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class r on r.oid = c.conrelid
    where r.relname = 'orders'
      and c.contype = 'f'
      and c.conname = 'orders_address_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_address_id_fkey
      foreign key (address_id) references public.addresses(id) on delete set null;
  end if;
end$$;

-- 5) Faol manzillar uchun partial indeks (list query: deleted_at is null)
create index if not exists addresses_user_active_idx
  on public.addresses(user_id, updated_at desc)
  where deleted_at is null;

commit;
