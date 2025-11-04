# ================================================================
# PRODUCTION BUILD SCRIPT - Support Portal
# ================================================================
Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  PRODUCTION BUILD - Support Portal" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$buildSuccess = $true

# Production deployment paths
$frontendPath = "D:\supportapp\frontend"
$backendPath = "D:\supportapp\api"

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

    # Deploy to Production Folders
    Write-Host "[4/5] Deploying to Production folders..." -ForegroundColor Yellow
    
    # Create directories if they don't exist
    if (!(Test-Path $frontendPath)) {
        New-Item -ItemType Directory -Path $frontendPath -Force | Out-Null
        Write-Host "  Created frontend directory: $frontendPath" -ForegroundColor Green
    }
    
    if (!(Test-Path $backendPath)) {
        New-Item -ItemType Directory -Path $backendPath -Force | Out-Null
        Write-Host "  Created backend directory: $backendPath" -ForegroundColor Green
    }
    
    # Deploy Frontend
    Write-Host "  Deploying frontend to $frontendPath..." -ForegroundColor Gray
    
    # Backup existing web.config if exists
    if (Test-Path "$frontendPath\web.config") {
        Copy-Item "$frontendPath\web.config" "$frontendPath\web.config.backup" -Force
        Write-Host "  Backed up existing web.config" -ForegroundColor Yellow
    }
    
    # Copy all files from dist to frontend folder
    Copy-Item -Path "dist\*" -Destination $frontendPath -Recurse -Force
    Write-Host "  Frontend deployed successfully" -ForegroundColor Green
    
    # Deploy Backend
    Write-Host "  Deploying backend to $backendPath..." -ForegroundColor Gray
    
    # Backup existing appsettings if exists
    if (Test-Path "$backendPath\appsettings.Production.json") {
        Copy-Item "$backendPath\appsettings.Production.json" "$backendPath\appsettings.Production.json.backup" -Force
        Write-Host "  Backed up existing appsettings.Production.json" -ForegroundColor Yellow
    }
    
    # Copy all files from publish to backend folder
    Copy-Item -Path "backend\ERPTraining.API\bin\Release\publish\*" -Destination $backendPath -Recurse -Force
    Write-Host "  Backend deployed successfully" -ForegroundColor Green
    
    Write-Host "`n[5/5] Build and deployment complete`n" -ForegroundColor Green

    # Summary
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  BUILD & DEPLOYMENT COMPLETED!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Deployment Locations:" -ForegroundColor Cyan
    $frontendCount = (Get-ChildItem $frontendPath -Recurse -File | Measure-Object).Count
    $backendCount = (Get-ChildItem $backendPath -Recurse -File | Measure-Object).Count
    Write-Host "  Frontend: $frontendPath ($frontendCount files)" -ForegroundColor White
    Write-Host "  Backend:  $backendPath ($backendCount files)" -ForegroundColor White
    
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "  1. Configure IIS to point to these folders" -ForegroundColor White
    Write-Host "  2. Update appsettings.Production.json with production database" -ForegroundColor White
    Write-Host "  3. Test the application" -ForegroundColor White
    Write-Host "  4. Start IIS application pool`n" -ForegroundColor White

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
