# PRODUCTION BACKEND DEBUGGING GUIDE
# Run these commands ON YOUR PRODUCTION SERVER (192.168.6.171)

Write-Host "=== PRODUCTION BACKEND DIAGNOSIS ===" -ForegroundColor Yellow

# 1. Check if Backend API is running on port 81
Write-Host "`n1. Checking if API is running on port 81..." -ForegroundColor Cyan
netstat -ano | findstr ":81"

# 2. Check for any .NET processes
Write-Host "`n2. Checking for .NET/ERP processes..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.ProcessName -like "*dotnet*" -or $_.ProcessName -like "*ERP*"}

# 3. Test API endpoint directly
Write-Host "`n3. Testing API endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://192.168.6.171:81/api" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ API is responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ API is not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test localhost API (if binding issue)
Write-Host "`n4. Testing localhost API..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:81/api" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Localhost API responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Localhost API not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Check Windows Services (if deployed as service)
Write-Host "`n5. Checking Windows Services..." -ForegroundColor Cyan
Get-Service | Where-Object {$_.Name -like "*ERP*" -or $_.DisplayName -like "*Business*"}

# 6. Check IIS Applications (if deployed to IIS)
Write-Host "`n6. Checking IIS Applications..." -ForegroundColor Cyan
if (Get-Command Get-IISSite -ErrorAction SilentlyContinue) {
    Get-IISSite | Where-Object {$_.Bindings -like "*:81*"}
    Get-IISApplication
} else {
    Write-Host "IIS PowerShell module not available" -ForegroundColor Yellow
}

# 7. Check Windows Firewall
Write-Host "`n7. Checking Windows Firewall for port 81..." -ForegroundColor Cyan
Get-NetFirewallRule -DisplayName "*81*" -ErrorAction SilentlyContinue | Select-Object DisplayName, Enabled, Direction

# 8. Check if port 81 is blocked
Write-Host "`n8. Testing port 81 accessibility..." -ForegroundColor Cyan
Test-NetConnection -ComputerName "192.168.6.171" -Port 81

# 9. Check backend deployment files
Write-Host "`n9. Checking backend deployment..." -ForegroundColor Cyan
$backendPaths = @(
    "C:\inetpub\wwwroot\api",
    "C:\ERPTraining",
    "C:\BusinessHub\backend",
    "C:\inetpub\api",
    "D:\ERPTraining",
    "D:\BusinessHub\backend"
)

foreach ($path in $backendPaths) {
    if (Test-Path $path) {
        Write-Host "Found backend at: $path" -ForegroundColor Green
        Get-ChildItem $path -Name | Select-Object -First 5
        if (Test-Path "$path\ERPTraining.API.exe") {
            Write-Host "✅ ERPTraining.API.exe found" -ForegroundColor Green
        }
        if (Test-Path "$path\ERPTraining.API.dll") {
            Write-Host "✅ ERPTraining.API.dll found" -ForegroundColor Green
        }
    }
}

# 10. Check Event Logs for errors
Write-Host "`n10. Checking Event Logs for recent errors..." -ForegroundColor Cyan
Get-EventLog -LogName Application -Source "*ERP*" -Newest 5 -ErrorAction SilentlyContinue | 
    Select-Object TimeGenerated, EntryType, Message

# 11. Manual API start test
Write-Host "`n11. MANUAL API START TEST" -ForegroundColor Yellow
Write-Host "To manually start the API, navigate to your backend deployment folder and run:" -ForegroundColor White
Write-Host "dotnet ERPTraining.API.dll --urls `"http://192.168.6.171:81`"" -ForegroundColor Cyan
Write-Host "OR" -ForegroundColor White  
Write-Host "ERPTraining.API.exe --urls `"http://192.168.6.171:81`"" -ForegroundColor Cyan

Write-Host "`n=== END DIAGNOSIS ===" -ForegroundColor Yellow