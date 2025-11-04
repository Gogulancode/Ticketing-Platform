# IIS Configuration - API as Application
# Run this script as Administrator on the production server

Write-Host "=== Configuring API as IIS Application ===" -ForegroundColor Cyan

Import-Module WebAdministration

$siteName = "Default Web Site"  # Change if your site has a different name
$apiPhysicalPath = "D:\SupportApp\api"
$frontendPhysicalPath = "D:\SupportApp\frontend"

Write-Host ""
Write-Host "Step 1: Update main site to point to frontend" -ForegroundColor Yellow
Set-ItemProperty "IIS:\Sites\$siteName" -Name physicalPath -Value $frontendPhysicalPath
Write-Host "  ✓ Site physical path set to: $frontendPhysicalPath" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Create 'api' application" -ForegroundColor Yellow
$appPath = "$siteName/api"
if (Test-Path "IIS:\Sites\$appPath") {
    Write-Host "  'api' application already exists, updating..." -ForegroundColor Yellow
    Set-ItemProperty "IIS:\Sites\$appPath" -Name physicalPath -Value $apiPhysicalPath
} else {
    New-WebApplication -Name "api" -Site $siteName -PhysicalPath $apiPhysicalPath -ApplicationPool "DefaultAppPool"
    Write-Host "  ✓ 'api' application created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Restart site" -ForegroundColor Yellow
Stop-Website -Name $siteName
Start-Website -Name $siteName
Write-Host "  ✓ Site restarted" -ForegroundColor Green

Write-Host ""
Write-Host "=== Configuration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Test URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost/" -ForegroundColor White
Write-Host "  API: http://localhost/api/swagger" -ForegroundColor White
Write-Host ""
Write-Host "Next: Clear browser cache and test login!" -ForegroundColor Yellow
