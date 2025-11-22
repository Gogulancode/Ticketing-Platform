-- Production Database Migration Script
-- Migration: 20251101075532_AddUserNotifications
-- Date: 2025-11-01
-- Description: Adds UserNotifications table for notification system

-- Step 1: Create UserNotifications table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserNotifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [UserNotifications] (
        [Id] int NOT NULL IDENTITY(1,1),
        [UserId] nvarchar(max) NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Message] nvarchar(1000) NOT NULL,
        [Type] nvarchar(50) NOT NULL,
        [IsRead] bit NOT NULL DEFAULT 0,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [ActionUrl] nvarchar(500) NULL,
        CONSTRAINT [PK_UserNotifications] PRIMARY KEY ([Id])
    );
    PRINT 'UserNotifications table created successfully';
END
ELSE
BEGIN
    PRINT 'UserNotifications table already exists';
END
GO

-- Step 2: Add migration history entry
IF NOT EXISTS (
    SELECT 1 FROM __EFMigrationsHistory 
    WHERE MigrationId = '20251101075532_AddUserNotifications'
)
BEGIN
    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) 
    VALUES ('20251101075532_AddUserNotifications', '9.0.7');
    PRINT 'Migration history entry added';
END
ELSE
BEGIN
    PRINT 'Migration history entry already exists';
END
GO

-- Step 3: Verify the table was created
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'UserNotifications'
ORDER BY ORDINAL_POSITION;
GO

PRINT 'Migration completed successfully!';
