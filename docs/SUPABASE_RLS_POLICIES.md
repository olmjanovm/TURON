# Supabase RLS Policies

This document explains the Row Level Security layer for the delivery schema. The SQL migration lives in [20260331213000_delivery_rls.sql](/C:/project/TURON/supabase/migrations/20260331213000_delivery_rls.sql).

## Security Model

- The schema keeps the existing Telegram Mini App architecture unchanged
- Direct client access is intentionally narrow
- Broad operational access is expected to go through the backend using Supabase service role
- RLS is still enabled on every business table so the access model stays explicit and future-proof

## JWT Assumptions

The policy helpers expect the client JWT to carry the application user identity in one of these places:

- `app_user_id`
- `user_id`
- `sub`

For role-aware checks, the helpers first try:

- `app_role`
- `user_role`

If no role claim is present, the database safely looks up the role from `public.users` using the resolved user id.

## Helper Functions

### `public.current_app_user_id()`

- Resolves the current application user UUID from the JWT
- Falls back to `auth.uid()` if needed

### `public.current_app_role()`

- Resolves the current app role from JWT claims or the `users` table

### `public.is_admin()` / `public.is_courier()`

- Convenience helpers for future policy expansion

### `public.can_update_own_user(...)`

- Protects security-sensitive columns on direct profile updates
- Prevents a user from changing `telegram_id`, `role`, or `is_active` from the client

### `public.can_read_order(...)`

- Allows access only when the current user owns the order or is the assigned courier

### `public.can_read_address(...)`

- Allows customers to read their own addresses
- Allows couriers to read only addresses tied to orders assigned to them

### `public.can_update_own_notification(...)`

- Allows notification `is_read`-style updates without allowing message payload tampering

## Table-By-Table Access Logic

### `users`

Direct client access:
- read own row
- update own profile row

Protected by:
- self-scope on `id`
- immutable checks for `telegram_id`, `role`, and `is_active`

Backend service role still handles:
- user creation during Telegram auth bootstrap
- role changes
- account activation/deactivation

### `addresses`

Direct client access:
- read own addresses
- insert own addresses
- update own addresses
- couriers may read addresses only when tied to assigned delivery orders

Backend service role still handles:
- any cross-user operational access
- future admin edits if needed

### `menu_categories`

Direct client access:
- read only active categories

Backend service role handles:
- insert/update/delete
- sort/order administration
- activation toggles

### `menu_items`

Direct client access:
- read only active items with `availability_status = AVAILABLE`

Backend service role handles:
- inventory changes
- pricing updates
- activation toggles
- admin CRUD

### `promo_codes`

Direct client access:
- none

Reason:
- customers must not inspect internal discount rules broadly
- promo validation and application should happen through backend pricing logic

Backend service role handles:
- validation
- CRUD
- activation windows
- reporting

### `orders`

Direct client access:
- customers read only their own orders
- couriers read only their assigned orders

No direct client writes by design.

Reason:
- totals, promos, payment state, and status transitions must stay server-controlled

Backend service role handles:
- order creation
- order status changes
- courier assignment linkage
- financial recalculation

### `order_items`

Direct client access:
- only through visible parent orders

No direct client writes by design.

Reason:
- order history snapshots must remain immutable and server-generated

### `courier_assignments`

Direct client access:
- couriers read only their own assignment rows

No direct client updates by design.

Reason:
- operational stage transitions should continue through backend logic where timeline validation and order-status synchronization happen together

Backend service role handles:
- assignment creation
- acceptance/rejection workflow
- ETA and distance updates
- delivery timeline writes

### `payments`

Direct client access:
- none

Reason:
- provider transaction identifiers and verification metadata are sensitive
- the order summary already exposes customer-safe payment state where needed

Backend service role handles:
- payment creation
- verification
- provider sync
- rejection reasons

### `notifications`

Direct client access:
- read own notifications
- update own notification read-state without changing core payload fields

Protected by:
- `user_id = current_app_user_id()`
- `role_target = current_app_role()`
- helper function that keeps title/message/type/order linkage immutable

Backend service role handles:
- notification creation
- system-wide broadcasts
- role-targeted notices

### `audit_logs`

Direct client access:
- none

Reason:
- audit logs should stay immutable and minimally exposed

Backend service role handles:
- writing audit events
- privileged operational review

## Backend Service Role vs Direct Client Access

### Safe For Direct Client Access

- `users`: self read/update only
- `addresses`: self CRUD plus courier delivery-read
- `menu_categories`: active read only
- `menu_items`: active and available read only
- `orders`: self/assigned read only
- `order_items`: read through permitted orders
- `courier_assignments`: courier self read only
- `notifications`: self read and read-state update

### Should Go Through Backend Service Role

- `promo_codes`
- `orders` writes
- `order_items` writes
- `courier_assignments` writes
- `payments`
- `audit_logs`
- menu management writes
- cross-user/admin operational reads

## Why This Split Is Safe

- Customers and couriers get only the minimum direct visibility needed by the Mini App
- Business-critical writes still stay behind backend validation
- Admin remains operationally powerful through backend service role, without exposing broad direct-table access from the client
- The RLS layer remains explicit and understandable even if you later introduce direct Supabase client reads for selected flows
