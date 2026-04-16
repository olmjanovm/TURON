# 🎯 DEPLOY TODAY - 15 MINUTE CHECKLIST

## Your Setup
- Frontend: ✅ Vercel (already live)
- Backend: AWS (ready for migrations)  
- Database: PostgreSQL on AWS RDS
- Status: 3 critical fixes ready → just need migrations

---

## ⚡ RIGHT NOW (5 minutes)

### 1️⃣ Prepare Credentials

```powershell
# Windows PowerShell - SET THESE
$env:BACKEND_SSH = "ec2-user@YOUR-AWS-IP"
$env:BACKEND_KEY = "C:\your\path\deploy-key.pem"
$env:API_URL = "https://api.your-domain.com"
$env:DATABASE_URL = "postgresql://user:password@aws-rds:5432/turon_prod"
$env:CUSTOMER_TOKEN = "JWT_TOKEN_HERE"
$env:ADMIN_TOKEN = "JWT_TOKEN_HERE"
$env:COURIER_TOKEN = "JWT_TOKEN_HERE"
```

### 2️⃣ SSH to AWS and Run Migrations

```bash
# Using putty.exe or ssh from Windows
ssh -i C:\your\key.pem ec2-user@your-aws-ip

# Once logged in:
cd /app/turon
npx prisma generate
npx prisma migrate deploy
npx prisma db execute --stdin << 'EOF'
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('idempotency_keys', 'delivery_proofs');
EOF
```

**Expected output**: 
```
 idempotency_keys
 delivery_proofs
```

---

## ✅ VERIFY (10 minutes)

### Run Automated Verification

```powershell
cd C:\Users\isroi\Downloads\Telegram Desktop\TURON FULL\TURON
.\deploy-and-verify.ps1
```

### OR Manual Verification

```powershell
# Test 1: Receipt Storage
$API = "https://api.your-domain.com"
$receipt = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

$order = @{
    idempotencyKey = [guid]::NewGuid()
    items = @(@{menuItemId = "item1"; quantity = 1})
    deliveryAddressId = "addr1"
    paymentMethod = "MANUAL_TRANSFER"
    receiptImageBase64 = "data:image/png;base64,$receipt"
} | ConvertTo-Json

$result = Invoke-WebRequest -Uri "$API/api/orders" -Method POST `
  -Headers @{"Authorization"="Bearer $env:CUSTOMER_TOKEN";"Content-Type"="application/json"} `
  -Body $order
$orderId = ($result.Content | ConvertFrom-Json).id

Write-Host "✅ Order $orderId created"

# Test 2: Check Receipt Stored
$receipt = Invoke-WebRequest -Uri "$API/api/orders/$orderId/payment-receipt" -Method GET `
  -Headers @{"Authorization"="Bearer $env:ADMIN_TOKEN";"Content-Type"="application/json"} | ConvertFrom-Json
  
Write-Host "✅ Receipt stored: $(if($receipt.receiptImageBase64) {'YES'} else {'NO'})"

# Test 3: Idempotency
$idempkey = [guid]::NewGuid()
$order2 = $order -replace [guid]::NewGuid(), $idempkey
$result1 = (Invoke-WebRequest -Uri "$API/api/orders" -Method POST `
  -Headers @{"Authorization"="Bearer $env:CUSTOMER_TOKEN";"Content-Type"="application/json"} `
  -Body $order2).Content | ConvertFrom-Json

Start-Sleep -Seconds 2

$result2 = (Invoke-WebRequest -Uri "$API/api/orders" -Method POST `
  -Headers @{"Authorization"="Bearer $env:CUSTOMER_TOKEN";"Content-Type"="application/json"} `
  -Body $order2).Content | ConvertFrom-Json

Write-Host "✅ Idempotency works: $(if($result1.id -eq $result2.id) {'YES'} else {'NO'})"
```

---

## 📋 STATUS CHECK

```bash
# SSH back to AWS
ssh -i key.pem ec2-user@ip

cd /app/turon

# Count receipts stored
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) FROM payments WHERE receipt_image_base64 IS NOT NULL;
EOF

# Count idempotency keys
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) FROM idempotency_keys;
EOF

# Check delivery proofs
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) FROM delivery_proofs;
EOF
```

---

## ✅ DONE! YOU'RE LIVE

Once verified:

```
✅ Migrations deployed
✅ Receipt storage working
✅ Idempotency working
✅ POD schema ready
✅ All 3 critical blockers fixed

🎉 READY FOR REAL ORDERS!
```

---

## 🚨 ROLLBACK (if needed)

```bash
# SSH to AWS
ssh -i key.pem ec2-user@ip
cd /app/turon

# Check migration status
npx prisma migrate status

# Rollback if broken
npx prisma migrate resolve --rolled-back migration_name
```

---

## 📞 WHAT'S NEXT?

**Today** (Done): Receipt + Idempotency + POD Schema
**Tomorrow**: Implement 4 remaining features in parallel:
- [ ] Courier auto-reassignment
- [ ] Geofence auto-transitions  
- [ ] Phone entry UX fix
- [ ] Real-time menu updates

**Timeline**: Ready for full production in 2-3 weeks

---

**Questions?** Check these files:
- [QUICK_START.md](QUICK_START.md) - Detailed manual steps
- [AWS_PRODUCTION_VERIFICATION.md](AWS_PRODUCTION_VERIFICATION.md) - All test scenarios
- [FIXES_COMPLETED.md](FIXES_COMPLETED.md) - What was fixed

**Go live! 🚀**

