# TURON Complete Order Flow Analysis
**Date**: April 16, 2026  
**Scope**: Full customer order lifecycle (excludes payment gateway SDK integration)  
**Status**: Production readiness assessment

---

## EXECUTIVE SUMMARY

The Turon platform has a **well-architected core** with functioning authentication, menu management, cart, checkout, and basic order lifecycle. However, **3 critical blockers** prevent real production usage:

1. **🚨 Payment receipts are NOT stored** → Admin cannot verify manual transfer payments
2. **🚨 EXTERNAL_PAYMENT (Click/Payme) has ZERO implementation** → No payment provider integration
3. **🚨 No proof of delivery (POD)** → Courier can mark order delivered without proof

Additionally, **5 high-priority gaps** degrade user experience but don't completely block usage.

---

## STEP-BY-STEP FLOW ANALYSIS

### 1. CUSTOMER AUTHENTICATION ✅✅✅

**Implementation**: `apps/backend/src/api/modules/auth/auth.controller.ts` - `telegramAuthHandler()`

**How it works:**
```
Customer opens Mini App
  ↓ Mini App auto-initializes with Telegram.WebApp.initData
  ↓ Frontend POST /auth/telegram with { initData }
  ↓ Backend verifies HMAC-SHA256 signature using BOT_TOKEN
  ↓ Extracts: telegramId, username, firstName, lastName, language
  ↓ UPSERT User record (create or update)
  ↓ Issue JWT: { id: user.id, role: user.role }
  ↓ Customer logged in
```

**Code path:**
1. `verifyTelegramWebAppData(initData, botToken)` - validates HMAC signature
2. `parseTelegramInitData(initData)` - extracts user object
3. `prisma.user.upsert()` - creates/updates with atomic operation
4. `reply.jwtSign()` - generates JWT for subsequent requests
5. `AuditService.record()` - logs LOGIN event (non-blocking)

**✅ What works:**
- Signature verification: Cryptographically sound (HMAC-SHA256)
- User creation: Atomic upsert with race condition handling (P2002 recovery)
- JWT generation: Async with error handling
- Audit logging: Fire-and-forget (doesn't block login)
- Language detection: Maps `tg_user.language_code` → UZ/RU/EN

**❌ What's missing:**
- Phone number: NOT captured during auth (must be entered during checkout)

**🚨 Blockers**: NONE - Auth flow is production-ready

---

### 2. MENU BROWSING ✅✅

**Implementation**: `apps/backend/src/api/modules/menu/menu.controller.ts` - `getMenuCategories()`

**How it works:**
```
Customer navigates to Menu
  ↓ Frontend GET /menu (no auth required per code)
  ↓ Backend retrieves categories with products
  ↓ Localizes text (Uzbek/Russian/English)
  ↓ Calculates availability status (AVAILABLE/OUT_OF_STOCK/TEMPORARILY_UNAVAILABLE)
  ↓ Adds badge (NEW/POPULAR/DISCOUNT)
  ↓ Returns serialized menu
```

**Data structure:**
```typescript
Category {
  id, name, slug, imageUrl, sortOrder, isActive
  items: [
    {
      id, categoryId, name, description, price, oldPrice,
      imageUrl, availability, stockQuantity, badge
    }
  ]
}
```

**Availability logic:**
```typescript
if (product.availabilityStatus) return it;  // Admin override
if (!product.isActive) return TEMPORARILY_UNAVAILABLE;
return stockQuantity > 0 ? AVAILABLE : OUT_OF_STOCK;
```

**✅ What works:**
- Menu serialization: Correct localization (nameUz/nameRu/nameEn fallback)
- Availability calculation: Handles all cases (active flag, stock, admin override)
- Lazy loading: Frontend loads categories on demand
- Caching: Menu cache implemented to reduce DB queries
- Performance: Uses `select()` to fetch only needed columns

**❌ What's missing:**
- Real-time updates: No WebSocket notification when menu changes
- Stock alerts: Customer doesn't see "Low stock" indicators
- Category filtering: No search/filter on category level

**⚠️ UX Issues:**
- If admin updates stock, customer view doesn't refresh (stale menu for 24h+)
- If product runs out, customer only sees it via out-of-stock badge

**🚨 Blockers**: NONE for MVP - menu is read-only for customers

---

### 3. PRODUCT SELECTION & CART ✅✅

**Implementation**: `apps/miniapp/src/store/useCartStore.ts` (Zustand)

**How it works:**
```
Customer clicks product
  ↓ Frontend opens ProductPage with quantity selector
  ↓ Customer clicks "Add to cart"
  ↓ useCartStore.addToCart(product, quantity)
  ↓ Zustand updates local state + persists to localStorage
  ↓ Cart icon updates with item count
  ↓ Customer can continue shopping or go to cart
```

**Cart state:**
```typescript
interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  isAvailable: boolean;
}
```

**Functions:**
- `addToCart(product, qty)` - Adds or increments existing item
- `removeFromCart(productId)` - Removes entire item
- `updateQuantity(productId, delta)` - Adjusts by +/-
- `setPromo(promo)` - Applies discount code
- Computed: `getSubtotal()`, `getDiscount()`, `getTotalItems()`, `getFinalTotal(deliveryFee)`

**✅ What works:**
- Client-side state: All operations instant (no network delay)
- Persistence: Cart survives page refresh (localStorage)
- Promo integration: Discount calculated client-side + validated server-side
- Haptic feedback: Vibration on add/update (Telegram.WebApp.HapticFeedback)
- Quantity validation: Prevents negative quantities

**❌ What's missing:**
- Server-side sync: Cart items not checked against current DB menu on cart load
- Product availability check: No real-time stock check when adding to cart
- Cart expiry: No "save for later" or abandoned cart recovery

**⚠️ UX Issues:**
- If product becomes unavailable, customer doesn't know until checkout
- Cart not synced across devices/browsers (web-only localStorage)

**🚨 Blockers**: NONE - Cart is pure client-side, works as designed

---

### 4. CHECKOUT FLOW ✅⚠️

**Implementation**: 
- Frontend: `apps/miniapp/src/pages/customer/CheckoutPage.tsx`
- Backend: `POST /orders/quote` (QuoteOrderSchema)

**How it works:**
```
Customer views cart total
  ↓ Goes to Checkout page
  ↓ [Step 1] Address selection
      - If no saved address: Opens MapSelectionPage
      - Else: Shows list of saved addresses
      - Customer picks one (triggers new quote calculation)
  ↓ [Step 2] Phone number
      - If no phone in JWT: PhoneModal appears
      - Customer enters +998 formatted number
      - PATCH /users/me/phone persists it
  ↓ [Step 3] Delivery & special requests
      - Shows: Distance, ETA, Delivery fee breakdown
      - Customer can add delivery note
  ↓ [Step 4] Promo code (optional)
      - Frontend calls validatePromo()
      - Shows discount if valid
  ↓ [Step 5] Payment method
      - Radio buttons: CASH / MANUAL_TRANSFER / EXTERNAL_PAYMENT
      - If MANUAL_TRANSFER: Receipt upload field appears
  ↓ [Step 6] Review & place order
      - Shows itemized summary
      - Customer can edit anything
      - Clicks "Place Order"
```

**Delivery fee calculation:**
```
POST /orders/quote with {
  items: [ { menuItemId, quantity }, ... ],
  deliveryAddressId,
  promoCode (optional)
}
```

Backend calculates:
```typescript
distance = haversine(restaurant, customer_address)
           OR Yandex Distance Matrix API
           OR Yandex Router API

base_fee = (distance > BASE_DISTANCE) ? DELIVERY_BASE_FEE : 0
extra_fee = max(distance - BASE_DISTANCE, 0) * RATE_PER_KM
delivery_fee = base_fee + extra_fee

if (subtotal >= FREE_THRESHOLD) delivery_fee = 0

total = subtotal - discount + delivery_fee
```

**✅ What works:**
- Address selection: Customers can save multiple addresses (DeliveryAddress table)
- Phone validation: Normalizes to +998XXXXXXXXX format on backend
- Delivery quote: Multi-source routing (Yandex → Haversine fallback)
- ETA calculation: Uses real routing APIs (not just straight-line distance)
- Promo validation: Server-side check of expiration date and usage limits

**❌ What's missing:**
- Phone caching: After first entry, should be stored for next orders
- Address geocoding: Customer must pick address on map (no address input field)
- Estimated delivery time: Not shown clearly (only ETA for courier)

**⚠️ UX Issues:**
- Phone entry modal appears DURING checkout (breaks flow for first-time users)
- If phone entry fails, checkout is blocked (no recovery UX)
- Large orders may have very high delivery fees (no affordability check)
- Manual address entry: Only map-based selection supported

**🚨 Blockers**: NONE - Checkout flow works for existing customers

---

### 5. ORDER CREATION 🚨⚠️

**Implementation**: `apps/backend/src/api/modules/orders/orders.controller.ts` - `handleCreateOrder()`

**Request schema:**
```typescript
{
  items: [ { menuItemId, quantity, priceAtOrder }, ... ],
  deliveryAddressId,
  paymentMethod: "CASH" | "MANUAL_TRANSFER" | "EXTERNAL_PAYMENT",
  promoCode?: "SUMMER2024",
  note?: "No onions, extra sauce",
  receiptImageBase64?: "data:image/jpeg;base64,..." // For MANUAL_TRANSFER only
}
```

**How it works:**
```
Customer POST /orders/ with cart data
  ↓ [Validation 1] Phone number required
      - Check JWT.phoneNumber
      - Fallback to DB lookup if missing
      - Error if still null: PHONE_REQUIRED
  ↓ [Validation 2] Payment method validation
      - If MANUAL_TRANSFER: receiptImageBase64 must be present
      - Error if missing: RECEIPT_REQUIRED
  ↓ [Validation 3] Price calculation
      - Call buildOrderPricing()
      - Verify all items exist and are active
      - Calculate subtotal, discount, delivery fee, total
      - Return error if items not found
  ↓ [ATOMIC TRANSACTION START]
      - If promo used:
        • Increment promo.timesUsed (acquires exclusive row lock!)
        • Check if promo.usageLimit exceeded
        • Query per-user usage: has this user already used this promo?
        • Both checks must pass or TX rolls back
      - Create Order {
          userId, status=PENDING, paymentStatus=PENDING,
          subtotal, discountAmount, deliveryFee, totalAmount,
          items: [OrderItem, ...],
          payment: { method, status=PENDING, amount=total }
        }
      - Create audit log: CREATE_ORDER
  ↓ [TRANSACTION COMMIT]
  ↓ [After TX] Async operations:
      - Auto-assign courier (if configured)
      - Notify admin via in-app notification
      - Send Telegram bot message to admin
      - Publish WebSocket: Order created
```

**✅ What works:**
- Transactional integrity: Uses `prisma.$transaction()` with proper isolation
- Promo locking: Atomic increment prevents race conditions
- Per-user promo limits: Prevents single customer from abusing promo
- Order items: Creates OrderItem records with snapshots of price/name
- Payment record: Created in Payment table with status=PENDING
- Audit logging: Complete serialized order stored in AuditLog
- Admin notifications: Telegram + in-app
- Auto-assignment: Starts courier search if enabled

**❌ What's missing:**
- **Idempotency: NO idempotency key** → Clicking submit twice creates 2 orders!
- **Receipt storage: receiptImageBase64 sent but NEVER SAVED!**
  - Not stored in Payment table
  - Not uploaded to file storage
  - Admin has no way to see it
  - Payment verification is completely blind
- Cash payment: No explicit handling (unclear if auto-completes)

**🚨 Blockers:**
1. **Missing receipt storage** → Payment verification cannot work
2. **No idempotency** → Network retry creates duplicate orders

**Data schema issue:**
```typescript
// Payment table MISSING field for receipt
model Payment {
  id, orderId, method, status, amount, provider, transactionRef,
  verifiedByAdminId, verifiedAt, rejectionReason  // NO receiptImageUrl or receiptData!
}
```

---

### 6. PAYMENT CONFIRMATION 🚨🚨

**This is the CRITICAL BLOCKER for the entire system.**

**Implementation**:
- Admin approval: `handleApprovePayment()` in orders.controller.ts
- Admin rejection: `handleRejectPayment()` in orders.controller.ts
- Admin UI: `PaymentVerificationCard` component in AdminOrderDetailPage

**Three payment methods, three different flows:**

#### 6A. MANUAL_TRANSFER (Bank transfer receipt)

**Current implementation:**
```
Order created with paymentMethod=MANUAL_TRANSFER
  ↓ Customer submits receiptImageBase64 during order creation
  ↓ [PROBLEM] receiptImageBase64 is NOT saved anywhere!
  ↓ Order status: PENDING
  ↓ Admin sees order in AdminOrdersPage
  ↓ Admin opens order detail
  ↓ PaymentVerificationCard shown with "Approve" / "Reject" buttons
  ↓ Admin has NO WAY to see the receipt! (blind verification)
  ↓ Admin clicks "Approve" anyway (or calls customer to verify receipt)
  ↓ Backend: handleApprovePayment()
      - Payment.status → COMPLETED
      - Order.paymentStatus → COMPLETED
      - If Order.status = PENDING → Update to PREPARING
      - AuditLog: Admin ID + timestamp
  ↓ Customer notified: "Payment confirmed"
  ↓ Order proceeds to kitchen
```

**✅ What works:**
- Approval flow: API logic correct
- Status transition: PENDING → PREPARING works
- Audit trail: Admin ID logged
- Notifications: Customer receives in-app notification

**🚨 Critical issues:**
- **Receipt image completely lost** - not stored anywhere
- **Admin blind verification** - no way to validate receipt actually exists
- **No OCR or image analysis** - can't auto-detect receipt tampering
- **No transaction reference capture** - can't correlate with actual bank transfer

**Admin rejection:**
```
Admin clicks "Reject" on unverified payment
  ↓ handleRejectPayment()
      - Payment.status → FAILED
      - Payment.rejectionReason → "Reason here"
      - Order.status → CANCELLED (auto-cancel)
      - Promo usage rolled back
      - Courier assignments cancelled
  ↓ Customer notified: "Payment rejected - reason: ..."
```

**⚠️ Rejection issues:**
- Order immediately cancelled (no retry opportunity)
- Customer must create new order and upload receipt again
- Poor user experience for legitimate payment failures

#### 6B. EXTERNAL_PAYMENT (Click/Payme)

**Current implementation:**
```
Order created with paymentMethod=EXTERNAL_PAYMENT
  ↓ [PROBLEM] Zero code implementation!
  ↓ No webhook handlers
  ↓ No payment provider SDK integration
  ↓ No callback verification
  ↓ Order stuck at paymentStatus=PENDING FOREVER
```

**What exists:**
- Enum value: `PaymentMethodEnum.EXTERNAL_PAYMENT`
- Database support: Payment table can store method=EXTERNAL_PAYMENT
- Frontend dropdown: User can select it

**What's missing:**
- Click API integration (webhook receiver)
- Payme API integration (webhook receiver)
- Payment status callback handlers
- Merchant key validation
- IPN (Instant Payment Notification) processing
- Transaction ID logging
- Payment reconciliation

**🚨 If customer uses EXTERNAL_PAYMENT:**
1. Order created with paymentStatus=PENDING
2. Payment provider doesn't know about order
3. Customer pays via Click app (payment goes to wrong merchant or fails silently)
4. Order never receives payment confirmation
5. Order stuck in PENDING forever
6. Admin can't do anything

#### 6C. CASH (On-delivery)

**Current implementation:**
```
Order created with paymentMethod=CASH
  ↓ [UNCLEAR] What happens?
  ↓ No explicit handling in code
  ↓ Does paymentStatus auto-complete?
  ↓ Does order go directly to kitchen?
```

**Assumptions:**
- Order created with paymentStatus=PENDING (same as MANUAL_TRANSFER)
- Payment happens on delivery
- Courier collects cash
- Order marked DELIVERED after cash received

**Issues:**
- No explicit "mark as paid" after cash received
- No payment reconciliation (how much cash collected vs. orders completed?)

---

### 7. ORDER TO KITCHEN 🚨⚠️

**Flow:**
```
After payment approved:
  ↓ handleApprovePayment() sets Order.status = PREPARING (auto)
  OR
  ↓ Admin manually transitions PENDING → PREPARING via status endpoint

From that point:
  - Kitchen staff see order in their view (assumed AdminOrdersPage)
  - No dedicated kitchen display system (KDS)
  - No printer integration
  - No order queue management
```

**Status machine:**
```
PENDING → PREPARING → READY_FOR_PICKUP → DELIVERING → DELIVERED
           ↓
        (payment approval auto-transitions here)
```

**✅ What works:**
- Auto-transition: If payment approved → PREPARING automatically
- Status validation: Can't skip transitions (e.g., can't go PENDING → DELIVERED)

**🚨 Blockers:**
- **Payment approval blocks kitchen**: If customer payment unverified, order never reaches kitchen
- **No KDS**: Kitchen staff must view web admin interface (not ideal UX)

**❌ Missing:**
- Kitchen display system (dedicated kitchen view)
- Thermal printer integration (auto-print order tickets)
- Order queue visualization
- Estimated prep time input
- Order staging (by type, by station)

---

### 8. KITCHEN PREPARATION ✅⚠️

**Implementation**: `handleUpdateStatus()` in orders.controller.ts

**How it works:**
```
Admin in AdminOrderDetailPage
  ↓ Sees order with PENDING status
  ↓ Clicks "Qabul qilish" (Accept/Start prep)
  ↓ Status updates: PENDING → PREPARING
  ↓ Kitchen staff see order status changed
  ↓ [Prep happens manually - ~15-30 min]
  ↓ Admin/kitchen clicks "Tayyorlash" (Finished prep)
  ↓ Status updates: PREPARING → READY_FOR_PICKUP
  ↓ Customer notified: "Order ready for pickup"
  ↓ Waiting for courier
```

**Each status transition:**
```typescript
// Validates transition
if (!StatusService.validateOrderStatusTransition(current, next)) {
  return error("Invalid transition");
}

// Updates in transaction
await tx.order.update({ where: { id }, data: { status: next } });

// Updates courier assignment if needed (for DELIVERING/DELIVERED)
if (next === DELIVERING || next === DELIVERED) {
  await tx.courierAssignment.update(...);
  await tx.courierAssignmentEvent.create(...);
}

// Publishes WebSocket
await publishOrderSnapshot(orderId);

// Audit log
await AuditService.record({ action: "STATUS_CHANGE", ... });

// Notifications
await dispatchOrderStatusNotifications(...);
```

**✅ What works:**
- Status validation: Enforced state machine
- WebSocket broadcasts: All subscribers notified immediately
- Audit trail: Who changed status, when
- Notifications: Customer gets status update notifications

**❌ Missing:**
- Estimated prep time: No "2 items ready, 1 item still cooking"
- Prep time tracking: No comparison with estimated vs. actual
- Kitchen visibility: No dedicated KDS
- Multi-station support: Can't mark individual items ready
- Prep notes: No "chef's special request" handling

**⚠️ UX Issues:**
- Manual clicks required (no auto-detection)
- If kitchen forgets to click "Ready", customer waits indefinitely
- No timeout warning (order "stuck" for too long)

---

### 9. COURIER ASSIGNMENT 🚨⚠️

**Implementation**: `courier-assignment.service.ts`

**How assignment happens:**

#### 9A. Auto-Assignment (preferred)

```
Triggered after order creation (if config enabled)
  ↓ continueAutoAssignmentAfterOrderCreation()
  ↓ Calls CourierAssignmentService.autoAssignOrder(orderId)
  ↓ [Query available couriers]
      - isOnline = true
      - isAcceptingOrders = true
      - activeAssignments < MAX
  ↓ [Calculate metrics for each courier]
      - Has live location? (from CourierPresence table)
      - Distance from restaurant (haversine or Yandex API)
      - ETA minutes
      - Active assignment count (workload)
      - Last assigned timestamp
  ↓ [Rank couriers]
      - Priority 1: Has live location (more accurate distance)
      - Priority 2: Closest distance (straight haversine fallback)
      - Priority 3: Lowest ETA
      - Priority 4: Lowest workload
      - Priority 5: Not assigned recently (round-robin)
  ↓ [Select top courier]
      - Create CourierAssignment { orderId, courierId, status=ASSIGNED }
      - Store distanceMeters, etaMinutes
  ↓ [Notify courier]
      - In-app notification: "New delivery assignment"
      - Telegram bot message: Click to accept
```

**Code snippet (ranking):**
```typescript
function compareRankedCouriers(left, right) {
  // Has live location? Better
  if (left.hasLiveLocation !== right.hasLiveLocation) {
    return left.hasLiveLocation ? -1 : 1;
  }
  // Closer distance? Better
  if (left.distance !== right.distance) {
    return left.distance - right.distance;
  }
  // Faster ETA? Better
  if (left.eta !== right.eta) {
    return left.eta - right.eta;
  }
  // Lower workload? Better
  if (left.activeAssignments !== right.activeAssignments) {
    return left.activeAssignments - right.activeAssignments;
  }
  // Not assigned recently? Better (round-robin)
  return new Date(left.lastAssigned) - new Date(right.lastAssigned);
}
```

#### 9B. Manual Assignment

```
Admin in AdminOrderDetailPage
  ↓ Clicks "Assign Courier" button
  ↓ Modal opens with list of available couriers
  ↓ Admin selects one
  ↓ PATCH /orders/{id}/assign-courier { courierId }
  ↓ Creates CourierAssignment { orderId, courierId, status=ASSIGNED }
```

**✅ What works:**
- Sophisticated ranking algorithm
- Live location integration (pulls from CourierPresence)
- Workload balancing (doesn't overload single courier)
- Multi-strategy support (auto + manual)
- Distance calculation (Yandex or fallback haversine)

**🚨 Blockers:**
- **No acceptance timeout**: If courier doesn't accept for 30min, order stuck
- **No auto-reassignment**: If courier rejects, admin must manually reassign
- **Courier offline handling**: If courier goes offline, still assigned

**❌ Missing:**
- Courier acceptance deadline (e.g., must accept within 5 minutes)
- Auto-escalation (if no acceptance, try next courier automatically)
- Priority queue (urgent orders not prioritized over regular)
- Batch assignments (multiple orders to same courier at once)
- Reassignment on timeout

**⚠️ Issues:**
- If assigned courier rejects: Order status returns to READY_FOR_PICKUP indefinitely
- If assigned courier goes offline: No auto-detection (stale assignment)
- No "assignment declined" notification to admin

---

### 10. DELIVERY TRACKING 🚨⚠️

**Implementation**: 
- Courier location updates: `POST /couriers/me/location`
- Location storage: `CourierPresence` table
- Customer tracking: `GET /orders/{id}/tracking/stream` (SSE)

**How courier tracking works:**

```
Courier opens delivery app
  ↓ App loads active assignment
  ↓ CourierMapView shows map with restaurant + customer location
  ↓ Courier starts delivering
  ↓ App starts location updates every 2-5 seconds:
      POST /couriers/me/location {
        latitude, longitude, heading, speedKmh
      }
  ↓ Backend stores in CourierPresence table
  ↓ Backend publishes WebSocket: courier.location event
  ↓ Courier taps stage buttons:
      - "Arrived at restaurant" → ARRIVED_AT_RESTAURANT
      - "Picked up" → PICKED_UP
      - "On the way" → DELIVERING
      - "Delivered" → DELIVERED
```

**How customer sees tracking:**

```
Customer opens order detail
  ↓ Subscribes to GET /orders/{id}/tracking/stream
  ↓ Server-Sent Events connection opens
  ↓ Customer sees live map with courier location
  ↓ Remaining distance + ETA shown
  ↓ Every location update received via SSE:
      { type: 'courier.location', orderId, tracking: {...} }
  ↓ Map updates in real-time (smooth animation)
  ↓ Customer can click to call courier (in-app chat)
```

**Location snapshot:**
```typescript
interface CourierLocationSnapshot {
  latitude: number;
  longitude: number;
  heading?: number;            // Direction 0-360°
  speedKmh?: number;           // Current speed
  remainingDistanceKm?: number;
  remainingEtaMinutes?: number;
  updatedAt: string;           // ISO timestamp
}
```

**Stale data handling:**
```
If location not updated for 45 seconds:
  - isLive = false
  - Customer sees "Last seen X minutes ago"
  - Map doesn't update
  - ETA becomes unreliable
```

**✅ What works:**
- Location updates: SSE streaming works
- Real-time map: Live courier position shown
- Heading display: Courier direction shown as arrow
- ETA calculation: Remaining distance / speed estimate
- Audit trail: All location updates logged

**🚨 Blockers:**
- **No auto-stage transitions**: Courier must manually tap each button
- **Geofence not detected**: App doesn't auto-detect arrival at restaurant
- **No offline detection**: If courier app crashes, location stale for 45+ seconds

**❌ Missing:**
- Geofence-based auto-transitions (auto-mark "Arrived at restaurant")
- Courier offline timeout (auto-reassign if offline for 5min)
- Speed anomalies (detect if courier stopped moving for no reason)
- Route deviations (alert if courier taking wrong route)
- Photo at delivery location (proof of delivery)

**⚠️ UX Issues:**
- Manual stage transitions break immersion
- If courier forgets to tap "Delivered", order stuck in DELIVERING forever
- Stale location persists even after 45 seconds (customer sees old position)
- No "cancel delivery" option for customer

---

### 11. DELIVERY COMPLETION 🚨🚨

**Implementation**: Status transition DELIVERING → DELIVERED

**How it works:**

```
Courier arrives at customer location
  ↓ Courier taps "Delivered" button (manual)
  ↓ OR Admin manually transitions DELIVERING → DELIVERED
  ↓ Backend updates Order.status = DELIVERED
  ↓ Backend updates CourierAssignment.status = DELIVERED
  ↓ Backend creates CourierAssignmentEvent { eventType: DELIVERED }
  ↓ Order locked to terminal state (no more transitions)
  ↓ Customer notified: "Order delivered"
  ↓ Courier freed to accept next delivery
  ↓ After 1-2 hours, customer can rate order 1-5 stars
```

**Delivery completion check:**
```typescript
if (status === OrderStatusEnum.DELIVERED) {
  // Final updates
  await tx.order.update({
    where: { id: order.id },
    data: { status: 'DELIVERED' }
  });
  
  await tx.courierAssignment.update({
    where: { id: activeAssignment.id },
    data: {
      status: 'DELIVERED',
      deliveredAt: now
    }
  });
  
  // Order becomes immutable
  // Terminal state - no more transitions allowed
}
```

**Customer rating (optional):**
```
After DELIVERED state:
  ↓ Customer can see "Rate order" button
  ↓ Click → Rating modal (1-5 stars, optional comment)
  ↓ PATCH /orders/{id}/rating { rating: 4, note: "Great!" }
  ↓ Stored in Order.customerRating + customerRatingNote
```

**✅ What works:**
- Status transition: Correct state machine
- Courier freed: Can accept next order
- Order locked: Cannot be changed after delivery
- Rating system: Can rate after delivery
- Audit trail: DELIVERED event logged with actor ID

**🚨 Critical missing - NO PROOF OF DELIVERY (POD):**

A deliverer can simply tap "Delivered" without actually delivering:
- No photo of delivery location
- No signature capture
- No customer confirmation
- No OTP verification
- Admin has ZERO confirmation delivery actually happened

**Example fraud scenario:**
```
Courier at wrong address
  ↓ Taps "Delivered" anyway
  ↓ Order marked DELIVERED
  ↓ Admin sees DELIVERED (✓ completed)
  ↓ Payment received (assumed completed)
  ↓ Customer never received food
  ↓ Customer disputes → refund hassle
```

**❌ Missing:**
- Photo capture: Delivery location proof
- Signature collection: Customer acknowledges delivery
- OTP verification: Only customer knows code
- GPS verification: Delivery within 100m of customer address
- Timestamp verification: Delivery time matches customer expected

**⚠️ Workarounds (not implemented):**
- Customer confirmation prompt: "Did courier ring doorbell?"
- Manual customer contact: Admin calls to verify
- Courier rating system: Track fraud couriers over time

---

### 12. ORDER HISTORY & REORDER ✅⚠️

**Implementation**: 
- Frontend: `pages/customer/OrdersPage.tsx`
- Backend: `GET /orders/my` (user-specific)

**How order history works:**

```
Customer navigates to "My Orders"
  ↓ Frontend calls GET /orders/my (auto-filtered by userId)
  ↓ Backend returns orders sorted by createdAt DESC
  ↓ Frontend separates into:
      - Active orders: status ≠ DELIVERED && status ≠ CANCELLED
      - Completed orders: status = DELIVERED || status = CANCELLED
  ↓ Active tab shows 1-5 orders (usually PENDING, PREPARING, READY, DELIVERING)
  ↓ Completed tab shows 10-50+ orders (scrollable)
  ↓ Each order card shows:
      - Order number (e.g., #1234)
      - Items count
      - Total amount
      - Current status
      - Order time
      - ETA if active
  ↓ Customer clicks order
  ↓ DetailPage opens with:
      - Items list (name, qty, price)
      - Delivery address
      - Delivery fee breakdown
      - Tracking map (if active)
      - Chat with courier (if in delivery)
      - Rating (if completed)
```

**Rating feature:**
```
After order DELIVERED (wait 1-2 hours):
  ↓ "Rate order" button appears
  ↓ Click → Modal with 1-5 stars
  ↓ Optional comment field
  ↓ PATCH /orders/{id}/rating { rating: 4, note: "..." }
  ↓ Stored in Order table: customerRating, customerRatingNote
```

**✅ What works:**
- Order listing: Efficient query with proper filtering
- Sorting: Newest first
- Tab separation: Active vs completed clear
- Order details: Full information shown
- Rating: Can rate after delivery
- Pagination: Handles large order history

**❌ Critical missing - NO REORDER FEATURE:**

Customer cannot easily reorder previous order. Instead:
```
Customer sees past order with items
  ↓ Wants to reorder same items
  ↓ Must manually:
    1. Click each item name to remember it
    2. Navigate to Menu page
    3. Find each item
    4. Add to cart
    5. Go to checkout
```

**What should exist:**
```
Customer sees past order
  ↓ Clicks "Reorder" button
  ↓ Items automatically added to cart
  ↓ Redirects to checkout with same address pre-filled
  ↓ Customer confirms
  ↓ Done (1 click vs 10 clicks)
```

**❌ Missing features:**
- Reorder button (one-click add all items to cart)
- Favorite orders (save as template)
- Recurring orders (auto-reorder weekly)
- Order frequency analytics (most ordered items)

**⚠️ Issues:**
- No order subscription/recurring
- No "Smart reorder" (quantities adjusted based on history)
- No time-based suggestions ("Order sushi every Friday night?")

---

## PRODUCTION READINESS MATRIX

| Step | Core Feature | Status | Blocker | Severity |
|------|---|---|---|---|
| 1 | Authentication | ✅ Working | None | N/A |
| 2 | Menu Browsing | ✅ Working | Minor | Low |
| 3 | Cart | ✅ Working | None | N/A |
| 4 | Checkout | ✅ Working | Minor | Low |
| 5 | Order Creation | ⚠️ Partial | Idempotency missing | Medium |
| 6a | Payment (Manual) | 🚨 Broken | **No receipt storage** | **CRITICAL** |
| 6b | Payment (Click/Payme) | ❌ Missing | **Not implemented** | **CRITICAL** |
| 6c | Payment (Cash) | ⚠️ Unclear | Undefined flow | Medium |
| 7 | Order to Kitchen | 🚨 Blocked | Payment blocks flow | **CRITICAL** |
| 8 | Kitchen Prep | ✅ Working | No KDS | Low |
| 9 | Courier Assignment | ⚠️ Partial | No reassignment | Medium |
| 10 | Delivery Tracking | ⚠️ Partial | No geofence | Medium |
| 11 | Delivery Completion | 🚨 Broken | **No proof of delivery** | **CRITICAL** |
| 12 | Order History | ⚠️ Partial | No reorder feature | Low |

---

## CRITICAL BLOCKERS (Must fix for production)

### 🚨 BLOCKER #1: Payment receipt not stored

**Problem:**
```typescript
// In handleCreateOrder():
const { receiptImageBase64 } = request.body;
// ❌ receiptImageBase64 is received but NEVER saved!

// In Payment table:
model Payment {
  // Missing: receiptImageUrl, receiptData, receiptImageHash
}

// Result: Admin cannot verify payment
// Admin blind-approves payment without seeing receipt
```

**Business impact:**
- Admin cannot verify manual bank transfers
- Susceptible to fraudulent receipts
- No audit trail of receipt images
- Compliance/taxation issues (no proof of payment)

**Fix required:**
1. Save receiptImageBase64 to file storage (S3/Cloudinary/local)
2. Store image URL in Payment.receiptImageUrl
3. Update admin UI to display receipt image
4. Add image validation (not just random base64)

---

### 🚨 BLOCKER #2: EXTERNAL_PAYMENT not implemented

**Problem:**
```typescript
// PaymentMethodEnum has EXTERNAL_PAYMENT
// But zero implementation:
// - No Click webhook receiver
// - No Payme webhook receiver
// - No payment callback handler
// - No IPN verification

// Result: Customer can select Click/Payme
// But payment never completes
// Order stuck at paymentStatus=PENDING forever
```

**Business impact:**
- If customer selects Click/Payme, order fails silently
- Payment provider receives no notification
- Customer charged twice (once in app, once fails)
- No revenue from external payment method

**Fix required:**
1. Choose payment provider (Click/Payme/Uzum)
2. Implement webhook receiver: `POST /webhooks/payment/{provider}`
3. Verify webhook signature (merchant key validation)
4. Handle payment notifications (PENDING → COMPLETED/FAILED)
5. Update order status on payment success
6. Reconciliation report

---

### 🚨 BLOCKER #3: No proof of delivery

**Problem:**
```typescript
// Courier can tap "Delivered" with zero proof:
await handleUpdateStatus({
  status: OrderStatusEnum.DELIVERED
  // NO verification that customer actually received food!
})

// Result: Fraud possible
// Courier marks delivered at wrong location
// Admin sees order completed
// Customer never received food
// Chargeback/refund complications
```

**Business impact:**
- Courier fraud (mark delivered without delivering)
- Customer disputes (chargebacks)
- No accountability
- Low customer retention

**Fix required:**
1. Photo capture at delivery location
2. OR customer OTP verification (sent via SMS/Telegram)
3. OR customer confirmation prompt ("Confirm receipt")
4. Timestamp + GPS verification
5. Admin review dashboard for flagged deliveries

---

## HIGH-PRIORITY FIXES (Degrade UX but don't completely block)

### ⚠️ Issue #1: No idempotency key

**Problem:**
```typescript
// If customer clicks submit twice (slow network):
POST /orders/ → 201 (order #1 created)
POST /orders/ → 201 (order #2 created!) 

// Same items, same address, same payment!
// Double charge if payment auto-completes
```

**Fix:**
```typescript
// Add idempotency key to request
POST /orders/ {
  ..., 
  idempotencyKey: "uuid-v4"
}

// Store key → orderId mapping in cache
// Return same order if seen again within 10min
```

---

### ⚠️ Issue #2: No geofence-based auto-transitions

**Problem:**
```
Courier must manually tap each stage button
- "Arrived at restaurant" (manual)
- "Picked up" (manual)
- "On the way" (manual)
- "Delivered" (manual)

// If courier forgets, order stuck indefinitely
// No indication it's forgotten
```

**Fix:**
```
Use geofencing:
- Auto-detect arrival at restaurant (within 100m)
- Auto-detect arrival at customer (within 50m)
- Still require tap for "Picked up" (manual trigger)
- Reduce manual taps from 4 to 1
```

---

### ⚠️ Issue #3: No auto-reassignment on courier rejection

**Problem:**
```
Assignment created: ASSIGNED
Courier taps "Reject"
Assignment status: REJECTED
Order status: READY_FOR_PICKUP (stuck)

// Order must be manually reassigned by admin
// No auto-try next courier
```

**Fix:**
```
Rejection flow:
1. Courier rejects assignment
2. Immediately try next ranked courier
3. If all couriers exhausted, notify admin
4. Admin can bump priority or extend distance radius
```

---

### ⚠️ Issue #4: Receipt upload doesn't validate format

**Problem:**
```
receiptImageBase64: "data:text/plain;base64,dGVzdA==" 
// Just "test" - not actually an image!

// Backend accepts any base64 without validation
// Could be text, not image
```

**Fix:**
```
Validate:
1. Base64 can be decoded
2. MIME type is image/* (jpeg/png/webp)
3. File size < 10MB
4. Image dimensions reasonable (not 1x1px)
5. OCR check: contains text like bank name, transfer amount
```

---

### ⚠️ Issue #5: Phone entry breaks checkout flow

**Problem:**
```
New customer at checkout:
  ↓ Phone modal appears
  ↓ Customer enters phone
  ↓ If API fails, modal stuck
  ↓ No "skip" or "use anonymous delivery" option
  ↓ Checkout blocked
```

**Fix:**
```
1. Validate phone in real-time
2. Add "skip" button (allow nullable phone initially)
3. Require phone only when courier accepts
4. Save phone to user profile for next order
5. Auto-fill on subsequent checkouts
```

---

## SUMMARY: DEPLOYMENT RECOMMENDATIONS

### If deploying **TODAY**:
❌ **NOT RECOMMENDED**

- Payment system unusable (can't verify MANUAL_TRANSFER, EXTERNAL_PAYMENT unimplemented)
- Proof of delivery missing (high fraud risk)
- Idempotency missing (duplicate orders on network retry)

### If deploying **in 2-3 weeks** (after fixes):
✅ Feasible with MVP constraints

**Must complete:**
1. Store and display receipt images
2. Implement one payment provider (Click or Payme)
3. Add proof of delivery (POD) - at minimum customer confirmation
4. Add idempotency keys to order creation
5. Fix status transition auto-completion (geofence or timeout)

**Can defer:**
1. Full KDS (kitchen display system)
2. Reorder feature
3. Advanced analytics
4. Subscription/recurring orders

---

## CODE REFERENCES (File locations)

**Auth flow**: `apps/backend/src/api/modules/auth/auth.controller.ts`  
**Menu**: `apps/backend/src/api/modules/menu/menu.controller.ts`  
**Cart**: `apps/miniapp/src/store/useCartStore.ts`  
**Checkout**: `apps/miniapp/src/pages/customer/CheckoutPage.tsx`  
**Order creation**: `apps/backend/src/api/modules/orders/orders.controller.ts:442`  
**Payment approval**: `apps/backend/src/api/modules/orders/orders.controller.ts:1057`  
**Status transitions**: `apps/backend/src/services/status.service.ts`  
**Courier assignment**: `apps/backend/src/services/courier-assignment.service.ts`  
**Delivery tracking**: `apps/backend/src/services/order-tracking.service.ts`  
**Order history**: `apps/miniapp/src/pages/customer/OrdersPage.tsx`  

---

**Report compiled**: April 16, 2026  
**Analysis scope**: Full order lifecycle (auth → delivery → history)  
**Next steps**: Address critical blockers, then UAT
