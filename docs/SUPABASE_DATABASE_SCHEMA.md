# Supabase Database Foundation

This schema is the Supabase-ready relational foundation for the Telegram Mini App delivery system. The SQL migration lives in [20260331210000_delivery_foundation.sql](/C:/project/TURON/supabase/migrations/20260331210000_delivery_foundation.sql).

## Scope

- Keeps the current Mini App-first product shape: `customer`, `admin`, `courier`
- Uses PostgreSQL enums so app and DB statuses stay explicit
- Preserves order history, financial totals, promo usage, courier timeline, payment verification, and auditability
- Stops at the database layer only

## Tables

### `users`

- One row per Telegram-linked user account
- `telegram_id` is unique and stored as `bigint`
- `role` keeps the primary app role in one place
- `language` defaults to `UZ`
- `is_active` supports soft account disabling without deleting order history

### `addresses`

- Multiple delivery addresses per user
- `user_id -> users.id`
- Stores full address text plus snapped delivery coordinates
- Partial unique index allows only one default address per user

### `menu_categories`

- Restaurant menu groups
- `slug` is unique and URL-safe
- `sort_order` supports stable ordering in the customer menu

### `menu_items`

- Products inside categories
- `category_id -> menu_categories.id`
- Stores localized names, localized descriptions, price, stock, image, and availability state
- `availability_status` is separate from `is_active`, so temporary stock changes do not require hiding the item entirely

### `promo_codes`

- Discount rules and lifecycle window
- `code` is uppercase and unique
- `discount_type` supports percentage and fixed-amount discounts
- `used_count` is maintained from the `orders` table through a trigger, so promo usage stays queryable and consistent

### `orders`

- Main financial and logistics aggregate
- `user_id -> users.id`
- `address_id -> addresses.id`
- `courier_id -> users.id` is nullable for unassigned orders
- `promo_code_id -> promo_codes.id` is nullable because not every order uses a promo
- `order_number` is a separate identity-based public order reference
- Stores immutable financial totals: `subtotal`, `discount_amount`, `delivery_fee`, `total_amount`
- Stores coordinate snapshots: `customer_latitude`, `customer_longitude`

### `order_items`

- Line items for each order
- `order_id -> orders.id`
- `menu_item_id -> menu_items.id` is nullable on purpose for history safety
- `item_name_snapshot` and `item_price_snapshot` preserve past order history even if the menu changes later

### `courier_assignments`

- Courier delivery timeline and dispatch state
- `order_id -> orders.id`
- `courier_id -> users.id`
- Tracks assignment timestamps directly: `assigned_at`, `accepted_at`, `picked_up_at`, `delivering_at`, `delivered_at`, `cancelled_at`
- Partial unique index ensures only one active assignment exists for an order at a time

### `payments`

- One payment record per order
- `order_id` is unique
- `admin_verified_by -> users.id` is nullable because not every payment path needs manual review
- `provider_transaction_id` is optional because cash/manual payments may not have an external provider reference

### `notifications`

- Read-model table for in-app notifications
- `user_id -> users.id`
- `role_target` duplicates the intended role for fast filtering and auditing
- `related_order_id -> orders.id` is nullable because some notices are not order-specific

### `audit_logs`

- Immutable operational audit trail
- `actor_user_id -> users.id` is nullable so system actions can also be logged
- `before_state`, `after_state`, and `metadata` use `jsonb`
- `entity_id` is stored as `text` intentionally, so logs can reference either UUID primary keys or business identifiers such as order numbers or promo codes

## Relationships

- `users 1 -> many addresses`
- `users 1 -> many orders`
- `users 1 -> many courier_assignments` as courier
- `users 1 -> many notifications`
- `users 1 -> many audit_logs` as actor
- `menu_categories 1 -> many menu_items`
- `promo_codes 1 -> many orders`
- `orders 1 -> many order_items`
- `orders 1 -> many courier_assignments`
- `orders 1 -> 1 payments`
- `orders 1 -> many notifications`

## Indexes For Performance

- `users(role, is_active)`
- `addresses(user_id)` and partial unique default-address index
- `menu_categories(is_active, sort_order, created_at)`
- `menu_items(category_id, is_active, availability_status)`
- `promo_codes(is_active, starts_at, expires_at)`
- `orders(user_id, status, created_at desc)`
- `orders(courier_id, status, created_at desc)`
- `orders(payment_status)`
- `order_items(order_id)`
- `courier_assignments(courier_id, status, assigned_at desc)`
- partial unique active-assignment index on `courier_assignments(order_id)`
- `payments(status, created_at desc)` and partial unique provider transaction index
- `notifications(user_id, is_read, created_at desc)`
- `audit_logs(entity_type, entity_id, created_at desc)`

## Constraints And Integrity Rules

- PostgreSQL enums enforce valid role, language, order, payment, promo, courier, and notification states
- Coordinate range checks protect latitude/longitude values
- Financial checks protect negative totals and ensure `total_amount = subtotal - discount_amount + delivery_fee`
- `order_items.total_price = item_price_snapshot * quantity`
- Promo validity checks cover usage limit, expiry window, and percentage cap
- Courier assignment timeline checks keep timestamp order sane
- Updated-at triggers keep mutable records synchronized automatically
- Promo usage trigger recalculates `promo_codes.used_count` from live orders

## Nullable Fields And Why

- `users.phone`: Telegram users may arrive before phone collection
- `addresses.note`: optional delivery hints
- `menu_items.description_uz`, `menu_items.description_ru`: some products only need names initially
- `menu_items.stock_quantity`: null supports unlimited/prepared-on-demand items
- `menu_items.image_url`: content upload may happen later
- `promo_codes.usage_limit`: null supports unlimited campaigns
- `promo_codes.expires_at`: null supports evergreen promo codes
- `orders.courier_id`: order may exist before courier assignment
- `orders.promo_code_id`: many orders have no discount
- `orders.note`: optional customer note
- `order_items.menu_item_id`: preserved history even if the source item is removed later
- `courier_assignments.accepted_at`, `picked_up_at`, `delivering_at`, `delivered_at`, `cancelled_at`: timeline fields only populate as the courier progresses
- `courier_assignments.eta_minutes`, `distance_meters`: route metrics can be filled asynchronously
- `payments.provider`, `provider_transaction_id`: cash/manual flows may not use an external gateway
- `payments.admin_verified_by`, `verified_at`, `rejection_reason`: only needed for reviewed or rejected payment cases
- `notifications.related_order_id`: some notifications are global, not order-scoped
- `audit_logs.actor_user_id`, `actor_role`: system-generated actions may have no human actor
- `audit_logs.before_state`, `after_state`, `metadata`: only populated when that audit event has relevant context

## Intentional Deferral

- `carts` were intentionally not added in this step because the current requirement marked them as optional (`if needed`), while this migration focuses on the mandatory business foundation first
- Supabase Auth and RLS policies are also intentionally deferred because the current authentication flow is Telegram-first and app-managed
