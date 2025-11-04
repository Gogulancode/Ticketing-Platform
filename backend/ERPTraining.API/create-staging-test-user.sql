-- Create test user in staging database
-- Run this on: sql8020.site4now.net, Database: db_aae2b0_solutionsnext

-- Insert user if not exists
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Email = 'gogulan@moojic.com')
BEGIN
    INSERT INTO AspNetUsers (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, 
                             FirstName, LastName, Department, IsActive, JoinDate, CreatedAt, UpdatedAt, 
                             SecurityStamp, ConcurrencyStamp)
    VALUES (NEWID(), 'gogulan@moojic.com', 'GOGULAN@MOOJIC.COM', 'gogulan@moojic.com', 'GOGULAN@MOOJIC.COM', 1,
            'Gogulan', '', 'IT', 1, GETUTCDATE(), GETUTCDATE(), GETUTCDATE(),
            NEWID(), NEWID());
    PRINT ' User created';
END
ELSE
BEGIN
    PRINT ' User already exists';
END;

-- Assign Admin role
DECLARE @UserId NVARCHAR(450);
DECLARE @RoleId NVARCHAR(450);

SELECT @UserId = Id FROM AspNetUsers WHERE Email = 'gogulan@moojic.com';
SELECT @RoleId = Id FROM AspNetRoles WHERE Name = 'Admin';

IF @RoleId IS NULL
BEGIN
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (NEWID(), 'Admin', 'ADMIN', NEWID());
    SELECT @RoleId = Id FROM AspNetRoles WHERE Name = 'Admin';
    PRINT ' Admin role created';
END;

IF NOT EXISTS (SELECT 1 FROM AspNetUserRoles WHERE UserId = @UserId AND RoleId = @RoleId)
BEGIN
    INSERT INTO AspNetUserRoles (UserId, RoleId) VALUES (@UserId, @RoleId);
    PRINT ' Admin role assigned';
END;

SELECT u.Email, u.FirstName, u.LastName, r.Name AS RoleName
FROM AspNetUsers u
LEFT JOIN AspNetUserRoles ur ON u.Id = ur.UserId
LEFT JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE u.Email = 'gogulan@moojic.com';
