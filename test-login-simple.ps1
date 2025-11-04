# Simple Login Performance Test

Write-Host "`n=== LOGIN PERFORMANCE TEST ===" -ForegroundColor Cyan

# Test 1: ERP API Direct
Write-Host "`nTEST 1: ERP API Direct" -ForegroundColor Yellow
$body = '{"Email":"Gogulan@moojic.com","Password":"Gogulan@20$@025"}'
$sw1 = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $erpResult = Invoke-RestMethod -Uri "http://154.84.227.120:440/api/Login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $sw1.Stop()
    Write-Host "SUCCESS: $($sw1.ElapsedMilliseconds) ms" -ForegroundColor Green
    Write-Host "UserID: $($erpResult.userId)" -ForegroundColor Gray
} catch {
    $sw1.Stop()
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Local API Full Login
Write-Host "`nTEST 2: Local API Full Login Flow" -ForegroundColor Yellow
$loginBody = '{"email":"Gogulan@moojic.com","password":"Gogulan@20$@025"}'
$sw2 = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $localResult = Invoke-RestMethod -Uri "http://localhost:5015/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 30
    $sw2.Stop()
    Write-Host "SUCCESS: $($sw2.ElapsedMilliseconds) ms" -ForegroundColor Green
    Write-Host "User: $($localResult.user.firstName) $($localResult.user.lastName)" -ForegroundColor Gray
    Write-Host "Roles: $($localResult.user.roles -join ', ')" -ForegroundColor Gray
} catch {
    $sw2.Stop()
    Write-Host "FAILED after $($sw2.ElapsedMilliseconds) ms" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Multiple Attempts
Write-Host "`nTEST 3: 5 Login Attempts" -ForegroundColor Yellow
$times = @()
for ($i = 1; $i -le 5; $i++) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:5015/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 30
        $sw.Stop()
        $times += $sw.ElapsedMilliseconds
        Write-Host "Attempt $i : $($sw.ElapsedMilliseconds) ms" -ForegroundColor Gray
    } catch {
        $sw.Stop()
        Write-Host "Attempt $i : FAILED after $($sw.ElapsedMilliseconds) ms" -ForegroundColor Red
        break
    }
    Start-Sleep -Milliseconds 500
}

if ($times.Count -gt 0) {
    $avg = [math]::Round(($times | Measure-Object -Average).Average, 0)
    $min = ($times | Measure-Object -Minimum).Minimum
    $max = ($times | Measure-Object -Maximum).Maximum
    
    Write-Host "`nRESULTS:" -ForegroundColor Cyan
    Write-Host "Average: $avg ms" -ForegroundColor Green
    Write-Host "Min: $min ms | Max: $max ms" -ForegroundColor Gray
    
    if ($avg -lt 1000) {
        Write-Host "Performance: EXCELLENT" -ForegroundColor Green
    } elseif ($avg -lt 2000) {
        Write-Host "Performance: GOOD" -ForegroundColor Green
    } else {
        Write-Host "Performance: NEEDS IMPROVEMENT" -ForegroundColor Yellow
    }
}

Write-Host "`n=== COMPLETE ===" -ForegroundColor Cyan
