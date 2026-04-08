-- ============================================================
-- Migration: Add customer rating columns and order chat messages table
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- ─── 1. Customer rating columns on orders ────────────────────────────────────

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "customer_rating"      INTEGER NULL,
  ADD COLUMN IF NOT EXISTS "customer_rating_note" TEXT    NULL;

-- ─── 2. chat_sender_role_enum ────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "chat_sender_role_enum" AS ENUM ('COURIER', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── 3. order_chat_messages table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "order_chat_messages" (
  "id"          TEXT                     NOT NULL,
  "order_id"    TEXT                     NOT NULL,
  "sender_id"   TEXT                     NOT NULL,
  "sender_role" "chat_sender_role_enum"  NOT NULL,
  "content"     TEXT                     NOT NULL,
  "is_read"     BOOLEAN                  NOT NULL DEFAULT false,
  "created_at"  TIMESTAMP(3)             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_chat_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_chat_messages_order_id_fkey"
    FOREIGN KEY ("order_id")  REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "order_chat_messages_sender_id_fkey"
    FOREIGN KEY ("sender_id") REFERENCES "users"("id")  ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "order_chat_messages_order_id_created_at_idx"
  ON "order_chat_messages"("order_id", "created_at" ASC);

CREATE INDEX IF NOT EXISTS "order_chat_messages_sender_id_idx"
  ON "order_chat_messages"("sender_id");
