BEGIN TRANSACTION;
ALTER TABLE [UserRoles] DROP CONSTRAINT [FK_UserRoles_RoleMasters_RoleId];

DROP INDEX [IX_UserRoles_RoleId] ON [UserRoles];
DROP INDEX [IX_UserRoles_UserId_RoleId] ON [UserRoles];
DECLARE @var sysname;
SELECT @var = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[UserRoles]') AND [c].[name] = N'RoleId');
IF @var IS NOT NULL EXEC(N'ALTER TABLE [UserRoles] DROP CONSTRAINT [' + @var + '];');
ALTER TABLE [UserRoles] ALTER COLUMN [RoleId] nvarchar(450) NOT NULL;
CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
CREATE UNIQUE INDEX [IX_UserRoles_UserId_RoleId] ON [UserRoles] ([UserId], [RoleId]);

CREATE TABLE [UserNotifications] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(max) NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Message] nvarchar(1000) NOT NULL,
    [Type] nvarchar(50) NOT NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ActionUrl] nvarchar(500) NULL,
    CONSTRAINT [PK_UserNotifications] PRIMARY KEY ([Id])
);

ALTER TABLE [UserRoles] ADD CONSTRAINT [FK_UserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251101075532_AddUserNotifications', N'9.0.7');

COMMIT;
GO

