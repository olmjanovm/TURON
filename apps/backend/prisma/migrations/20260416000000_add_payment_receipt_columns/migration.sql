ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "receipt_image_base64" TEXT,
  ADD COLUMN IF NOT EXISTS "receipt_uploaded_at" TIMESTAMP(3);
