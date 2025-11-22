# IIS Configuration Check and Deployment Script

Write-Host "=== Checking IIS Configuration ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check if IIS is installed
$iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue
if ($iisFeature -and $iisFeature.Installed) {
    Write-Host "✅ IIS is installed" -ForegroundColor Green
} else {
    Write-Host "❌ IIS is not installed!" -ForegroundColor Red
    exit 1
}

# 2. List all websites
Write-Host ""
Write-Host "=== IIS Websites ===" -ForegroundColor Cyan
Import-Module WebAdministration -ErrorAction SilentlyContinue
Get-Website | Select-Object Name, State, PhysicalPath, @{Name="Bindings";Expression={$_.bindings.Collection.bindingInformation}} | Format-Table -AutoSize

# 3. Check default website
Write-Host ""
Write-Host "=== Checking Default Web Site ===" -ForegroundColor Cyan
$defaultSite = Get-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
if ($defaultSite) {
    Write-Host "✅ Default Web Site exists" -ForegroundColor Green
    Write-Host "   Physical Path: $($defaultSite.physicalPath)" -ForegroundColor Gray
    Write-Host "   State: $($defaultSite.state)" -ForegroundColor Gray
    
    # Check if path exists
    if (Test-Path $defaultSite.physicalPath) {
        Write-Host "✅ Physical path exists" -ForegroundColor Green
        
        # List files in wwwroot
        Write-Host ""
        Write-Host "=== Files in wwwroot ===" -ForegroundColor Cyan
        Get-ChildItem $defaultSite.physicalPath | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
    } else {
        Write-Host "❌ Physical path does not exist!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Default Web Site not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Recommended Deployment Path ===" -ForegroundColor Yellow
Write-Host "Based on IIS configuration, deploy to:" -ForegroundColor Yellow
if ($defaultSite) {
    Write-Host $defaultSite.physicalPath -ForegroundColor White
    
    Write-Host ""
    Write-Host "=== Run this to deploy ===" -ForegroundColor Green
    Write-Host "Copy-Item 'D:\BabajiShivram_training\dist\*' '$($defaultSite.physicalPath)' -Recurse -Force" -ForegroundColor White
}
