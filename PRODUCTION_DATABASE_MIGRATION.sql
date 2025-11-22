-- ============================================================================
-- PRODUCTION DATABASE MIGRATION SCRIPT
-- Feature: Comment Attachments & Email Notifications
-- Migration: AddCommentIdToAttachments (20251112062557)
-- Date: November 12, 2025
-- ============================================================================

-- IMPORTANT: Run this script in your PRODUCTION database
-- Make sure to backup your database BEFORE running this script

-- NOTE: Change the database name below ONLY if your production database 
-- has a different name than ERPTrainingDB (e.g., ERPTrainingDB_Production)
-- If your production database is named ERPTrainingDB, leave it as-is
USE [Support_DB]; 
GO

PRINT 'Starting database migration...';
PRINT '';

-- ============================================================================
-- Step 1: Add CommentId column to Attachments table
-- NOTE: Production uses 'Attachments' table, not 'TicketAttachments'
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Attachments') 
    AND name = 'CommentId'
)
BEGIN
    PRINT 'Adding CommentId column to Attachments table...';
    
    ALTER TABLE [dbo].[Attachments] 
    ADD [CommentId] uniqueidentifier NULL;
    
    PRINT '  CommentId column added successfully.';
END
ELSE
BEGIN
    PRINT 'CommentId column already exists. Skipping...';
END
GO

-- ============================================================================
-- Step 2: Add foreign key constraint
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 
    FROM sys.foreign_keys 
    WHERE name = 'FK_Attachments_TicketComments_CommentId'
)
BEGIN
    PRINT 'Adding foreign key constraint...';
    
    ALTER TABLE [dbo].[Attachments]
    ADD CONSTRAINT [FK_Attachments_TicketComments_CommentId] 
    FOREIGN KEY ([CommentId]) 
    REFERENCES [dbo].[TicketComments]([Id]) 
    ON DELETE NO ACTION;
    
    PRINT '  Foreign key constraint added successfully.';
END
ELSE
BEGIN
    PRINT 'Foreign key constraint already exists. Skipping...';
END
GO

-- ============================================================================
-- Step 3: Create index for performance
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = 'IX_Attachments_CommentId'
    AND object_id = OBJECT_ID('Attachments')
)
BEGIN
    PRINT 'Creating index on CommentId column...';
    
    CREATE INDEX [IX_Attachments_CommentId] 
    ON [dbo].[Attachments]([CommentId]) 
    WHERE [CommentId] IS NOT NULL;
    
    PRINT '  Index created successfully.';
END
ELSE
BEGIN
    PRINT 'Index already exists. Skipping...';
END
GO

-- ============================================================================
-- Step 4: Verify "Reopen" status exists
-- ============================================================================

PRINT 'Checking for Reopen status...';

IF NOT EXISTS (
    SELECT 1 
    FROM [dbo].[TicketStatuses] 
    WHERE [Name] = 'Reopen'
)
BEGIN
    PRINT '  WARNING: Reopen status does not exist!';
    PRINT '  Creating Reopen status...';
    
    -- Find the next available WorkflowOrder
    DECLARE @NextOrder INT;
    SELECT @NextOrder = ISNULL(MAX([WorkflowOrder]), 0) + 1 
    FROM [dbo].[TicketStatuses];
    
    INSERT INTO [dbo].[TicketStatuses] (
        [Name], 
        [WorkflowOrder], 
        [IsActive], 
        [Color], 
        [IsDefault], 
        [IsClosedStatus],
        [CreatedAt],
        [UpdatedAt]
    )
    VALUES (
        'Reopen',           -- Name
        @NextOrder,         -- WorkflowOrder (automatically calculated)
        1,                  -- IsActive
        '#FFA500',          -- Color (Orange)
        0,                  -- IsDefault
        0,                  -- IsClosedStatus
        GETUTCDATE(),       -- CreatedAt
        GETUTCDATE()        -- UpdatedAt
    );
    
    PRINT '  Reopen status created successfully.';
    PRINT '  Status ID: ' + CAST(SCOPE_IDENTITY() AS NVARCHAR(10));
END
ELSE
BEGIN
    DECLARE @ReopenId INT, @ReopenActive BIT;
    SELECT @ReopenId = [Id], @ReopenActive = [IsActive]
    FROM [dbo].[TicketStatuses] 
    WHERE [Name] = 'Reopen';
    
    PRINT '  Reopen status exists.';
    PRINT '  Status ID: ' + CAST(@ReopenId AS NVARCHAR(10));
    PRINT '  Is Active: ' + CASE WHEN @ReopenActive = 1 THEN 'Yes' ELSE 'No' END;
    
    IF @ReopenActive = 0
    BEGIN
        PRINT '  WARNING: Reopen status is inactive! Activating...';
        UPDATE [dbo].[TicketStatuses] 
        SET [IsActive] = 1, [UpdatedAt] = GETUTCDATE()
        WHERE [Id] = @ReopenId;
        PRINT '  Reopen status activated.';
    END
END
GO

-- ============================================================================
-- Step 5: Insert migration record into __EFMigrationsHistory
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 
    FROM [dbo].[__EFMigrationsHistory] 
    WHERE [MigrationId] = '20251112062557_AddCommentIdToAttachments'
)
BEGIN
    PRINT 'Recording migration in __EFMigrationsHistory...';
    
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20251112062557_AddCommentIdToAttachments', '8.0.0');
    
    PRINT '  Migration recorded successfully.';
END
ELSE
BEGIN
    PRINT 'Migration already recorded. Skipping...';
END
GO

-- ============================================================================
-- Step 6: Verification
-- ============================================================================

PRINT '';
PRINT '============================================';
PRINT 'MIGRATION VERIFICATION';
PRINT '============================================';

-- Check CommentId column
IF EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('Attachments') AND name = 'CommentId'
)
    PRINT '[OK] CommentId column exists';
ELSE
    PRINT '[FAIL] CommentId column missing!';

-- Check foreign key
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'FK_Attachments_TicketComments_CommentId'
)
    PRINT '[OK] Foreign key constraint exists';
ELSE
    PRINT '[FAIL] Foreign key constraint missing!';

-- Check index
IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Attachments_CommentId'
)
    PRINT '[OK] Index exists';
ELSE
    PRINT '[FAIL] Index missing!';

-- Check Reopen status
IF EXISTS (
    SELECT 1 FROM [dbo].[TicketStatuses] 
    WHERE [Name] = 'Reopen' AND [IsActive] = 1
)
    PRINT '[OK] Reopen status exists and is active';
ELSE
    PRINT '[FAIL] Reopen status missing or inactive!';

-- Check migration record
IF EXISTS (
    SELECT 1 FROM [dbo].[__EFMigrationsHistory] 
    WHERE [MigrationId] = '20251112062557_AddCommentIdToAttachments'
)
    PRINT '[OK] Migration recorded';
ELSE
    PRINT '[FAIL] Migration not recorded!';

PRINT '';
PRINT '============================================';
PRINT 'MIGRATION COMPLETED SUCCESSFULLY';
PRINT '============================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Deploy backend files to production server';
PRINT '2. Deploy frontend files to production server';
PRINT '3. Update appsettings.Production.json with correct configuration';
PRINT '4. Restart IIS Application Pool';
PRINT '5. Test the new features';
PRINT '';

-- Display sample data
PRINT 'Sample Attachments structure:';
SELECT TOP 3 
    [Id],
    [TicketId],
    [CommentId],
    [FileName],
    [CreatedAt]
FROM [dbo].[Attachments]
ORDER BY [CreatedAt] DESC;

PRINT '';
PRINT 'Current Ticket Statuses:';
SELECT 
    [Id],
    [Name],
    [WorkflowOrder],
    [IsActive],
    [Color]
FROM [dbo].[TicketStatuses]
WHERE [IsActive] = 1
ORDER BY [WorkflowOrder];

GO
