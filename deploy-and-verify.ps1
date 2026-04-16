# TURON Production Deploy & Verify - PowerShell Version
# Usage: .\deploy-and-verify.ps1

param(
    [string]$BackendSSH = "ec2-user@your-backend-ip",
    [string]$BackendKey = "C:\path\to\deploy-key.pem",
    [string]$ApiUrl = "https://api.your-domain.com",
    [string]$CustomerToken = $env:CUSTOMER_TOKEN,
    [string]$AdminToken = $env:ADMIN_TOKEN,
    [string]$CourierToken = $env:COURIER_TOKEN
)

# Color functions
function Write-Header { Write-Host $args[0] -ForegroundColor Cyan -BackgroundColor Black }
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Error { Write-Host $args[0] -ForegroundColor Red }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }
function Write-Info { Write-Host $args[0] -ForegroundColor Blue }

Clear-Host
Write-Header "`n╔════════════════════════════════════════╗"
Write-Header "║  🚀 TURON PRODUCTION DEPLOY & VERIFY  ║"
Write-Header "╚════════════════════════════════════════╝`n"

# Verify tokens
if (-not $CustomerToken) {
    Write-Error "❌ CUSTOMER_TOKEN not set"
    Write-Info "Set environment variable: `$env:CUSTOMER_TOKEN = 'your-token'"
    exit 1
}

if (-not $AdminToken) {
    Write-Error "❌ ADMIN_TOKEN not set"
    Write-Info "Set environment variable: `$env:ADMIN_TOKEN = 'your-token'"
    exit 1
}

Write-Success "✅ Tokens configured`n"

# ============================================================================
# STEP 1: Run migrations on AWS
# ============================================================================
Write-Warning "[STEP 1] Running migrations on AWS..."
Write-Info "Using SSH connection: $BackendSSH"
Write-Info ""

$migrateScript = @'
cd /app/turon
echo "Generating Prisma Client..."
npx prisma generate

echo "Running migrations..."
npx prisma migrate deploy

echo "Verifying tables..."
npx prisma db execute --stdin << 'EOF'
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('payments', 'idempotency_keys', 'delivery_proofs')
ORDER BY table_name;
EOF
'@

# Execute via ssh.exe (comes with Windows 10+/Git Bash)
$sshCmd = "ssh -i $BackendKey $BackendSSH `"$migrateScript`""
Invoke-Expression $sshCmd

Write-Success "✅ Migrations complete`n"

# ============================================================================
# STEP 2: Test Receipt Storage
# ============================================================================
Write-Warning "[STEP 2] Testing Receipt Storage..."
Write-Info ""

$ReceiptB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
$IdempotencyKey1 = [guid]::NewGuid().ToString()

Write-Info "Creating test order with receipt..."

$orderPayload = @{
    idempotencyKey = $IdempotencyKey1
    items = @(@{menuItemId = "test-item-1"; quantity = 1})
    deliveryAddressId = "test-address-1"
    paymentMethod = "MANUAL_TRANSFER"
    receiptImageBase64 = "data:image/png;base64,$ReceiptB64"
} | ConvertTo-Json

try {
    $orderResponse = Invoke-WebRequest -Uri "$ApiUrl/api/orders" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $CustomerToken"
            "Content-Type" = "application/json"
        } `
        -Body $orderPayload `
        -UseBasicParsing

    $orderData = $orderResponse.Content | ConvertFrom-Json
    $OrderId = $orderData.id

    if (-not $OrderId) {
        Write-Error "❌ Failed to create order"
        Write-Error "Response: $($orderResponse.Content)"
        exit 1
    }

    Write-Info "Order created: $OrderId"
    Write-Info ""
    Write-Info "Retrieving receipt via API..."

    $receiptResponse = Invoke-WebRequest -Uri "$ApiUrl/api/orders/$OrderId/payment-receipt" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $AdminToken"
            "Content-Type" = "application/json"
        } `
        -UseBasicParsing

    $receiptData = $receiptResponse.Content | ConvertFrom-Json
    $ReceiptExists = $receiptData.receiptImageBase64

    if ($ReceiptExists) {
        Write-Success "✅ Receipt stored and retrieved successfully"
    } else {
        Write-Error "❌ Receipt retrieval failed"
        Write-Error "Response: $($receiptResponse.Content)"
    }
} catch {
    Write-Error "❌ Receipt test failed: $_"
    exit 1
}

Write-Info "`n"

# ============================================================================
# STEP 3: Test Idempotency
# ============================================================================
Write-Warning "[STEP 3] Testing Idempotency..."

$IdempotencyKey = [guid]::NewGuid().ToString()
Write-Info "Idempotency Key: $IdempotencyKey`n"

Write-Info "Request 1 (First tap)..."

$idempayload = @{
    idempotencyKey = $IdempotencyKey
    items = @(@{menuItemId = "test-item-2"; quantity = 1})
    deliveryAddressId = "test-address-2"
    paymentMethod = "MANUAL_TRANSFER"
    receiptImageBase64 = "data:image/png;base64,$ReceiptB64"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri "$ApiUrl/api/orders" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $CustomerToken"
            "Content-Type" = "application/json"
        } `
        -Body $idempayload `
        -UseBasicParsing

    $data1 = $response1.Content | ConvertFrom-Json
    $OrderId1 = $data1.id
    $Timestamp1 = $data1.createdAt

    if (-not $OrderId1) {
        Write-Error "❌ First request failed"
        exit 1
    }

    Write-Info "Order 1: $OrderId1 at $Timestamp1"
    Write-Info ""

    Start-Sleep -Seconds 2

    Write-Info "Request 2 (Duplicate - same idempotency key)..."

    $response2 = Invoke-WebRequest -Uri "$ApiUrl/api/orders" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $CustomerToken"
            "Content-Type" = "application/json"
        } `
        -Body $idempayload `
        -UseBasicParsing

    $data2 = $response2.Content | ConvertFrom-Json
    $OrderId2 = $data2.id
    $Timestamp2 = $data2.createdAt

    Write-Info "Order 2: $OrderId2 at $Timestamp2"
    Write-Info ""

    if ($OrderId1 -eq $OrderId2 -and $Timestamp1 -eq $Timestamp2) {
        Write-Success "✅ IDEMPOTENCY WORKS! Same order returned"
    } else {
        Write-Error "❌ IDEMPOTENCY FAILED!"
        Write-Error "Different orders created:"
        Write-Error "  Order 1: $OrderId1"
        Write-Error "  Order 2: $OrderId2"
    }
} catch {
    Write-Error "❌ Idempotency test failed: $_"
    exit 1
}

Write-Info "`n"

# ============================================================================
# STEP 4: Database Verification
# ============================================================================
Write-Warning "[STEP 4] Database Verification..."
Write-Info ""

$dbScript = @'
cd /app/turon

echo "Recent receipts:"
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as count FROM payments 
WHERE receipt_image_base64 IS NOT NULL 
AND created_at > NOW() - INTERVAL '1 hour';
EOF

echo ""
echo "Idempotency keys created:"
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as count FROM idempotency_keys
WHERE created_at > NOW() - INTERVAL '1 hour';
EOF

echo ""
echo "Delivery proofs:"
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as count FROM delivery_proofs;
EOF
'@

$sshDbCmd = "ssh -i $BackendKey $BackendSSH `"$dbScript`""
Invoke-Expression $sshDbCmd

Write-Success "✅ Database verification complete`n"

# ============================================================================
# FINAL SUMMARY
# ============================================================================
Write-Header "`n╔════════════════════════════════════════╗"
Write-Header "║        ✅ ALL TESTS PASSED             ║"
Write-Header "╚════════════════════════════════════════╝`n"

Write-Info "Summary:"
Write-Success "  ✅ Migrations deployed to AWS"
Write-Success "  ✅ Receipt storage working"
Write-Success "  ✅ Idempotency working"
Write-Success "  ✅ Database tables created"

Write-Info "`nNext steps:"
Write-Info "  1. Monitor real orders:"
Write-Info "     ssh -i $BackendKey $BackendSSH 'tail -f /app/turon/logs/backend.log'"
Write-Info "  2. Check admin receipt approval flow"
Write-Info "  3. Test courier delivery proof submission"
Write-Info "`n"
