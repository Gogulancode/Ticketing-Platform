Write-Host "Deploying Frontend to Production..." -ForegroundColor Cyan

$productionPath = "D:\SupportApp\frontend"

# Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "Error: dist folder not found. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Backup current deployment
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "D:\SupportApp\frontend-backup-$timestamp"

Write-Host "`nStep 1: Creating backup..." -ForegroundColor Yellow
if (Test-Path $productionPath) {
    Copy-Item -Path $productionPath -Destination $backupPath -Recurse -Force
    Write-Host "✓ Backup created at: $backupPath" -ForegroundColor Green
}

# Clear old files from production (except web.config backup)
Write-Host "`nStep 2: Clearing old files..." -ForegroundColor Yellow
if (Test-Path "$productionPath\assets") {
    Remove-Item "$productionPath\assets\*" -Recurse -Force
    Write-Host "✓ Removed old assets" -ForegroundColor Green
}

# Copy new files
Write-Host "`nStep 3: Copying new files..." -ForegroundColor Yellow
Copy-Item -Path "dist\*" -Destination $productionPath -Recurse -Force
Write-Host "✓ Files copied" -ForegroundColor Green

# Verify deployment
Write-Host "`nStep 4: Verifying deployment..." -ForegroundColor Yellow
$indexHtml = Get-Content "$productionPath\index.html" -Raw
if ($indexHtml -match 'index-([A-Za-z0-9]+)\.js') {
    $jsFile = $matches[0]
    Write-Host "  index.html references: $jsFile" -ForegroundColor Cyan
    
    if (Test-Path "$productionPath\assets\$jsFile") {
        Write-Host "  ✓ $jsFile exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $jsFile NOT FOUND!" -ForegroundColor Red
    }
}

if ($indexHtml -match 'index-([A-Za-z0-9]+)\.css') {
    $cssFile = $matches[0]
    Write-Host "  index.html references: $cssFile" -ForegroundColor Cyan
    
    if (Test-Path "$productionPath\assets\$cssFile") {
        Write-Host "  ✓ $cssFile exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $cssFile NOT FOUND!" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext: Restart IIS or the application pool" -ForegroundColor Yellow
Write-Host "Command: Restart-WebAppPool -Name YourAppPoolName" -ForegroundColor Yellow
