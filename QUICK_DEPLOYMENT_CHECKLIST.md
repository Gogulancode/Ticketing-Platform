# QUICK DEPLOYMENT CHECKLIST - Staging Deployment

**Date:** October 15, 2025  
**Build:** staging-build-hostbuddy/ (Latest with HTTPS + CORS Fix)  
**Commits:** 0bab59a, 67ce77e, 6eb9f49, 10c7989

---

## ✅ Pre-Deployment

- [x] Build completed successfully
- [x] HTTPS URL verified in build output
- [x] Documentation created
- [x] Git commits pushed

---

## 📤 Upload to HostBuddy

### Login to HostBuddy Control Panel
- URL: https://cp.hostbuddy.com
- Navigate to staging site file manager

### Step 1: Upload Frontend Files
Navigate to your staging frontend directory and upload:

```
FROM: staging-build-hostbuddy/frontend/
TO: [Your HostBuddy staging frontend folder]

FILES TO UPLOAD:
├── index.html ✓
├── web.config ✓
├── .htaccess ✓
├── _redirects ✓
└── assets/
    ├── index-BS4MiUpG.css ✓
    └── index-DHskee8F.js ✓ (HTTPS)
```

**Delete Old Files:**
```
- assets/index-ByWE9Cb0.js (old HTTP build)
- assets/index-Cbq4w0ft.js (old wrong URL build)
```

### Step 2: Upload Backend Files (CORS FIX)
**IMPORTANT:** Backend needs to be updated for CORS fix!

Navigate to your staging backend directory and upload:

```
FROM: staging-build-hostbuddy/backend/
TO: [Your HostBuddy staging backend folder]

FILES TO UPLOAD:
├── ERPTraining.API.dll ⭐ (CORS FIX)
├── ERPTraining.Core.dll
├── ERPTraining.Infrastructure.dll
├── appsettings.json
├── web.config
└── (All other DLL files - 250+ files)
```

**Why backend update?**
- Fixed CORS policy to allow staging URL
- Without this, you'll get HTTP 405 errors
- Backend now accepts requests from staging frontend

### Step 3: Restart IIS Application Pool
**CRITICAL:** After uploading backend files:

1. In HostBuddy control panel, go to IIS settings
2. Find your staging application pool
3. Click "Restart" or "Recycle"
4. Wait 10-15 seconds for app to reload

**Why restart?**
- IIS caches DLL files in memory
- Restart forces IIS to load new DLL with CORS fix
- Without restart, old DLL (without CORS fix) still runs

---

## 🧪 Testing

### 1. Clear Browser Cache
```
Chrome/Edge: Ctrl+Shift+Delete
Firefox: Ctrl+Shift+Delete
OR: Open incognito/private window
```

### 2. Visit Staging
```
URL: https://support.solutionsnextwave.com/support-staging
```

### 3. Check Browser Console (F12)
**Expected:**
```javascript
✅ [SettingsApi] Using baseUrl: https://support.solutionsnextwave.com/support-staging/api
✅ 🚀 Mock API endpoints initialized for: ...
✅ 🔐 Logging in...
✅ ✅ Authenticated user loaded: your-email@example.com
```

**NOT Expected (Errors Fixed):**
```javascript
❌ support-api/api (WRONG PATH)
❌ http:// (WRONG PROTOCOL)
❌ 404 - File or directory not found
❌ Blocked loading mixed active content
❌ NetworkError when attempting to fetch
```

### 4. Test Login
- [ ] Enter admin credentials
- [ ] Click "Login"
- [ ] Should redirect to dashboard
- [ ] No errors in console

### 5. Verify Dashboard
- [ ] Dashboard loads successfully
- [ ] Shows "Admin View - All Departments" banner
- [ ] Department dropdown shows all departments
- [ ] Ticket statistics display correctly

### 6. Test API Functionality
- [ ] Create a new ticket
- [ ] View ticket list
- [ ] Open a ticket detail
- [ ] Add a comment
- [ ] All actions work without errors

---

## 🐛 Troubleshooting

### If getting HTTP 405 errors:

**Error Message:**
```
POST https://support.solutionsnextwave.com/support-staging/api/auth/login
405 - HTTP verb used to access this page is not allowed
```

**This means:**
- Backend CORS policy blocking requests
- IIS not restarted after backend upload
- Old DLL still loaded in memory

**Fix:**
1. ✅ Verify backend files uploaded (check ERPTraining.API.dll timestamp)
2. ✅ Restart IIS application pool (CRITICAL!)
3. ✅ Clear browser cache
4. ✅ Try login again

### If still getting 404 errors:

**Check #1: Files Uploaded Correctly**
```
Verify these files exist in HostBuddy:
- Frontend: index.html, assets/index-DHskee8F.js
- Backend: ERPTraining.API.dll (check modified date is recent)
```

**Check #2: Old Files Deleted**
```
Make sure these are DELETED:
- assets/index-ByWE9Cb0.js
- assets/index-Cbq4w0ft.js
```

**Check #3: Browser Cache Cleared**
```
- Hard refresh: Ctrl+Shift+R
- Or use incognito mode
- Check Network tab to see which JS file is loading
```

**Check #4: Correct URL**
```
Browser console should show:
https://support.solutionsnextwave.com/support-staging/api/...
NOT:
http://... (wrong protocol)
.../support-api/... (wrong path)
```

### If getting Mixed Content error:

**This means:**
- Old build still cached
- Need to clear browser cache
- Or old JS file still being served

**Fix:**
1. Clear ALL browser cache
2. Verify new JS file (index-DHskee8F.js) uploaded
3. Check Network tab - which JS file is loading?

### If backend not responding:

**Check these in HostBuddy:**
- IIS application pool is running
- Backend files are deployed
- web.config exists in backend folder
- Check IIS error logs

---

## ✅ Success Criteria

### Frontend
- ✅ Loads without errors
- ✅ Console shows HTTPS API URL
- ✅ No Mixed Content warnings
- ✅ No 404 errors

### Authentication
- ✅ Login succeeds
- ✅ JWT token stored in localStorage
- ✅ User redirected to dashboard

### Dashboard
- ✅ "Admin View - All Departments" banner displays
- ✅ All departments visible in dropdown
- ✅ Statistics load correctly

### Tickets
- ✅ Can create tickets
- ✅ Can view ticket list
- ✅ Can open ticket details
- ✅ Can add comments

---

## 📝 Deployment Notes

**Time Estimate:** 10-15 minutes  
**Downtime:** ~10 seconds during IIS restart  
**Rollback:** Keep backup of old files  

**Frontend:** Updated with HTTPS API URLs  
**Backend:** Updated with CORS fix (allows staging URL)  
**Database:** No changes needed  
**Configuration:** No changes needed  

**Files Changed:**
- Frontend: index-DHskee8F.js (new build with HTTPS)
- Backend: ERPTraining.API.dll (CORS policy updated)  

---

## 📞 Need Help?

**Developer:** Gogulan@moojic.com  
**Documentation:** 
- STAGING_404_FIX_SUMMARY.md (URL configuration fixes)
- STAGING_CORS_FIX_SUMMARY.md (HTTP 405 CORS fix)  
**Build Location:** staging-build-hostbuddy/  

---

**Ready to deploy!** 🚀

Upload the files, clear your cache, and test login.  
Should work perfectly now! ✨
