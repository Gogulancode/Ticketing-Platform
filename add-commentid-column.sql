-- Add CommentId column to Attachments table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Attachments]') AND name = 'CommentId')
BEGIN
    ALTER TABLE [dbo].[Attachments]
    ADD [CommentId] uniqueidentifier NULL;
    
    CREATE NONCLUSTERED INDEX [IX_Attachments_CommentId]
    ON [dbo].[Attachments]([CommentId] ASC);
    
    ALTER TABLE [dbo].[Attachments]
    ADD CONSTRAINT [FK_Attachments_TicketComments_CommentId]
    FOREIGN KEY([CommentId])
    REFERENCES [dbo].[TicketComments]([Id]);
    
    PRINT 'CommentId column added successfully to Attachments table';
END
ELSE
BEGIN
    PRINT 'CommentId column already exists in Attachments table';
END
