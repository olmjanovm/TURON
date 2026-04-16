# 🚀 DEPLOYMENT COMMANDS - RUN THESE NOW

## Step 1: Database Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Create new tables (receipt_image_base64, idempotency_keys, delivery_proofs)
npx prisma migrate deploy

# Or if deploying fresh:
npx prisma db push
```

## Step 2: Verify Setup
```bash
# Test Prisma connection
npx prisma db execute --stdin < apps/backend/prisma/schema.prisma

# Check if tables created
npx prisma db execute --stdin << EOF
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('payments', 'idempotency_keys', 'delivery_proofs')
ORDER BY table_name;
EOF
```

## Step 3: Build & Deploy

### Local Testing
```bash
# Terminal 1: Backend
cd apps/backend
npm run dev

# Terminal 2: Frontend  
cd apps/miniapp
npm run dev

# Terminal 3: Database (optional)
npx prisma studio
```

### Production Deploy

**Railway Backend**:
```bash
# Run these before starting server
pnpm prisma generate
pnpm prisma migrate deploy
pnpm build
pnpm start
```

**Vercel Frontend**:
```bash
# Frontend just needs env var
VITE_API_URL=https://api.yourdomain.com
```

---

## What Changed (Git diff)

### Schema Changes
```
✅ apps/backend/prisma/schema.prisma
   - Payment model: added receiptImageBase64, receiptUploadedAt
   - NEW: IdempotencyKey model
   - NEW: DeliveryProof model
   - Order model: added deliveryProofs relationship

✅ apps/backend/src/api/utils/schemas.ts
   - CreateOrderSchema: added idempotencyKey field

✅ apps/backend/src/api/modules/orders/orders.controller.ts
   - handleCreateOrder: added idempotency check + save
   - handleCreateOrder: added receipt image saving

✅ apps/miniapp/src/pages/customer/CheckoutPage.tsx
   - Checkout payload: added idempotencyKey generation

✅ NEW: apps/backend/src/api/modules/orders/NEW_ENDPOINTS.ts
   - handleGetPaymentReceipt (GET /api/orders/:id/payment-receipt)
   - handleSubmitDeliveryProof (POST /api/orders/:id/delivery-proof)
   - handleGetDeliveryProof (GET /api/orders/:id/delivery-proof)
```

---

## Testing Checklist

### Test 1: Idempotency
```
1. Open Postman/Thunder Client
2. POST /api/orders
   {
     "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
     "items": [{"menuItemId": "...", "quantity": 1}],
     "deliveryAddressId": "...",
     "paymentMethod": "MANUAL_TRANSFER",
     "receiptImageBase64": "data:image/png;base64,..."
   }
3. Same request again → Should return SAME orderId (cached)
4. Different idempotencyKey → Should create NEW order
```

### Test 2: Receipt Storage
```
1. Submit order with receiptImageBase64
2. Check database:
   SELECT * FROM payments WHERE receipt_image_base64 IS NOT NULL;
3. Call: GET /api/orders/:id/payment-receipt
   → Should see receipt image
```

### Test 3: POD Photos
```
1. As Courier, call:
   POST /api/orders/:id/delivery-proof
   {
     "photoBase64": "data:image/png;base64,...",
     "gpsLatitude": 41.2995,
     "gpsLongitude": 69.2401,
     "customerOtp": null
   }
2. Check database:
   SELECT * FROM delivery_proofs;
3. Verify: order status changed to DELIVERED
```

---

## Rollback (if needed)

```bash
# Undo last migration
npx prisma migrate resolve --rolled-back <migration_name>

# Or reset database completely (local only!)
npx prisma migrate reset --force
```

---

## Environment Variables (No changes needed)

All existing env vars work. No new vars required for these fixes.

---

## Support/Issues

If error during migration:

```bash
# Check migration status
npx prisma migrate status

# If stuck, try:
npx prisma migrate deploy --force

# If still stuck, check logs:
tail -f logs/prisma.log
```

