-- ============================================================================
-- QUICK FIX: Add Foreign Key Constraint Only
-- Run this in Production (Support_DB) to complete the migration
-- ============================================================================

USE [Support_DB];
GO

PRINT 'Adding foreign key constraint to Attachments table...';
PRINT '';

-- Add foreign key constraint with NO ACTION to avoid cascade conflicts
IF NOT EXISTS (
    SELECT 1 
    FROM sys.foreign_keys 
    WHERE name = 'FK_Attachments_TicketComments_CommentId'
)
BEGIN
    ALTER TABLE [dbo].[Attachments]
    ADD CONSTRAINT [FK_Attachments_TicketComments_CommentId] 
    FOREIGN KEY ([CommentId]) 
    REFERENCES [dbo].[TicketComments]([Id]) 
    ON DELETE NO ACTION;
    
    PRINT '✅ Foreign key constraint added successfully.';
END
ELSE
BEGIN
    PRINT '✅ Foreign key constraint already exists. Nothing to do.';
END
GO

-- Verification
PRINT '';
PRINT '============================================';
PRINT 'VERIFICATION';
PRINT '============================================';

IF EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'FK_Attachments_TicketComments_CommentId'
)
    PRINT '[OK] Foreign key constraint exists';
ELSE
    PRINT '[FAIL] Foreign key constraint missing!';

PRINT '';
PRINT 'Migration complete! All database changes are now applied.';
GO
