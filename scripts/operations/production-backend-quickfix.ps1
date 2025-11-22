# PRODUCTION BACKEND QUICK FIX COMMANDS
# Run these ON YOUR PRODUCTION SERVER (192.168.6.171)

Write-Host "=== PRODUCTION BACKEND QUICK FIX ===" -ForegroundColor Yellow

# First, find where your backend is deployed
Write-Host "`nStep 1: Finding backend deployment location..." -ForegroundColor Cyan

$commonPaths = @(
    "C:\inetpub\wwwroot\api",
    "C:\inetpub\api", 
    "C:\ERPTraining",
    "C:\BusinessHub\backend",
    "D:\ERPTraining",
    "D:\BusinessHub\backend",
    "C:\Program Files\ERPTraining",
    "C:\Deploy\backend"
)

$backendPath = $null
foreach ($path in $commonPaths) {
    if (Test-Path "$path\ERPTraining.API.exe" -Or Test-Path "$path\ERPTraining.API.dll") {
        $backendPath = $path
        Write-Host "✅ Found backend at: $path" -ForegroundColor Green
        break
    }
}

if ($backendPath) {
    Write-Host "`nStep 2: Starting API server..." -ForegroundColor Cyan
    
    # Stop any existing processes
    Get-Process | Where-Object {$_.ProcessName -like "*ERPTraining*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Navigate to backend directory
    Set-Location $backendPath
    
    # Try starting with .exe first, then .dll
    if (Test-Path "ERPTraining.API.exe") {
        Write-Host "Starting with ERPTraining.API.exe..." -ForegroundColor Yellow
        Start-Process -FilePath "ERPTraining.API.exe" -ArgumentList "--urls", "http://192.168.6.171:81" -WindowStyle Minimized
    } elseif (Test-Path "ERPTraining.API.dll") {
        Write-Host "Starting with dotnet ERPTraining.API.dll..." -ForegroundColor Yellow  
        Start-Process -FilePath "dotnet" -ArgumentList "ERPTraining.API.dll", "--urls", "http://192.168.6.171:81" -WindowStyle Minimized
    }
    
    # Wait a moment for startup
    Start-Sleep -Seconds 3
    
    # Test if it's running
    Write-Host "`nStep 3: Testing API..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://192.168.6.171:81/api" -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ SUCCESS! API is now running: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "✅ Frontend should now work!" -ForegroundColor Green
    } catch {
        Write-Host "❌ API still not responding: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Check if Windows Firewall is blocking port 81" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Backend deployment not found!" -ForegroundColor Red
    Write-Host "Please copy the backend files to one of these locations:" -ForegroundColor Yellow
    $commonPaths | ForEach-Object { Write-Host "  - $_" -ForegroundColor Cyan }
}

Write-Host "`n=== QUICK FIREWALL FIX ===" -ForegroundColor Yellow
Write-Host "If API still doesn't work, run this to open port 81:" -ForegroundColor Cyan
Write-Host "New-NetFirewallRule -DisplayName 'Allow Port 81' -Direction Inbound -Protocol TCP -LocalPort 81 -Action Allow" -ForegroundColor White

Write-Host "`n=== MANUAL STARTUP ===" -ForegroundColor Yellow
Write-Host "If automation fails, manually navigate to your backend folder and run:" -ForegroundColor Cyan
Write-Host "ERPTraining.API.exe --urls `"http://192.168.6.171:81`"" -ForegroundColor White
Write-Host "OR" -ForegroundColor White
Write-Host "dotnet ERPTraining.API.dll --urls `"http://192.168.6.171:81`"" -ForegroundColor White