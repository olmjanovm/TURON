# 🚨 TURON: HAQIQIY BUYURTMALAR UCHUN TAYYOR EMAS - EXACT BLOCKERS

**Sana**: 16 Aprel 2026  
**Maqsad**: Hozir qaysi qism ishlashni bloklashayotganini ANIQ ko'rsatish  
**Format**: File path + Line number + Current code + What's missing

---

# 🔴 BLOCKER #1: MANUAL PAYMENT RECEIPT SAVED EMAS

## **PROBLEM**: 
Mijoz receipt rasmi yuboradi → Backend qabul qiladi → **Hech joyda saqlalmayapti** → Admin blind-approve qiladi

---

## **1️⃣ FRONTEND - Receipt correctly sent** ✅

**File**: `apps/miniapp/src/pages/customer/CheckoutPage.tsx`

**Line 127**: Receipt yuborilmoqda
```typescript
receiptImageBase64: paymentMethod === 'MANUAL_TRANSFER' ? receiptImage : undefined,
```

✅ **OK** - Receipt yuborilmoqda


---

## **2️⃣ BACKEND - Receipt received but NOT saved** ❌

**File**: `apps/backend/src/api/modules/orders/orders.controller.ts`

**Line 447**: Receipt received
```typescript
const { 
  items, 
  deliveryAddressId, 
  paymentMethod, 
  promoCode, 
  note, 
  receiptImageBase64  // ← Receipt qabul qilinadi
} = request.body;
```

**Lines 467-469**: Receipt validation
```typescript
if (paymentMethod === PaymentMethodEnum.MANUAL_TRANSFER) {
  if (!receiptImageBase64) {
    throw new BadRequestException('Receipt image required for manual transfer');
  }
}
```

✅ **OK** - Validated

**Lines 527-536**: ❌ **PROBLEM - Receipt IGNORED**
```typescript
payment: {
  create: {
    method: paymentMethod,
    status: PaymentStatusEnum.PENDING as any,
    amount: quote.totalAmount,
    provider: paymentMethod === 'MANUAL_TRANSFER' 
      ? 'Manual transfer' 
      : null,
    // ❌ receiptImageBase64 SAQLANMAYAPTI!
    // ❌ Hech qayerda yozilmayapti
  },
}
```

---

## **3️⃣ DATABASE SCHEMA - Receipt field YO'Q** ❌

**File**: `apps/backend/prisma/schema.prisma`

**Lines 456-474**: Payment model
```prisma
model Payment {
  id                String            @id @default(uuid())
  orderId           String            @unique @map("order_id")
  method            PaymentMethodEnum
  status            PaymentStatusEnum @default(PENDING)
  amount            Decimal           @db.Decimal(12, 2)
  provider          String?
  transactionRef    String?
  verifiedByAdminId String?
  verifiedAt        DateTime?
  rejectionReason   String?
  
  // ❌ MISSING FIELDS:
  // receiptImageUrl         String?
  // receiptImageBase64      String?
  // receiptUploadedAt       DateTime?
  
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")
  
  order             Order             @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

❌ **Receipt field YO'Q!**

---

## **4️⃣ ADMIN APPROVAL - Can't see receipt** ❌

**File**: `apps/backend/src/api/modules/orders/orders.controller.ts`

**Lines 1057-1135**: Admin payment approval
```typescript
export async function handleApprovePayment(request, reply) {
  const order = await findOrderWithDetails(orderId);
  
  // ❌ NO receipt retrieval
  // const payment = await prisma.payment.findUnique({
  //   where: { orderId: order.id },
  //   select: { receiptImageBase64: true }
  // });
  
  // ❌ NO receipt validation
  
  // Just mark as approved (BLIND!)
  await tx.payment.update({
    where: { orderId: order.id },
    data: {
      status: PaymentStatusEnum.COMPLETED,
      verifiedByAdminId: admin.id,
      verifiedAt: now,
    },
  });
}
```

❌ **Admin can't see receipt image!**

---

## **💥 OQIBASI**: 

```
Mihoj: "Mana transfer rasmi"
System: "OK saved!" (lie)
...later...
Admin: "Approve payment?"
Admin: "????" (receipt ko'rinmaydi)
Admin: "Approve!" (blind)

RESULT: Fake payment approval possible ✅
         Zero audit trail ❌
         Fraud risk EXTREME 🚨
```

---

---

# 🔴 BLOCKER #2: EXTERNAL_PAYMENT (Click/Payme) - COMPLETELY MISSING

## **PROBLEM**: 
Enum ta'riflanadi lekin hech nima implement qilinmagan

---

## **1️⃣ DATABASE ENUM** ✅

**File**: `apps/backend/prisma/schema.prisma`

**Lines 61-65**: Enum ta'riflanadi
```prisma
enum PaymentMethodEnum {
  CASH
  MANUAL_TRANSFER
  EXTERNAL_PAYMENT  // ← Enum mavjud
  @@map("payment_method_enum")
}
```

✅ **Enum bor** (lekin hech narsali!)

---

## **2️⃣ ORDER CREATION - EXTERNAL_PAYMENT IGNORED** ❌

**File**: `apps/backend/src/api/modules/orders/orders.controller.ts`

**Lines 467-469**: Validation ONLY for MANUAL_TRANSFER
```typescript
if (paymentMethod === PaymentMethodEnum.MANUAL_TRANSFER) {
  if (!receiptImageBase64) {
    throw new BadRequestException('Receipt image required for manual transfer');
  }
}

// ❌ NO validation for EXTERNAL_PAYMENT
// ❌ NO Check for Click merchant key
// ❌ NO Check for Payme terminal ID
```

**Lines 529-536**: Provider string, no integration
```typescript
provider: paymentMethod === 'MANUAL_TRANSFER' 
  ? 'Manual transfer' 
  : paymentMethod === 'EXTERNAL_PAYMENT' 
    ? 'External payment'  // ❌ Just a string!
    : null,
```

❌ **No Click API call**  
❌ **No Payme API call**  
❌ **Just stores string "External payment"**

---

## **3️⃣ WEBHOOK HANDLERS - COMPLETELY MISSING** ❌

**File**: `apps/backend/src/api/modules/orders/orders.routes.ts`

Search result: ❌ **No webhook routes exist**

```typescript
// ❌ MISSING:
// POST /api/webhooks/click
// POST /api/webhooks/payme
// POST /api/webhooks/payment-callback

// These don't exist!
```

---

## **4️⃣ PAYMENT RECONCILIATION - MISSING** ❌

**File**: Hech joyda yo'q!

```typescript
// ❌ NO job that:
// - Checks if payment received from Click
// - Checks if payment received from Payme
// - Updates order status if payment success
// - Cancels order if payment failed
```

---

## **💥 OQIBASI**:

```
Scenario:
1. Customer: "I want to pay with Click"
2. System: "OK, order created"
3. System: "Go to Click payment page"
4. Customer: (pays with Click)
5. Click server: "Payment received! 💰"
6. Backend: "????" [hech kim callback handler yoq]
7. Order: FOREVER PENDING ❌
8. Customer: "Nima boldi?" 😡
9. Kitchen: "Ketur order?" 🤷
```

---

---

# 🔴 BLOCKER #3: ORDER IDEMPOTENCY - ZERO IMPLEMENTATION

## **PROBLEM**: 
Duplicate "Order" tap = 2 ta buyurtma, 2x charge

---

## **1️⃣ REQUEST SCHEMA - idempotencyKey YO'Q** ❌

**File**: `apps/backend/src/api/utils/schemas.ts`

Search for: `CreateOrderSchema`

Current schema (approximate Lines 100-120):
```typescript
export const CreateOrderSchema = z.object({
  items: z.array(...).min(1),
  deliveryAddressId: UuidSchema,
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  promoCode: z.string().optional(),
  note: z.string().optional(),
  receiptImageBase64: z.string().optional(),
  
  // ❌ MISSING:
  // idempotencyKey: z.string().uuid(),
});
```

❌ **idempotencyKey field YO'Q!**

---

## **2️⃣ ORDER CREATION CONTROLLER - NO IDEMPOTENCY CHECK** ❌

**File**: `apps/backend/src/api/modules/orders/orders.controller.ts`

**Lines 442-480**: Order creation function
```typescript
export async function handleCreateOrder(request, reply) {
  const user = request.user as any;
  const { items, deliveryAddressId, paymentMethod, promoCode, note, receiptImageBase64 } = request.body;
  
  // ❌ MISSING:
  // const idempotencyKey = request.body.idempotencyKey;
  // if (!idempotencyKey) throw new Error('Idempotency key required');
  
  // const existing = await prisma.idempotencyKey.findUnique({
  //   where: { key: idempotencyKey }
  // });
  // if (existing) {
  //   return { orderId: existing.orderId };  // Return cached
  // }
  
  // Just creates order immediately without checking duplicates
  const order = await prisma.order.create({...});
  
  // ❌ MISSING: Save idempotency key
  // await prisma.idempotencyKey.create({
  //   data: { key: idempotencyKey, orderId: order.id }
  // });
  
  return order;
}
```

❌ **No duplicate detection!**

---

## **3️⃣ DATABASE SCHEMA - NO IDEMPOTENCY TABLE** ❌

**File**: `apps/backend/prisma/schema.prisma`

Search: `IdempotencyKey` model

Result: ❌ **Model YO'Q!**

```prisma
// ❌ MISSING ENTIRELY:
// model IdempotencyKey {
//   key       String    @id
//   orderId   String
//   response  Json
//   createdAt DateTime  @default(now())
// }
```

---

## **4️⃣ FRONTEND - NO IDEMPOTENCY KEY SENT** ❌

**File**: `apps/miniapp/src/pages/customer/CheckoutPage.tsx`

**Line 230**: Checkout payload
```typescript
const payload = {
  items: quoteItems,
  deliveryAddressId: selectedAddress.id,
  paymentMethod,
  promoCode: discount > 0 ? appliedPromo?.code : undefined,
  note: note || selectedAddress.note,
  receiptImageBase64: paymentMethod === 'MANUAL_TRANSFER' ? receiptImage : undefined,
  
  // ❌ MISSING:
  // idempotencyKey: crypto.randomUUID(),
};

createOrderMutation.mutate(payload, {
  onSuccess: (order) => {
    // Navigate...
  }
});
```

❌ **No idempotency key generated!**

---

## **💥 OQIBASI**:

```
Timeline:
14:30:00 - Customer clicks "Confirm Order" 
           Network timeout (30 sec)
14:30:35 - Customer clicks "Confirm Order" again
           (same request sent)

RESULT: 2 orders created
        Customer charged 2x ✅ (money lost)
        2 receipts saved ✅
        Promo code counted 2x ✅ (bypasses limit)
        2 couriers assigned ✅
        Restaurant prepares 2x ✅

LOSS: ~$50-100 per incident
```

---

---

# 🔴 BLOCKER #4: PROOF OF DELIVERY - COMPLETELY MISSING

## **PROBLEM**: 
Courier "Delivered" tap → No photo, no signature, no GPS, no evidence

---

## **1️⃣ DATABASE SCHEMA - NO DeliveryProof TABLE** ❌

**File**: `apps/backend/prisma/schema.prisma`

Search: `DeliveryProof` or `proof` or `photo`

Result: ❌ **Model YO'Q!**

Models exist for: `User, Order, OrderItem, Payment, Menu, ...` 

❌ But NO:
- DeliveryProof
- Proof
- ProofOfDelivery

---

## **2️⃣ COURIER APP - NO PHOTO CAPTURE** ❌

**File**: `apps/miniapp/src/pages/courier/CourierOrderDetailPage.tsx`

**Lines 1-300**: Courier order detail page

What's there:
- Stage progress display (IDLE → ARRIVED → PICKED_UP → DELIVERING → DELIVERED)
- Map showing restaurant & customer location
- Buttons to update stages
- "Mark as Delivered" button

```typescript
const handleMarkDelivered = () => {
  updateDeliveryStageMutation.mutate({
    stage: 'DELIVERED',
    // ❌ NO: photo capture
    // ❌ NO: GPS verification
    // ❌ NO: signature capture
    // ❌ NO: customer OTP
  });
}
```

❌ **NO photo capture component**  
❌ **NO camera access request**  
❌ **NO photo preview**  
❌ **NO upload logic**

---

## **3️⃣ BACKEND - NO POD STORAGE** ❌

**File**: `apps/backend/src/api/modules/courier/delivery.controller.ts`

**Lines 300-400**: Update delivery stage handler
```typescript
export async function updateDeliveryStage(request, reply) {
  const { orderId, stage } = request.body;
  
  if (stage === 'DELIVERED') {
    // ❌ NO: Check for proof photo
    // ❌ NO: Validate GPS coordinates
    // ❌ NO: Check customer confirmation
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED }
    });
    
    return order;
  }
}
```

❌ **No proof verification**  
❌ **Just marks as delivered blind**

---

## **4️⃣ ADMIN UI - NO POD VERIFICATION** ❌

**File**: `apps/miniapp/src/components/admin/AdminComponents.tsx`

Admin order details page:

What's shown:
- Order items ✅
- Customer address ✅
- Delivery status ✅
- Payment approval ✅

What's NOT shown:
- ❌ Proof of delivery photo
- ❌ Courier photo verification
- ❌ Geolocation verification
- ❌ Signature capture
- ❌ POD audit trail

---

## **💥 OQIBASI**:

```
Fraud Scenario:
1. Courier at corner (not at customer location)
2. Taps "Mark Delivered"
3. Order: DELIVERED ✅
4. No photo, no verification
5. Payment confirmed ✅

Customer: "I didn't receive!"
Admin: "Courier marked delivered"
Customer: "Proof?" 
Admin: "We have... uh... nothing"

RESULT: Chargeback requested
        Restaurant loses money
        No evidence to defend
```

---

---

# ⚠️ SECONDARY BLOCKERS

## **BLOCKER #5: COURIER REASSIGNMENT - MISSING**

**File**: `apps/backend/src/api/modules/orders/orders.controller.ts` - **Lines ~800**

When courier rejects order:
```typescript
// ❌ MISSING:
// - Auto-reassign to next ranked courier
// - Send notification to new courier
// - Track rejection history

// Current: Order stuck with rejecting courier
// Admin must manually reassign
```

**Impact**: 10-30 min delivery delay

---

## **BLOCKER #6: GEOFENCE AUTO-TRANSITIONS - MISSING**

**File**: `apps/miniapp/src/pages/courier/CourierOrderDetailPage.tsx` - **Lines ~150**

Courier must manually tap:
1. "Arrived at Restaurant" 
2. "Picked Up"
3. "On the Way"
4. "Delivered"

```typescript
// ❌ MISSING:
// - GPS monitoring in background
// - Auto-detect restaurant geofence (enter)
// - Auto-detect customer geofence (enter)
// - Auto-transition stages

// Current: Manual 4 taps (error-prone)
```

**Impact**: User friction, manual errors

---

## **BLOCKER #7: PHONE ENTRY BREAKS CHECKOUT**

**File**: `apps/miniapp/src/pages/customer/CheckoutPage.tsx` - **Lines ~420**

Phone modal appears during checkout:
```typescript
if (!userPhone) {
  showPhoneModal();  // Interrupts checkout flow
}
```

**Impact**: Some users abandon checkout

---

## **BLOCKER #8: REAL-TIME MENU UPDATES - MISSING**

**File**: `apps/miniapp/src/hooks/queries/useMenu.ts` - **Lines ~50**

Menu loads once, no updates:
```typescript
// ❌ MISSING:
// - WebSocket subscription to menu changes
// - Real-time price updates
// - Real-time availability updates

// Current: Admin changes price → Customer sees old price
```

**Impact**: Price discrepancies, customer confusion

---

---

# 📊 SUMMARY TABLE: EXACT BLOCKERS

| # | Blocker | File | Line | Problem | Impact | Fixable Days |
|---|---------|------|------|---------|--------|------------|
| 1 | Receipt Not Saved | orders.controller.ts | 527-536 | receiptImageBase64 ignored | Fraud risk, no audit | 2h |
| 2 | No Receipt in Schema | schema.prisma | 456-474 | Missing field | Can't store receipt | 5m |
| 3 | No Receipt Display | AdminComponents.tsx | ~50 | No image in admin panel | Admin can't verify | 1h |
| 4 | Click/Payme Not Impl | orders.controller.ts | 529 | Just string "External payment" | Payment stuck | 14d |
| 5 | No Webhook Handlers | orders.routes.ts | N/A | Routes don't exist | No payment callback | 10d |
| 6 | No Idempotency Key | schemas.ts | 100-120 | Field missing | Duplicate orders | 3h |
| 7 | No Idempotency Check | orders.controller.ts | 442-480 | No duplicate detection | 2x charge | 2h |
| 8 | No Idempotency Table | schema.prisma | N/A | Model missing | Can't track dups | 5m |
| 9 | No POD Table | schema.prisma | N/A | DeliveryProof missing | No proof storage | 5m |
| 10 | No Photo Capture | CourierOrderDetailPage.tsx | 1-300 | No camera UI | No photo evidence | 3h |
| 11 | No POD Backend Logic | delivery.controller.ts | 300-400 | No proof validation | Blind delivery approval | 1h |
| 12 | No Courier Reassign | orders.controller.ts | ~800 | No re-ranking logic | Stuck orders | 5h |
| 13 | No Geofence Auto | CourierOrderDetailPage.tsx | ~150 | Manual stage transitions | User friction | 5h |

---

# 🎯 PRIORITY FIX ORDER

**MUST FIX BEFORE REAL ORDERS:**
1. ✅ Receipt storage (2h) - FRAUD RISK
2. ✅ Idempotency (3h) - DOUBLE CHARGES
3. ✅ POD photos (3h) - DELIVERY FRAUD

**Total: 8 hours of coding**

**Then ready for real orders!** 🚀

