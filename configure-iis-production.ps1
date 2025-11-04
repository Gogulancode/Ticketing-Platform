# IIS Configuration Guide for Production
# Run this script as Administrator on the production server

Write-Host "=== IIS Configuration for Support Portal ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$frontendPath = "D:\SupportApp\frontend"
$apiPath = "D:\SupportApp\api"
$frontendSiteName = "SupportPortal-Frontend"
$apiSiteName = "SupportPortal-API"
$frontendPort = 80
$apiPort = 5015  # Or any available port

Write-Host "Step 1: Import WebAdministration module" -ForegroundColor Yellow
Import-Module WebAdministration -ErrorAction Stop

Write-Host "Step 2: Create Frontend Site" -ForegroundColor Yellow
if (Test-Path "IIS:\Sites\$frontendSiteName") {
    Write-Host "  Frontend site already exists" -ForegroundColor Green
} else {
    New-Website -Name $frontendSiteName -Port $frontendPort -PhysicalPath $frontendPath -ApplicationPool "DefaultAppPool"
    Write-Host "  ✓ Frontend site created on port $frontendPort" -ForegroundColor Green
}

Write-Host "Step 3: Create API Site" -ForegroundColor Yellow
if (Test-Path "IIS:\Sites\$apiSiteName") {
    Write-Host "  API site already exists" -ForegroundColor Green
} else {
    New-Website -Name $apiSiteName -Port $apiPort -PhysicalPath $apiPath -ApplicationPool "DefaultAppPool"
    Write-Host "  ✓ API site created on port $apiPort" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Configuration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: http://localhost:$frontendPort" -ForegroundColor Cyan
Write-Host "API URL: http://localhost:$apiPort/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Update frontend .env to use http://localhost:$apiPort/api" -ForegroundColor Yellow
