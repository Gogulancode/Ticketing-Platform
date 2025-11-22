# Script to install URL Rewrite Module
Write-Host "Checking IIS URL Rewrite Module..." -ForegroundColor Cyan

$rewriteModule = Get-WebGlobalModule | Where-Object { $_.Name -eq 'RewriteModule' }

if ($rewriteModule) {
    Write-Host " URL Rewrite Module is already installed" -ForegroundColor Green
} else {
    Write-Host " URL Rewrite Module is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Download and install from:" -ForegroundColor Yellow
    Write-Host "https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use direct link:" -ForegroundColor Yellow
    Write-Host "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi" -ForegroundColor Yellow
}
