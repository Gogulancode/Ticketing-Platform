@echo off
REM ========================================
REM HOSTBUDDY STAGING BUILD SCRIPT
REM Includes Authentication Security Fixes
REM Date: October 15, 2025
REM Commit: 6485f6d
REM ========================================

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   HOSTBUDDY STAGING BUILD - Authentication Security Fix   ║
echo ║   Commit: 6485f6d                                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Configuration
set STAGING_URL=https://support.solutionsnextwave.com/support-staging
set BUILD_DIR=staging-build-hostbuddy
set BACKEND_DIR=%BUILD_DIR%\backend
set FRONTEND_DIR=%BUILD_DIR%\frontend
set STAGING_DB=sql8020.site4now.net

echo [1/8] Cleaning previous build...
echo ----------------------------------------
if exist "%BUILD_DIR%" (
    echo Removing old build directory...
    rmdir /s /q "%BUILD_DIR%"
)
mkdir "%BUILD_DIR%"
mkdir "%BACKEND_DIR%"
mkdir "%FRONTEND_DIR%"
echo ✓ Build directory created
echo.

echo [2/8] Building Frontend for STAGING...
echo ----------------------------------------
echo Environment: STAGING
echo API URL: %STAGING_URL%
echo.

REM Set environment variable for frontend build
set VITE_API_BASE_URL=%STAGING_URL%/api

echo Running npm build...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Frontend build failed!
    echo Check npm output above for errors
    pause
    exit /b 1
)
echo ✓ Frontend build completed
echo.

echo [3/8] Copying Frontend build...
echo ----------------------------------------
xcopy /s /e /y /i "dist\*" "%FRONTEND_DIR%\"
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to copy frontend files!
    pause
    exit /b 1
)
echo ✓ Frontend files copied to %FRONTEND_DIR%
echo.

echo [4/8] Building Backend for STAGING...
echo ----------------------------------------
cd backend\ERPTraining.API

echo Publishing .NET application in Release mode...
dotnet publish -c Release -o "..\..\%BACKEND_DIR%" /p:EnvironmentName=Staging
if %errorlevel% neq 0 (
    cd ..\..
    echo.
    echo ❌ ERROR: Backend build failed!
    echo Check dotnet output above for errors
    pause
    exit /b 1
)

cd ..\..
echo ✓ Backend build completed
echo.

echo [5/8] Configuring Staging Settings...
echo ----------------------------------------

REM Copy staging configuration
echo Copying appsettings.Staging.json...
copy /y "backend\ERPTraining.API\appsettings.Staging.json" "%BACKEND_DIR%\appsettings.json"
if %errorlevel% neq 0 (
    echo ❌ WARNING: Failed to copy staging config
)

REM Copy additional staging files if they exist
if exist "appsettings.staging.json" (
    copy /y "appsettings.staging.json" "%BACKEND_DIR%\appsettings.staging.json"
)

echo ✓ Configuration files copied
echo.

echo [6/8] Creating IIS web.config...
echo ----------------------------------------
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<configuration^>
echo   ^<location path="." inheritInChildApplications="false"^>
echo     ^<system.webServer^>
echo       ^<handlers^>
echo         ^<add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" /^>
echo       ^</handlers^>
echo       ^<aspNetCore processPath="dotnet" arguments=".\ERPTraining.API.dll" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess"^>
echo         ^<environmentVariables^>
echo           ^<environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Staging" /^>
echo         ^</environmentVariables^>
echo       ^</aspNetCore^>
echo       ^<httpErrors errorMode="Detailed" /^>
echo       ^<security^>
echo         ^<requestFiltering^>
echo           ^<requestLimits maxAllowedContentLength="104857600" /^> ^<!-- 100MB --^>
echo         ^</requestFiltering^>
echo       ^</security^>
echo     ^</system.webServer^>
echo   ^</location^>
echo ^</configuration^>
) > "%BACKEND_DIR%\web.config"

echo ✓ web.config created
echo.

echo [7/8] Creating Deployment Documentation...
echo ----------------------------------------

REM Create deployment readme
(
echo # HOSTBUDDY STAGING DEPLOYMENT
echo.
echo **Build Date:** %date% %time%
echo **Commit:** 6485f6d
echo **Environment:** STAGING
echo **Authentication Fix:** ✓ INCLUDED
echo.
echo ## Deployment Checklist
echo.
echo ### Pre-Deployment
echo - [ ] Backup current staging database
echo - [ ] Note current staging version
echo - [ ] Verify HostBuddy hosting credentials
echo.
echo ### Database Setup
echo.
echo **IMPORTANT:** Run this SQL script on staging database:
echo.
echo ```sql
echo USE db_aae2b0_solutionsnext;
echo GO
echo.
echo -- Create Admin role if not exists
echo IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE Name = 'Admin'^)
echo BEGIN
echo     INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp^)
echo     VALUES (NEWID(^), 'Admin', 'ADMIN', NEWID(^)^);
echo END;
echo GO
echo.
echo -- Assign Admin role to your staging user
echo DECLARE @AdminEmail NVARCHAR(256^) = 'YOUR-ADMIN@EMAIL.COM'; -- ⚠️ CHANGE THIS!
echo DECLARE @UserId NVARCHAR(450^);
echo DECLARE @RoleId NVARCHAR(450^);
echo.
echo SELECT @UserId = Id FROM AspNetUsers WHERE Email = @AdminEmail;
echo SELECT @RoleId = Id FROM AspNetRoles WHERE Name = 'Admin';
echo.
echo IF @UserId IS NOT NULL AND NOT EXISTS (
echo     SELECT 1 FROM AspNetUserRoles WHERE UserId = @UserId AND RoleId = @RoleId
echo ^)
echo BEGIN
echo     INSERT INTO AspNetUserRoles (UserId, RoleId^) VALUES (@UserId, @RoleId^);
echo     PRINT '✓ Admin role assigned';
echo END;
echo.
echo -- Verify
echo SELECT u.Email, STRING_AGG(r.Name, ', '^) AS Roles
echo FROM AspNetUsers u
echo INNER JOIN AspNetUserRoles ur ON u.Id = ur.UserId
echo INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
echo WHERE u.Email = @AdminEmail
echo GROUP BY u.Email;
echo ```
echo.
echo ### HostBuddy Deployment Steps
echo.
echo 1. **Login to HostBuddy Control Panel**
echo    - URL: https://cp.hostbuddy.com
echo    - Navigate to your staging site
echo.
echo 2. **Backup Current Files**
echo    - Download current backend folder
echo    - Download current frontend folder
echo.
echo 3. **Upload Backend Files**
echo    - Upload contents of `backend\` folder to staging backend directory
echo    - Ensure web.config is uploaded
echo    - Verify appsettings.json is present
echo.
echo 4. **Upload Frontend Files**
echo    - Upload contents of `frontend\` folder to staging frontend directory
echo    - Ensure index.html is at the root
echo.
echo 5. **Configure IIS on HostBuddy**
echo    - Ensure .NET 8.0 runtime is installed
echo    - Set application pool to "No Managed Code"
echo    - Enable "Load User Profile" in application pool
echo    - Set "Start Mode" to "AlwaysRunning"
echo.
echo 6. **Update Database Connection**
echo    - Server: sql8020.site4now.net
echo    - Database: db_aae2b0_solutionsnext
echo    - Connection string in appsettings.json
echo.
echo 7. **Run Database Script**
echo    - Connect to SQL Server using SSMS or Azure Data Studio
echo    - Run the Admin role assignment script above
echo    - Update @AdminEmail variable with your staging admin
echo.
echo 8. **Restart Application**
echo    - Restart IIS application pool
echo    - Wait 30 seconds for application to initialize
echo.
echo 9. **Test Authentication**
echo    - Visit: http://support.solutionsnextwave.com/support-staging
echo    - Login with admin credentials
echo    - Verify you see "Admin View - All Departments" banner
echo    - Test creating a ticket
echo.
echo ### Post-Deployment Verification
echo.
echo Run these PowerShell commands to verify:
echo.
echo ```powershell
echo # Test login endpoint
echo $body = @{userName="admin@yourdomain.com"; password="YourPassword"} ^| ConvertTo-Json
echo Invoke-RestMethod -Uri "http://support.solutionsnextwave.com/support-staging/api/auth/login" -Method POST -ContentType "application/json" -Body $body
echo.
echo # Test protected endpoint requires auth (should return 401^)
echo try { Invoke-RestMethod -Uri "http://support.solutionsnextwave.com/support-staging/api/tickets" } catch { Write-Host "✓ Properly secured" }
echo ```
echo.
echo ### Configuration Details
echo.
echo **Database:**
echo - Server: sql8020.site4now.net
echo - Database: db_aae2b0_solutionsnext
echo - User: db_aae2b0_solutionsnext_admin
echo.
echo **JWT Settings:**
echo - Key: (Configured in appsettings.json^)
echo - Issuer: ERPTrainingAPI-Staging
echo - Audience: ERPTrainingUsers-Staging
echo - Expiry: 24 hours
echo.
echo **CORS:**
echo - Allowed Origin: http://support.solutionsnextwave.com/support-staging
echo.
echo ### Rollback Plan
echo.
echo If issues occur:
echo 1. Restore backed up files from HostBuddy control panel
echo 2. Restart application pool
echo 3. No database rollback needed (only role assignment, safe to keep^)
echo.
echo ### Support
echo.
echo - Detailed docs: STAGING_DEPLOYMENT_AUTH_FIX.md
echo - Quick reference: STAGING_QUICK_REFERENCE.md
echo - Contact: Gogulan@moojic.com
echo.
echo ### Security Notes
echo.
echo ✅ **Authentication Fixed:**
echo - All ticket endpoints now require JWT authentication
echo - Admin access preserved with role-based filtering
echo - No anonymous access vulnerabilities
echo - Proper logging implemented
echo.
echo 🔒 **Database Changes:**
echo - NO schema changes required
echo - Only user role assignment (runtime data^)
echo - Safe to deploy without migrations
echo.
echo ### Build Information
echo.
echo - Branch: recovery/restore-training-ticketing
echo - Commits included:
echo   - 5cc1dae: Authentication security fixes
echo   - 6485f6d: Deployment documentation
echo.
) > "%BUILD_DIR%\DEPLOYMENT_README.md"

echo ✓ Deployment documentation created
echo.

echo [8/8] Creating Staging Database Script...
echo ----------------------------------------

REM Create SQL script for staging deployment
(
echo -- ========================================
echo -- HOSTBUDDY STAGING - Admin Role Setup
echo -- Server: sql8020.site4now.net
echo -- Database: db_aae2b0_solutionsnext
echo -- Date: %date%
echo -- ========================================
echo.
echo USE db_aae2b0_solutionsnext;
echo GO
echo.
echo PRINT 'Starting Admin role assignment...';
echo PRINT '';
echo.
echo -- Step 1: Create Admin role if not exists
echo IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE Name = 'Admin'^)
echo BEGIN
echo     INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp^)
echo     VALUES (NEWID(^), 'Admin', 'ADMIN', NEWID(^)^);
echo     PRINT '✓ Admin role created';
echo END
echo ELSE
echo BEGIN
echo     PRINT '✓ Admin role already exists';
echo END;
echo GO
echo.
echo -- Step 2: List available users (to help identify admin^)
echo PRINT '';
echo PRINT '=== Available Users ===';
echo SELECT Id, Email, UserName, FirstName, LastName, Department, IsActive
echo FROM AspNetUsers
echo WHERE IsActive = 1
echo ORDER BY Email;
echo GO
echo.
echo -- Step 3: Assign Admin role to user
echo -- ⚠️ UPDATE @AdminEmail with your staging admin email!
echo DECLARE @AdminEmail NVARCHAR(256^) = 'admin@babajishivram.com'; -- ⚠️ CHANGE THIS!
echo DECLARE @UserId NVARCHAR(450^);
echo DECLARE @RoleId NVARCHAR(450^);
echo.
echo -- Find user
echo SELECT @UserId = Id FROM AspNetUsers 
echo WHERE Email = @AdminEmail OR UserName = @AdminEmail;
echo.
echo IF @UserId IS NULL
echo BEGIN
echo     PRINT '❌ ERROR: User not found with email: ' + @AdminEmail;
echo     PRINT '⚠️  Please update @AdminEmail variable with correct staging user';
echo     PRINT '';
echo END
echo ELSE
echo BEGIN
echo     -- Get Admin role ID
echo     SELECT @RoleId = Id FROM AspNetRoles WHERE Name = 'Admin';
echo     
echo     -- Check if already assigned
echo     IF NOT EXISTS (
echo         SELECT 1 FROM AspNetUserRoles 
echo         WHERE UserId = @UserId AND RoleId = @RoleId
echo     ^)
echo     BEGIN
echo         INSERT INTO AspNetUserRoles (UserId, RoleId^)
echo         VALUES (@UserId, @RoleId^);
echo         PRINT '✓ Admin role assigned to: ' + @AdminEmail;
echo     END
echo     ELSE
echo     BEGIN
echo         PRINT '✓ User already has Admin role: ' + @AdminEmail;
echo     END;
echo     
echo     PRINT '';
echo     PRINT '=== Role Assignment Verification ===';
echo     
echo     -- Verify assignment
echo     SELECT 
echo         u.Id,
echo         u.Email,
echo         u.UserName,
echo         u.FirstName,
echo         u.LastName,
echo         u.Department,
echo         STRING_AGG(r.Name, ', '^) AS Roles
echo     FROM AspNetUsers u
echo     INNER JOIN AspNetUserRoles ur ON u.Id = ur.UserId
echo     INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
echo     WHERE u.Id = @UserId
echo     GROUP BY u.Id, u.Email, u.UserName, u.FirstName, u.LastName, u.Department;
echo END;
echo GO
echo.
echo PRINT '';
echo PRINT '========================================';
echo PRINT 'Admin role assignment complete!';
echo PRINT '========================================';
echo PRINT '';
echo PRINT 'Next Steps:';
echo PRINT '1. Verify user has Admin role above';
echo PRINT '2. Deploy backend and frontend files to HostBuddy';
echo PRINT '3. Restart IIS application pool';
echo PRINT '4. Test login at: http://support.solutionsnextwave.com/support-staging';
echo PRINT '5. Verify admin dashboard shows all departments';
echo GO
) > "%BUILD_DIR%\staging-database-setup.sql"

echo ✓ Database setup script created
echo.

REM Create a quick deployment checklist
(
echo ╔════════════════════════════════════════════════════════════╗
echo ║          HOSTBUDDY STAGING DEPLOYMENT CHECKLIST           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo PRE-DEPLOYMENT:
echo   [ ] Backup current staging files from HostBuddy
echo   [ ] Backup staging database (if needed^)
echo   [ ] Review DEPLOYMENT_README.md
echo   [ ] Update staging-database-setup.sql with admin email
echo.
echo DEPLOYMENT:
echo   [ ] Run staging-database-setup.sql on sql8020.site4now.net
echo   [ ] Upload backend\ folder to HostBuddy staging backend directory
echo   [ ] Upload frontend\ folder to HostBuddy staging frontend directory
echo   [ ] Verify web.config is present in backend
echo   [ ] Verify appsettings.json is present in backend
echo   [ ] Restart IIS application pool in HostBuddy control panel
echo.
echo POST-DEPLOYMENT TESTING:
echo   [ ] Visit http://support.solutionsnextwave.com/support-staging
echo   [ ] Login with admin credentials
echo   [ ] Verify "Admin View - All Departments" banner displays
echo   [ ] Test creating a ticket
echo   [ ] Test adding comments
echo   [ ] Test ticket statistics
echo   [ ] Test protected endpoints return 401 without auth
echo   [ ] Verify JWT tokens are generated correctly
echo.
echo CONFIGURATION VERIFIED:
echo   [ ] Database: sql8020.site4now.net / db_aae2b0_solutionsnext
echo   [ ] JWT settings in appsettings.json
echo   [ ] CORS allows staging URL
echo   [ ] .NET 8.0 runtime on HostBuddy
echo   [ ] Application pool configured correctly
echo.
echo DOCUMENTATION:
echo   [ ] Read: DEPLOYMENT_README.md
echo   [ ] Read: STAGING_DEPLOYMENT_AUTH_FIX.md (full guide^)
echo   [ ] Read: STAGING_QUICK_REFERENCE.md (quick reference^)
echo.
echo CONTACTS:
echo   HostBuddy Support: support@hostbuddy.com
echo   Database: sql8020.site4now.net
echo   Developer: Gogulan@moojic.com
echo.
) > "%BUILD_DIR%\DEPLOYMENT_CHECKLIST.txt"

echo ✓ Deployment checklist created
echo.

REM Create file list for verification
echo Creating file inventory...
echo.
echo === BACKEND FILES === > "%BUILD_DIR%\FILE_INVENTORY.txt"
dir /b /s "%BACKEND_DIR%" >> "%BUILD_DIR%\FILE_INVENTORY.txt"
echo. >> "%BUILD_DIR%\FILE_INVENTORY.txt"
echo === FRONTEND FILES === >> "%BUILD_DIR%\FILE_INVENTORY.txt"
dir /b /s "%FRONTEND_DIR%" >> "%BUILD_DIR%\FILE_INVENTORY.txt"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              BUILD COMPLETED SUCCESSFULLY! ✓               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📁 Build Location: %BUILD_DIR%\
echo.
echo 📦 Contents:
echo    ├─ backend\                 (API + DLLs + Configuration^)
echo    ├─ frontend\                (Static web files^)
echo    ├─ DEPLOYMENT_README.md     (Full deployment guide^)
echo    ├─ DEPLOYMENT_CHECKLIST.txt (Quick checklist^)
echo    ├─ staging-database-setup.sql (Database script^)
echo    └─ FILE_INVENTORY.txt       (All files list^)
echo.
echo 🎯 Next Steps:
echo    1. Read DEPLOYMENT_README.md for detailed instructions
echo    2. Update staging-database-setup.sql with admin email (line 32^)
echo    3. Run SQL script on sql8020.site4now.net
echo    4. Upload backend\ to HostBuddy staging backend directory
echo    5. Upload frontend\ to HostBuddy staging frontend directory
echo    6. Restart IIS application pool
echo    7. Test at: http://support.solutionsnextwave.com/support-staging
echo.
echo 🔒 Security: Authentication fixes included ✓
echo 📚 Documentation: See STAGING_DEPLOYMENT_AUTH_FIX.md
echo.
echo ════════════════════════════════════════════════════════════════
echo Ready for deployment to HostBuddy staging server!
echo ════════════════════════════════════════════════════════════════
echo.
pause
