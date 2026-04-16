begin;

alter table if exists public.payments
  add column if not exists receipt_image_base64 text,
  add column if not exists receipt_uploaded_at timestamptz;

commit;
