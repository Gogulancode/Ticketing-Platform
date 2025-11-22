# PRODUCTION DEPLOYMENT GUIDE
## Comment Attachments & Email Notifications Feature
**Date:** November 12, 2025  
**Version:** 1.0.0

---

## 📋 OVERVIEW

This deployment includes:
- ✅ **Database Migration**: AddCommentIdToAttachments (20251112062557)
- ✅ **Backend Changes**: Email notifications, reopen functionality, dynamic status lookup
- ✅ **Frontend Changes**: Blue highlighting for comment attachments, download functionality

---

## ⚠️ PRE-DEPLOYMENT REQUIREMENTS

### 1. Database Backup
```sql
-- Create full backup before deployment
BACKUP DATABASE [ERPTrainingDB] 
TO DISK = 'C:\DatabaseBackups\ERPTrainingDB_PreDeployment_20251112.bak' 
WITH FORMAT, NAME = 'Full Backup before Comment Attachments deployment';
```

### 2. Prerequisites Check
- [ ] .NET 8 SDK installed on build machine
- [ ] Node.js 18+ and npm installed
- [ ] Access to production server
- [ ] Database admin credentials
- [ ] IIS admin access
- [ ] Email service (Microsoft Graph) credentials ready

### 3. Notification
- [ ] Inform team about deployment window
- [ ] Schedule maintenance window (recommended: 30-60 minutes)
- [ ] Prepare rollback plan

---

## 🗄️ DATABASE MIGRATION

### Option A: Using EF Core Migrations (Recommended)

```powershell
# Navigate to Infrastructure project
cd backend\ERPTraining.Infrastructure

# Set connection string for production
$env:ConnectionStrings__DefaultConnection = "Server=YOUR_SERVER;Database=ERPTrainingDB;Integrated Security=true;TrustServerCertificate=true;"

# Apply migration
dotnet ef database update --startup-project ..\ERPTraining.API

# Verify migration applied
# Check __EFMigrationsHistory table
```

### Option B: Using SQL Script

```sql
-- Run this script in production database

-- Add CommentId column to TicketAttachments table
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('TicketAttachments') 
    AND name = 'CommentId'
)
BEGIN
    ALTER TABLE TicketAttachments 
    ADD CommentId uniqueidentifier NULL;
    
    -- Add foreign key constraint
    ALTER TABLE TicketAttachments
    ADD CONSTRAINT FK_TicketAttachments_TicketComments_CommentId 
    FOREIGN KEY (CommentId) REFERENCES TicketComments(Id) ON DELETE SET NULL;
    
    -- Create index for performance
    CREATE INDEX IX_TicketAttachments_CommentId 
    ON TicketAttachments(CommentId) 
    WHERE CommentId IS NOT NULL;
    
    PRINT 'CommentId column added successfully';
END
ELSE
BEGIN
    PRINT 'CommentId column already exists';
END

-- Verify migration
SELECT TOP 5 * FROM TicketAttachments;
```

### Verify "Reopen" Status Exists

```sql
-- Check if Reopen status exists
SELECT Id, Name, WorkflowOrder, IsActive 
FROM TicketStatuses 
WHERE Name = 'Reopen';

-- If it doesn't exist, create it
IF NOT EXISTS (SELECT 1 FROM TicketStatuses WHERE Name = 'Reopen')
BEGIN
    INSERT INTO TicketStatuses (Name, WorkflowOrder, IsActive, Color, IsDefault, IsClosedStatus, CreatedAt, UpdatedAt)
    VALUES ('Reopen', 7, 1, '#FFA500', 0, 0, GETUTCDATE(), GETUTCDATE());
    
    PRINT 'Reopen status created';
END
```

---

## 🔧 BACKEND DEPLOYMENT

### 1. Build Backend

```powershell
# Clean and build
cd backend\ERPTraining.API
dotnet clean --configuration Release
dotnet restore
dotnet build --configuration Release
dotnet publish --configuration Release --output publish
```

### 2. Prepare Production Backend

```powershell
# On production server
# Stop IIS Application Pool
Stop-WebAppPool -Name "YourAppPoolName"

# Backup current backend
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
Copy-Item -Path "C:\inetpub\wwwroot\api" -Destination "C:\Backups\api_backup_$timestamp" -Recurse

# Clear existing files (keep appsettings.Production.json)
Get-ChildItem "C:\inetpub\wwwroot\api" -Exclude "appsettings.Production.json","Web.config" | Remove-Item -Recurse -Force

# Copy new files
Copy-Item -Path ".\publish\*" -Destination "C:\inetpub\wwwroot\api\" -Recurse -Force
```

### 3. Update Configuration

Update `appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_PRODUCTION_SERVER;Database=ERPTrainingDB;Integrated Security=true;TrustServerCertificate=true;Encrypt=false"
  },
  "MicrosoftGraph": {
    "TenantId": "your-tenant-id",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret",
    "HelpdeskEmail": "ithelpdesk@yourdomain.com"
  },
  "Cors": {
    "AllowedOrigins": [
      "https://your-production-domain.com",
      "http://your-production-domain.com"
    ]
  },
  "RebaseUrl": "https://your-production-domain.com"
}
```

### 4. Restart IIS

```powershell
# Start IIS Application Pool
Start-WebAppPool -Name "YourAppPoolName"

# Verify backend is running
Invoke-WebRequest -Uri "https://your-api-url/api/health" -UseBasicParsing
```

---

## 🎨 FRONTEND DEPLOYMENT

### 1. Build Frontend

```powershell
# Clean and build
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run build
```

### 2. Deploy Frontend

```powershell
# On production server
# Backup current frontend
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
Copy-Item -Path "C:\inetpub\wwwroot" -Destination "C:\Backups\frontend_backup_$timestamp" -Recurse -Exclude "api"

# Clear existing files (keep web.config)
Get-ChildItem "C:\inetpub\wwwroot" -Exclude "api","web.config" | Remove-Item -Recurse -Force

# Copy new files
Copy-Item -Path ".\dist\*" -Destination "C:\inetpub\wwwroot\" -Recurse -Force
```

### 3. Verify web.config

Ensure `web.config` exists in frontend root with URL rewrite rules:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="React Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                        <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
        </staticContent>
    </system.webServer>
</configuration>
```

---

## ✅ VERIFICATION & TESTING

### 1. Backend Verification

```powershell
# Test API health endpoint
Invoke-WebRequest -Uri "https://your-api-url/api/health"

# Test authentication endpoint
Invoke-RestMethod -Uri "https://your-api-url/api/auth/login" -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@domain.com","password":"test"}'
```

### 2. Frontend Verification

- [ ] Application loads without errors
- [ ] Login page displays correctly
- [ ] User can successfully login
- [ ] Ticketing module accessible

### 3. Feature Testing

#### Comment Attachments
1. Navigate to any ticket
2. Add a comment with an attachment
3. **Verify:** Comment has blue left border highlighting
4. **Verify:** Attachment shows download icon
5. **Verify:** Clicking download works correctly

#### Email Notifications - Assignment
1. Assign a ticket to an agent
2. **Verify:** Agent receives email notification
3. **Verify:** Email contains ticket details and link

#### Email Notifications - Collaborator
1. Add a collaborator to a ticket
2. **Verify:** Collaborator receives email notification

#### Email Notifications - Resolution
1. Resolve a ticket (set status to "Resolved")
2. **Verify:** Ticket creator receives email
3. **Verify:** Email contains:
   - ✅ Resolution notification header (green)
   - 📝 Ticket details
   - 📄 Resolution notes
   - 🔄 "Reopen Ticket" button

#### Reopen Functionality
1. Click "Reopen Ticket" link from resolution email
2. **Verify:** Success page displays
3. **Verify:** Ticket status changed to "Reopen" (not "In Progress" or "New")
4. **Verify:** System comment added: "Ticket reopened by customer"
5. Try reopening a closed ticket
6. **Verify:** Error message: "ticket is closed and cannot be reopened"

#### Email Reply Reopening
1. Resolve a ticket
2. Customer replies to ticket via email (send email to ithelpdesk@yourdomain.com)
3. **Verify:** Ticket status changes to "Reopen"
4. **Verify:** Email content added as comment

### 4. Database Verification

```sql
-- Verify CommentId column exists and has data
SELECT TOP 10 
    ta.Id,
    ta.FileName,
    ta.CommentId,
    tc.Body as CommentText
FROM TicketAttachments ta
LEFT JOIN TicketComments tc ON ta.CommentId = tc.Id
WHERE ta.CommentId IS NOT NULL;

-- Verify Reopen status is being used
SELECT TOP 10 
    Id,
    PublicId,
    Title,
    Status,
    ts.Name as StatusName
FROM Tickets t
INNER JOIN TicketStatuses ts ON t.Status = ts.Id
WHERE ts.Name = 'Reopen'
ORDER BY t.CreatedAt DESC;
```

---

## 🔄 ROLLBACK PROCEDURE

If critical issues occur:

### 1. Stop Application
```powershell
Stop-WebAppPool -Name "YourAppPoolName"
```

### 2. Restore Database
```sql
-- Restore from backup
RESTORE DATABASE [ERPTrainingDB]
FROM DISK = 'C:\DatabaseBackups\ERPTrainingDB_PreDeployment_20251112.bak'
WITH REPLACE, RECOVERY;
```

### 3. Restore Backend
```powershell
# Restore backed up backend
Remove-Item -Path "C:\inetpub\wwwroot\api\*" -Recurse -Force
Copy-Item -Path "C:\Backups\api_backup_$timestamp\*" -Destination "C:\inetpub\wwwroot\api\" -Recurse
```

### 4. Restore Frontend
```powershell
# Restore backed up frontend
Get-ChildItem "C:\inetpub\wwwroot" -Exclude "api" | Remove-Item -Recurse -Force
Copy-Item -Path "C:\Backups\frontend_backup_$timestamp\*" -Destination "C:\inetpub\wwwroot\" -Recurse -Exclude "api"
```

### 5. Restart Application
```powershell
Start-WebAppPool -Name "YourAppPoolName"
```

---

## 📊 KEY FILES CHANGED

### Backend Files
- `Controllers/Ticketing/TicketsV2Controller.cs` - Reopen endpoint, resolution notifications
- `Infrastructure/Services/Ticketing/MicrosoftGraphEmailService.cs` - Email notification methods
- `Infrastructure/Services/Ticketing/GraphEmailToTicketProcessor.cs` - Email reply reopening
- `Core/Interfaces/Ticketing/IEmailService.cs` - Email service interface
- `Program.cs` - IEmailService DI registration

### Frontend Files
- `src/modules/ticketing/components/tickets/detail/TicketComments.tsx` - Blue highlighting
- `src/modules/ticketing/services/ticketsApi.ts` - API calls

### Database Migration
- `20251112062557_AddCommentIdToAttachments` - Adds CommentId column to TicketAttachments

---

## 🎯 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Database backup completed
- [ ] Team notified
- [ ] Maintenance window scheduled
- [ ] Production credentials ready

### Deployment
- [ ] Database migration applied
- [ ] Backend built and deployed
- [ ] Frontend built and deployed
- [ ] Configuration files updated
- [ ] IIS restarted

### Post-Deployment
- [ ] Application accessible
- [ ] Login works
- [ ] Comment attachments display with blue highlighting
- [ ] Assignment email received
- [ ] Resolution email received
- [ ] Reopen link works correctly
- [ ] Ticket status shows "Reopen" after reopening
- [ ] Email reply reopens resolved tickets
- [ ] Closed tickets cannot be reopened
- [ ] All existing features functional

### Sign-Off
- Deployed by: _________________ Date: _________________
- Tested by: _________________ Date: _________________
- Approved by: _________________ Date: _________________

---

## 📞 SUPPORT

For deployment issues, contact:
- **Technical Lead:** [Your Name]
- **Database Admin:** [DBA Name]
- **DevOps Team:** [Team Contact]

---

## 📝 NOTES

- **Reopen Status:** Ensure "Reopen" status exists in TicketStatuses table with IsActive=1
- **Email Configuration:** Microsoft Graph credentials must be correct in appsettings.Production.json
- **CORS:** Add production domain to allowed origins
- **Database Connection:** Use Integrated Security or SQL Auth based on your setup
- **URL Rewrite:** Frontend requires URL rewrite module in IIS

---

**END OF DEPLOYMENT GUIDE**
