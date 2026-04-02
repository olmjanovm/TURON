# Manual Test Checklist: High-Level Path Verification

## 1. Role-Based Navigation & Access
- [ ] [ ] **Auth Entry**: User redirected to `/customer` by default.
- [ ] [ ] **Admin Access**: `/admin` available for `ADMIN` role only.
- [ ] [ ] **Courier Access**: `/courier` available for `COURIER` and `ADMIN`.
- [ ] [ ] **RoleGuard**: Unauthorized routes redirect back or show 403.

## 2. Customer Critical Path
- [ ] [ ] **Category Filter**: Clicking category updates the list.
- [ ] [ ] **Cart Totals**: Subtotal, delivery fee, and discount calculate correctly.
- [ ] [ ] **Promo Code**: Active promo reduces total correctly.
- [ ] [ ] **Map Pin**: Location selection saves latitude and longitude.
- [ ] [ ] **Order Success**: Redirect appears after successful creation.
- [ ] [ ] **Order Tracking**: Status badge updates on "My Orders" page.

## 3. Admin Critical Path
- [ ] [ ] **New Order Alert**: High-priority banner for incoming orders.
- [ ] [ ] **Order Detail**: Displays correct items, customer info, and address.
- [ ] [ ] **Status Flow**: Updating status manually correctly identifies next step.
- [ ] [ ] **Courier Picker**: List shows only active couriers.
- [ ] [ ] **Menu Management**: Ability to toggle product "Out of Stock".
- [ ] [ ] **Promo Creation**: Code, discount type, and dates are saved.

## 4. Courier Critical Path
- [ ] [ ] **Active Tasks**: Assigned orders appear in the task list.
- [ ] [ ] **Map Link**: Opens external Yandex/Google map correctly.
- [ ] [ ] **Step Sequence**: Arrive -> Pick Up -> Delivering -> Done sequence works.
- [ ] [ ] **Haptic Feedback**: Vibration on task update (if on mobile).
- [ ] [ ] **Resume Banner**: Persistent banner shows if active delivery exists.

## 5. End-to-End Scenarios (The Big 3)
### E2E-1: Full Standard Flow
- [ ] [ ] Customer creates order (Cash).
- [ ] [ ] Admin accepts and moves to "Preparing".
- [ ] [ ] Admin assigns Courier.
- [ ] [ ] Courier completes delivery.
- [ ] [ ] Customer sees "Delivered" state.

### E2E-2: Payment Flow
- [ ] [ ] Customer creates order (Manual Transfer).
- [ ] [ ] Admin verifies payment in Admin Panel.
- [ ] [ ] Order proceeds to "Preparing".
- [ ] [ ] Customer sees "Paid" state.

### E2E-3: Promo Safety
- [ ] [ ] Admin creates 50% promo.
- [ ] [ ] Customer applies promo.
- [ ] [ ] Total is halved (rounded).
- [ ] [ ] Order snapshot stores the discount amount permanently.
