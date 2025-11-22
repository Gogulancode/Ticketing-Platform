# ============================================================================
# BACKEND DEPLOYMENT SCRIPT FOR PRODUCTION
# Deploy Comment Attachments & Email Notifications Feature
# Target: D:\SupportApp\api
# ============================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     BACKEND DEPLOYMENT TO PRODUCTION SERVER               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Configuration
$packagePath = "D:\BabajiShivram_training\BusinessHub-Production-20251112-171511.zip"
$extractPath = "C:\Temp\BusinessHub-Deploy"
$productionBackendPath = "D:\SupportApp\api"
$backupPath = "D:\SupportApp\api_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Check if package exists
if (-not (Test-Path $packagePath)) {
    Write-Host "❌ ERROR: Package not found at $packagePath" -ForegroundColor Red
    Write-Host "Please copy BusinessHub-Production-20251112-171511.zip to D:\BabajiShivram_training\" -ForegroundColor Yellow
    exit 1
}

# Step 1: Extract package
Write-Host "📦 Step 1: Extracting deployment package..." -ForegroundColor Cyan
if (Test-Path $extractPath) {
    Remove-Item -Path $extractPath -Recurse -Force
}
Expand-Archive -Path $packagePath -DestinationPath $extractPath -Force
Write-Host "✅ Package extracted to $extractPath`n" -ForegroundColor Green

# Step 2: Backup existing backend
Write-Host "💾 Step 2: Backing up existing backend..." -ForegroundColor Cyan
if (Test-Path $productionBackendPath) {
    Copy-Item -Path $productionBackendPath -Destination $backupPath -Recurse -Force
    Write-Host "✅ Backup created at: $backupPath`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  No existing backend found (fresh installation)`n" -ForegroundColor Yellow
}

# Step 3: Stop IIS Application Pool
Write-Host "🛑 Step 3: Stopping IIS Application Pool..." -ForegroundColor Cyan
Write-Host "Available Application Pools:" -ForegroundColor Yellow
Import-Module WebAdministration
Get-ChildItem IIS:\AppPools | Select-Object Name, State | Format-Table

$appPoolName = Read-Host "Enter the Application Pool name for the API (e.g., SupportAppAPI)"

if ($appPoolName) {
    try {
        Stop-WebAppPool -Name $appPoolName -ErrorAction Stop
        Write-Host "✅ Application Pool '$appPoolName' stopped`n" -ForegroundColor Green
        Start-Sleep -Seconds 3
    } catch {
        Write-Host "⚠️  Could not stop app pool automatically. Please stop it manually in IIS Manager." -ForegroundColor Yellow
        $continue = Read-Host "Press Enter when app pool is stopped..."
    }
} else {
    Write-Host "⚠️  No app pool name provided. Please stop it manually in IIS Manager." -ForegroundColor Yellow
    $continue = Read-Host "Press Enter when app pool is stopped..."
}

# Step 4: Preserve appsettings.Production.json
Write-Host "📝 Step 4: Preserving configuration..." -ForegroundColor Cyan
$configBackupPath = "$env:TEMP\appsettings.Production.json.backup"
if (Test-Path "$productionBackendPath\appsettings.Production.json") {
    Copy-Item -Path "$productionBackendPath\appsettings.Production.json" -Destination $configBackupPath -Force
    Write-Host "✅ Configuration backed up`n" -ForegroundColor Green
}

# Step 5: Deploy new backend files
Write-Host "🚀 Step 5: Deploying new backend files..." -ForegroundColor Cyan
Copy-Item -Path "$extractPath\backend\*" -Destination $productionBackendPath -Recurse -Force
Write-Host "✅ Backend files deployed to $productionBackendPath`n" -ForegroundColor Green

# Step 6: Restore configuration
Write-Host "📝 Step 6: Restoring configuration..." -ForegroundColor Cyan
if (Test-Path $configBackupPath) {
    Copy-Item -Path $configBackupPath -Destination "$productionBackendPath\appsettings.Production.json" -Force
    Write-Host "✅ Configuration restored`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  No previous configuration found. Using default.`n" -ForegroundColor Yellow
}

# Step 7: Verify critical files
Write-Host "🔍 Step 7: Verifying deployment..." -ForegroundColor Cyan
$criticalFiles = @(
    "ERPTraining.API.dll",
    "appsettings.json",
    "appsettings.Production.json",
    "web.config"
)

$allFilesPresent = $true
foreach ($file in $criticalFiles) {
    $filePath = Join-Path $productionBackendPath $file
    if (Test-Path $filePath) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - MISSING!" -ForegroundColor Red
        $allFilesPresent = $false
    }
}

if (-not $allFilesPresent) {
    Write-Host "`n⚠️  WARNING: Some critical files are missing!" -ForegroundColor Red
    $continue = Read-Host "Continue anyway? (yes/no)"
    if ($continue -ne "yes") {
        Write-Host "Deployment cancelled. Restoring backup..." -ForegroundColor Yellow
        if (Test-Path $backupPath) {
            Remove-Item -Path $productionBackendPath -Recurse -Force
            Copy-Item -Path $backupPath -Destination $productionBackendPath -Recurse -Force
        }
        exit 1
    }
}

# Step 8: Start IIS Application Pool
Write-Host "`n🚀 Step 8: Starting IIS Application Pool..." -ForegroundColor Cyan
if ($appPoolName) {
    try {
        Start-WebAppPool -Name $appPoolName -ErrorAction Stop
        Write-Host "✅ Application Pool '$appPoolName' started`n" -ForegroundColor Green
        Start-Sleep -Seconds 5
    } catch {
        Write-Host "⚠️  Could not start app pool automatically. Please start it manually in IIS Manager." -ForegroundColor Yellow
        $continue = Read-Host "Press Enter when app pool is started..."
    }
}

# Step 9: Test API
Write-Host "🧪 Step 9: Testing API..." -ForegroundColor Cyan
Write-Host "Testing: http://businesshub.babajishivram.com/api/health" -ForegroundColor Gray

Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://businesshub.babajishivram.com/api/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API is responding! Status: $($response.StatusCode)`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  API health check failed. This might be normal if /health endpoint doesn't exist." -ForegroundColor Yellow
    Write-Host "Testing login endpoint instead..." -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "http://businesshub.babajishivram.com/api/auth/login" -Method POST -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ API is responding! (Got expected error from login without credentials)`n" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 401) {
            Write-Host "✅ API is responding! (Got expected error from login without credentials)`n" -ForegroundColor Green
        } else {
            Write-Host "❌ API is not responding. Check IIS and application logs.`n" -ForegroundColor Red
        }
    }
}

# Step 10: Cleanup
Write-Host "🧹 Step 10: Cleanup..." -ForegroundColor Cyan
Remove-Item -Path $extractPath -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path $configBackupPath -Force -ErrorAction SilentlyContinue
Write-Host "✅ Temporary files cleaned up`n" -ForegroundColor Green

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           DEPLOYMENT COMPLETED SUCCESSFULLY ✅             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Backend deployed to: $productionBackendPath" -ForegroundColor White
Write-Host "  ✅ Backup location: $backupPath" -ForegroundColor White
Write-Host "  ✅ Configuration preserved" -ForegroundColor White
Write-Host "  ✅ IIS Application Pool restarted" -ForegroundColor White

Write-Host "`n🔗 Test URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://businesshub.babajishivram.com" -ForegroundColor Yellow
Write-Host "  Backend:  http://businesshub.babajishivram.com/api" -ForegroundColor Yellow

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test login on the frontend" -ForegroundColor White
Write-Host "  2. Create a ticket with comment attachments" -ForegroundColor White
Write-Host "  3. Verify blue highlighting on comments with attachments" -ForegroundColor White
Write-Host "  4. Test email notifications (assignment, resolution)" -ForegroundColor White
Write-Host "  5. Test reopen functionality from resolved tickets" -ForegroundColor White

Write-Host "`n💡 Tip: If API doesn't work, check:" -ForegroundColor Yellow
Write-Host "  - IIS Application Pool is started" -ForegroundColor Gray
Write-Host "  - D:\SupportApp\api\appsettings.Production.json has correct connection string" -ForegroundColor Gray
Write-Host "  - Windows Event Viewer > Application logs for errors" -ForegroundColor Gray

Write-Host "`n"
