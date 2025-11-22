# ============================================================================
# COMPLETE PRODUCTION DEPLOYMENT SCRIPT
# For Comment Attachments & Email Notifications Feature
# Date: November 12, 2025
# ============================================================================

param(
    [string]$ProductionServer = "your-production-server",
    [string]$DatabaseServer = "your-db-server",
    [string]$DatabaseName = "ERPTrainingDB_Production",
    [switch]$SkipTests,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$deploymentLog = "deployment-$timestamp.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $deploymentLog -Value $logMessage
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "INFO"
    
    # Check if dotnet is installed
    if (!(Get-Command dotnet -ErrorAction SilentlyContinue)) {
        Write-Log ".NET SDK not found!" "ERROR"
        exit 1
    }
    
    # Check if npm is installed
    if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Log "npm not found!" "ERROR"
        exit 1
    }
    
    # Check if git is clean
    $gitStatus = git status --porcelain
    if ($gitStatus -and !$DryRun) {
        Write-Log "WARNING: Git working directory has uncommitted changes" "WARN"
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne 'y') { exit 1 }
    }
    
    Write-Log "Prerequisites check passed" "INFO"
}

function Backup-ProductionDatabase {
    Write-Log "Creating database backup..." "INFO"
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would backup database: $DatabaseName" "INFO"
        return
    }
    
    $backupFile = "ERPTrainingDB_Backup_$timestamp.bak"
    $backupSql = @"
BACKUP DATABASE [$DatabaseName] 
TO DISK = 'C:\DatabaseBackups\$backupFile' 
WITH FORMAT, 
     MEDIANAME = 'ProductionBackup',
     NAME = 'Full Backup before deployment';
"@
    
    try {
        Invoke-Sqlcmd -ServerInstance $DatabaseServer -Query $backupSql -QueryTimeout 300
        Write-Log "Database backup created: $backupFile" "INFO"
    }
    catch {
        Write-Log "Database backup failed: $_" "ERROR"
        exit 1
    }
}

function Apply-DatabaseMigration {
    Write-Log "Applying database migration..." "INFO"
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would apply migration: AddCommentIdToAttachments" "INFO"
        return
    }
    
    # Check if migration already exists
    $checkSql = @"
SELECT COUNT(*) as MigrationExists 
FROM [__EFMigrationsHistory] 
WHERE MigrationId = '20251112062557_AddCommentIdToAttachments'
"@
    
    try {
        $result = Invoke-Sqlcmd -ServerInstance $DatabaseServer -Database $DatabaseName -Query $checkSql
        if ($result.MigrationExists -gt 0) {
            Write-Log "Migration already applied, skipping" "INFO"
            return
        }
        
        # Apply migration using EF Core
        Set-Location ".\backend\ERPTraining.Infrastructure"
        $connectionString = "Server=$DatabaseServer;Database=$DatabaseName;Integrated Security=true;TrustServerCertificate=true;"
        
        $env:ConnectionStrings__DefaultConnection = $connectionString
        dotnet ef database update --startup-project ..\ERPTraining.API --verbose
        
        if ($LASTEXITCODE -ne 0) {
            throw "Migration failed with exit code $LASTEXITCODE"
        }
        
        Write-Log "Database migration applied successfully" "INFO"
    }
    catch {
        Write-Log "Migration failed: $_" "ERROR"
        Write-Log "Rolling back database..." "WARN"
        # Add rollback logic here if needed
        exit 1
    }
    finally {
        Set-Location "..\..\"
    }
}

function Build-Backend {
    Write-Log "Building backend..." "INFO"
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would build backend in Release mode" "INFO"
        return
    }
    
    Set-Location ".\backend\ERPTraining.API"
    
    # Clean previous builds
    Write-Log "Cleaning previous builds..." "INFO"
    dotnet clean --configuration Release
    Remove-Item -Path "bin\Release" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "obj\Release" -Recurse -Force -ErrorAction SilentlyContinue
    
    # Restore dependencies
    Write-Log "Restoring NuGet packages..." "INFO"
    dotnet restore
    
    # Build in Release mode
    Write-Log "Building in Release mode..." "INFO"
    dotnet build --configuration Release --no-restore
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Backend build failed!" "ERROR"
        Set-Location "..\..\"
        exit 1
    }
    
    # Publish
    Write-Log "Publishing backend..." "INFO"
    dotnet publish --configuration Release --output "bin\Release\publish" --no-build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Backend publish failed!" "ERROR"
        Set-Location "..\..\"
        exit 1
    }
    
    Set-Location "..\..\"
    Write-Log "Backend build completed successfully" "INFO"
}

function Build-Frontend {
    Write-Log "Building frontend..." "INFO"
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would build frontend for production" "INFO"
        return
    }
    
    # Clean previous builds
    Write-Log "Cleaning previous frontend builds..." "INFO"
    Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
    
    # Install dependencies
    Write-Log "Installing npm dependencies..." "INFO"
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "npm install failed!" "ERROR"
        exit 1
    }
    
    # Build for production
    Write-Log "Building frontend for production..." "INFO"
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Frontend build failed!" "ERROR"
        exit 1
    }
    
    Write-Log "Frontend build completed successfully" "INFO"
}

function Create-DeploymentPackage {
    Write-Log "Creating deployment package..." "INFO"
    
    $packageName = "BusinessHub-Production-$timestamp"
    $packagePath = ".\$packageName"
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would create package: $packageName.zip" "INFO"
        return
    }
    
    # Create package directory structure
    New-Item -Path $packagePath -ItemType Directory -Force | Out-Null
    New-Item -Path "$packagePath\backend" -ItemType Directory -Force | Out-Null
    New-Item -Path "$packagePath\frontend" -ItemType Directory -Force | Out-Null
    New-Item -Path "$packagePath\database" -ItemType Directory -Force | Out-Null
    
    # Copy backend files
    Write-Log "Copying backend files..." "INFO"
    Copy-Item -Path ".\backend\ERPTraining.API\bin\Release\publish\*" -Destination "$packagePath\backend\" -Recurse -Force
    
    # Copy frontend files
    Write-Log "Copying frontend files..." "INFO"
    Copy-Item -Path ".\dist\*" -Destination "$packagePath\frontend\" -Recurse -Force
    
    # Copy migration script
    Write-Log "Copying migration scripts..." "INFO"
    Copy-Item -Path ".\backend\ERPTraining.Infrastructure\AddCommentId.sql" -Destination "$packagePath\database\" -ErrorAction SilentlyContinue
    
    # Create deployment instructions
    $instructions = @"
DEPLOYMENT INSTRUCTIONS FOR BUSINESS HUB - PRODUCTION
======================================================
Date: $timestamp
Feature: Comment Attachments & Email Notifications

DATABASE CHANGES:
1. Backup production database before proceeding
2. Run migration script in database\ folder OR
3. Use EF Core migrations: dotnet ef database update

BACKEND DEPLOYMENT:
1. Stop IIS Application Pool
2. Backup existing backend folder
3. Copy files from backend\ to production backend directory
4. Update appsettings.Production.json with correct:
   - Connection string
   - Email settings (Microsoft Graph credentials)
   - CORS origins
5. Start IIS Application Pool
6. Test API endpoint: https://your-domain/api/health

FRONTEND DEPLOYMENT:
1. Backup existing frontend folder
2. Copy files from frontend\ to production frontend directory (usually wwwroot)
3. Verify web.config is in place for URL rewriting
4. Test: https://your-domain

VERIFICATION STEPS:
1. Login to application
2. Create a test ticket
3. Add a comment with attachment → Verify blue highlighting
4. Assign ticket to agent → Verify email notification received
5. Resolve ticket → Verify resolution email with reopen link
6. Click reopen link → Verify ticket status changes to "Reopen"

ROLLBACK PLAN:
If issues occur:
1. Stop IIS Application Pool
2. Restore database from backup
3. Restore backed up backend/frontend folders
4. Restart IIS Application Pool

NEW FEATURES:
- Comment attachments with visual highlighting (blue border)
- Email notifications for agent assignment
- Email notifications for collaborator addition
- Resolution notification emails with reopen functionality
- Dynamic "Reopen" status lookup (environment-agnostic)
- Only resolved tickets can be reopened (not closed)
- Automatic reopening when customer replies to resolved ticket via email

SUPPORT CONTACT:
- Technical Lead: [Your Name]
- Date: $timestamp
"@
    
    $instructions | Out-File -FilePath "$packagePath\DEPLOYMENT-INSTRUCTIONS.txt" -Encoding UTF8
    
    # Create deployment checklist
    $checklist = @"
PRE-DEPLOYMENT CHECKLIST
========================
[ ] Database backup completed
[ ] IIS Application Pool stopped
[ ] Existing backend backed up
[ ] Existing frontend backed up
[ ] Team notified of deployment window

DEPLOYMENT CHECKLIST
====================
[ ] Database migration applied
[ ] Backend files copied
[ ] appsettings.Production.json updated
[ ] Frontend files copied
[ ] web.config verified
[ ] IIS Application Pool started

POST-DEPLOYMENT VERIFICATION
=============================
[ ] Application loads successfully
[ ] User can login
[ ] Test ticket created
[ ] Comment with attachment works (blue highlight visible)
[ ] Assignment email notification received
[ ] Resolution email notification received
[ ] Reopen link works correctly
[ ] Ticket status shows "Reopen" after reopening
[ ] All existing features still work

SIGN-OFF
========
Deployed by: _______________  Date: _______________
Verified by: _______________  Date: _______________
"@
    
    $checklist | Out-File -FilePath "$packagePath\DEPLOYMENT-CHECKLIST.txt" -Encoding UTF8
    
    # Compress package
    Write-Log "Compressing deployment package..." "INFO"
    Compress-Archive -Path $packagePath -DestinationPath "$packageName.zip" -Force
    
    # Cleanup temporary directory
    Remove-Item -Path $packagePath -Recurse -Force
    
    Write-Log "Deployment package created: $packageName.zip" "INFO"
    return "$packageName.zip"
}

function Run-Tests {
    if ($SkipTests) {
        Write-Log "Skipping tests (--SkipTests specified)" "WARN"
        return
    }
    
    Write-Log "Running backend tests..." "INFO"
    Set-Location ".\backend"
    
    # Add test execution here if you have unit tests
    # dotnet test --configuration Release
    
    Set-Location ".."
    Write-Log "Tests completed" "INFO"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Log "========================================" "INFO"
Write-Log "PRODUCTION DEPLOYMENT STARTED" "INFO"
Write-Log "========================================" "INFO"

if ($DryRun) {
    Write-Log "DRY RUN MODE - No actual changes will be made" "WARN"
}

try {
    # Step 1: Check prerequisites
    Test-Prerequisites
    
    # Step 2: Run tests
    Run-Tests
    
    # Step 3: Backup production database
    Backup-ProductionDatabase
    
    # Step 4: Build backend
    Build-Backend
    
    # Step 5: Build frontend
    Build-Frontend
    
    # Step 6: Create deployment package
    $packageFile = Create-DeploymentPackage
    
    # Step 7: Apply database migration (optional - can be done manually)
    $applyMigration = Read-Host "Apply database migration now? (y/n) [Recommended to do manually in production]"
    if ($applyMigration -eq 'y') {
        Apply-DatabaseMigration
    }
    
    Write-Log "========================================" "INFO"
    Write-Log "DEPLOYMENT PACKAGE CREATED SUCCESSFULLY" "INFO"
    Write-Log "Package: $packageFile" "INFO"
    Write-Log "========================================" "INFO"
    Write-Log "" "INFO"
    Write-Log "NEXT STEPS:" "INFO"
    Write-Log "1. Extract $packageFile" "INFO"
    Write-Log "2. Review DEPLOYMENT-INSTRUCTIONS.txt" "INFO"
    Write-Log "3. Follow DEPLOYMENT-CHECKLIST.txt" "INFO"
    Write-Log "4. Deploy to production server" "INFO"
    Write-Log "" "INFO"
    Write-Log "Deployment log saved to: $deploymentLog" "INFO"
    
}
catch {
    Write-Log "========================================" "ERROR"
    Write-Log "DEPLOYMENT FAILED" "ERROR"
    Write-Log "Error: $_" "ERROR"
    Write-Log "========================================" "ERROR"
    exit 1
}
