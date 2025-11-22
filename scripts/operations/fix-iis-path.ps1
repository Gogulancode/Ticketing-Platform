# IIS Configuration Fix for Production Frontend
# This script helps configure IIS to point to the correct folder

Write-Host "=== IIS Configuration Guide ===" -ForegroundColor Cyan
Write-Host ""

# Expected configuration
$expectedPath = "D:\supportapp\frontend"
$siteName = "Default Web Site"  # Change this if your site has a different name

Write-Host "ISSUE: IIS is looking for files at the wrong path" -ForegroundColor Yellow
Write-Host "Expected: http://localhost/assets/index-CB10YXSq.css" -ForegroundColor Red
Write-Host "Actual:   http://localhost/frontend/assets/index-CB10YXSq.css" -ForegroundColor Red
Write-Host ""

Write-Host "SOLUTION: Configure IIS site to point directly to frontend folder" -ForegroundColor Green
Write-Host ""

Write-Host "Option 1: Using IIS Manager (GUI)" -ForegroundColor Cyan
Write-Host "---------------------------------------"
Write-Host "1. Open IIS Manager (inetmgr)"
Write-Host "2. Expand 'Sites' in the left panel"
Write-Host "3. Find your website (likely 'Default Web Site' or 'SupportApp')"
Write-Host "4. Right-click → 'Manage Website' → 'Advanced Settings'"
Write-Host "5. Change 'Physical Path' to: $expectedPath"
Write-Host "6. Click OK"
Write-Host "7. Right-click the site → 'Manage Website' → 'Restart'"
Write-Host ""

Write-Host "Option 2: Using PowerShell (Run as Administrator)" -ForegroundColor Cyan
Write-Host "---------------------------------------"
Write-Host "Copy and run these commands in PowerShell (as Administrator):" -ForegroundColor Yellow
Write-Host ""
Write-Host 'Import-Module WebAdministration' -ForegroundColor White
Write-Host ''
Write-Host "# List all sites to find your site name:" -ForegroundColor Gray
Write-Host 'Get-Website | Select-Object Name, PhysicalPath' -ForegroundColor White
Write-Host ''
Write-Host "# Update the site path (replace 'YourSiteName' with actual site name):" -ForegroundColor Gray
Write-Host "Set-ItemProperty 'IIS:\Sites\YourSiteName' -Name physicalPath -Value 'D:\supportapp\frontend'" -ForegroundColor White
Write-Host ''
Write-Host "# Restart the site:" -ForegroundColor Gray
Write-Host 'Stop-Website -Name "YourSiteName"' -ForegroundColor White
Write-Host 'Start-Website -Name "YourSiteName"' -ForegroundColor White
Write-Host ""

Write-Host "Option 3: Create a Virtual Directory (Alternative)" -ForegroundColor Cyan
Write-Host "---------------------------------------"
Write-Host "If you can't change the main site path, create a virtual directory:"
Write-Host "1. Open IIS Manager"
Write-Host "2. Right-click your website"
Write-Host "3. Add Virtual Directory"
Write-Host "   - Alias: [leave empty or use '/']"
Write-Host "   - Physical path: D:\supportapp\frontend"
Write-Host ""

Write-Host "After making changes, test with:" -ForegroundColor Yellow
Write-Host "http://localhost/index.html" -ForegroundColor White
Write-Host "http://localhost/assets/index-CB10YXSq.css" -ForegroundColor White
Write-Host ""

Write-Host "=== Current File Locations ===" -ForegroundColor Cyan
Write-Host "Frontend files are at: D:\supportapp\frontend" -ForegroundColor Green
if (Test-Path "D:\supportapp\frontend\index.html") {
    Write-Host "[OK] index.html exists" -ForegroundColor Green
}
if (Test-Path "D:\supportapp\frontend\assets\index-CB10YXSq.css") {
    Write-Host "[OK] CSS file exists" -ForegroundColor Green
}
if (Test-Path "D:\supportapp\frontend\assets\index-DuN44hIp.js") {
    Write-Host "[OK] JS file exists" -ForegroundColor Green
}
