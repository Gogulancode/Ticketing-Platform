# Production Deployment Verification Script

Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "   Production Build Verification" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

# 1. Check if dist folder exists
if (Test-Path "dist") {
    Write-Host "✅ dist folder exists" -ForegroundColor Green
    
    # Check critical files
    $files = @("dist/index.html", "dist/web.config")
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Host "✅ $file exists" -ForegroundColor Green
        } else {
            Write-Host "❌ $file missing!" -ForegroundColor Red
        }
    }
    
    # Check assets
    $jsFiles = Get-ChildItem "dist/assets/*.js" -ErrorAction SilentlyContinue
    $cssFiles = Get-ChildItem "dist/assets/*.css" -ErrorAction SilentlyContinue
    
    Write-Host "✅ Found $($jsFiles.Count) JavaScript file(s)" -ForegroundColor Green
    Write-Host "✅ Found $($cssFiles.Count) CSS file(s)" -ForegroundColor Green
    
} else {
    Write-Host "❌ dist folder not found! Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "   Configuration Verification" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

# 2. Check production configuration
$jsFile = Get-ChildItem "dist/assets/*.js" | Select-Object -First 1
if ($jsFile) {
    $content = Get-Content $jsFile.FullName -Raw
    
    $prodCount = ($content | Select-String -Pattern 'businesshub\.babajishivram\.com/api' -AllMatches).Matches.Count
    $ipCount = ($content | Select-String -Pattern '192\.168\.6\.171' -AllMatches).Matches.Count
    
    Write-Host "Production domain references: " -NoNewline
    if ($prodCount -gt 0) {
        Write-Host "$prodCount" -ForegroundColor Green
    } else {
        Write-Host "0 ⚠️  WARNING!" -ForegroundColor Yellow
    }
    
    Write-Host "Internal IP references: " -NoNewline
    if ($ipCount -eq 0) {
        Write-Host "0 (Good!)" -ForegroundColor Green
    } else {
        Write-Host "$ipCount ⚠️  Should be 0!" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "   Deployment Readiness" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

# 3. Check .env.production
if (Test-Path ".env.production") {
    $envContent = Get-Content ".env.production" -Raw
    if ($envContent -match 'VITE_API_BASE_URL=http://businesshub\.babajishivram\.com/api') {
        Write-Host "✅ .env.production configured correctly" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env.production may need updating" -ForegroundColor Yellow
    }
}

# 4. Summary
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "   Deployment Steps" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Stop IIS site:" -ForegroundColor Yellow
Write-Host "   Stop-Website -Name 'YourSiteName'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Backup current (optional):" -ForegroundColor Yellow
Write-Host "   Copy-Item 'C:\inetpub\wwwroot\businesshub\*' 'C:\backup\$(Get-Date -Format 'yyyyMMdd-HHmmss')' -Recurse" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy new build:" -ForegroundColor Yellow
Write-Host "   Copy-Item 'dist\*' 'C:\inetpub\wwwroot\businesshub' -Recurse -Force" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start IIS site:" -ForegroundColor Yellow
Write-Host "   Start-Website -Name 'YourSiteName'" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Test in browser:" -ForegroundColor Yellow
Write-Host "   http://businesshub.babajishivram.com/Login" -ForegroundColor Gray
Write-Host "   Check console for: 'detectedEnvironment: PRODUCTION_DOMAIN'" -ForegroundColor Gray
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

if ($prodCount -gt 0 -and $ipCount -eq 0) {
    Write-Host "🎉 BUILD IS READY FOR PRODUCTION DEPLOYMENT!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Review configuration before deploying" -ForegroundColor Yellow
}

Write-Host ""
