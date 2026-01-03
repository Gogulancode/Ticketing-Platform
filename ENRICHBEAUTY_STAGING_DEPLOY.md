# EnrichBeauty Staging Deployment Guide

## Environment Details
- **Domain:** enrichbeauty.solutionsnextwave.com
- **Frontend Path:** `h:\root\home\solutionsnext-001\www\enrichbeauty\`
- **Backend Path:** `h:\root\home\solutionsnext-001\www\enrichbeauty\api\`

---

## 1. Build Frontend

```powershell
# From the Ticketing Platform directory
cd "D:\Ticketing Platform"

# Build for staging
npm run build -- --mode staging
```

The build output will be in the `dist` folder.

---

## 2. Build Backend

```powershell
cd "D:\Ticketing Platform\backend\ERPTraining.API"

# Publish for staging
dotnet publish -c Release -o ./publish-staging
```

---

## 3. Deploy to Staging Server

### Frontend Deployment
Copy contents of `dist\` folder to:
```
h:\root\home\solutionsnext-001\www\enrichbeauty\
```

### Backend Deployment
Copy contents of `publish-staging\` folder to:
```
h:\root\home\solutionsnext-001\www\enrichbeauty\api\
```

---

## 4. IIS Configuration

### Backend Application Pool
- .NET CLR Version: No Managed Code
- Managed Pipeline Mode: Integrated
- Identity: ApplicationPoolIdentity (or custom account)

### Backend Site Settings
- Physical Path: `h:\root\home\solutionsnext-001\www\enrichbeauty\api\`
- Application Pool: Use the pool created above
- Virtual Path: `/api`

### web.config for Backend
Ensure `appsettings.Staging.json` is in the `api` folder with correct connection string.

Set environment variable:
```xml
<aspNetCore processPath=".\ERPTraining.API.exe" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="Outofprocess">
  <environmentVariables>
    <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Staging" />
  </environmentVariables>
</aspNetCore>
```

---

## 5. Database Connection

Update `appsettings.Staging.json` with the correct SQL Server connection string for the staging database.

---

## 6. Verify Deployment

### Test API Health
```
https://enrichbeauty.solutionsnextwave.com/api/health
```

### Test Frontend
```
https://enrichbeauty.solutionsnextwave.com/
```

---

## API Endpoints Structure

| Endpoint | URL |
|----------|-----|
| Frontend | `https://enrichbeauty.solutionsnextwave.com/` |
| API Base | `https://enrichbeauty.solutionsnextwave.com/api/` |
| Health | `https://enrichbeauty.solutionsnextwave.com/api/health` |
| Auth | `https://enrichbeauty.solutionsnextwave.com/api/auth/login` |
| Tickets | `https://enrichbeauty.solutionsnextwave.com/api/tickets` |

---

## Troubleshooting

### CORS Issues
CORS is configured in `Program.cs` to allow:
- `http://enrichbeauty.solutionsnextwave.com`
- `https://enrichbeauty.solutionsnextwave.com`

### 500 Errors
Check logs at:
```
h:\root\home\solutionsnext-001\www\enrichbeauty\api\logs\
```

### Database Connection
Verify connection string in `appsettings.Staging.json` is correct for the staging database.
