-- Create TicketCollaborators table for multi-agent assignment
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TicketCollaborators]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TicketCollaborators](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [TicketId] [uniqueidentifier] NOT NULL,
        [UserId] [nvarchar](450) NOT NULL,
        [Role] [nvarchar](max) NOT NULL,
        [AddedByUserId] [nvarchar](450) NOT NULL,
        [AddedAt] [datetime2](7) NOT NULL,
        CONSTRAINT [PK_TicketCollaborators] PRIMARY KEY CLUSTERED ([Id] ASC)
    )

    -- Add foreign keys
    ALTER TABLE [dbo].[TicketCollaborators]  WITH CHECK ADD CONSTRAINT [FK_TicketCollaborators_AspNetUsers_AddedByUserId] 
        FOREIGN KEY([AddedByUserId]) REFERENCES [dbo].[AspNetUsers] ([Id])
    
    ALTER TABLE [dbo].[TicketCollaborators]  WITH CHECK ADD  CONSTRAINT [FK_TicketCollaborators_AspNetUsers_UserId] 
        FOREIGN KEY([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id])
    
    ALTER TABLE [dbo].[TicketCollaborators]  WITH CHECK ADD  CONSTRAINT [FK_TicketCollaborators_Tickets_TicketId] 
        FOREIGN KEY([TicketId]) REFERENCES [dbo].[Tickets] ([Id]) ON DELETE CASCADE

    -- Add indexes
    CREATE NONCLUSTERED INDEX [IX_TicketCollaborators_AddedByUserId] ON [dbo].[TicketCollaborators]
    (
        [AddedByUserId] ASC
    )

    CREATE UNIQUE NONCLUSTERED INDEX [IX_TicketCollaborators_TicketId_UserId] ON [dbo].[TicketCollaborators]
    (
        [TicketId] ASC,
        [UserId] ASC
    )

    CREATE NONCLUSTERED INDEX [IX_TicketCollaborators_UserId] ON [dbo].[TicketCollaborators]
    (
        [UserId] ASC
    )

    PRINT 'TicketCollaborators table created successfully'
END
ELSE
BEGIN
    PRINT 'TicketCollaborators table already exists'
END
