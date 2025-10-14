# Staging Deployment Guide - Authentication Security Fix

**Date:** October 15, 2025  
**Commit:** `5cc1dae`  
**Branch:** `recovery/restore-training-ticketing`

---

## 📋 Overview

This deployment includes **NO DATABASE SCHEMA CHANGES**. Only user role assignments need to be performed in staging.

### ✅ What Changed
- Backend: JWT authentication enforcement on ticket endpoints
- Frontend: Fixed token storage and login flow
- User Management: Admin role assignment (runtime data, not schema)

### ❌ What Did NOT Change
- No Entity Framework migrations
- No table schema changes
- No new columns or indexes
- No stored procedures modified

---

## 🗄️ Database Changes Required

### Option 1: SQL Script (Recommended)

Run this script on **STAGING database** to ensure admin user exists and has correct roles:

```sql
-- ==============================================
-- STAGING DEPLOYMENT - Admin Role Assignment
-- Run this on: ERPTrainingDB_Staging
-- Date: October 15, 2025
-- ==============================================

USE ERPTrainingDB_Staging;  -- Adjust database name for staging
GO

-- Step 1: Verify Admin role exists (create if missing)
IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE Name = 'Admin')
BEGIN
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (NEWID(), 'Admin', 'ADMIN', NEWID());
    PRINT '✓ Admin role created in staging';
END
ELSE
BEGIN
    PRINT '✓ Admin role already exists in staging';
END;
GO

-- Step 2: Identify your staging admin user (UPDATE THIS!)
-- Replace with YOUR staging admin user email
DECLARE @StagingAdminEmail NVARCHAR(256) = 'admin@yourdomain.com'; -- ⚠️ CHANGE THIS!
DECLARE @UserId NVARCHAR(450);
DECLARE @RoleId NVARCHAR(450);

-- Find user by email
SELECT @UserId = Id 
FROM AspNetUsers 
WHERE Email = @StagingAdminEmail OR UserName = @StagingAdminEmail;

IF @UserId IS NULL
BEGIN
    PRINT '❌ ERROR: User not found with email: ' + @StagingAdminEmail;
    PRINT '⚠️  Please update @StagingAdminEmail variable with correct staging user email';
    PRINT '   Run this query to see available users:';
    PRINT '   SELECT Id, Email, UserName, FirstName, LastName FROM AspNetUsers';
END
ELSE
BEGIN
    -- Get Admin role ID
    SELECT @RoleId = Id FROM AspNetRoles WHERE Name = 'Admin';

    -- Assign Admin role if not already assigned
    IF NOT EXISTS (
        SELECT 1 FROM AspNetUserRoles 
        WHERE UserId = @UserId AND RoleId = @RoleId
    )
    BEGIN
        INSERT INTO AspNetUserRoles (UserId, RoleId)
        VALUES (@UserId, @RoleId);
        PRINT '✓ Admin role assigned to: ' + @StagingAdminEmail;
    END
    ELSE
    BEGIN
        PRINT '✓ User already has Admin role: ' + @StagingAdminEmail;
    END;

    -- Verify role assignment
    SELECT 
        u.Id,
        u.Email,
        u.UserName,
        u.FirstName,
        u.LastName,
        STRING_AGG(r.Name, ', ') AS Roles
    FROM AspNetUsers u
    INNER JOIN AspNetUserRoles ur ON u.Id = ur.UserId
    INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
    WHERE u.Id = @UserId
    GROUP BY u.Id, u.Email, u.UserName, u.FirstName, u.LastName;
END;
GO

PRINT '========================================';
PRINT 'Staging admin role assignment complete!';
PRINT '========================================';
```

### Option 2: PowerShell Script

```powershell
# Run this on staging server after deployment

$serverInstance = "YOUR_STAGING_SERVER\INSTANCE"  # ⚠️ UPDATE THIS
$database = "ERPTrainingDB_Staging"               # ⚠️ UPDATE THIS
$adminEmail = "admin@yourdomain.com"              # ⚠️ UPDATE THIS

$query = @"
-- Create Admin role if not exists
IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE Name = 'Admin')
BEGIN
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (NEWID(), 'Admin', 'ADMIN', NEWID());
END;

-- Assign Admin role to user
DECLARE @UserId NVARCHAR(450);
DECLARE @RoleId NVARCHAR(450);

SELECT @UserId = Id FROM AspNetUsers WHERE Email = '$adminEmail' OR UserName = '$adminEmail';
SELECT @RoleId = Id FROM AspNetRoles WHERE Name = 'Admin';

IF @UserId IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM AspNetUserRoles WHERE UserId = @UserId AND RoleId = @RoleId
)
BEGIN
    INSERT INTO AspNetUserRoles (UserId, RoleId) VALUES (@UserId, @RoleId);
END;

-- Verify
SELECT u.Email, u.UserName, STRING_AGG(r.Name, ', ') AS Roles
FROM AspNetUsers u
INNER JOIN AspNetUserRoles ur ON u.Id = ur.UserId
INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE u.Email = '$adminEmail' OR u.UserName = '$adminEmail'
GROUP BY u.Email, u.UserName;
"@

Invoke-Sqlcmd -ServerInstance $serverInstance -Database $database -Query $query
```

---

## 🔍 Pre-Deployment Checklist

### 1. Identify Staging Admin User

Run this query on **staging database** to find who should be admin:

```sql
-- List all users in staging
SELECT 
    Id, 
    Email, 
    UserName, 
    FirstName, 
    LastName,
    Department,
    IsActive
FROM AspNetUsers
WHERE IsActive = 1
ORDER BY Email;
```

**Action Required:**  
✏️ Update the SQL script above with the correct admin user email

### 2. Check Existing Roles

```sql
-- Check current roles in staging
SELECT 
    r.Name AS RoleName,
    COUNT(ur.UserId) AS UserCount
FROM AspNetRoles r
LEFT JOIN AspNetUserRoles ur ON r.Id = ur.RoleId
GROUP BY r.Name
ORDER BY r.Name;
```

### 3. Verify Authentication Configuration

Ensure staging `appsettings.json` has correct JWT settings:

```json
{
  "Jwt": {
    "Key": "your-staging-jwt-key-minimum-256-bits-DIFFERENT-FROM-DEV",
    "Issuer": "ERPTrainingAPI-Staging",
    "Audience": "ERPTrainingUsers-Staging",
    "ExpiryInHours": 24
  }
}
```

⚠️ **IMPORTANT:** Staging JWT key should be DIFFERENT from development!

---

## 🚀 Deployment Steps

### Step 1: Deploy Code
```bash
# Pull latest code on staging server
git pull origin recovery/restore-training-ticketing

# Build backend
cd backend/ERPTraining.API
dotnet publish -c Release -o /path/to/staging/publish

# Build frontend
cd ../../
npm install
npm run build
```

### Step 2: Update Configuration

**Backend (`appsettings.json`):**
- Update JWT:Key to staging-specific key
- Verify ConnectionStrings point to staging database
- Check CORS allows staging frontend URL

**Frontend (`.env.production` or Vite config):**
- Update API base URL to staging API endpoint
- Verify CORS configuration

### Step 3: Run Database Script

Execute the SQL script from Option 1 above on **staging database**.

### Step 4: Restart Services

```bash
# Restart backend API
systemctl restart your-api-service  # Linux
# OR
iisreset  # Windows IIS

# Clear browser cache and test
```

---

## ✅ Post-Deployment Testing

### 1. Test Authentication Flow

```powershell
# Test login endpoint (staging URL)
$body = @{
    userName = "admin@yourdomain.com"
    password = "YourPassword"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "https://staging.yourdomain.com/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "Token received: $($response.token.Substring(0, 20))..."
```

### 2. Test Protected Endpoints

```powershell
# Test tickets endpoint requires authentication
try {
    Invoke-RestMethod -Uri "https://staging.yourdomain.com/api/tickets"
    Write-Host "❌ FAIL: Should return 401" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ PASS: Returns 401 without token" -ForegroundColor Green
    }
}

# Test with token
$token = $response.token
$headers = @{ "Authorization" = "Bearer $token" }
$tickets = Invoke-RestMethod `
    -Uri "https://staging.yourdomain.com/api/tickets" `
    -Headers $headers

Write-Host "✓ PASS: Authenticated request succeeded" -ForegroundColor Green
Write-Host "Tickets returned: $($tickets.Count)"
```

### 3. Test Admin Dashboard

1. Login to staging frontend: `https://staging.yourdomain.com`
2. Verify you see: **"Admin View - All Departments"** purple banner
3. Check you can view all tickets (not filtered by department)
4. Try creating a ticket
5. Try viewing ticket statistics

### 4. Test Regular User Access

1. Login as non-admin user
2. Verify you see: **"Department View - [Department Name]"**
3. Confirm tickets are filtered to your department only
4. Verify "My Tickets" shows only your created tickets

---

## 🔒 Security Verification

### Required Checks:

- [ ] All ticket endpoints return 401 without JWT token
- [ ] Login endpoint is public (no 401)
- [ ] Register endpoint is public (no 401)
- [ ] `/api/auth/me` requires JWT token
- [ ] Admin user can see all departments
- [ ] Regular users see only their department
- [ ] JWT tokens expire after 24 hours
- [ ] CORS only allows staging frontend domain

### Security Commands:

```powershell
# Test all endpoints without token (should all return 401)
$endpoints = @(
    "/api/tickets",
    "/api/tickets/my",
    "/api/tickets/statistics",
    "/api/auth/me"
)

foreach ($endpoint in $endpoints) {
    try {
        Invoke-RestMethod -Uri "https://staging.yourdomain.com$endpoint"
        Write-Host "❌ $endpoint - Should require auth!" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "✓ $endpoint - Properly secured" -ForegroundColor Green
        }
    }
}
```

---

## 📊 Comparison: Dev vs Staging

| Aspect | Development | Staging | Action Required |
|--------|-------------|---------|-----------------|
| **Database Name** | ERPTrainingDB | ERPTrainingDB_Staging | ✅ Verify connection string |
| **JWT Key** | Dev key | Different key | ⚠️ **MUST CHANGE** |
| **Admin User** | Gogulan@moojic.com | Your staging user | ⚠️ **RUN SQL SCRIPT** |
| **Schema Changes** | None | None | ✅ No migrations needed |
| **CORS Origins** | localhost:5178 | staging.yourdomain.com | ⚠️ Update config |
| **API URL** | localhost:5015 | staging.yourdomain.com | ⚠️ Update frontend |

---

## ⚠️ Important Notes

### NO MIGRATIONS REQUIRED ✅

This deployment **DOES NOT** include any Entity Framework migrations. The authentication changes are:
- Code-level security (attributes, JWT validation)
- Configuration changes (JWT settings)
- Runtime data (user role assignments)

**You do NOT need to run:**
```bash
# ❌ NOT NEEDED for this deployment
dotnet ef database update
```

### Only User Role Assignment Needed

The only database change is assigning the **Admin role** to your staging admin user. This is:
- Runtime data modification (AspNetUserRoles table)
- Not a schema change
- Safe to run multiple times (idempotent)

### Configuration Files

Ensure these files are updated for staging:
- ✅ `appsettings.json` - JWT key, connection string, CORS
- ✅ Frontend environment config - API base URL
- ✅ `web.config` (if using IIS) - Environment variables

---

## 🆘 Rollback Plan

If issues occur, rollback is simple since there are NO database schema changes:

### 1. Rollback Code
```bash
# Checkout previous commit
git checkout <previous-commit-hash>

# Rebuild and redeploy
dotnet publish -c Release
npm run build
```

### 2. Rollback Database (Only if needed)
```sql
-- Remove Admin role assignment (if needed)
DELETE FROM AspNetUserRoles 
WHERE UserId = 'your-user-id' 
  AND RoleId IN (SELECT Id FROM AspNetRoles WHERE Name = 'Admin');
```

**Note:** This rollback is typically **not necessary** as the code handles missing admin roles gracefully.

---

## 📞 Support & Troubleshooting

### Common Issues:

**Issue:** "401 Unauthorized" on login
- **Cause:** JWT key mismatch or not configured
- **Fix:** Check `appsettings.json` JWT section

**Issue:** Admin dashboard not showing all departments
- **Cause:** Admin role not assigned
- **Fix:** Re-run SQL script from Step 3

**Issue:** Frontend showing old login screen
- **Cause:** Browser cache
- **Fix:** Hard refresh (Ctrl+Shift+R) or clear cache

**Issue:** CORS errors
- **Cause:** Staging URL not in CORS allowed origins
- **Fix:** Update CORS configuration in `Program.cs`

---

## ✅ Deployment Complete Checklist

- [ ] Code deployed to staging server
- [ ] `appsettings.json` updated with staging JWT key
- [ ] Connection string points to staging database
- [ ] SQL script executed to assign admin role
- [ ] Admin user verified in staging database
- [ ] API service restarted
- [ ] Frontend built and deployed
- [ ] Login tested successfully
- [ ] Protected endpoints require authentication (401 test passed)
- [ ] Admin dashboard shows "Admin View - All Departments"
- [ ] Regular user sees filtered department view
- [ ] Ticket creation works
- [ ] Comments/attachments work
- [ ] Statistics display correctly

---

**Deployment Status:** Ready for staging  
**Risk Level:** Low (no schema changes, only code security + role assignment)  
**Estimated Downtime:** ~5 minutes (service restart)  
**Rollback Complexity:** Low (simple code revert, no database rollback needed)

---

**Questions?** Contact: Gogulan@moojic.com
