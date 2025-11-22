-- Add EscalationTime column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SlaPolicies') AND name = 'EscalationTime')
BEGIN
    ALTER TABLE SlaPolicies ADD EscalationTime INT NULL;
    PRINT 'EscalationTime column added to SlaPolicies table';
END
ELSE
BEGIN
    PRINT 'EscalationTime column already exists';
END
GO

-- Add names to existing SLA policies based on their priority
UPDATE SlaPolicies
SET 
    Name = CASE Priority
        WHEN 0 THEN 'Critical Priority SLA'
        WHEN 1 THEN 'High Priority SLA'
        WHEN 2 THEN 'Medium Priority SLA'
        WHEN 3 THEN 'Low Priority SLA'
        ELSE 'Standard SLA Policy'
    END,
    Description = CASE Priority
        WHEN 0 THEN 'SLA for critical issues requiring immediate attention'
        WHEN 1 THEN 'SLA for high priority issues'
        WHEN 2 THEN 'SLA for medium priority issues'
        WHEN 3 THEN 'SLA for low priority issues'
        ELSE 'Standard service level agreement'
    END,
    IsActive = 1,
    UpdatedAt = GETUTCDATE()
WHERE Name IS NULL;

PRINT 'SLA policies updated with names and descriptions';
GO

-- Show updated policies
SELECT Id, Name, Description, Category, Priority, FirstResponseMins, ResolutionMins, EscalationTime, IsActive
FROM SlaPolicies;
GO
