-- Create TicketCustomFieldValues table if it doesn't exist
-- TicketId is UNIQUEIDENTIFIER to match Tickets.Id (PublicId)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TicketCustomFieldValues')
BEGIN
    CREATE TABLE TicketCustomFieldValues (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TicketId UNIQUEIDENTIFIER NOT NULL,
        CustomFieldId INT NOT NULL,
        Value NVARCHAR(MAX),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_TicketCustomFieldValues_TicketId ON TicketCustomFieldValues(TicketId);
    CREATE INDEX IX_TicketCustomFieldValues_CustomFieldId ON TicketCustomFieldValues(CustomFieldId);
    CREATE UNIQUE INDEX UX_TicketCustomFieldValues_TicketId_CustomFieldId ON TicketCustomFieldValues(TicketId, CustomFieldId);
    
    PRINT 'Table TicketCustomFieldValues created successfully';
END
ELSE
BEGIN
    PRINT 'Table TicketCustomFieldValues already exists';
END
