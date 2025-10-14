# Staging Deployment - Quick Reference Card

**Date:** October 15, 2025  
**Commit:** `5cc1dae` - Authentication Security Fix

---

## ⚡ TL;DR

### Database Changes: ✅ NONE

**NO Entity Framework migrations required!**

### What You Need to Do:

1. **Deploy code** (backend + frontend)
2. **Update JWT key** in `appsettings.json` (staging-specific)
3. **Run ONE SQL script** to assign Admin role to your staging admin user
4. **Restart services**
5. **Test login**

**Total Time:** ~10 minutes  
**Downtime:** ~5 minutes  
**Risk:** LOW (no schema changes)

---

## 📝 Copy-Paste SQL Script

**⚠️ UPDATE LINE 12 WITH YOUR STAGING ADMIN EMAIL!**

```sql
USE ERPTrainingDB_Staging;  -- Adjust if needed
GO

-- Create Admin role if not exists
IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE Name = 'Admin')
BEGIN
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (NEWID(), 'Admin', 'ADMIN', NEWID());
END;
GO

DECLARE @StagingAdminEmail NVARCHAR(256) = 'YOUR-ADMIN@EMAIL.COM'; -- ⚠️ CHANGE THIS!
DECLARE @UserId NVARCHAR(450);
DECLARE @RoleId NVARCHAR(450);

SELECT @UserId = Id FROM AspNetUsers 
WHERE Email = @StagingAdminEmail OR UserName = @StagingAdminEmail;

SELECT @RoleId = Id FROM AspNetRoles WHERE Name = 'Admin';

IF @UserId IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM AspNetUserRoles WHERE UserId = @UserId AND RoleId = @RoleId
)
BEGIN
    INSERT INTO AspNetUserRoles (UserId, RoleId) VALUES (@UserId, @RoleId);
    PRINT '✓ Admin role assigned';
END;

-- Verify
SELECT u.Email, u.UserName, STRING_AGG(r.Name, ', ') AS Roles
FROM AspNetUsers u
INNER JOIN AspNetUserRoles ur ON u.Id = ur.UserId
INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE u.Id = @UserId
GROUP BY u.Email, u.UserName;
```

---

## 🔧 Configuration Changes

### appsettings.json (Backend)

```json
{
  "Jwt": {
    "Key": "YOUR-UNIQUE-STAGING-JWT-KEY-256-BITS-MIN",  // ⚠️ CHANGE THIS!
    "Issuer": "ERPTrainingAPI-Staging",
    "Audience": "ERPTrainingUsers-Staging",
    "ExpiryInHours": 24
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_STAGING_SERVER;Database=ERPTrainingDB_Staging;..."
  },
  "Cors": {
    "AllowedOrigins": ["https://staging.yourdomain.com"]  // ⚠️ UPDATE!
  }
}
```

### Frontend Config

Update API base URL to point to staging API:
- `.env.production` or Vite config
- Change `http://localhost:5015` → `https://staging-api.yourdomain.com`

---

## ✅ Testing Commands

### 1. Test Login Works
```powershell
$body = @{
    userName = "admin@yourdomain.com"
    password = "YourPassword"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://staging/api/auth/login" -Method POST -ContentType "application/json" -Body $body
```

### 2. Test Authentication Required (Should Fail with 401)
```powershell
try {
    Invoke-RestMethod -Uri "https://staging/api/tickets"
} catch {
    Write-Host "✓ Returns 401 - Authentication working!" -ForegroundColor Green
}
```

### 3. Test Admin Dashboard
1. Login to staging frontend
2. Look for purple banner: **"Admin View - All Departments"**
3. Verify you can see all tickets (not just your department)

---

## 🚨 Important Reminders

### ✅ DO:
- Change JWT key for staging (different from dev)
- Update CORS to staging domain
- Run SQL script to assign admin role
- Test login after deployment
- Verify 401 on protected endpoints

### ❌ DON'T:
- Run `dotnet ef database update` (not needed!)
- Copy dev JWT key to staging (security risk)
- Skip testing authentication after deployment
- Forget to update frontend API URL

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 on login | Check JWT key in appsettings.json |
| CORS error | Add staging URL to CORS allowed origins |
| Not seeing admin view | Re-run SQL script to assign Admin role |
| Old login screen | Clear browser cache (Ctrl+Shift+R) |

---

## 📊 What This Deployment Does

### Backend Changes:
✅ Secures 7 ticket endpoints with JWT authentication  
✅ Removes anonymous access vulnerabilities  
✅ Adds proper logging (ILogger)  
✅ Fixes security holes (fallback user removed)

### Frontend Changes:
✅ Fixes token storage (no more fake tokens)  
✅ Uses correct JWT-based login component  
✅ Properly validates user authentication  
✅ Calls API with Authorization header

### Database Changes:
✅ **ONLY:** Assigns Admin role to one user  
❌ **NO:** Schema changes, migrations, new tables, or columns

---

## 📞 Need Help?

Full documentation: `STAGING_DEPLOYMENT_AUTH_FIX.md`  
Contact: Gogulan@moojic.com

---

**Status:** ✅ READY FOR STAGING  
**Risk:** 🟢 LOW (no schema changes)  
**Estimated Time:** ⏱️ 10 minutes
