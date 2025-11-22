# URGENT: Manual SQL Fix Required

## Error
```
Invalid column name 'EscalationTime'
GET /api/tickets/settings/sla - 400 Bad Request
POST /api/tickets/settings/sla/1/contacts - 400 Bad Request
```

## Root Cause
The `SlaPolicies` table in the database is missing the `EscalationTime` column that was added to the entity model.

## Solution - Execute in SQL Server Management Studio

### Step 1: Open SSMS and Connect
1. Open **SQL Server Management Studio**
2. Connect to: **DESKTOP-81Q1B98\TRAINING_MODULE**
3. Select database: **ERPTrainingDB**

### Step 2: Execute This SQL Script

```sql
-- Add the missing EscalationTime column
USE ERPTrainingDB;
GO

-- Add column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'SlaPolicies' 
    AND COLUMN_NAME = 'EscalationTime'
)
BEGIN
    ALTER TABLE SlaPolicies 
    ADD EscalationTime INT NULL;
    
    PRINT 'EscalationTime column added successfully';
END
ELSE
BEGIN
    PRINT 'EscalationTime column already exists';
END
GO

-- Populate Name and Description for existing SLA policies
UPDATE SlaPolicies
SET 
    Name = CASE Priority
        WHEN 0 THEN 'Critical Priority SLA - ' + CAST(FirstResponseMins AS NVARCHAR) + 'min response'
        WHEN 1 THEN 'High Priority SLA - ' + CAST(FirstResponseMins AS NVARCHAR) + 'min response'
        WHEN 2 THEN 'Medium Priority SLA - ' + CAST(FirstResponseMins AS NVARCHAR) + 'min response'
        WHEN 3 THEN 'Low Priority SLA - ' + CAST(FirstResponseMins AS NVARCHAR) + 'min response'
        ELSE 'SLA Policy - Priority ' + CAST(Priority AS NVARCHAR)
    END,
    Description = CASE Priority
        WHEN 0 THEN 'Critical issues requiring immediate attention with ' + 
                    CAST(FirstResponseMins AS NVARCHAR) + ' minute response and ' + 
                    CAST(ResolutionMins AS NVARCHAR) + ' minute resolution time'
        WHEN 1 THEN 'High priority issues with ' + 
                    CAST(FirstResponseMins AS NVARCHAR) + ' minute response and ' + 
                    CAST(ResolutionMins AS NVARCHAR) + ' minute resolution time'
        WHEN 2 THEN 'Medium priority issues with ' + 
                    CAST(FirstResponseMins AS NVARCHAR) + ' minute response and ' + 
                    CAST(ResolutionMins AS NVARCHAR) + ' minute resolution time'
        WHEN 3 THEN 'Low priority issues with ' + 
                    CAST(FirstResponseMins AS NVARCHAR) + ' minute response and ' + 
                    CAST(ResolutionMins AS NVARCHAR) + ' minute resolution time'
        ELSE 'SLA policy for priority level ' + CAST(Priority AS NVARCHAR)
    END,
    IsActive = 1,
    UpdatedAt = GETUTCDATE()
WHERE Name IS NULL;
GO

-- Verify the changes
SELECT 
    Id, 
    Name, 
    Description, 
    Priority, 
    FirstResponseMins, 
    ResolutionMins, 
    EscalationTime,
    IsActive,
    CreatedAt,
    UpdatedAt
FROM SlaPolicies;
GO

PRINT 'SLA Policies table updated successfully!';
```

### Step 3: Verify and Restart

After executing the script:

1. **Verify column exists**:
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'SlaPolicies'
   ORDER BY ORDINAL_POSITION;
   ```

2. **Check data**:
   ```sql
   SELECT TOP 5 * FROM SlaPolicies;
   ```

3. **Restart the backend server** (it's currently running)

4. **Test the API**:
   - GET http://localhost:5015/api/tickets/settings/sla
   - Should return 200 OK with policy names visible

## Alternative: Copy-Paste Script

If you prefer, copy this entire block and paste into SSMS Query window:

```sql
USE ERPTrainingDB;

-- Add column
ALTER TABLE SlaPolicies ADD EscalationTime INT NULL;

-- Populate names
UPDATE SlaPolicies
SET Name = CASE Priority
    WHEN 0 THEN 'Critical - ' + CAST(FirstResponseMins AS NVARCHAR) + 'min response'
    WHEN 1 THEN 'High - ' + CAST(FirstResponseMins AS NVARCHAR) + 'min response'
    WHEN 2 THEN 'Medium - ' + CAST(FirstResponseMins AS NVARCHAR) + 'min response'
    WHEN 3 THEN 'Low - ' + CAST(FirstResponseMins AS NVARCHAR) + 'min response'
END,
Description = 'SLA for priority ' + CAST(Priority AS NVARCHAR),
IsActive = 1
WHERE Name IS NULL;

-- Verify
SELECT * FROM SlaPolicies;
```

## What This Fixes

✅ Adds `EscalationTime` column to SlaPolicies table  
✅ Populates `Name` and `Description` for existing policies  
✅ Sets all existing policies to `IsActive = 1`  
✅ Fixes the 400 Bad Request errors  
✅ Makes policy names visible in the frontend table  
✅ Allows creating escalation contacts  

## Why sqlcmd Failed

The command-line connection failed with:
- "Error Locating Server/Instance Specified"
- "Login timeout expired"

This is common when:
- SQL Server Browser service is not running
- Named Pipes/TCP IP is not enabled
- Windows Authentication requires interactive session

**SSMS is the most reliable method** for this update.

## After the Fix

Once you've executed the SQL script:

1. Backend server will automatically pick up the changes (no restart needed if using hot reload)
2. Refresh the SLA Policies page
3. Policy names should be visible
4. Creating escalation contacts should work
5. All CRUD operations should function normally

---

**Status**: ⚠️ Code is ready, waiting for database update  
**Priority**: 🔴 CRITICAL - All SLA functionality blocked  
**Time to fix**: ⏱️ 2-3 minutes in SSMS
