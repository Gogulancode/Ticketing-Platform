-- Add EscalationTime column to SlaPolicies table
USE ERPTrainingDB;
GO

-- Check if column exists and add it if not
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID(N'SlaPolicies') 
               AND name = 'EscalationTime')
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

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'SlaPolicies'
  AND COLUMN_NAME = 'EscalationTime';
GO
