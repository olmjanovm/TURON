# Final Acceptance Checklist: Turon TMA Sign-off

## 1. Role-Based Navigation & Access
- [ ] [ ] **Roles Defined**: CUSTOMER, ADMIN, COURIER.
- [ ] [ ] **Auth Entry**: `/auth` redirects to role-specific entry point (`/customer`, `/admin`, `/courier`).
- [ ] [ ] **RoleGuard**: Unauthorized routes redirect back based on RBAC rules.
- [ ] [ ] **App Shell**: Common components (bottom nav, banners) appear correctly for each role.

## 2. Customer Module
- [ ] [ ] **Menu Browsing**: Dynamic menu from backend categories/products.
- [ ] [ ] **Geolocation**: Interactive map pin for delivery location.
- [ ] [ ] **Cart & Checkout**: Real-time totals, delivery fees, and promo code appliance.
- [ ] [ ] **Order Tracking**: Status badge updates automatically in order history.
- [ ] [ ] **Reorder Flow**: Ability to re-populate cart from past orders.

## 3. Admin Module
- [ ] [ ] **Analytics Dashboard**: KPI cards for "Today's Sales" and "Order Count".
- [ ] [ ] **Order Board**: Multi-tab order list categorized by status.
- [ ] [ ] **Courier Assignment**: Ability to select from active courier list.
- [ ] [ ] **Menu Control**: Full Manageability of categories, products, and variants.
- [ ] [ ] **Promo Control**: CRUD for promo codes and expiration management.
- [ ] [ ] **Payment Verification**: Dedicated flow for manual cash/transfer verification.

## 4. Courier Module
- [ ] [ ] **Task List**: Real-time assignment list for active couriers.
- [ ] [ ] **Map Flow**: Yandex/Google map integration for navigation.
- [ ] [ ] **Stage Management**: Sequence-locked delivery steps (Arrived -> Picked Up -> Done).
- [ ] [ ] **Resume Banner**: High-priority banner for active delivery session.

## 5. Security & Infrastructure
- [ ] [ ] **Input Validation**: No invalid inputs (negative prices, etc.) accepted by backend.
- [ ] [ ] **Audit Trail**: All status changes and sensitive edits recorded in DB.
- [ ] [ ] **Rate Limiting**: Protection against spam/brute-force.
- [ ] [ ] **Health Endpoint**: Standard `/health` check for monitoring.
- [ ] [ ] **Deployment Readiness**: Final build succeeds (Vite) and Docker/Static hosting tested.

---

### Final Sign-off
**Project Lead Signature**: __________________________  **Date**: 2026/___/___
**Stakeholder Signature**: __________________________  **Date**: 2026/___/___
**QA Lead Signature**: __________________________  **Date**: 2026/___/___
