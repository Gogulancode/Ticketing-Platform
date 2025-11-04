# Network Access Fix Guide - ERP API Connectivity

## Problem
Production server cannot reach ERP API at `http://154.84.227.120:440/api`

**Error from logs:**
```
System.Net.Sockets.SocketException (10060): A connection attempt failed because 
the connected party did not properly respond after a period of time, or 
established connection failed because connected host has failed to respond.
```

## Solution: Enable Network Access

### Option 1: Contact Hosting Provider (RECOMMENDED)

**Email/Support Ticket to your hosting provider:**

```
Subject: Request to Allow Outbound Connection to ERP API

Hello,

I need to enable outbound HTTP connections from my production web server to our ERP system API.

Server Details:
- My Production Server: D:\SupportApp\api (hosted on your infrastructure)
- Target ERP Server: 154.84.227.120
- Port: 440
- Protocol: HTTP

Please allow outbound connections from my application server to:
- IP Address: 154.84.227.120
- Port: 440
- Direction: Outbound only

This connection is required for user authentication against our company's ERP system.

Thank you.
```

### Option 2: Firewall Configuration (If you have server access)

#### Windows Firewall Rule:
```powershell
# Run as Administrator
New-NetFirewallRule `
    -DisplayName "Allow Outbound to ERP API" `
    -Direction Outbound `
    -Action Allow `
    -Protocol TCP `
    -RemoteAddress 154.84.227.120 `
    -RemotePort 440 `
    -Enabled True
```

#### Test After Firewall Update:
```powershell
# Test TCP connectivity
Test-NetConnection -ComputerName 154.84.227.120 -Port 440

# Test HTTP endpoint
Invoke-WebRequest -Uri "http://154.84.227.120:440/api" -TimeoutSec 5

# Test actual login
$body = '{"Email":"Gogulan@moojic.com","Password":"Gogulan@20$@025"}'
Invoke-RestMethod -Uri "http://154.84.227.120:440/api/Login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -TimeoutSec 10
```

### Option 3: Check Network Security Groups (If using cloud hosting)

If your production server is on **Azure/AWS/Cloud**:

**Azure:**
1. Go to Network Security Groups (NSG)
2. Find NSG attached to your production server
3. Add Outbound Rule:
   - Priority: 100
   - Source: Any
   - Destination: IP Address → 154.84.227.120
   - Port: 440
   - Protocol: TCP
   - Action: Allow

**AWS:**
1. Go to Security Groups
2. Find group attached to your production EC2/server
3. Add Outbound Rule:
   - Type: Custom TCP
   - Port Range: 440
   - Destination: 154.84.227.120/32
   - Description: ERP API Access

## Verification Steps

### 1. From Production Server Command Line:
```powershell
# Step 1: Test network connectivity
Test-NetConnection -ComputerName 154.84.227.120 -Port 440
```

**Expected Success Output:**
```
TcpTestSucceeded : True
```

### 2. Test HTTP Endpoint:
```powershell
Invoke-WebRequest -Uri "http://154.84.227.120:440/api" -TimeoutSec 5
```

**Expected:** 200 or 404 status (not timeout)

### 3. Test Login from Production:
```powershell
$body = '{"Email":"Gogulan@moojic.com","Password":"Gogulan@20$@025"}'
Invoke-RestMethod -Uri "http://154.84.227.120:440/api/Login" `
    -Method POST -Body $body -ContentType "application/json"
```

**Expected Success:** JWT token returned

### 4. Test Application Login:
Once network is fixed, try logging in through the web interface:
- URL: `http://localhost` (frontend)
- Username: `Gogulan@moojic.com`
- Password: `Gogulan@20$@025`

## Troubleshooting

### If still not working after firewall update:

1. **Check if there's a proxy server:**
   ```powershell
   netsh winhttp show proxy
   ```

2. **Check if port 440 is blocked by ISP/Router:**
   - Some ISPs block certain ports
   - Try accessing from another network

3. **Verify ERP API is actually running:**
   - Test from your local development machine
   - Should respond in ~500ms

4. **Check server network adapter settings:**
   - Ensure DNS resolution works
   - Test: `nslookup 154.84.227.120`

5. **Review IIS Application Pool Identity:**
   - App pool might not have network access permissions
   - Change to NetworkService or ApplicationPoolIdentity with network rights

## Alternative: Use Domain Name (If Available)

If the ERP API has a domain name (e.g., `erp.babajishivram.com`):

1. Update `appsettings.Production.json`:
   ```json
   "ERPApi": {
     "BaseUrl": "http://erp.babajishivram.com/api"
   }
   ```

2. This might bypass IP-based firewall restrictions

## Support Information

**Current Setup:**
- Frontend: http://localhost (port 80)
- Backend: http://localhost:81/api
- ERP API: http://154.84.227.120:440/api
- Database: sql8020.site4now.net (working ✓)

**What Works:**
- ✅ Frontend loads
- ✅ Backend API responds
- ✅ Database connectivity
- ✅ ERP API accessible from dev machine
- ❌ ERP API NOT accessible from production server

**Root Cause:** Network isolation on production server

**Fix Required:** Allow outbound HTTP traffic to 154.84.227.120:440
