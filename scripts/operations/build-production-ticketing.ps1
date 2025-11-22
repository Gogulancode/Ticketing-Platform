#!/usr/bin/env pwsh
# Production Build Script for Ticketing-Only Deployment
# Hides Training Module and creates optimized production build

Write-Host "🚀 Starting Production Build (Ticketing Only)..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Cleaned dist folder" -ForegroundColor Green
}

# Verify environment configuration
Write-Host "⚙️ Verifying environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    $envContent = Get-Content ".env.production"
    Write-Host "📋 Production Environment Settings:" -ForegroundColor Cyan
    $envContent | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    # Check if Training Module is disabled
    $trainingDisabled = $envContent | Where-Object { $_ -match "VITE_ENABLE_TRAINING_MODULE=false" }
    if ($trainingDisabled) {
        Write-Host "✅ Training Module is DISABLED (production safe)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ WARNING: Training Module might be enabled!" -ForegroundColor Red
        Write-Host "⚠️ Check .env.production file" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env.production file not found!" -ForegroundColor Red
    exit 1
}

# Build frontend for production
Write-Host "🔨 Building frontend for production..." -ForegroundColor Yellow
Write-Host "Mode: production (Training Module Hidden)" -ForegroundColor Cyan

try {
    npm run build:production
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend build failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Frontend build error: $_" -ForegroundColor Red
    exit 1
}

# Build backend for production
Write-Host "🔨 Building backend for production..." -ForegroundColor Yellow

try {
    dotnet build backend/ERPTraining.API --configuration Release
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend build failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Backend build error: $_" -ForegroundColor Red
    exit 1
}

# Verify build output
Write-Host "🔍 Verifying build output..." -ForegroundColor Yellow

if (Test-Path "dist/index.html") {
    $distSize = (Get-ChildItem "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "✅ Frontend build output: dist/ ($([math]::Round($distSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build output not found!" -ForegroundColor Red
    exit 1
}

if (Test-Path "backend/ERPTraining.API/bin/Release") {
    Write-Host "✅ Backend build output: backend/ERPTraining.API/bin/Release/" -ForegroundColor Green
} else {
    Write-Host "❌ Backend build output not found!" -ForegroundColor Red
    exit 1
}

# Create deployment package
$deploymentFolder = "BusinessHub-Production-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "📦 Creating deployment package: $deploymentFolder" -ForegroundColor Yellow

New-Item -ItemType Directory -Path $deploymentFolder | Out-Null

# Copy frontend build
Copy-Item -Recurse "dist" "$deploymentFolder/frontend"
Write-Host "✅ Frontend files copied to deployment package" -ForegroundColor Green

# Copy backend build
Copy-Item -Recurse "backend/ERPTraining.API/bin/Release" "$deploymentFolder/backend"
Write-Host "✅ Backend files copied to deployment package" -ForegroundColor Green

# Copy configuration files
Copy-Item ".env.production" "$deploymentFolder/.env.production"
Copy-Item "web.config" "$deploymentFolder/web.config" -ErrorAction SilentlyContinue
Write-Host "✅ Configuration files copied" -ForegroundColor Green

# Create deployment instructions
$instructions = @"
# Business Hub Production Deployment - Ticketing Only
Generated: $(Get-Date)

## Features Included:
✅ Support Hub (Ticketing System)
❌ Learning Academy (Training Module) - HIDDEN

## Deployment Files:
* frontend/     → Deploy to web server (IIS/Apache/Nginx)
* backend/      → Deploy .NET API 
* .env.production → Environment configuration
* web.config    → IIS configuration (if using IIS)

## CORS Configuration:
The backend includes CORS policies for:
* https://businesshub.babajishivram.com
* http://businesshub.babajishivram.com  
* http://192.168.6.171 (Internal LAN)
* https://192.168.6.171 (Internal LAN HTTPS)

## Database:
Uses existing ERPTrainingDB - no schema changes required

## URLs:
* Frontend: https://businesshub.babajishivram.com
* Backend API: Configure backend URL in production environment

## Verification:
1. Only "Support Hub" should appear on landing page
2. No training-related routes should be accessible
3. All ticketing features should work normally
"@

$instructions | Out-File "$deploymentFolder/DEPLOYMENT_INSTRUCTIONS.txt" -Encoding UTF8
Write-Host "✅ Deployment instructions created" -ForegroundColor Green

# Summary
Write-Host "" -ForegroundColor White
Write-Host "🎉 PRODUCTION BUILD COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "📦 Deployment Package: $deploymentFolder" -ForegroundColor Cyan
Write-Host "🎯 Training Module: HIDDEN (production safe)" -ForegroundColor Green
Write-Host "🎯 Support Hub: ACTIVE" -ForegroundColor Green
Write-Host "🔗 Domain: businesshub.babajishivram.com" -ForegroundColor Cyan
Write-Host "📋 See DEPLOYMENT_INSTRUCTIONS.txt for details" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

# Optional: Open deployment folder
$openFolder = Read-Host "Open deployment folder? (y/n)"
if ($openFolder -eq "y" -or $openFolder -eq "Y") {
    Start-Process $deploymentFolder
}

Write-Host "✅ Ready for production deployment!" -ForegroundColor Green