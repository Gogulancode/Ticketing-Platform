# QUICK DEPLOYMENT CHECKLIST - Staging 404 Fix

**Date:** October 15, 2025  
**Build:** staging-build-hostbuddy/ (Latest with HTTPS)  
**Commits:** 0bab59a, 67ce77e, 6eb9f49

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

### Upload Frontend Files (ONLY)
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
    └── index-DHskee8F.js ✓ (NEW - HTTPS)
```

### Delete Old Files
```
DELETE THESE:
- assets/index-ByWE9Cb0.js (old HTTP build)
- assets/index-Cbq4w0ft.js (old wrong URL build)
```

**Why only frontend?**
- Backend hasn't changed
- Only frontend had the API URL issue
- Saves upload time

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

### If still getting 404 errors:

**Check #1: Files Uploaded Correctly**
```
Verify these files exist in HostBuddy:
- index.html
- assets/index-DHskee8F.js (NEW file)
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

**Time Estimate:** 5-10 minutes  
**Downtime:** None (just replacing files)  
**Rollback:** Keep backup of old frontend files  

**Backend:** No changes needed  
**Database:** No changes needed  
**Configuration:** No changes needed  

---

## 📞 Need Help?

**Developer:** Gogulan@moojic.com  
**Documentation:** STAGING_404_FIX_SUMMARY.md  
**Build Location:** staging-build-hostbuddy/  

---

**Ready to deploy!** 🚀

Upload the files, clear your cache, and test login.  
Should work perfectly now! ✨
