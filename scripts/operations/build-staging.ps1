# ================================================================
# STAGING BUILD SCRIPT - Support Portal with Notifications
# ================================================================
Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  STAGING BUILD - Support Portal" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$buildSuccess = $true

try {
    # Clean previous builds
    Write-Host "[1/5] Cleaning previous builds..." -ForegroundColor Yellow
    
    if (Test-Path "dist") {
        Remove-Item -Path "dist" -Recurse -Force
        Write-Host "  Removed frontend dist folder" -ForegroundColor Green
    }
    
    if (Test-Path "backend\ERPTraining.API\bin\Release") {
        Remove-Item -Path "backend\ERPTraining.API\bin\Release" -Recurse -Force
        Write-Host "  Removed backend Release folder" -ForegroundColor Green
    }
    
    if (Test-Path "backend\ERPTraining.API\obj") {
        Remove-Item -Path "backend\ERPTraining.API\obj" -Recurse -Force
        Write-Host "  Removed backend obj folder" -ForegroundColor Green
    }
    
    Write-Host "  Clean complete`n" -ForegroundColor Green

    # Build Frontend
    Write-Host "[2/5] Building Frontend..." -ForegroundColor Yellow
    Write-Host "  Running npm install..." -ForegroundColor Gray
    
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    
    Write-Host "  Building production bundle..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    
    Copy-Item "web.config" "dist\web.config" -Force
    Write-Host "  Web.config copied to dist" -ForegroundColor Green
    Write-Host "  Frontend build complete`n" -ForegroundColor Green

    # Build Backend
    Write-Host "[3/5] Building Backend..." -ForegroundColor Yellow
    Write-Host "  Restoring NuGet packages..." -ForegroundColor Gray
    
    dotnet restore backend\ERPTraining.API\ERPTraining.API.csproj
    if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed" }
    
    Write-Host "  Building Release configuration..." -ForegroundColor Gray
    dotnet publish backend\ERPTraining.API\ERPTraining.API.csproj -c Release -o backend\ERPTraining.API\bin\Release\publish --self-contained false --runtime win-x64
    
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
    Write-Host "  Backend build complete`n" -ForegroundColor Green

    # Prepare Package
    Write-Host "[4/5] Preparing deployment package..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $packageName = "SupportPortal-Staging-$timestamp"
    $packagePath = ".\$packageName"
    
    New-Item -ItemType Directory -Path $packagePath -Force | Out-Null
    New-Item -ItemType Directory -Path "$packagePath\frontend" -Force | Out-Null
    New-Item -ItemType Directory -Path "$packagePath\backend" -Force | Out-Null
    
    Write-Host "  Copying frontend build..." -ForegroundColor Gray
    Copy-Item -Path "dist\*" -Destination "$packagePath\frontend" -Recurse -Force
    
    Write-Host "  Copying backend build..." -ForegroundColor Gray
    Copy-Item -Path "backend\ERPTraining.API\bin\Release\publish\*" -Destination "$packagePath\backend" -Recurse -Force
    
    Write-Host "  Creating deployment guide..." -ForegroundColor Gray
    
    $guide = "STAGING DEPLOYMENT GUIDE`n"
    $guide += "========================`n`n"
    $guide += "Build Date: $timestamp`n`n"
    $guide += "DEPLOYMENT PATHS:`n"
    $guide += "Frontend: h:\root\home\solutionsnext-001\www\support-staging`n"
    $guide += "Backend: h:\root\home\solutionsnext-001\www\support-staging\support-api-staging`n`n"
    $guide += "NEW FEATURES:`n"
    $guide += "- User Notifications System (bell icon)`n"
    $guide += "- Profile Management (user icon)`n"
    $guide += "- Automatic notifications for ticket assignment and status changes`n`n"
    $guide += "DATABASE:`n"
    $guide += "- UserNotifications table must exist`n"
    $guide += "- Run migration if needed`n`n"
    $guide += "VERIFICATION:`n"
    $guide += "Frontend: http://support.solutionsnextwave.com/support-staging`n"
    $guide += "Backend API: http://support.solutionsnextwave.com/support-staging/support-api-staging/api`n"
    
    $guide | Out-File -FilePath "$packagePath\DEPLOYMENT-INSTRUCTIONS.txt" -Encoding UTF8
    
    Write-Host "  Deployment package created: $packageName`n" -ForegroundColor Green

    # Create ZIP
    Write-Host "[5/5] Creating ZIP archive..." -ForegroundColor Yellow
    
    $zipPath = ".\$packageName.zip"
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    Compress-Archive -Path "$packagePath\*" -DestinationPath $zipPath -CompressionLevel Optimal
    Write-Host "  ZIP archive created: $packageName.zip`n" -ForegroundColor Green

    # Summary
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  BUILD COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Build Artifacts:" -ForegroundColor Cyan
    $fileCount = (Get-ChildItem dist -Recurse | Measure-Object).Count
    Write-Host "  Frontend: dist\ ($fileCount files)" -ForegroundColor White
    Write-Host "  Backend: backend\ERPTraining.API\bin\Release\publish\" -ForegroundColor White
    Write-Host "  Package: $packageName\" -ForegroundColor White
    Write-Host "  Archive: $packageName.zip" -ForegroundColor White
    
    $zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host "`nPackage Size: $zipSize MB`n" -ForegroundColor Cyan
    
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Review DEPLOYMENT-INSTRUCTIONS.txt" -ForegroundColor White
    Write-Host "  2. Upload $packageName.zip to staging server" -ForegroundColor White
    Write-Host "  3. Extract and deploy files" -ForegroundColor White
    Write-Host "  4. Test at http://support.solutionsnextwave.com/support-staging`n" -ForegroundColor White

} catch {
    $buildSuccess = $false
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPlease fix the errors and run the build again.`n" -ForegroundColor Yellow
    exit 1
}

if ($buildSuccess) {
    Write-Host "Build completed successfully`n" -ForegroundColor Gray
    exit 0
}
