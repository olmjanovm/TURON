begin;

-- ─────────────────────────────────────────────────────────────────────────
-- Schema drift fix (2026-06-21). Prisma schema quyidagilarni e'lon qilgan,
-- lekin DB'ga hech qachon qo'shilmagan edi (migratsiya yozilmagan):
--   • order_chat_messages.target_role  → chat YUBORILMAYDI edi (P2022/Invalid create)
--   • order_chat_messages.telegram_message_id
--   • delivery_proofs jadvali (DeliveryProof modeli)
--   • bir nechta performance indeks
-- Hammasi IDEMPOTENT (if not exists) — qayta ishga tushsa zararsiz.
-- ID/timestamp ustunlari DB konvensiyasiga mos: uuid + timestamptz.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Chat: admin targetRole (kimga yo'naltirilgan) + telegram fallback id
alter table if exists public.order_chat_messages
  add column if not exists target_role public.chat_sender_role_enum;
alter table if exists public.order_chat_messages
  add column if not exists telegram_message_id bigint;

create index if not exists order_chat_messages_order_id_target_role_idx
  on public.order_chat_messages (order_id, target_role);
create index if not exists order_chat_messages_telegram_message_id_idx
  on public.order_chat_messages (telegram_message_id);

-- 2) delivery_proofs (DeliveryProof) — uuid FK orders(id) bilan mos
create table if not exists public.delivery_proofs (
  id                    uuid not null default gen_random_uuid(),
  order_id              uuid not null,
  courier_assignment_id uuid,
  photo_base64          text,
  photo_url             text,
  gps_latitude          numeric(11,8),
  gps_longitude         numeric(11,8),
  distance_meters       integer,
  customer_otp          text,
  otp_verified_at       timestamptz,
  signature_base64      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint delivery_proofs_pkey primary key (id),
  constraint delivery_proofs_order_id_fkey
    foreign key (order_id) references public.orders(id) on delete cascade on update cascade
);
create index if not exists delivery_proofs_order_id_created_at_idx
  on public.delivery_proofs (order_id, created_at);

-- 3) Yetishmayotgan performance indekslar (ustunlar allaqachon bor)
create index if not exists daily_reports_report_date_idx
  on public.daily_reports (report_date);
create index if not exists menu_items_is_featured_is_active_idx
  on public.menu_items (is_featured, is_active);
create index if not exists menu_items_is_popular_is_active_idx
  on public.menu_items (is_popular, is_active);
create index if not exists menu_items_is_new_is_active_idx
  on public.menu_items (is_new, is_active);
create index if not exists menu_items_is_discounted_is_active_idx
  on public.menu_items (is_discounted, is_active);
create index if not exists orders_order_number_idx
  on public.orders (order_number desc);
create index if not exists orders_is_test_order_idx
  on public.orders (is_test_order);

commit;
