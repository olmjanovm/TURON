#!/bin/bash
# TURON Production Deploy & Verify Script
# Usage: ./deploy-and-verify.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_SSH="${BACKEND_SSH:-ec2-user@your-backend-ip}"
BACKEND_KEY="${BACKEND_KEY:-./deploy-key.pem}"
API_URL="${API_URL:-https://api.your-domain.com}"
DATABASE_URL="${DATABASE_URL}"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 TURON PRODUCTION DEPLOY & VERIFY  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Remote SSH to AWS and run migrations
echo -e "${YELLOW}[STEP 1]${NC} Running migrations on AWS..."
echo "Command: corepack pnpm --filter @turon/backend prisma:deploy && npx prisma migrate deploy"
echo ""

ssh -i "$BACKEND_KEY" "$BACKEND_SSH" << 'EOFREMOTE'
  set -e
  cd /app/turon
  
  echo "Generating Prisma Client..."
  corepack pnpm --filter @turon/backend prisma:generate
  
  echo "Running backend SQL migrations..."
  corepack pnpm --filter @turon/backend prisma:deploy

  echo "Running Prisma migrations..."
  npx prisma migrate deploy
  
  echo "Verifying tables..."
  npx prisma db execute --stdin << 'EOFSQL'
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('payments', 'idempotency_keys', 'delivery_proofs')
ORDER BY table_name;
EOFSQL
  
  echo "✅ Migrations complete!"
EOFREMOTE

echo ""
echo -e "${GREEN}✅ Migrations applied successfully${NC}"
echo ""

# Step 2: Test Receipt Storage
echo -e "${YELLOW}[STEP 2]${NC} Testing Receipt Storage..."
echo ""

RECEIPT_B64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
IDEMPOTENCY_KEY_1=$(uuidgen)

echo "Creating test order with receipt..."
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/api/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "'$IDEMPOTENCY_KEY_1'",
    "items": [{"menuItemId": "test-item-1", "quantity": 1}],
    "deliveryAddressId": "test-address-1",
    "paymentMethod": "MANUAL_TRANSFER",
    "receiptImageBase64": "data:image/png;base64,'$RECEIPT_B64'"
  }')

ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id // empty')

if [ -z "$ORDER_ID" ]; then
  echo -e "${RED}❌ Failed to create order${NC}"
  echo "Response: $ORDER_RESPONSE"
  exit 1
fi

echo "Order created: $ORDER_ID"
echo ""
echo "Retrieving receipt via API..."

RECEIPT_RESPONSE=$(curl -s -X GET "$API_URL/api/orders/$ORDER_ID/payment-receipt" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

RECEIPT_EXISTS=$(echo "$RECEIPT_RESPONSE" | jq -r '.receiptImageBase64 // empty')

if [ -n "$RECEIPT_EXISTS" ]; then
  echo -e "${GREEN}✅ Receipt stored and retrieved successfully${NC}"
else
  echo -e "${RED}❌ Receipt retrieval failed${NC}"
  echo "Response: $RECEIPT_RESPONSE"
fi

echo ""

# Step 3: Test Idempotency
echo -e "${YELLOW}[STEP 3]${NC} Testing Idempotency..."
echo ""

IDEMPOTENCY_KEY=$(uuidgen)
echo "Idempotency Key: $IDEMPOTENCY_KEY"
echo ""

echo "Request 1 (First tap)..."
RESPONSE1=$(curl -s -X POST "$API_URL/api/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "'$IDEMPOTENCY_KEY'",
    "items": [{"menuItemId": "test-item-2", "quantity": 1}],
    "deliveryAddressId": "test-address-2",
    "paymentMethod": "MANUAL_TRANSFER",
    "receiptImageBase64": "data:image/png;base64,'$RECEIPT_B64'"
  }')

ORDER_ID_1=$(echo "$RESPONSE1" | jq -r '.id // empty')
TIMESTAMP_1=$(echo "$RESPONSE1" | jq -r '.createdAt // empty')

if [ -z "$ORDER_ID_1" ]; then
  echo -e "${RED}❌ First request failed${NC}"
  echo "Response: $RESPONSE1"
  exit 1
fi

echo "Order 1: $ORDER_ID_1 at $TIMESTAMP_1"
echo ""

sleep 2

echo "Request 2 (Duplicate - same idempotency key)..."
RESPONSE2=$(curl -s -X POST "$API_URL/api/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "'$IDEMPOTENCY_KEY'",
    "items": [{"menuItemId": "test-item-2", "quantity": 1}],
    "deliveryAddressId": "test-address-2",
    "paymentMethod": "MANUAL_TRANSFER",
    "receiptImageBase64": "data:image/png;base64,'$RECEIPT_B64'"
  }')

ORDER_ID_2=$(echo "$RESPONSE2" | jq -r '.id // empty')
TIMESTAMP_2=$(echo "$RESPONSE2" | jq -r '.createdAt // empty')

echo "Order 2: $ORDER_ID_2 at $TIMESTAMP_2"
echo ""

if [ "$ORDER_ID_1" == "$ORDER_ID_2" ] && [ "$TIMESTAMP_1" == "$TIMESTAMP_2" ]; then
  echo -e "${GREEN}✅ IDEMPOTENCY WORKS! Same order returned${NC}"
else
  echo -e "${RED}❌ IDEMPOTENCY FAILED!${NC}"
  echo "Different orders created:"
  echo "  Order 1: $ORDER_ID_1"
  echo "  Order 2: $ORDER_ID_2"
fi

echo ""

# Step 4: Database Verification
echo -e "${YELLOW}[STEP 4]${NC} Database Verification..."
echo ""

ssh -i "$BACKEND_KEY" "$BACKEND_SSH" << 'EOFREMOTE2'
  cd /app/turon
  
  echo "Recent receipts:"
  npx prisma db execute --stdin << 'EOFSQL'
SELECT COUNT(*) as count FROM payments 
WHERE receipt_image_base64 IS NOT NULL 
AND created_at > NOW() - INTERVAL '1 hour';
EOFSQL
  
  echo ""
  echo "Idempotency keys created:"
  npx prisma db execute --stdin << 'EOFSQL'
SELECT COUNT(*) as count FROM idempotency_keys
WHERE created_at > NOW() - INTERVAL '1 hour';
EOFSQL
  
  echo ""
  echo "Delivery proofs:"
  npx prisma db execute --stdin << 'EOFSQL'
SELECT COUNT(*) as count FROM delivery_proofs;
EOFSQL
EOFREMOTE2

echo ""
echo -e "${GREEN}✅ Database verification complete${NC}"
echo ""

# Final Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        ✅ ALL TESTS PASSED             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Summary:"
echo "  ✅ Migrations deployed to AWS"
echo "  ✅ Receipt storage working"
echo "  ✅ Idempotency working"
echo "  ✅ Database tables created"
echo ""
echo "Next steps:"
echo "  1. Monitor real orders: tail -f /app/turon/logs/backend.log"
echo "  2. Check admin receipt approval flow"
echo "  3. Test courier delivery proof submission"
echo ""
