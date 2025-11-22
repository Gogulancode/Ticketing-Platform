# Simple Deployment Script for businesshub.babajishivram.com

Write-Host "=== Frontend Deployment to Production ===" -ForegroundColor Cyan
Write-Host ""

# Check if dist folder exists
if (!(Test-Path "dist")) {
    Write-Host "❌ dist folder not found!" -ForegroundColor Red
    Write-Host "Run 'npm run build' first" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ dist folder found" -ForegroundColor Green

# Check common IIS paths
$possiblePaths = @(
    "C:\inetpub\wwwroot",
    "C:\inetpub\wwwroot\businesshub",
    "D:\inetpub\wwwroot",
    "D:\inetpub\wwwroot\businesshub"
)

Write-Host ""
Write-Host "=== Checking possible IIS paths ===" -ForegroundColor Cyan
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        Write-Host "✅ Found: $path" -ForegroundColor Green
        
        # List files in the path
        $fileCount = (Get-ChildItem $path -File -ErrorAction SilentlyContinue).Count
        Write-Host "   Files: $fileCount" -ForegroundColor Gray
    } else {
        Write-Host "❌ Not found: $path" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Deployment Options ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Deploy to Default Web Site (most common)" -ForegroundColor White
Write-Host "Copy-Item 'dist\*' 'C:\inetpub\wwwroot' -Recurse -Force" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 2: Deploy to businesshub subfolder" -ForegroundColor White
Write-Host "New-Item 'C:\inetpub\wwwroot\businesshub' -ItemType Directory -Force" -ForegroundColor Cyan
Write-Host "Copy-Item 'dist\*' 'C:\inetpub\wwwroot\businesshub' -Recurse -Force" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 3: Deploy to custom path (adjust path as needed)" -ForegroundColor White
Write-Host "Copy-Item 'dist\*' 'YOUR_IIS_PATH' -Recurse -Force" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== Current Dist Contents ===" -ForegroundColor Cyan
Get-ChildItem "dist" -Recurse | Select-Object Name, Length, FullName | Format-Table -AutoSize

Write-Host ""
Write-Host "=== IMPORTANT: Find your IIS path ===" -ForegroundColor Yellow
Write-Host "1. Open IIS Manager (inetmgr)" -ForegroundColor White
Write-Host "2. Find the site for businesshub.babajishivram.com" -ForegroundColor White
Write-Host "3. Right-click → Manage Website → Advanced Settings" -ForegroundColor White
Write-Host "4. Note the 'Physical Path'" -ForegroundColor White
Write-Host "5. Use that path in the Copy-Item command above" -ForegroundColor White
