-- Script to Make User Admin
-- User ID: b66feb76-0e3c-4805-9719-a0e6b2a2279c

-- Step 1: Check if user exists
SELECT 
    Id, 
    Email, 
    UserName, 
    FirstName, 
    LastName, 
    Department,
    IsActive
FROM AspNetUsers 
WHERE Id = 'b66feb76-0e3c-4805-9719-a0e6b2a2279c';

-- Step 2: Check existing roles
SELECT Id, Name, NormalizedName 
FROM AspNetRoles;

-- Step 3: Create Admin role if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE Name = 'Admin')
BEGIN
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (
        NEWID(), 
        'Admin', 
        'ADMIN', 
        NEWID()
    );
    PRINT '✓ Admin role created';
END
ELSE
BEGIN
    PRINT '✓ Admin role already exists';
END;

-- Step 4: Assign Admin role to user (if not already assigned)
DECLARE @UserId NVARCHAR(450) = 'b66feb76-0e3c-4805-9719-a0e6b2a2279c';
DECLARE @RoleId NVARCHAR(450);

-- Get Admin role ID
SELECT @RoleId = Id FROM AspNetRoles WHERE Name = 'Admin';

-- Check if user already has Admin role
IF NOT EXISTS (
    SELECT 1 FROM AspNetUserRoles 
    WHERE UserId = @UserId AND RoleId = @RoleId
)
BEGIN
    -- Assign Admin role to user
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    VALUES (@UserId, @RoleId);
    PRINT '✓ Admin role assigned to user';
END
ELSE
BEGIN
    PRINT '✓ User already has Admin role';
END;

-- Step 5: Verify role assignment
SELECT 
    u.Id,
    u.Email,
    u.UserName,
    u.FirstName,
    u.LastName,
    r.Name AS RoleName
FROM AspNetUsers u
INNER JOIN AspNetUserRoles ur ON u.Id = ur.UserId
INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE u.Id = 'b66feb76-0e3c-4805-9719-a0e6b2a2279c';

PRINT '========================================';
PRINT 'User is now an Admin!';
PRINT '========================================';
