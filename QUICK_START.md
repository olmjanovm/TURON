# ⚡ QUICK START - EXACT COMMANDS FOR YOUR SETUP

## Your Environment
- **Frontend**: Vercel (already deployed)
- **Backend + Bot**: AWS
- **OS**: Windows
- **Task**: Run migrations + verify 3 fixes

---

## 🔑 PREREQUISITES

Before running anything, set up credentials on Windows:

```powershell
# PowerShell (Run as Administrator)

# 1. SSH Key Path
$env:BACKEND_KEY = "C:\path\to\your-deploy-key.pem"

# 2. AWS Backend SSH
$env:BACKEND_SSH = "ec2-user@your-aws-backend-ip"

# 3. JWT Tokens (from Telegram auth or your admin panel)
$env:CUSTOMER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$env:ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 4. API URL
$env:API_URL = "https://your-api-domain.com"
$env:DATABASE_URL = "postgresql://user:password@aws-rds-endpoint:5432/turon_prod"

# Verify setup
Write-Host "Backend SSH: $env:BACKEND_SSH"
Write-Host "API URL: $env:API_URL"
```

---

## 🚀 OPTION 1: AUTOMATED SCRIPT (EASIEST)

```powershell
# Navigate to project
cd C:\Users\isroi\Downloads\Telegram Desktop\TURON FULL\TURON

# Run the automated deploy script
.\deploy-and-verify.ps1 `
    -BackendSSH "ec2-user@your-ip" `
    -BackendKey "C:\path\to\key.pem" `
    -ApiUrl "https://api.your-domain.com"

# Script will:
# 1. SSH to AWS and run migrations
# 2. Test receipt storage
# 3. Test idempotency
# 4. Verify database
```

---

## 🔧 OPTION 2: MANUAL STEP-BY-STEP

### Step 1: Connect to AWS and Run Migrations

```powershell
# Open terminal, SSH to AWS
ssh -i C:\path\to\key.pem ec2-user@your-aws-ip

# Once connected to AWS:
cd /app/turon

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify tables created
npx prisma db execute --stdin << 'EOF'
\d idempotency_keys
\d delivery_proofs
\d payments
EOF
```

### Step 2: Test Receipt Storage

```powershell
# On Windows PowerShell (NOT on AWS)

$API = "https://api.your-domain.com"
$ADMIN_TOKEN = "your-jwt-token"
$CUSTOMER_TOKEN = "your-jwt-token"

# 1. Create order with receipt
$receipt = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
$payload = @{
    idempotencyKey = [guid]::NewGuid().ToString()
    items = @(@{menuItemId = "item-1"; quantity = 1})
    deliveryAddressId = "addr-1"
    paymentMethod = "MANUAL_TRANSFER"
    receiptImageBase64 = "data:image/png;base64,$receipt"
} | ConvertTo-Json

$order = Invoke-WebRequest -Uri "$API/api/orders" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $CUSTOMER_TOKEN"
        "Content-Type" = "application/json"
    } `
    -Body $payload | ConvertFrom-Json

$orderId = $order.id
Write-Host "✅ Order created: $orderId"

# 2. Retrieve receipt (Admin)
$receipt = Invoke-WebRequest -Uri "$API/api/orders/$orderId/payment-receipt" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
        "Content-Type" = "application/json"
    } | ConvertFrom-Json

if ($receipt.receiptImageBase64) {
    Write-Host "✅ Receipt stored and retrieved!"
} else {
    Write-Host "❌ Receipt not found"
}
```

### Step 3: Test Idempotency (Double Tap)

```powershell
# Test: Two identical requests = One order

$API = "https://api.your-domain.com"
$CUSTOMER_TOKEN = "your-jwt-token"
$idempkey = [guid]::NewGuid().ToString()

$payload = @{
    idempotencyKey = $idempkey
    items = @(@{menuItemId = "item-2"; quantity = 1})
    deliveryAddressId = "addr-2"
    paymentMethod = "MANUAL_TRANSFER"
    receiptImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
} | ConvertTo-Json

# Request 1
$order1 = Invoke-WebRequest -Uri "$API/api/orders" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $CUSTOMER_TOKEN"
        "Content-Type" = "application/json"
    } `
    -Body $payload | ConvertFrom-Json

Write-Host "Order 1: $($order1.id) at $($order1.createdAt)"

# Wait 2 seconds
Start-Sleep -Seconds 2

# Request 2 (SAME payload)
$order2 = Invoke-WebRequest -Uri "$API/api/orders" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $CUSTOMER_TOKEN"
        "Content-Type" = "application/json"
    } `
    -Body $payload | ConvertFrom-Json

Write-Host "Order 2: $($order2.id) at $($order2.createdAt)"

# Check if same
if ($order1.id -eq $order2.id) {
    Write-Host "✅ IDEMPOTENCY WORKS! Same order returned"
} else {
    Write-Host "❌ FAILED - Different orders created"
}
```

### Step 4: Test Proof of Delivery

```powershell
# As Courier, submit proof of delivery

$API = "https://api.your-domain.com"
$COURIER_TOKEN = "courier-jwt-token"
$ORDER_ID = "order-in-delivering-state"

$proofPayload = @{
    photoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    gpsLatitude = 41.2995
    gpsLongitude = 69.2401
    customerOtp = $null
} | ConvertTo-Json

$result = Invoke-WebRequest -Uri "$API/api/orders/$ORDER_ID/delivery-proof" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $COURIER_TOKEN"
        "Content-Type" = "application/json"
    } `
    -Body $proofPayload | ConvertFrom-Json

Write-Host "Order status: $($result.orderStatus)"
if ($result.orderStatus -eq "DELIVERED") {
    Write-Host "✅ POD photo submitted - Order marked DELIVERED"
} else {
    Write-Host "❌ Status not updated"
}
```

### Step 5: Verify Database

```powershell
# SSH back to AWS to check database

ssh -i C:\path\to\key.pem ec2-user@your-aws-ip

# Once connected:
cd /app/turon

# Check receipts
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as count FROM payments 
WHERE receipt_image_base64 IS NOT NULL;
EOF

# Check idempotency keys
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as count FROM idempotency_keys;
EOF

# Check delivery proofs
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as count FROM delivery_proofs;
EOF
```

---

## 📊 EXPECTED RESULTS

### ✅ Receipt Storage Works When:
```
POST /api/orders → receiptImageBase64 saved
GET /api/orders/:id/payment-receipt → receipt returned to admin
Database: SELECT * FROM payments WHERE receipt_image_base64 IS NOT NULL;
          → Shows 1+ rows with data
```

### ✅ Idempotency Works When:
```
POST /api/orders (1st time) → Order created, ID = ABC123
POST /api/orders (2nd time, same key) → Returns same order, ID = ABC123
Database: SELECT * FROM idempotency_keys;
          → Shows entry with key + cached response
```

### ✅ POD Works When:
```
POST /api/orders/:id/delivery-proof → Accepted
GET /api/orders/:id → orderStatus = "DELIVERED"
Database: SELECT * FROM delivery_proofs;
          → Shows photo_base64 + GPS data
```

---

## 🆘 TROUBLESHOOTING

### Migration Fails
```powershell
# Check status
ssh -i key.pem user@ip "cd /app/turon && npx prisma migrate status"

# Force deploy
ssh -i key.pem user@ip "cd /app/turon && npx prisma migrate deploy --force"
```

### API Returns 500
```powershell
# Check backend logs
ssh -i key.pem user@ip "tail -f /app/turon/logs/error.log | grep -i receipt"
```

### JWT Token Invalid
```powershell
# Get fresh token from Telegram init
# Or generate JWT manually:
# Header: {"alg":"HS256","typ":"JWT"}
# Payload: {"userId":"...", "role":"ADMIN"}
# Secret: your-jwt-secret
```

### Database Connection Failed
```powershell
# Test connection string
$db = "postgresql://user:pass@aws-rds:5432/turon"
psql $db -c "SELECT 1;"
```

---

## ✅ FINAL CHECKLIST

```
[ ] SSH key configured in PowerShell
[ ] JWT tokens obtained (customer + admin)
[ ] AWS backend IP known
[ ] Can SSH to AWS successfully
[ ] Ran: npx prisma migrate deploy
[ ] Created test order with receipt
[ ] Retrieved receipt via API
[ ] Submitted 2x same order (got cached)
[ ] Verified database tables exist
[ ] Database has receipt data
[ ] Database has idempotency keys
[ ] All 3 fixes verified ✅
```

---

## 🎯 NEXT STEPS

1. ✅ Run migrations
2. ✅ Verify 3 fixes
3. ⏳ Fix Courier Reassignment (auto-reassign when courier rejects)
4. ⏳ Fix Geofence Auto-Transitions (GPS auto-transitions)
5. ⏳ Fix Phone Entry UX (move modal earlier)
6. ⏳ Fix Real-time Menu Updates (WebSocket prices)

**Ready to take real orders NOW** ✅

