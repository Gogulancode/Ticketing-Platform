# 🔍 DEBUGGING - Diagnostics Work, Login Fails

## Current Status

| Endpoint | Status | Result |
|----------|--------|--------|
| Swagger | ❌ Not responding | Might be disabled in Production |
| Diagnostics | ✅ Working | ERP login succeeds, 3294 users found |
| Login API | ❌ 401 Error | Returns "Invalid username or password" |

## 🤔 The Mystery

**The diagnostic endpoint proves:**
- ✅ ERP API is reachable
- ✅ Login to ERP works (`Gogulan@moojic.com` / password)
- ✅ User lookup works (found user ID 15866)
- ✅ ERPSSOAuthService is working

**But the login endpoint:**
- ❌ Returns 401 Unauthorized
- ❌ Message: "Invalid username or password"

## 💡 Why This Happens

The diagnostic and login endpoints use the SAME ERPSSOAuthService, but something is different. Possible causes:

### 1. **Model Binding Issue**
The LoginDto might not be getting populated correctly from the request body.

### 2. **Middleware Interference**
Something (like authentication middleware) might be rejecting the request before it reaches the controller.

### 3. **CORS Issue**
If you're testing from the frontend, CORS might be blocking it.

### 4. **Rate Limiting**
After 100 failed attempts, there might be rate limiting.

## 🔧 SOLUTIONS TO TRY

### Solution 1: Check Server Logs 📋

This will tell us EXACTLY what's happening.

**HostBuddy Logs Location:**
```
/root/home/solutionsnext-001/www/support-api-staging/logs/
```

**Look for files:**
- `stdout_yyyyMMdd_*.log` (most recent)
- Any error logs

**What to look for:**
1. Search for: "Attempting SSO login"
   - If you see this: The service is being called
   - If you don't: The request isn't reaching the service

2. Search for: "ERP authentication failed"
   - This tells us the ERP call failed

3. Look for any stack traces or errors

**Can you:**
1. Access these logs via HostBuddy File Manager?
2. Or via FTP?
3. Send me the last 50-100 lines after you try to login?

### Solution 2: Enable Detailed Logging

Add this to `appsettings.Staging.json` (or upload a new version):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Information",
      "ERPTraining": "Debug",
      "ERPTraining.Infrastructure.Services": "Debug"
    }
  }
}
```

This will log EVERYTHING the auth service does.

### Solution 3: Test with userName Instead of email

The LoginDto has both `email` and `userName` fields. Try:

```powershell
Invoke-RestMethod -Uri 'https://support.solutionsnextwave.com/support-api-staging/api/auth/login' -Method POST -Body '{"userName":"Gogulan@moojic.com","password":"Gogulan@20$@025"}' -ContentType 'application/json'
```

### Solution 4: Test via Diagnostic Login

Since this works, use it as a workaround:

```powershell
$body = @{
    email = "Gogulan@moojic.com"
    password = "Gogulan@20$@025"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'https://support.solutionsnextwave.com/support-api-staging/api/diagnostics/test-login' -Method POST -Body $body -ContentType 'application/json'
```

This proves the service works, so we can use this to debug.

### Solution 5: Check AuthController

Let me verify the AuthController is calling the service correctly.

The controller code (line 137):
```csharp
var result = await _authService.LoginAsync(loginDto);
if (result == null)
    return Unauthorized(new { message = "Invalid username or password" });
```

This is straightforward - if the service returns null, it sends 401.

**So the service IS returning null.**

But why? The diagnostic proves the service CAN work!

## 🎯 Most Likely Cause

Looking at the code, the LoginDto has:
```csharp
[JsonPropertyName("email")]
public string Email { get; set; } = string.Empty;

[JsonPropertyName("userName")]  
public string UserName { get; set; } = string.Empty;
```

And the ERPSSOAuthService does:
```csharp
string email = !string.IsNullOrEmpty(loginDto.Email) ? loginDto.Email : loginDto.UserName;
```

**If BOTH are empty, email would be empty string, and ERP login would fail!**

## 🧪 Test This Theory

Try sending BOTH fields:

```powershell
Invoke-RestMethod -Uri 'https://support.solutionsnextwave.com/support-api-staging/api/auth/login' -Method POST -Body '{"email":"Gogulan@moojic.com","userName":"Gogulan@moojic.com","password":"Gogulan@20$@025"}' -ContentType 'application/json'
```

Or just userName:

```powershell
Invoke-RestMethod -Uri 'https://support.solutionsnextwave.com/support-api-staging/api/auth/login' -Method POST -Body '{"userName":"Gogulan@moojic.com","password":"Gogulan@20$@025"}' -ContentType 'application/json'
```

## 📝 Next Steps

1. **Try the userName test above** ⬆️
2. **Check server logs** - This will show us exactly what's happening
3. **Compare diagnostic vs login** - What's different?

## 🆘 Without Logs, We're Guessing

I need to see the server logs to understand why:
- Diagnostic login: ✅ Works
- Actual login: ❌ Fails

Both call the same service, so something must be different in how they're called or what parameters they receive.

**Can you access the logs?** That's the fastest way to solve this.

---

## Quick Tests to Run

```powershell
# Test 1: With userName field
try {
    $r = Invoke-RestMethod -Uri 'https://support.solutionsnextwave.com/support-api-staging/api/auth/login' -Method POST -Body '{"userName":"Gogulan@moojic.com","password":"Gogulan@20$@025"}' -ContentType 'application/json'
    Write-Host "✅ userName works! User: $($r.user.email)" -ForegroundColor Green
} catch {
    Write-Host "❌ userName failed" -ForegroundColor Red
}

# Test 2: With both fields
try {
    $r = Invoke-RestMethod -Uri 'https://support.solutionsnextwave.com/support-api-staging/api/auth/login' -Method POST -Body '{"email":"Gogulan@moojic.com","userName":"Gogulan@moojic.com","password":"Gogulan@20$@025"}' -ContentType 'application/json'
    Write-Host "✅ Both fields work! User: $($r.user.email)" -ForegroundColor Green
} catch {
    Write-Host "❌ Both fields failed" -ForegroundColor Red
}

# Test 3: Diagnostic (we know this works)
$body = '{"email":"Gogulan@moojic.com","password":"Gogulan@20$@025"}'
try {
    $r = Invoke-RestMethod -Uri 'https://support.solutionsnextwave.com/support-api-staging/api/diagnostics/test-login' -Method POST -Body $body -ContentType 'application/json'
    Write-Host "✅ Diagnostic works: $($r.steps[0].status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Diagnostic failed" -ForegroundColor Red
}
```

Run these and tell me which ones work!
