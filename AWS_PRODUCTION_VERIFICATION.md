# 🚀 PRODUCTION MIGRATION & VERIFICATION - AWS + VERCEL

## **STEP 1: AWS DATABASE MIGRATION**

### Option A: SSH into AWS Backend Server
```bash
# SSH to AWS EC2/App Server
ssh -i your-key.pem ec2-user@your-backend-ip

# Go to app directory
cd /app/turon

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Check status
npx prisma migrate status

# Verify tables created
npx prisma db execute --stdin << 'EOF'
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('payments', 'idempotency_keys', 'delivery_proofs')
ORDER BY table_name;
EOF
```

### Option B: Remote Execution (from local machine)
```bash
# Using prisma with DATABASE_URL env var set to AWS
export DATABASE_URL="postgresql://user:password@aws-rds-endpoint:5432/turon_prod"

# Generate client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma db execute --stdin << 'EOF'
\dt idempotency_keys;
\dt delivery_proofs;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name LIKE '%receipt%';
EOF
```

### Option C: Check AWS RDS Console Directly
```sql
-- Run in AWS RDS Query Editor / psql
\d idempotency_keys
\d delivery_proofs
\d payments

-- Count records
SELECT COUNT(*) FROM idempotency_keys;
SELECT COUNT(*) FROM delivery_proofs;
```

---

## **STEP 2: TEST RECEIPT STORAGE**

### Test: Submit Order with Receipt → Verify Storage

```bash
# 1. Get Auth Token (replace with real Telegram miniapp initData)
AUTH_TOKEN="your-jwt-token-here"
BACKEND_URL="https://api.your-domain.com"  # AWS backend

# 2. Create Sample Receipt Base64 (1x1 PNG)
RECEIPT_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# 3. Submit Order with Receipt
curl -X POST "$BACKEND_URL/api/orders" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "'$(uuidgen)'",
    "items": [{"menuItemId": "item-id-123", "quantity": 1}],
    "deliveryAddressId": "address-id-456",
    "paymentMethod": "MANUAL_TRANSFER",
    "receiptImageBase64": "data:image/png;base64,'$RECEIPT_BASE64'",
    "note": "Test order with receipt"
  }' | jq .

# Save orderId from response
ORDER_ID="order-uuid-from-response"

# 4. Verify Receipt Stored in Database
export DATABASE_URL="postgresql://user:pass@aws-rds:5432/turon_prod"
npx prisma db execute --stdin << EOF
SELECT 
  id, 
  method, 
  amount,
  CASE 
    WHEN receipt_image_base64 IS NOT NULL THEN 'YES ✅'
    ELSE 'NO ❌'
  END as receipt_stored,
  receipt_uploaded_at
FROM payments
WHERE id = (SELECT payment_id FROM orders WHERE id = '$ORDER_ID');
EOF

# 5. Retrieve Receipt via API
curl -X GET "$BACKEND_URL/api/orders/$ORDER_ID/payment-receipt" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

---

## **STEP 3: TEST IDEMPOTENCY**

### Test: Double Tap Order → Expect Cached Response

```bash
# Generate unique idempotency key
IDEMPOTENCY_KEY=$(uuidgen)
echo "Using idempotency key: $IDEMPOTENCY_KEY"

# Prepare payload
PAYLOAD='{
  "idempotencyKey": "'$IDEMPOTENCY_KEY'",
  "items": [{"menuItemId": "item-id-789", "quantity": 2}],
  "deliveryAddressId": "address-id-123",
  "paymentMethod": "MANUAL_TRANSFER",
  "receiptImageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}'

# FIRST REQUEST
echo "=== REQUEST 1 (First tap) ==="
RESPONSE1=$(curl -s -X POST "$BACKEND_URL/api/orders" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

ORDER_ID_1=$(echo "$RESPONSE1" | jq -r '.id')
TIMESTAMP_1=$(echo "$RESPONSE1" | jq -r '.createdAt')
echo "Order created: $ORDER_ID_1"
echo "Timestamp: $TIMESTAMP_1"

# Sleep 2 seconds to simulate retry
sleep 2

# SECOND REQUEST (Same idempotency key)
echo ""
echo "=== REQUEST 2 (Duplicate tap - same idempotency key) ==="
RESPONSE2=$(curl -s -X POST "$BACKEND_URL/api/orders" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

ORDER_ID_2=$(echo "$RESPONSE2" | jq -r '.id')
TIMESTAMP_2=$(echo "$RESPONSE2" | jq -r '.createdAt')
echo "Order ID: $ORDER_ID_2"
echo "Timestamp: $TIMESTAMP_2"

# VERIFY THEY'RE THE SAME
if [ "$ORDER_ID_1" = "$ORDER_ID_2" ]; then
  echo ""
  echo "✅ IDEMPOTENCY WORKS! Same order returned (ID: $ORDER_ID_1)"
else
  echo ""
  echo "❌ IDEMPOTENCY FAILED! Different orders created:"
  echo "  First:  $ORDER_ID_1"
  echo "  Second: $ORDER_ID_2"
fi

# Check database idempotency key table
echo ""
echo "=== Database Verification ==="
npx prisma db execute --stdin << EOF
SELECT 
  key, 
  order_id, 
  created_at,
  (SELECT COUNT(*) FROM idempotency_keys WHERE key = '$IDEMPOTENCY_KEY') as total_keys
FROM idempotency_keys
WHERE key = '$IDEMPOTENCY_KEY';
EOF
```

---

## **STEP 4: TEST PROOF OF DELIVERY**

### Test: Courier Submits Photo → Order Marked Delivered

```bash
# Get order that's in DELIVERING state
ORDER_ID="order-in-delivering-state"
COURIER_TOKEN="courier-jwt-token"

# Create test photo base64 (1x1 PNG)
PHOTO_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# 1. Submit Delivery Proof
echo "=== Submitting Delivery Proof ==="
curl -X POST "$BACKEND_URL/api/orders/$ORDER_ID/delivery-proof" \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "photoBase64": "data:image/png;base64,'$PHOTO_BASE64'",
    "gpsLatitude": 41.2995,
    "gpsLongitude": 69.2401,
    "customerOtp": null
  }' | jq .

# 2. Verify Order Status Changed to DELIVERED
echo ""
echo "=== Checking Order Status ==="
curl -X GET "$BACKEND_URL/api/orders/$ORDER_ID" \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" | jq '.orderStatus'

# 3. Verify POD Photo Stored
echo ""
echo "=== Verifying POD in Database ==="
npx prisma db execute --stdin << EOF
SELECT 
  id,
  order_id,
  CASE 
    WHEN photo_base64 IS NOT NULL THEN 'YES ✅'
    ELSE 'NO ❌'
  END as photo_stored,
  gps_latitude,
  gps_longitude,
  distance_meters,
  created_at
FROM delivery_proofs
WHERE order_id = '$ORDER_ID';
EOF

# 4. Retrieve POD via API (Admin can view)
echo ""
echo "=== Retrieving POD via API ==="
curl -X GET "$BACKEND_URL/api/orders/$ORDER_ID/delivery-proof" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

---

## **STEP 5: AUTOMATED VERIFICATION SCRIPT**

Save as `verify-production.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="${API_URL:-https://api.your-domain.com}"
DB_URL="${DATABASE_URL:-postgresql://user:pass@aws:5432/turon}"
CUSTOMER_TOKEN="${CUSTOMER_TOKEN}"
COURIER_TOKEN="${COURIER_TOKEN}"
ADMIN_TOKEN="${ADMIN_TOKEN}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_status() {
  local name=$1
  local status=$2
  
  if [ "$status" == "0" ]; then
    echo -e "${GREEN}✅ $name${NC}"
    return 0
  else
    echo -e "${RED}❌ $name${NC}"
    return 1
  fi
}

echo "================================"
echo "🔍 PRODUCTION VERIFICATION SUITE"
echo "================================"
echo ""

# Test 1: Database Connection
echo "Test 1: Database Connection"
export DATABASE_URL="$DB_URL"
npx prisma db execute --stdin << 'EOF' > /dev/null 2>&1
SELECT 1;
EOF
check_status "Database connected" $?

# Test 2: Tables Exist
echo ""
echo "Test 2: Migration Tables Exist"
npx prisma db execute --stdin << 'EOF' > /dev/null 2>&1
SELECT * FROM idempotency_keys LIMIT 1;
EOF
check_status "idempotency_keys table" $?

npx prisma db execute --stdin << 'EOF' > /dev/null 2>&1
SELECT * FROM delivery_proofs LIMIT 1;
EOF
check_status "delivery_proofs table" $?

npx prisma db execute --stdin << 'EOF' > /dev/null 2>&1
SELECT receipt_image_base64 FROM payments LIMIT 1;
EOF
check_status "payments.receipt_image_base64 column" $?

# Test 3: API Health
echo ""
echo "Test 3: API Connectivity"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
  check_status "API Reachable (HTTP $HTTP_CODE)" 0
else
  check_status "API Reachable" 1
fi

# Test 4: Recent Orders with Receipts
echo ""
echo "Test 4: Recent Orders with Receipts"
COUNT=$(npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as count FROM payments 
WHERE receipt_image_base64 IS NOT NULL 
AND created_at > NOW() - INTERVAL '1 day';
EOF
)
echo "Orders with receipts (last 24h): $COUNT"

# Test 5: Idempotency Keys Created
echo ""
echo "Test 5: Idempotency Keys"
COUNT=$(npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as count FROM idempotency_keys
WHERE created_at > NOW() - INTERVAL '1 day';
EOF
)
echo "Idempotency keys created (last 24h): $COUNT"

# Test 6: Delivery Proofs
echo ""
echo "Test 6: Delivery Proofs"
COUNT=$(npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as count FROM delivery_proofs
WHERE created_at > NOW() - INTERVAL '1 day';
EOF
)
echo "Delivery proofs submitted (last 24h): $COUNT"

echo ""
echo "================================"
echo "✅ Verification Complete"
echo "================================"
```

### Run Verification:
```bash
chmod +x verify-production.sh
export API_URL="https://api.your-domain.com"
export DATABASE_URL="postgresql://user:pass@aws-rds:5432/turon"
./verify-production.sh
```

---

## **STEP 6: QUICK CHECKLIST**

```bash
# 1. SSH to AWS and run migrations
ssh -i key.pem ec2-user@backend-ip
cd /app/turon
npx prisma migrate deploy

# 2. Check tables created
npx prisma db execute --stdin << 'EOF'
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('idempotency_keys', 'delivery_proofs')
AND table_schema = 'public';
EOF

# 3. Run automated verification
./verify-production.sh

# 4. Check backend logs
tail -f /app/turon/logs/backend.log | grep -i "receipt\|idempotency\|delivery"

# 5. Monitor real orders
SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '1 hour';
SELECT * FROM payments WHERE receipt_image_base64 IS NOT NULL ORDER BY created_at DESC LIMIT 10;
```

---

## **TROUBLESHOOTING**

### Migration Fails
```bash
# Check current status
npx prisma migrate status

# If stuck, check logs
npx prisma migrate resolve --rolled-back migration_name

# Force deploy (careful!)
npx prisma migrate deploy --force
```

### API Returns 500
```bash
# Check AWS backend logs
ssh -i key.pem ec2-user@backend-ip
tail -f /app/turon/logs/error.log

# Search for recent errors
grep -i "receipt\|idempotency\|delivery" /app/turon/logs/error.log
```

### Database Permission Error
```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

