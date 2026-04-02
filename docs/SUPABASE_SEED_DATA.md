# Supabase Seed Data

This document describes the demo data inserted into the Supabase PostgreSQL database for the Turon Mini App development environment.

## Inserted Tables

- `users`
- `addresses`
- `menu_categories`
- `menu_items`
- `promo_codes`
- `orders`
- `order_items`
- `courier_assignments`
- `payments`
- `notifications`
- `audit_logs`

## Demo Users

### Admin

- `Ibrohim Yuldashev`
  - role: `ADMIN`
  - telegram_id: `7812345001`
  - phone: `+998901112200`
  - language: `UZ`

### Couriers

- `Jasur Rahimov`
  - role: `COURIER`
  - telegram_id: `7812345002`
  - phone: `+998901112201`
  - language: `UZ`

- `Bekzod Aliev`
  - role: `COURIER`
  - telegram_id: `7812345003`
  - phone: `+998901112202`
  - language: `RU`

### Customers

- `Akmal Karimov`
  - role: `CUSTOMER`
  - telegram_id: `7812345004`
  - phone: `+998901112203`
  - language: `UZ`

- `Dilorom Sodiqova`
  - role: `CUSTOMER`
  - telegram_id: `7812345005`
  - phone: `+998933334455`
  - language: `RU`

- `Timur Xasanov`
  - role: `CUSTOMER`
  - telegram_id: `7812345006`
  - phone: `+998977778899`
  - language: `UZ`

## Demo Catalog

- 8 menu categories
- 26 menu items
- Mixed availability:
  - active and available
  - temporarily unavailable
  - out of stock
  - inactive item kept for admin/demo history checks

## Promo Codes

- `WELCOME10`
  - percentage discount
  - active
- `KOMBO15000`
  - fixed amount discount
  - active
- `RAMADAN20`
  - expired example
- `NEWYEAR30000`
  - future scheduled example

## Order State Coverage

The seed uses the current schema enum values, which map the business states into the implemented database statuses:

- `PENDING` for new incoming orders
- `PREPARING`
- `READY_FOR_PICKUP`
- `DELIVERING`
- `DELIVERED`
- `CANCELLED`

Courier assignment rows additionally cover:

- `ACCEPTED`
- `PICKED_UP`
- `DELIVERING`
- `DELIVERED`
- `CANCELLED`

## Payment Coverage

The dataset includes:

- cash on delivery pending payment
- manual transfer pending verification
- completed external payments
- failed manual transfer example

## Data Volumes

- users: 6
- addresses: 5
- menu_categories: 8
- menu_items: 26
- promo_codes: 4
- orders: 7
- order_items: 14
- courier_assignments: 5
- payments: 7
- notifications: 8
- audit_logs: 5

## Demo Notes

- `order_items` keep snapshots so historical orders remain stable even if menu data changes later.
- `orders` keep financial totals and payment status snapshots for development and audit testing.
- `promo_codes.used_count` is refreshed from seeded orders.
- Notifications cover customer, courier, and admin flows.
- Audit logs cover promo creation, courier assignment, delivery completion, payment rejection, and menu availability change scenarios.
