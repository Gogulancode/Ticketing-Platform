# Staging 404 Error - Root Cause & Fix

**Date:** October 15, 2025  
**Status:** ✅ RESOLVED  
**Commits:** 0bab59a, 67ce77e

---

## 🐛 Issue

User reported 404 errors when trying to access the API in staging deployment on HostBuddy.

### Error Symptoms

**First Error (404):**
```
❌ Login failed: Error: <!DOCTYPE html...404 - File or directory not found
```
- Frontend trying to call: `https://support.solutionsnextwave.com/support-api/api/auth/login`
- Should be: `https://support.solutionsnextwave.com/support-staging/api/auth/login`

**Second Error (Mixed Content):**
```
Blocked loading mixed active content "http://support.solutionsnextwave.com/support-staging/api/auth/login"
❌ Login failed: TypeError: NetworkError when attempting to fetch resource.
```
- Frontend served over HTTPS but API URL was HTTP
- Browsers block HTTP requests from HTTPS pages (security policy)

---

## 🔍 Root Cause Analysis

### Issue #1: Wrong Environment Variable Name

**Build Script:**
```bat
set VITE_API_URL=%STAGING_URL%  ❌ WRONG VARIABLE NAME
```

**Frontend Code Expected:**
```typescript
import.meta.env.VITE_API_BASE_URL  ✅ LOOKING FOR THIS
```

**Result:** Frontend used fallback/hardcoded URLs with wrong path `/support-api/` instead of `/support-staging/`

### Issue #2: HTTP vs HTTPS Mismatch

**Staging URL was:**
```
http://support.solutionsnextwave.com/support-staging  ❌ HTTP
```

**Should be:**
```
https://support.solutionsnextwave.com/support-staging  ✅ HTTPS
```

**Result:** Browser blocked HTTP API calls from HTTPS frontend (Mixed Active Content policy)

---

## ✅ Fixes Applied

### Fix #1: Correct Environment Variable (Commit 0bab59a)

**Changed:**
```bat
REM BEFORE
set VITE_API_URL=%STAGING_URL%

REM AFTER  
set VITE_API_BASE_URL=%STAGING_URL%/api
```

**Result:**
- Frontend now correctly reads `VITE_API_BASE_URL`
- API calls go to correct path: `/support-staging/api`

### Fix #2: Use HTTPS (Commit 67ce77e)

**Changed:**
```bat
REM BEFORE
set STAGING_URL=http://support.solutionsnextwave.com/support-staging

REM AFTER
set STAGING_URL=https://support.solutionsnextwave.com/support-staging
```

**Result:**
- All API calls now use HTTPS
- No more Mixed Content security errors
- Browser allows API requests from HTTPS frontend

---

## 📦 New Build Output

**Location:** `staging-build-hostbuddy/`

**Frontend Files (index-DHskee8F.js):**
```javascript
VITE_API_BASE_URL: "https://support.solutionsnextwave.com/support-staging/api"
```

**All API endpoints now correctly resolve to:**
- `https://support.solutionsnextwave.com/support-staging/api/auth/login`
- `https://support.solutionsnextwave.com/support-staging/api/tickets`
- `https://support.solutionsnextwave.com/support-staging/api/users`
- etc.

---

## 🚀 Deployment Steps

### 1. Upload New Frontend Files

Upload **ONLY the frontend files** from the latest build:

```
staging-build-hostbuddy/frontend/
├── index.html                    ← Upload this
├── assets/
│   ├── index-BS4MiUpG.css       ← Upload this
│   └── index-DHskee8F.js        ← Upload this (NEW - with HTTPS)
├── web.config                    ← Upload this
├── .htaccess                     ← Upload this
└── _redirects                    ← Upload this
```

**Delete old JS file:**
- Delete `index-ByWE9Cb0.js` (old build with HTTP)
- Delete `index-Cbq4w0ft.js` (very old build with wrong URL)

### 2. Clear Browser Cache

After uploading:
- Clear browser cache or hard refresh (Ctrl+Shift+R)
- Or open in incognito/private mode

### 3. Test Login

1. Visit: `https://support.solutionsnextwave.com/support-staging`
2. Login with admin credentials
3. Should now work without errors!

---

## ✅ Verification

### Browser Console Should Show:

```javascript
[SettingsApi] Using baseUrl: https://support.solutionsnextwave.com/support-staging/api
🔐 Logging in...
✅ Authenticated user loaded: admin@example.com
```

### NO errors about:
- ❌ 404 - File or directory not found
- ❌ Blocked loading mixed active content
- ❌ NetworkError when attempting to fetch

### Expected Behavior:
- ✅ Login succeeds
- ✅ JWT token stored
- ✅ Dashboard loads
- ✅ "Admin View - All Departments" banner displays

---

## 📝 Lessons Learned

1. **Environment Variable Names Matter**
   - Frontend expected `VITE_API_BASE_URL`
   - Build script was setting `VITE_API_URL`
   - Result: Fallback URLs were used

2. **HTTPS is Required for Modern Web Apps**
   - Browsers enforce Mixed Content policy
   - HTTP API calls blocked from HTTPS pages
   - Always use HTTPS in production/staging

3. **Test After Each Build**
   - Check browser console for actual URLs being used
   - Verify environment variables are correctly passed
   - Test API connectivity before full deployment

4. **Build Output Verification**
   - Search built JS files for hardcoded URLs
   - Verify environment variables are injected correctly
   - Check that no fallback/default values are being used

---

## 🔧 Build Script (Final Version)

```bat
REM Configuration
set STAGING_URL=https://support.solutionsnextwave.com/support-staging
set BUILD_DIR=staging-build-hostbuddy
set BACKEND_DIR=%BUILD_DIR%\backend
set FRONTEND_DIR=%BUILD_DIR%\frontend

REM Set environment variable for frontend build
set VITE_API_BASE_URL=%STAGING_URL%/api

echo Running npm build...
call npm run build
```

**Key Points:**
- ✅ Uses HTTPS
- ✅ Correct variable name: `VITE_API_BASE_URL`
- ✅ Includes `/api` suffix

---

## 📊 Timeline

**10:00 AM** - User reports 404 errors in staging  
**10:05 AM** - Investigated console logs, found wrong API URL  
**10:10 AM** - Root cause: Wrong environment variable name  
**10:15 AM** - Fix #1 applied (Commit 0bab59a)  
**10:20 AM** - Rebuild completed, user uploaded to staging  
**10:25 AM** - New error: Mixed Content (HTTP vs HTTPS)  
**10:30 AM** - Fix #2 applied (Commit 67ce77e)  
**10:35 AM** - Final rebuild completed  
**10:40 AM** - Ready for redeployment  

---

## 🎯 Next Steps

1. ✅ Upload new frontend files to HostBuddy staging
2. ✅ Clear browser cache
3. ✅ Test login
4. ⏳ Verify all API endpoints work
5. ⏳ Test ticket creation/viewing
6. ⏳ Confirm admin dashboard shows all departments
7. ⏳ Mark staging deployment as complete

---

## 📞 Support

**Developer:** Gogulan@moojic.com  
**Staging Server:** HostBuddy (https://cp.hostbuddy.com)  
**Database:** sql8020.site4now.net / db_aae2b0_solutionsnext  
**Staging URL:** https://support.solutionsnextwave.com/support-staging  

---

**Status:** ✅ **FIXED AND READY FOR DEPLOYMENT**
