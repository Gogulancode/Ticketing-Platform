# Production Backend Troubleshooting Commands

# Run these commands on your production server (192.168.6.171):

# 1. Check if API is running on port 81
netstat -ano | findstr ":81"

# 2. Test API directly
Invoke-WebRequest -Uri "http://192.168.6.171:81/api" -UseBasicParsing

# 3. Test specific auth endpoint
Invoke-WebRequest -Uri "http://192.168.6.171:81/api/auth/login" -Method POST -UseBasicParsing -Headers @{"Content-Type"="application/json"} -Body '{"username":"test","password":"test"}'

# 4. Check if any processes are using port 81
Get-Process | Where-Object {$_.ProcessName -like "*ERP*" -or $_.ProcessName -like "*dotnet*"}

# 5. Check Windows Firewall for port 81
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*81*"}

# 6. Test from localhost on the production server
Invoke-WebRequest -Uri "http://localhost:81/api" -UseBasicParsing
