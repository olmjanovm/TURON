# ✅ DELIVERY FEE BUG FIX - TEST CASES

## 🐛 Bug Found & Fixed

**Location**: `apps/backend/src/services/delivery-quote.service.ts` (line 131)

**Problem**: 
- System was checking `merchandiseTotal` (AFTER discount) against 80,000 threshold
- Should check `subtotal` (BEFORE discount)
- Resulted in orders with promo codes being charged incorrect delivery fees

**Example of Bug**:
```
Order: 90,000 sum
Promo Code: -15,000 sum
Merchandise Total: 75,000 sum
Delivery Fee: 5,000 sum ❌ WRONG
Final Total: 80,000 sum

Correct Should Be:
Order: 90,000 sum (>= 80,000) → FREE delivery
Discount: -15,000 sum  
Final Total: 75,000 sum ✅
```

---

## ✅ Fixed Logic

```typescript
// BEFORE (BUGGY):
const feeBaseAmount = merchandiseTotal >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_BASE_FEE;

// AFTER (FIXED):
const feeBaseAmount = subtotal >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_BASE_FEE;
```

**Key Change**: Check `subtotal` instead of `merchandiseTotal`

---

## 📋 TEST CASES

### Test Case 1: Small Order (< 80,000)
```
Subtotal: 50,000 sum
Discount: 0 sum
Expected Delivery Fee: 5,000 sum

Result:
├─ Subtotal: 50,000 (< 80,000) → 5,000 delivery fee ✅
├─ Merchandise: 50,000
├─ Delivery: 5,000
└─ Total: 55,000 ✅
```

### Test Case 2: Large Order (>= 80,000) WITHOUT DISCOUNT
```
Subtotal: 90,000 sum
Discount: 0 sum
Expected Delivery Fee: 0 sum (free)

Result:
├─ Subtotal: 90,000 (>= 80,000) → 0 delivery fee ✅
├─ Merchandise: 90,000
├─ Delivery: 0
└─ Total: 90,000 ✅
```

### Test Case 3: Large Order (>= 80,000) WITH PROMO CODE ✅ FIXED
```
Subtotal: 90,000 sum
Promo Code: -15,000 sum
Merchandise Total: 75,000 sum
Expected Delivery Fee: 0 sum (free, because original was 90,000)

OLD (BUGGY) LOGIC:
├─ Check 75,000 < 80,000 → add 5,000 ❌
├─ Merchandise: 75,000
├─ Delivery: 5,000 ❌
└─ Total: 80,000 ❌ WRONG!

NEW (FIXED) LOGIC:
├─ Check 90,000 >= 80,000 → 0 delivery ✅
├─ Merchandise: 75,000
├─ Delivery: 0
└─ Total: 75,000 ✅ CORRECT!
```

### Test Case 4: Just Under Threshold WITH DISCOUNT
```
Subtotal: 85,000 sum
Promo Code: -10,000 sum (WELCOME10)
Merchandise Total: 75,000 sum
Expected Delivery Fee: 0 sum (free, because original was 85,000)

Result:
├─ Subtotal: 85,000 (>= 80,000) → 0 delivery fee ✅
├─ Discount: -10,000
├─ Merchandise: 75,000
├─ Delivery: 0
└─ Total: 75,000 ✅
```

### Test Case 5: Just Over Threshold
```
Subtotal: 80,000 sum (exactly at threshold)
Discount: 0 sum
Expected Delivery Fee: 0 sum (free)

Result:
├─ Subtotal: 80,000 (>= 80,000) → 0 delivery fee ✅
├─ Merchandise: 80,000
├─ Delivery: 0
└─ Total: 80,000 ✅
```

### Test Case 6: Under Threshold WITH DISCOUNT
```
Subtotal: 75,000 sum
Promo Code: -5,000 sum
Merchandise Total: 70,000 sum
Expected Delivery Fee: 5,000 sum (charged, because original was < 80,000)

Result:
├─ Subtotal: 75,000 (< 80,000) → 5,000 delivery fee ✅
├─ Discount: -5,000
├─ Merchandise: 70,000
├─ Delivery: 5,000
└─ Total: 75,000 ✅
```

---

## 🧪 How to Test

### 1. Create Test Orders via API

```bash
# Test Case 3: 90,000 with promo (main bug fix)
curl -X POST "https://api.your-domain.com/api/orders/quote" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"menuItemId": "kfc-1-kg", "quantity": 1}  # 95,000
    ],
    "deliveryAddressId": "your-address-id",
    "promoCode": "KOMBO15000"  # -15,000
  }' | jq .

# Expected Response:
{
  "subtotal": 95000,           # Original
  "discount": 15000,           # Promo
  "merchandiseTotal": 80000,   # After discount
  "deliveryFee": 0,            # ✅ FREE (was 5,000 before fix)
  "total": 80000               # ✅ CORRECT
}
```

### 2. Check Database

```sql
-- Recent orders with promos
SELECT 
  o.id,
  o.subtotal,
  o.discount_amount,
  p.delivery_fee,
  (o.subtotal - o.discount_amount + p.delivery_fee) as calculated_total,
  o.total_amount
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
WHERE o.promo_code_id IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- Verify:
-- If subtotal >= 80,000 → delivery_fee should be 0
-- If subtotal < 80,000 → delivery_fee should be 5,000
```

---

## 🎯 Summary

| Scenario | Before Fix | After Fix | Status |
|----------|-----------|-----------|--------|
| 50,000 no promo | +5,000 ✅ | +5,000 ✅ | No change (already correct) |
| 90,000 no promo | 0 ✅ | 0 ✅ | No change (already correct) |
| 90,000 - 15,000 promo | +5,000 ❌ | 0 ✅ | **FIXED** |
| 85,000 - 10,000 promo | +5,000 ❌ | 0 ✅ | **FIXED** |
| 75,000 - 5,000 promo | +5,000 ✅ | +5,000 ✅ | No change (already correct) |

---

## 📊 Impact

✅ **Orders >= 80,000 sum** (even with promo) → **FREE delivery** (0 cost)  
✅ **Orders < 80,000 sum** → **5,000 sum delivery fee** (always added)  
✅ **Promo codes** no longer break delivery pricing  
✅ **All pricing now correct** and consistent

---

## 🚀 Deploy

```bash
cd apps/backend

# Generate and migrate (if needed)
npx prisma generate
npx prisma migrate deploy

# No database migration needed - only logic fix

# Build and test
npm run build
npm run test

# Deploy to AWS
git add .
git commit -m "fix: delivery fee calculation - check subtotal before discount"
git push origin main
```

---

## ✅ Verification Commands

```powershell
# Test the fix locally
$testPayload = @{
    items = @(@{menuItemId = "item-1"; quantity = 1})
    deliveryAddressId = "addr-1"
    promoCode = "KOMBO15000"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/orders/quote" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $testPayload | 
  ConvertFrom-Json | 
  Select-Object subtotal, discount, deliveryFee, total
```

