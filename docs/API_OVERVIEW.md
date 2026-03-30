# API Overview: Turon Mini App Platform

## 1. Authentication (`/auth`)
Backend authentication is based on a seamless Telegram `initData` verification that converts to a standard JWT session.

- **`POST /auth/login`**: Accepts `initData` from the Mini App, validates it against the `BOT_TOKEN`, and returns a JWT.
- **`GET /auth/me`**: Returns the current authenticated user profile and roles.

---

## 2. Menu & Catalog (`/menu`)
Publicly readable catlaog for customers, with admin-only mutations.

- **`GET /menu/categories`**: Returns all active categories. High performance.
- **`GET /menu/products`**: Returns all products, filtered by availability.
- **`POST /menu/products`** (Admin): Creates a new product. Requires `ADMIN` role.
- **`PATCH /menu/products/:id`** (Admin): Updates product details or availability.

---

## 3. Order Management (`/orders`)
Centralized order life-cycle management with role-based visibility.

- **`GET /orders`** (Admin): Returns all orders for the dashboard board.
- **`GET /orders/my`** (Customer): Returns the authenticated user's order history.
- **`POST /orders`** (Customer): Creates a new order. Totals are recalculated on the backend for integrity.
- **`PATCH /orders/:id/status`** (Admin): Transitions an order through the status machine (e.g., `PREPARING` -> `READY`).

---

## 4. Courier Logistics (`/courier`)
Specialized endpoints for the map-driven delivery flow.

- **`GET /courier/orders`**: Returns orders assigned to the authenticated courier.
- **`POST /courier/orders/:id/assign`** (Admin): Assigns a courier to an order.
- **`PATCH /courier/orders/:id/stage`**: Transitions the delivery stage (e.g., `PICKED_UP` -> `ARRIVED_AT_DESTINATION`).

---

## 5. Addresses & Localization (`/addresses`)
User-owned delivery address management.

- **`GET /addresses`**: List authenticated user's saved addresses.
- **`POST /addresses`**: Save a new location (Latitude, Longitude, and Metadata).
- **`DELETE /addresses/:id`**: Remove a saved address.

---

## 6. Promos & Discounts (`/promos`)
Rule-based promo code validation and management.

- **`GET /promos/validate/:code`**: Verifies if a code is active and returns the discount amount.
- **`POST /promos`** (Admin): Creates new promo rules (Expiration, Limit, Discount Type).

---

## 7. System Health (`/health`)
- **`GET /health`**: Returns the status of API and database connectivity.
