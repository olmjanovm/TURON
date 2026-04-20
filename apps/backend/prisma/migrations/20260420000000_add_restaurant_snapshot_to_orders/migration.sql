-- Add restaurant snapshot fields to orders table
-- These are populated at order-creation time so couriers always see
-- the restaurant data that was current when the order was placed.

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "restaurant_name"         TEXT,
  ADD COLUMN IF NOT EXISTS "restaurant_phone"        TEXT,
  ADD COLUMN IF NOT EXISTS "restaurant_address_text" TEXT,
  ADD COLUMN IF NOT EXISTS "restaurant_lon"          DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS "restaurant_lat"          DECIMAL(10,7);
