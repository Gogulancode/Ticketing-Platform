# Login Performance Test Script
# Tests ERP API response time and full login flow

Write-Host "`n=== LOGIN PERFORMANCE TEST ===" -ForegroundColor Cyan
Write-Host "Testing ERP API and Full Login Flow`n" -ForegroundColor Gray

# Test credentials
$email = "Gogulan@moojic.com"
$password = "Gogulan@20$@025"
$erpApiUrl = "http://154.84.227.120:440/api/Login"
$localApiUrl = "http://localhost:5015/api/auth/login"

# Test 1: ERP API Direct
Write-Host "TEST 1: ERP API Direct Response Time" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Gray
$body = @{
    Email = $email
    Password = $password
} | ConvertTo-Json

try {
    $erpStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $erpResponse = Invoke-RestMethod -Uri $erpApiUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $erpStopwatch.Stop()
    
    Write-Host "✓ ERP API Response Time: $($erpStopwatch.ElapsedMilliseconds) ms" -ForegroundColor Green
    Write-Host "  Token received: $($erpResponse.token.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "  User ID: $($erpResponse.userId)" -ForegroundColor Gray
} catch {
    Write-Host "✗ ERP API Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  This is expected if firewall not yet configured" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Local API Full Login Flow
Write-Host "TEST 2: Local API Full Login Flow" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray
Write-Host "This includes: ERP validation + DB queries + JWT generation" -ForegroundColor Gray

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $localStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $localResponse = Invoke-RestMethod -Uri $localApiUrl -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 30
    $localStopwatch.Stop()
    
    Write-Host "✓ Full Login Response Time: $($localStopwatch.ElapsedMilliseconds) ms" -ForegroundColor Green
    Write-Host "  Token received: $($localResponse.token.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "  User: $($localResponse.user.firstName) $($localResponse.user.lastName)" -ForegroundColor Gray
    Write-Host "  Email: $($localResponse.user.email)" -ForegroundColor Gray
    Write-Host "  Roles: $($localResponse.user.roles -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "✗ Local API Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*timed out*" -or $_.Exception.Message -like "*failed to respond*") {
        Write-Host "  Likely waiting for ERP API timeout (30 seconds)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 3: Multiple Login Attempts (Average)
Write-Host "TEST 3: Average Login Time (5 attempts)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$attempts = 5
$times = @()

for ($i = 1; $i -le $attempts; $i++) {
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri $localApiUrl -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 30 -ErrorAction Stop
        $sw.Stop()
        $times += $sw.ElapsedMilliseconds
        $timeMs = $sw.ElapsedMilliseconds
        Write-Host "  Attempt ${i}: ${timeMs} ms" -ForegroundColor Gray
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "  Attempt ${i}: FAILED" -ForegroundColor Red
        break
    }
}

if ($times.Count -gt 0) {
    $avgTime = [math]::Round(($times | Measure-Object -Average).Average, 2)
    $minTime = ($times | Measure-Object -Minimum).Minimum
    $maxTime = ($times | Measure-Object -Maximum).Maximum
    
    Write-Host ""
    Write-Host "RESULTS:" -ForegroundColor Cyan
    Write-Host "  Average: $avgTime ms" -ForegroundColor Green
    Write-Host "  Minimum: $minTime ms" -ForegroundColor Green
    Write-Host "  Maximum: $maxTime ms" -ForegroundColor Green
    
    if ($avgTime -lt 1000) {
        Write-Host "`n✓ Performance: EXCELLENT (< 1 second)" -ForegroundColor Green
    } elseif ($avgTime -lt 2000) {
        Write-Host "`n✓ Performance: GOOD (1-2 seconds)" -ForegroundColor Green
    } elseif ($avgTime -lt 3000) {
        Write-Host "`n⚠ Performance: ACCEPTABLE (2-3 seconds)" -ForegroundColor Yellow
    } else {
        Write-Host "`n✗ Performance: SLOW (> 3 seconds)" -ForegroundColor Red
    }
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan

# Test 4: Breakdown Analysis
Write-Host "`nTEST 4: Login Flow Breakdown" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Gray
Write-Host "Expected breakdown for successful login:" -ForegroundColor Gray
Write-Host "  1. ERP API validation:    ~500-600 ms" -ForegroundColor Gray
Write-Host "  2. Database operations:   ~100-200 ms" -ForegroundColor Gray
Write-Host "  3. JWT generation:        ~10-50 ms" -ForegroundColor Gray
Write-Host "  4. Response serialization: ~10-20 ms" -ForegroundColor Gray
Write-Host "  ----------------------------------------" -ForegroundColor Gray
Write-Host "  TOTAL EXPECTED:          ~620-870 ms" -ForegroundColor Gray
Write-Host ""
Write-Host "NOTE: Your local machine can reach ERP API in ~523ms (tested earlier)" -ForegroundColor Cyan
Write-Host "      Production server times out after 30,000ms due to firewall" -ForegroundColor Yellow
