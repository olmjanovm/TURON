# QA Test Plan: Turon Mini App Platform

## 1. Overview
This document outlines the test cases and verification procedures for the Turon Mini App (TMA). The goal is to ensure end-to-end integrity across Customer, Admin, and Courier roles.

---

## 2. Customer Tests (Role: CUSTOMER)

| ID | Scenario | Preconditions | Steps | Expected Result | Result |
|:---|:---|:---|:---|:---|:---|
| **C01** | App Entry & Auth | `initData` present | 1. Open app via Telegram. | App identifies user, creates/updates profile, and redirects to `/customer`. | [ ] Pass/Fail |
| **C02** | Menu Browsing | User on Home | 1. Scroll categories. 2. Click category. | Items load dynamically from backend. Correct prices/images shown. | [ ] Pass/Fail |
| **C03** | Cart Actions | User on Product | 1. Add item. 2. Change quantity in cart. 3. Remove item. | Cart state updates instantly. Totals reflect changes. | [ ] Pass/Fail |
| **C04** | Promo Application | Cart has items | 1. Enter valid promo code. 2. Remove promo. | Discount applied immediately. Minimum order value enforced. | [ ] Pass/Fail |
| **C05** | Address Selection | Checkout flow | 1. Open map pin. 2. Save new address. | Geolocation captured precisely. Address saved to user profile. | [ ] Pass/Fail |
| **C06** | Order Creation | Checkout filled | 1. Click "Confirm Order". | Order saved to DB. User redirected to success page. Cart cleared. | [ ] Pass/Fail |
| **C07** | Order Tracking | Active order | 1. Open "My Orders". 2. View details. | Real-time status updates shown (Pending -> Preparing -> Delivering). | [ ] Pass/Fail |

---

## 3. Admin Tests (Role: ADMIN)

| ID | Scenario | Preconditions | Steps | Expected Result | Result |
|:---|:---|:---|:---|:---|:---|
| **A01** | Dashboard KPI | Logged as Admin | 1. View Dashboard. | Correct sales, order counts, and active courier stats visible. | [ ] Pass/Fail |
| **A02** | Order Management | New order exists | 1. Update status to "Preparing". 2. Update to "Ready". | Status updates in DB. Audit log entry created. Customer sees update. | [ ] Pass/Fail |
| **A03** | Courier Assign | Order "Ready" | 1. Select Courier from list. 2. Confirm. | CourierAssignment created. Order moves to Courier view. | [ ] Pass/Fail |
| **A04** | Menu Management | Admin Panel | 1. Create Category. 2. Add Product. 3. Toggle availability. | Changes reflect in Customer UI immediately. | [ ] Pass/Fail |
| **A05** | Promo Management | Admin Panel | 1. Create Promo. 2. Set usage limit. | Promo becomes active. Rules enforced during checkout. | [ ] Pass/Fail |
| **A06** | Payment Verify | Payment "Pending" | 1. Click "Verify". 2. Enter Ref #. | PaymentStatus moves to COMPLETED. Audit trail logged. | [ ] Pass/Fail |

---

## 4. Courier Tests (Role: COURIER)

| ID | Scenario | Preconditions | Steps | Expected Result | Result |
|:---|:---|:---|:---|:---|:---|
| **K01** | Assignment List | Order assigned | 1. Open Courier dashboard. | Assigned order appears with notification badge. | [ ] Pass/Fail |
| **K02** | Map Navigation | Order detail | 1. Click "Open Map". | Yandex/Google map opens with pickup and delivery pins. | [ ] Pass/Fail |
| **K03** | Delivery Stages | Active delivery | 1. "Arrived at Restaurant". 2. "Picked Up". 3. "Delivered". | Successive stages unlock. Order status updates in real-time. | [ ] Pass/Fail |
| **K04** | Invalid Transition | Active delivery | 1. Try "Delivered" before "Picked Up". | System blocks transition via backend StatusService. | [ ] Pass/Fail |
| **K05** | Active Resume | App closed/reopened | 1. Restart app during delivery. | High-priority banner appears to resume active delivery. | [ ] Pass/Fail |

---

## 5. Security & Access Tests

| ID | Scenario | Tester Role | Step | Expected Result | Result |
|:---|:---|:---|:---|:---|:---|
| **S01** | Unauthorized Path | Customer | 1. Manual navigate to `/admin`. | RoleGuard redirects to `/customer` or 403 error. | [ ] Pass/Fail |
| **S02** | ID Tampering | Courier | 1. Try PATCH other order. | Backend verifies courier ID vs assignment. 403 returned. | [ ] Pass/Fail |
| **S03** | Data Validation | - | 1. Submit negative price. | Backend Zod schema rejects request. 400 returned. | [ ] Pass/Fail |
| **S04** | Audit Integrity | - | 1. Perform sensitive mutation. | Verify entry exists in `AuditLog` table with old/new values. | [ ] Pass/Fail |

---

## 6. Deployment & Environment

| ID | Item | Step | Expected Result | Result |
|:---|:---|:---|:---|:---|
| **D01** | Health Check | `GET /health` | Returns `{ "status": "ok" }`. | [ ] Pass/Fail |
| **D02** | Webhook | Send test update | Bot processes request without 50x errors. | [ ] Pass/Fail |
| **D03** | CORS | Frontend request | No CORS policy errors in browser console. | [ ] Pass/Fail |
