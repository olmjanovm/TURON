# 🚨 TURON: BUYURTMA OQIMI VA KRITIK BLOCKERS (Online To'lovdan Tashqari)

**Sana**: 16 Aprel 2026  
**Status**: ❌ Real Buyurtmalar Uchun Tayyor Emas  
**Sabablar**: 3 Critical Blocker + 5 High-Priority Masalalar

---

## 📊 QISQA XULOSA: 12-BOSQICHLI OQIM

```
1️⃣ AUTENTIFIKATSIYA ✅ OK
2️⃣ MENU BROWSING ✅ OK (real-time updates yo'q)
3️⃣ CART ✅ OK
4️⃣ CHECKOUT ✅ OK (phone entry UX muammo)
5️⃣ ORDER CREATION ⚠️ IDEMPOTENCY YO'Q
6️⃣ PAYMENT - MANUAL 🚨 RECEIPT SAVED EMAS
7️⃣ PAYMENT - EXTERNAL ❌ 0% DONE (Click/Payme)
8️⃣ ORDER TO KITCHEN ✅ OK (payment kerak)
9️⃣ KITCHEN PREP ✅ OK
🔟 COURIER ASSIGN ⚠️ REASSIGNMENT YO'Q
1️⃣1️⃣ DELIVERY TRACKING ✅ OK (auto geofence yo'q)
1️⃣2️⃣ PROOF OF DELIVERY 🚨 YO'Q - FRAUD RISK

```

---

# 🔴 3 CRITICAL BLOCKERS (HOZIR DEPLOY QILSA CRASH BO'LADI)

## **BLOCKER #1: MANUAL PAYMENT RECEIPT SAVED EMAS** 🚨

### Muammo:
```
Mijoz: "Mana check rasmi" 📸 (base64 string)
       ↓ [order create endpoint-ga yuboriladi]
Backend: "Qabul qildim ✓"
       ↓ [Biron joyda base64 saqlanadi?]
Database: "Nima? Receipt? Bilmayman 🤷"

Admin Panel-da:
✅ "Approve" tugmasi bor
❌ Receipt rasmi ko'rinmaydi
❌ Admin blind-approve qiladi (hech nima ko'rmay)
```

### Kod Evidentsiyasi:
**File**: `apps/backend/src/api/modules/orders/orders.controller.ts` (Line 595-650)
```typescript
const receiptImageBase64 = createOrderBody.receiptImageBase64;
// ❌ SAQLANMAYAPTI - hech joyda yozilmayapti!
// Database Payment table-da receipt field YO'Q
// File storage-ga yuklanmayapti
```

**Database Schema**: `apps/backend/prisma/schema.prisma`
```prisma
model Payment {
  id String @id @default(cuid())
  method PaymentMethod
  status PaymentStatus
  // ❌ receiptImageUrl yoki receiptBase64 FIELD YO'Q
  // ❌ receipts jadvali YO'Q
}
```

### ❌ Nima Yo'q:
- [ ] Payment jadvali Receipt image URL field yo'q
- [ ] File storage integration (AWS S3/Supabase Storage) yo'q
- [ ] Admin panel receipt display yo'q
- [ ] Receipt validation (OCR/image check) yo'q
- [ ] Receipt audit trail yo'q

### 💔 Oqibasi:
```
Fraudulent Receipt Scenario:
1. Rasm: Biror boshqa rasm yoki fake screenshot
2. Paylaydigan: "Ww, bu receipt!"
3. System: "OK, approve!" ✓
4. Pul: Tomosha qiladi

Shuning uchun:
- Fraud risk VERY HIGH ⚠️
- Compliance issue (audit trail yo'q)
- Chargeback possibility EXTREME
```

### 🔧 FIKSING KERAK (MANDATORY):

```
1. Prisma schema update:
   - Payment model-ga receiptImageUrl field qo'shish
   - Receipts audit table yaratish
   
2. File storage setup:
   - AWS S3 OR Supabase Storage
   - Base64 → Binary → Upload
   
3. Admin panel:
   - Receipt display component
   - Manual image validation
   
4. API:
   - Receipt URL storage to Payment
   - Admin approval/rejection with receipt view
   
Vaqt: 5-7 kun
```

---

## **BLOCKER #2: EXTERNAL_PAYMENT (Click/Payme) NOLGA TENG** 🚨

### Muammo:
```
Mijoz: "Karta raqami? Click orqali to'lashni istayapman!"
UI: ✅ Click radio button bor
UI: ✅ "Pay with Click" tugmasi ko'rinadi

Lekin...

Customer clicks "Pay"
       ↓
Backend: "To'lov UC/Q: PENDING"
       ↓ [Click server tomonidan callback kutamiz]
Click Server: "Sizga pul keldi!" 💰
Backend: "???" [hech kim callback handler yoq]
       ↓
Order: FOREVER PENDING... ❌
Customer: "Nima bo'ldi?" 😭
```

### Kod Evidentsiyasi:

**File**: `apps/backend/src/api/modules/orders/orders.controller.ts` (Line 562)
```typescript
export enum PaymentMethodEnum {
  CASH = 'CASH',
  MANUAL_TRANSFER = 'MANUAL_TRANSFER',
  EXTERNAL_PAYMENT = 'EXTERNAL_PAYMENT',  // ✅ Enum bor
}

// Lekin...
// EXTERNAL_PAYMENT hojjasida nima qilish kerak?
// ❌ Click merchant validation - YO'Q
// ❌ Payme terminal ID check - YO'Q
// ❌ Payment gateway API call - YO'Q
```

**File**: `apps/backend/src/api/modules/orders/orders.routes.ts`
```typescript
// ✅ Webhook routes bor:
ordersRoute.post('/webhooks/:slug', handler)

// Lekin...
// ❌ Click webhook handler - YO'Q
// ❌ Payme webhook handler - YO'Q
// ❌ Signature verification - YO'Q
// ❌ Idempotency check - YO'Q
```

### ❌ Nima Yo'q:
- [ ] Click merchant account configuration
- [ ] Payme terminal configuration
- [ ] Webhook signature verification
- [ ] Webhook idempotency (same webhook twice = duplicate handling)
- [ ] Payment status polling from provider
- [ ] Error handling (payment rejected by provider)
- [ ] Timeout logic (payment never received)
- [ ] Payment reconciliation job

### 💔 Oqibasi:
```
Order Status: PENDING (FOREVER)
Admin: "???" (nima bolgan?)
Customer: "Tolov qildim, lekin order yuqotildi!" 😡
```

### 🔧 FIKSING KERAK:
```
1. Provider Configuration (YTT API bilan):
   - Click merchant key/secret
   - Payme terminal ID/password
   
2. Webhook Handlers:
   - POST /api/webhooks/click
   - POST /api/webhooks/payme
   
3. Payment Verification:
   - Signature check
   - Idempotency (same callback twice?)
   - Payment amount match
   
4. Order Status Update:
   - Payment SUCCESS → Order status PENDING (ready for kitchen)
   - Payment FAILED → Order status CANCELLED
   
5. Error Recovery:
   - Timeout (30 min - cancel order)
   - Retry logic (poll provider for status)

Vaqt: 10-14 kun (YTT API documentation required)
```

---

## **BLOCKER #3: PROOF OF DELIVERY (POD) YO'Q** 🚨

### Muammo:
```
Courier app-da:

Order: "Tepe Rest → Misr Ko'chasi 45B"
Courier: "Delivered!" ✓ [tap]

Nima bo'ldi?
❌ Rasm/video saqlanmadi
❌ GPS location tasdiqlanmadi
❌ Customer imzo/OTP yo'q
❌ Delivery time stamp yo'q

Result: Courier delivered... **QAYERGA?**
        Shayad boshqa joyga? 
        Shayad butunlay bekor qildi?
        Hech kim bilmayman! 🤷

Customer: "Buyurtma kelmadi!" 😡
Courier: "Menda qo'yib ketdim!"
Siz: "Qanday dalil bor?" 
    → DALIL YO'Q → REFUND KERAK → LOSS 💰
```

### Kod Evidentsiyasi:

**File**: `apps/backend/src/api/modules/courier/delivery-stages.controller.ts` (Line ~450)
```typescript
async updateDeliveryStage(req: FastifyRequest, res: FastifyReply) {
  const { orderId, stage } = req.body;
  
  // DELIVERED-ga otkazish:
  if (stage === 'DELIVERED') {
    // ❌ POD nazorat yoq
    // ❌ Rasm upload yoq
    // ❌ GPS check yoq
    // ❌ Customer confirmation yoq
    
    order.stage = 'DELIVERED';
    await order.save();
    return { success: true };
  }
}
```

**Database Schema**: `apps/backend/prisma/schema.prisma`
```prisma
model DeliveryStage {
  // ❌ proofOfDeliveryImageUrl yo'q
  // ❌ deliveryPhotoBase64 yo'q
  // ❌ customerSignatureImageUrl yo'q
  // ❌ customerOTP yo'q
  // ❌ gpsCoordinates yo'q
  // ❌ deliveryTimestamp yo'q
}
```

### ❌ Nima Yo'q:
- [ ] Photo capture at delivery location
- [ ] GPS geofence validation (10m radius)
- [ ] Customer signature/OTP verification
- [ ] Delivery timestamp recording
- [ ] Proof of delivery storage (image + metadata)
- [ ] Photo verification before marking DELIVERED

### 💔 Oqibasi:
```
Fraud Scenario:
1. Courier "delivered" bulsa, asl leverni ko'rsatmadi
2. Customer: "O'tim ko'rinmadi!" (noto'g'ri manzilga olib ketgan)
3. Chargeback request
4. Siz: "Courier said delivered" (dalil yo'q)
5. LOSS - Pul qaytarish

Risk Level: CRITICAL ⚠️⚠️⚠️
```

### 🔧 FIKSING KERAK:
```
1. Courier App Update:
   - Photo capture screen (delivery location)
   - GPS check (within 10m of delivery address)
   - Optional: Customer signature pad OR OTP entry
   
2. Database:
   - DeliveryProof table (proof_image_url, gps_lat/lng, timestamp)
   - Link to Delivery Stage
   
3. Photo Storage:
   - Upload to cloud storage (S3/Supabase)
   - Compress/optimize images
   
4. Validation:
   - GPS within geofence
   - Photo exists and valid image
   - Timestamp recorded
   
5. Customer Notification:
   - POD image in order confirmation email
   - Proof available in order history

Vaqt: 7-10 kun
```

---

# ⚠️ 5 TA HIGH-PRIORITY MUAMMOLAR (PERFORMANCE/UX)

## **ISSUE #1: IDEMPOTENCY KEY YO'Q** ⚠️

### Muammo:
```
Mijoz: [Order tugmasini bosdi]
       [Network lag 3 sekundiya]
Mijoz: [Yana bosdi] (imino edi)
       [Yana bosdi]

Result: 3 TA ORDERDAN BIRI YARATILDI
        3 TA RUZ CHARGED ❌
```

### Kod:
**File**: `apps/backend/src/api/modules/orders/orders.schemas.ts`
```typescript
export const CreateOrderSchema = z.object({
  // ❌ idempotencyKey yo'q
  items: z.array(...),
  address: z.string(),
  paymentMethod: z.enum(...),
});
```

### 🔧 FIKSING:
```
1. Schema-ga idempotencyKey qo'shish
2. Idempotency token tracking table
3. Duplicate detection

Vaqt: 3-5 kun
```

---

## **ISSUE #2: NO GEOFENCE AUTO-TRANSITIONS** ⚠️

### Muammo:
```
Courier-da order:
"Restaurant → Customer Address"

Courier restoranga yetdi:
❌ Sistema avtomatik "ARRIVED" qilmadi
❌ Courier "ARRIVED" tugmasini tap-tap-tap qiladi

Manual 4 ta bosqich:
1. "Arrived at Restaurant" - tap
2. "Picked Up" - tap
3. "On the Way" - tap
4. "Delivered" - tap

Result: Courier noqulay, error risk
```

### 🔧 FIKSING:
```
1. GPS location monitoring
2. Geofence set (10m radius)
3. Auto-transition when entering geofence:
   - Enter restaurant geofence → "ARRIVED"
   - After pickup + exit restaurant → "PICKED_UP"
   - Arrive at customer location → prompt "DELIVERED"

Vaqt: 5-7 kun
```

---

## **ISSUE #3: COURIER REASSIGNMENT YO'Q** ⚠️

### Muammo:
```
Admin: "Courier X-ga order assign qildim"
Courier X: "Ishim yo'q, bekor qilaman" [Reject]

Result: 
❌ Order stuck with Courier X
❌ Admin must manually reassign
❌ No automatic re-ranking
❌ Delivery delay 10-30 min
```

### 🔧 FIKSING:
```
1. Rejection handling:
   - Courier presses "Reject"
   - Order removes from their queue
   
2. Auto-reassignment:
   - System re-ranks available couriers
   - Next best option gets assigned
   - Notification sent
   
3. Manual fallback:
   - If auto-assignment fails, alert admin

Vaqt: 5-7 kun
```

---

## **ISSUE #4: PHONE ENTRY BREAKS CHECKOUT** ⚠️

### Muammo:
```
Checkout flow:

1. Items OK ✓
2. Address OK ✓
3. Delivery time OK ✓
4. Payment method OK ✓
5. FINAL STEP → Phone entry modal pops up

IF user has phone in localStorage:
✅ Pre-filled, all OK

IF user DOESN'T have phone:
❌ Modal appears
❌ User confused (unexpected)
❌ Some users close = checkout abandoned
❌ No fallback
```

### 🔧 FIKSING:
```
1. Move phone to earlier step (checkout beginning)
2. Show as "required" clearly
3. Validation before reaching checkout
4. Fallback: inline input, not modal

Vaqt: 2-3 kun
```

---

## **ISSUE #5: NO REAL-TIME MENU UPDATES** ⚠️

### Muammo:
```
1. Menu loads
2. Admin changes menu (disables item / changes price)
3. Customer sees OLD menu still

Result: 
❌ Customer orders unavailable item
❌ "This item not available" error at checkout
❌ UX broken

OR:

Customer selects Item (price: 10,000)
Admin changes price to 15,000
Customer checkout with OLD price 10,000
Restaurant loses 5,000 ✓ per order
```

### 🔧 FIKSING:
```
1. Real-time menu updates:
   - WebSocket subscription to menu changes
   - Live price/availability updates
   
2. Item lock at checkout:
   - Lock price at time of selection
   - Store item snapshot in order
   - Show old vs new price if changed

Vaqt: 5-7 kun
```

---

# 📋 12-BOSQICHLI ORDER FLOW - DETALIY ANALIZ

## **1️⃣ AUTENTIFIKATSIYA** ✅ ISHLAYAPTI

### Nima Boladi:
```
User opens Telegram Mini App
    ↓
Mini App receives initData (Telegram signature)
    ↓
Frontend: POST /api/auth/login { initData }
    ↓
Backend validates signature with BOT_TOKEN
    ↓
User found/created in database
    ↓
Backend returns JWT token
    ↓
Frontend saves token to localStorage
    ↓
User authenticated ✅
```

### ✅ Ishlayapti:
- Telegram signature verification correct
- JWT generation & expiration
- User profile creation
- Role assignment (CUSTOMER/ADMIN/COURIER)

### ❌ Muammo Yo'q
- Hech qanday blocker yo'q ✓

---

## **2️⃣ MENU BROWSING** ✅ ISHLAYAPTI (PARTIAL)

### Nima Boladi:
```
User navigates to /customer
    ↓
Frontend: GET /api/menu/categories
    ↓
Backend returns [Pizza, Burgers, Drinks, ...]
    ↓
User clicks category
    ↓
Frontend: GET /api/menu/items?categoryId=123
    ↓
Backend returns items with:
- Name (localized: uz, ru, en)
- Price
- Image URL
- Badge (HOT, NEW, etc)
- Availability status
    ↓
Items displayed ✅
```

### ✅ Ishlayapti:
- Category listing
- Product filtering
- Localization (uz/ru/en)
- Image display
- Price display
- Badge system (HOT, NEW)
- Availability flags

### ⚠️ Muammo:
```
❌ Real-time updates yo'q
   - Admin changes menu
   - Customer still sees old version
   - Until page refresh
```

### 📍 Kod:
**File**: `apps/backend/src/api/modules/menu/menu.controller.ts` (Line ~100)
```typescript
async getItems(req: FastifyRequest) {
  const items = await prisma.menuItem.findMany({
    where: { categoryId: req.query.categoryId }
  });
  return items;
  // ❌ No WebSocket subscription for updates
}
```

---

## **3️⃣ CART - PRODUCT SELECTION** ✅ ISHLAYAPTI

### Nima Boladi:
```
Customer selects item
    ↓
Frontend (Zustand store):
  - Add item to cart
  - Store: { itemId, quantity, variant, notes }
  - Save to localStorage
    ↓
Cart sidebar updates ✅
Total recalculated ✅
```

### ✅ Ishlayapti:
- Item add/remove
- Quantity adjustment
- Variant selection
- Special notes
- Cart persistence (localStorage)
- Total calculation
- Promo code application

### ❌ Muammo Yo'q
- All working ✓

### 📍 Kod:
**File**: `apps/miniapp/src/store/useCartStore.ts`
```typescript
export const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set(...),
  removeItem: (id) => set(...),
  clear: () => set(...),
}));
```

---

## **4️⃣ CHECKOUT FLOW** ✅ ISHLAYAPTI (UX ISSUES)

### Nima Boladi:
```
Customer clicks "Checkout"
    ↓
Step 1: Delivery Address
  - Map selection OR saved addresses
  - Pin exact location on map
  - Store: { latitude, longitude, address }
    ↓
Step 2: Delivery Time (optional)
  - ASAP / Scheduled
  - Date + time picker
    ↓
Step 3: Special Notes
  - No onions, extra cheese, etc
  - Optional text field
    ↓
Step 4: Payment Method
  - Select: CASH / MANUAL_TRANSFER / EXTERNAL_PAYMENT
    ↓
Step 5: Phone Number
  - Pre-filled if saved
  - Modal appears if not saved ⚠️ (UX issue)
    ↓
Step 6: Review & Submit
  - Show summary
  - Total price
  - Delivery fee
    ↓
SUBMIT ✅
```

### ✅ Ishlayapti:
- Address selection (map + saved)
- Delivery time scheduling
- Promo code validation (on review page)
- Order summary display
- All fields saved

### ⚠️ Muammolar:
```
1. Phone entry modal interrupts flow
   - Appears unexpected
   - Some users quit checkout
   
2. No validation error display
   - If address invalid, no clear error message
   
3. No backup if promo invalid
   - Code validation happens at submit
   - Better: realtime validation as typing
```

### 📍 Kod:
**File**: `apps/miniapp/src/pages/CheckoutPage.tsx`
```typescript
async handleSubmit() {
  // ❌ Phone entry modal pops here (unexpected)
  if (!userPhone) {
    showPhoneModal();  // Breaks flow!
    return;
  }
  
  // Submit order...
}
```

---

## **5️⃣ ORDER CREATION** ⚠️ IDEMPOTENCY ISSUE

### Nima Boladi:
```
Customer clicks "Confirm Order"
    ↓
Frontend: POST /api/orders { items, address, promo, paymentMethod }
    ↓
Backend validation:
  - All items exist? ✓
  - Menu item prices match? ✓
  - Promo valid? ✓
  - Address valid? ✓
    ↓
Database transaction:
  1. Create Order record
  2. Create OrderItem records (for each item)
  3. Create Payment record
  4. Create Delivery record
    ↓
If success: Return orderId ✅
If error: Rollback all ✅ (transactional integrity good)
```

### ✅ Ishlayapti:
- Transactional integrity
- Item validation
- Price validation
- Promo validation
- Order creation
- Delivery initialization

### ❌ BLOCKER - IDEMPOTENCY YO'Q:
```
Scenario: Network lag + retry

1. Customer clicks "Order" (submit)
2. Request sent, network lag (3 seconds)
3. Customer clicks "Order" again (impatient)
4. Same request sent again

Result: 2 ta ORDER CREATED

User charged 2x ❌
```

### 🔧 FIKSING KERAK:
```
1. Schema-ga idempotencyKey qo'shish:
   POST /api/orders { idempotencyKey, items, ... }
   
2. Backend-da idempotency tracking:
   - Save (idempotencyKey, orderId) pair
   - On duplicate key: return saved orderId
   
3. Frontend:
   - Generate UUID for each checkout
   - Include in request
   - Retry logic: if error, send same UUID

Vaqt: 3-5 kun
```

---

## **6️⃣ PAYMENT - MANUAL TRANSFER** 🚨 RECEIPT SAVED EMAS

### Nima Boladi:
```
Order created with paymentMethod = MANUAL_TRANSFER
    ↓
Customer sees: "Transfer details"
   Bank: HUMO
   Card: 9860 **** **** 1234
   Amount: 125,000 UZS
    ↓
Customer transfers money manually via banking app
    ↓
Customer takes screenshot of receipt
    ↓
Customer uploads receipt image (base64)
    ↓
Frontend: PATCH /api/orders/:id/payment { receiptImageBase64 }
    ↓
Backend receives request...
    ↓
❌ RECEIPT NOT SAVED ANYWHERE
```

### ✅ Ishlayapti:
- Transfer instructions shown
- Receipt upload UI exists
- Base64 received by backend

### 🚨 BLOCKER - RECEIPT NOT SAVED:
```
Backend receives receiptImageBase64 but:
❌ Doesn't save to database
❌ Doesn't upload to file storage
❌ Doesn't store URL in Payment table

Result:
Admin Panel → "Approve Payment" button
Admin clicks
❌ No image to verify
Admin blind-approves (no visual proof)

Fraud Risk: EXTREME
```

### 🔧 FIKSING KERAK:
```
1. Database schema:
   ALTER TABLE payments ADD receiptImageUrl TEXT;
   
2. File storage setup:
   AWS S3 / Supabase Storage
   
3. Backend logic:
   - Convert base64 → binary
   - Upload to storage
   - Save URL to Payment.receiptImageUrl
   - Store upload timestamp
   
4. Admin panel:
   - Display receipt image
   - Add "Verify" button
   - Reject option with reason
   
5. Audit:
   - Log who approved, when
   - Store approval timestamp

Vaqt: 5-7 kun
```

---

## **7️⃣ PAYMENT - EXTERNAL (Click/Payme)** ❌ 0% DONE

### Nima Boladi:
```
Order created with paymentMethod = EXTERNAL_PAYMENT
    ↓
Backend: Order.paymentStatus = PENDING
    ↓
Frontend redirected to payment provider:
  - Click payment page / Payme checkout
    ↓
Customer pays ✅ (money taken from account)
    ↓
Provider sends webhook callback to backend...
    ↓
❌ WEBHOOK HANDLER DOESN'T EXIST
    ↓
Order: STUCK AT PENDING FOREVER ❌
```

### ❌ COMPLETELY MISSING:
```
- Click merchant configuration
- Payme terminal configuration
- Webhook receiver endpoint
- Signature verification
- Order status update logic
- Error handling
- Timeout logic
```

### 🔧 FIKSING KERAK (YTT WITH Click/Payme):
```
Per YTT API documentation:

1. Setup Phase:
   - Get Click merchant key
   - Get Payme terminal ID/password
   
2. Create webhook handlers:
   POST /api/webhooks/click
   POST /api/webhooks/payme
   
3. Payment verification:
   - Signature verification
   - Amount match
   - Order exists
   
4. Order update:
   - Update Payment.status → COMPLETED
   - Update Order.status → PENDING (ready for kitchen)
   - If failed: Order.status → CANCELLED
   
5. Error handling:
   - Network timeout → retry
   - Invalid signature → log alert
   - Amount mismatch → manual review

Vaqt: 10-14 kun (YTT setup required)
```

---

## **8️⃣ ORDER TO KITCHEN** ✅ ISHLAYAPTI (PAYMENT DEPENDENT)

### Nima Boladi:
```
Admin sees new order in dashboard
    ↓
Payment verified (MANUAL or EXTERNAL)
    ↓
Order.paymentStatus = COMPLETED ✅
    ↓
Admin presses "Accept Order"
    ↓
Backend: PATCH /api/orders/:id { status: PREPARING }
    ↓
Kitchen staff notified:
- Order appears on KDS (Kitchen Display System)
- Sound/visual alert
    ↓
Order added to queue ✅
```

### ✅ Ishlayapti:
- Order listing in admin dashboard
- Status transition validation
- Kitchen notification
- Order queueing

### ⚠️ Muammo:
```
❌ Current: Manual status transition only
   - No KDS (Kitchen Display System)
   - No kitchen printer integration
   
❌ Payment blocks this:
   - If payment not approved, order stuck
```

---

## **9️⃣ KITCHEN PREPARATION** ✅ ISHLAYAPTI

### Nima Boladi:
```
Admin/Kitchen staff sees "PREPARING" orders
    ↓
Kitchen starts preparing
    ↓
When ready:
Admin presses "Mark as Ready"
    ↓
Backend: PATCH /api/orders/:id { status: READY_FOR_PICKUP }
    ↓
System:
- Courier assignment process starts
- Customer notified: "Order ready!"
```

### ✅ Ishlayapti:
- Status display
- Status transition
- Timing tracking (preparation duration)
- Customer notification

---

## **🔟 COURIER ASSIGNMENT** ⚠️ NO REASSIGNMENT

### Nima Boladi:
```
Order reaches READY_FOR_PICKUP
    ↓
Backend ranking algorithm:
1. Available couriers?
2. Sort by:
   - Distance to restaurant
   - Current workload
   - ETA to delivery
   - Rating
    ↓
Best courier selected
    ↓
Notification sent to courier:
"New delivery: Restaurant X → Address Y"
    ↓
Courier options:
✅ Accept → Assigned
❌ Reject → ???
```

### ✅ Ishlayapti:
- Sophisticated ranking algorithm
- Distance calculation
- Workload awareness
- ETA calculation
- Courier notification

### ❌ PROBLEM - NO REASSIGNMENT:
```
If Courier rejects:
1. Order stuck with that courier
2. Admin must manually reassign
3. No automatic re-ranking
4. Delay 10-30 minutes

Should be:
1. Courier rejects
2. System auto-ranks next best courier
3. Notification sent
4. Process continues
```

### 🔧 FIKSING:
```
1. Add rejection handler
2. Auto-reassign to next ranked courier
3. Track rejection count
4. Alert admin if all couriers reject

Vaqt: 5-7 kun
```

---

## **1️⃣1️⃣ DELIVERY TRACKING** ✅ ISHLAYAPTI (MOSTLY)

### Nima Boladi:
```
Courier accepts order
    ↓
Courier app shows:
- Restaurant location (pin)
- Customer delivery location (pin)
- Route to restaurant
    ↓
Courier navigates to restaurant
    ↓
WebSocket connection established
    ↓
Real-time GPS tracking:
- Courier position updated every 5 seconds
- Customer sees live location on map
    ↓
Courier reaches restaurant
    ↓
Manual: Courier taps "Arrived" button ✅
  (Should be: Auto-detected by geofence)
    ↓
After pickup:
Manual: Courier taps "Picked Up" ✅
    ↓
Courier navigates to customer
    ↓
Real-time tracking continues
    ↓
Courier arrives at delivery address
    ↓
Manual: Courier taps "Delivering" ✅
```

### ✅ Ishlayapti:
- Real-time GPS updates (WebSocket)
- Map display
- Route showing
- Location tracking
- Customer notifications

### ⚠️ Muammolar:
```
1. Manual stage transitions (should auto-detect)
2. No geofence for restaurant
3. No geofence for delivery
4. Courier must tap buttons (error-prone)
```

---

## **1️⃣2️⃣ PROOF OF DELIVERY** 🚨 CRITICAL MISSING

### Nima Boladi:
```
Courier arrives at customer location
    ↓
Customer (or courier?) goes to delivery address
    ↓
Courier: "Delivered" button
    ↓
Backend: Order.status = DELIVERED ✅
    ↓
❌ PROBLEM:
   No proof captured!
   - No photo
   - No GPS verification
   - No customer signature
   - No OTP
   - Nothing!
```

### 🚨 FRAUD RISK:
```
Scenario 1: Courier delivers to wrong location
- Marks "DELIVERED"
- Customer: "Didn't receive!"
- No photo proof
- REFUND → LOSS

Scenario 2: Courier doesn't deliver at all
- Marks "DELIVERED" at corner
- Customer: "Never came!"
- No evidence
- CHARGEBACK → LOSS

Scenario 3: Partial delivery
- Marks "DELIVERED" with only 2/3 items
- Customer complains
- No photo
- DISPUTE → LOSS
```

### 🔧 FIKSING KERAK:
```
1. Photo capture:
   - Courier takes photo at delivery location
   - Send to backend + store
   
2. GPS verification:
   - Check GPS is within 10m of address
   - Auto-reject if too far away
   
3. Customer confirmation:
   - Option 1: Customer signature pad
   - Option 2: Customer OTP entry
   - Option 3: Courier photo (sufficient in UZ)
   
4. Proof storage:
   - Photo URL
   - GPS coordinates
   - Timestamp
   - (Optional) Signature
   
5. Verification:
   - Photo valid image file
   - GPS within geofence
   - Timestamp reasonable

Vaqt: 7-10 kun
```

---

## **ORDER HISTORY & REORDER** ✅ PARTIAL

### ✅ Ishlayapti:
- View past orders
- Order details
- Rating/review system
- Download receipt

### ❌ MISSING:
```
- Reorder button
  - Quick reorder same items
  - Auto-fill address
  - Auto-fill delivery time preference
```

---

# 🎯 SUMMARY TABLE

| Step | Feature | Status | Blocker | Fix Time |
|------|---------|--------|---------|----------|
| 1 | Auth | ✅ | None | - |
| 2 | Menu | ✅ | Non-critical | 2-3 days |
| 3 | Cart | ✅ | None | - |
| 4 | Checkout | ✅ | UX issue | 2-3 days |
| 5 | Order Create | ⚠️ | **IDEMPOTENCY** | **3-5 days** |
| 6a | Payment-Manual | 🚨 | **RECEIPT SAVED EMAS** | **5-7 days** |
| 6b | Payment-External | ❌ | **0% DONE** | **10-14 days** |
| 7 | Order→Kitchen | ⚠️ | Depends on payment | 2-3 days |
| 8 | Kitchen Prep | ✅ | None | - |
| 9 | Courier Assign | ⚠️ | No reassignment | 5-7 days |
| 10 | Tracking | ✅ | No auto-geofence | 5-7 days |
| 11 | Delivery | 🚨 | **NO POD** | **7-10 days** |
| 12 | History | ✅ | Missing reorder | 2-3 days |

---

# 🚀 DEPLOYMENT READINESS

## **IMMEDIATE (Fix Before Deploy):**
1. ✅ Manual payment receipt storage (BLOCKING)
2. ✅ Proof of delivery system (BLOCKING FRAUD RISK)
3. ✅ Order idempotency (BLOCKING REVENUE LOSS)
4. ✅ Error handler + logging (OPERATIONAL NEED)
5. ✅ Webhook handlers structure (IF using online payments)

## **BEFORE REAL MONEY:**
6. ✅ Phone entry UX fix
7. ✅ Courier reassignment
8. ✅ Geofence auto-transitions
9. ✅ Real-time menu updates
10. ✅ Reorder feature

---

# 📝 CONCLUSION

**Real buyurtmalar qabul qilsa boladi?** ⚠️ **XO'ZIRCHA YO'Q**

**Nima sababdan:**
1. 🚨 Receipt saqlash yoq
2. 🚨 POD yoq (fraud risk)
3. ⚠️ Idempotency yoq (duplicate orders)

**To'ng qilinsa?** ✅ **3-4 hafta ichida tayyor**

**Manual to'lovdan tashqari qolgan hamma shu jadvalda.**

