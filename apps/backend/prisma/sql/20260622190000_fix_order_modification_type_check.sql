begin;

-- Schema drift fix (2026-06-22). order_modification_requests.type CHECK constraint
-- faqat ['CANCEL','ADDRESS_CHANGE','OTHER'] ruxsat etardi, lekin kod 5 tur yuboradi
-- (createOrderModification): PAYMENT_METHOD_CHANGE va ITEMS_CHANGE ham bor.
-- Natija: to'lov usulini o'zgartirish / taom qo'shish → 23514 check_violation.
-- Constraint'ni kodga moslab kengaytiramiz.

alter table if exists public.order_modification_requests
  drop constraint if exists order_modification_requests_type_check;

alter table if exists public.order_modification_requests
  add constraint order_modification_requests_type_check
  check (type = any (array['CANCEL','ADDRESS_CHANGE','PAYMENT_METHOD_CHANGE','ITEMS_CHANGE','OTHER']::text[]));

commit;
