CREATE TABLE SlaEscalationContacts (
    Id int IDENTITY(1,1) PRIMARY KEY,
    SlaPolicyId uniqueidentifier NOT NULL,
    Level int NOT NULL CHECK (Level BETWEEN 1 AND 3),
    Name nvarchar(200) NOT NULL,
    Email nvarchar(256) NOT NULL,
    NotifyByEmail bit NOT NULL DEFAULT 1,
    NotifyBySystem bit NOT NULL DEFAULT 1,
    IsActive bit NOT NULL DEFAULT 1,
    CreatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_SlaEscalationContacts_SLAs_SlaPolicyId 
        FOREIGN KEY (SlaPolicyId) REFERENCES SLAs(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IX_SlaEscalationContacts_SlaPolicyId_Level_Email 
    ON SlaEscalationContacts (SlaPolicyId, Level, Email);