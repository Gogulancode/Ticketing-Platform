IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetRoles] (
        [Id] nvarchar(450) NOT NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUsers] (
        [Id] nvarchar(450) NOT NULL,
        [FirstName] nvarchar(max) NOT NULL,
        [LastName] nvarchar(max) NOT NULL,
        [Department] nvarchar(max) NOT NULL,
        [Position] nvarchar(max) NULL,
        [IsAgent] bit NOT NULL,
        [JoinDate] datetime2 NOT NULL,
        [Avatar] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AutoAssignmentRules] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(max) NULL,
        [CategoryId] int NULL,
        [SubCategoryId] int NULL,
        [TicketPriority] int NULL,
        [DepartmentId] int NULL,
        [Keywords] nvarchar(max) NULL,
        [Strategy] int NOT NULL,
        [Priority] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AutoAssignmentRules] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [EmailAttachments] (
        [Id] int NOT NULL IDENTITY,
        [ProcessingLogId] int NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [SizeBytes] bigint NOT NULL,
        CONSTRAINT [PK_EmailAttachments] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [EmailMailboxes] (
        [Id] int NOT NULL IDENTITY,
        [Address] nvarchar(max) NOT NULL,
        [Active] bit NOT NULL,
        [EmailAddress] nvarchar(max) NOT NULL,
        [IsEnabled] bit NOT NULL,
        [DefaultDepartment] nvarchar(max) NOT NULL,
        [DefaultPriority] int NOT NULL,
        [DefaultCategory] int NOT NULL,
        [DefaultSubCategory] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_EmailMailboxes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [EmailMonitoringStatuses] (
        [Id] int NOT NULL IDENTITY,
        [IsRunning] bit NOT NULL,
        [LastCheck] datetime2 NOT NULL,
        [MonitoredEmails] nvarchar(max) NOT NULL,
        [ProcessedToday] int NOT NULL,
        [ErrorsToday] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_EmailMonitoringStatuses] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [EmailSettings] (
        [Id] int NOT NULL IDENTITY,
        [Host] nvarchar(max) NOT NULL,
        [Port] int NOT NULL,
        [Username] nvarchar(max) NOT NULL,
        [Password] nvarchar(max) NOT NULL,
        [UseSsl] bit NOT NULL,
        [SmtpServer] nvarchar(max) NOT NULL,
        [SmtpPort] int NOT NULL,
        [SmtpUsername] nvarchar(max) NOT NULL,
        [SmtpPassword] nvarchar(max) NOT NULL,
        [FromEmail] nvarchar(max) NOT NULL,
        [FromName] nvarchar(max) NOT NULL,
        [IsEnabled] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_EmailSettings] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [GraphEmailConfigs] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] nvarchar(100) NOT NULL,
        [ClientId] nvarchar(100) NOT NULL,
        [ClientSecret] nvarchar(500) NOT NULL,
        [Email] nvarchar(255) NOT NULL,
        [IsActive] bit NOT NULL,
        [CategoryId] int NULL,
        [ProcessIncomingEmails] bit NOT NULL,
        [CreateTicketsFromEmails] bit NOT NULL,
        [SendNotifications] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [Category] int NULL,
        CONSTRAINT [PK_GraphEmailConfigs] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [IssueTypes] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [Color] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_IssueTypes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [PlatformPermissions] (
        [Id] int NOT NULL IDENTITY,
        [PermissionName] nvarchar(100) NOT NULL,
        [Feature] nvarchar(50) NOT NULL,
        [Action] nvarchar(50) NOT NULL,
        [Description] nvarchar(500) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_PlatformPermissions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [PlatformRoles] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [RoleName] nvarchar(450) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_PlatformRoles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [SLAs] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [IsDeleted] bit NOT NULL,
        [Category] int NOT NULL,
        [Priority] int NOT NULL,
        [FirstResponseMins] int NOT NULL,
        [ResolutionMins] int NOT NULL,
        [EscalationTime] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_SLAs] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketCategories] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [Color] nvarchar(max) NULL,
        [IconName] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TicketCategories] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketConfigurations] (
        [Id] int NOT NULL IDENTITY,
        [AutoCloseDays] int NOT NULL,
        [EnableSla] bit NOT NULL,
        CONSTRAINT [PK_TicketConfigurations] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketDepartments] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [SortOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketDepartments] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketFieldSettings] (
        [Id] int NOT NULL IDENTITY,
        [CategoryId] int NOT NULL,
        [FieldName] nvarchar(100) NOT NULL,
        [FieldType] nvarchar(50) NOT NULL,
        [IsMandatory] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [Options] nvarchar(1000) NULL,
        [PlaceholderText] nvarchar(200) NULL,
        [DisplayOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [Category] int NULL,
        CONSTRAINT [PK_TicketFieldSettings] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketPriorities] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Level] int NOT NULL,
        [Color] nvarchar(max) NULL,
        [SortOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [IsDeleted] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketPriorities] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketStatuses] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [WorkflowOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [IsDeleted] bit NOT NULL,
        [Color] nvarchar(max) NOT NULL,
        [IsDefault] bit NOT NULL,
        [IsClosedStatus] bit NOT NULL,
        [AllowedTransitions] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketStatuses] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketTags] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [SubCategoryId] int NOT NULL,
        [IsActive] bit NOT NULL,
        [IsDeleted] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketTags] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetRoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [Agents] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [Department] nvarchar(max) NOT NULL,
        [DepartmentId] int NULL,
        [AgentGroupId] int NULL,
        [IsActive] bit NOT NULL,
        [MaxTicketsCapacity] int NOT NULL,
        [CurrentTicketCount] int NOT NULL,
        [AvailabilityStatus] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Agents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Agents_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserRoles] (
        [UserId] nvarchar(450) NOT NULL,
        [RoleId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserTokens] (
        [UserId] nvarchar(450) NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [EmailProcessingRules] (
        [Id] int NOT NULL IDENTITY,
        [Pattern] nvarchar(max) NOT NULL,
        [Action] nvarchar(max) NOT NULL,
        [MailboxId] int NULL,
        [Priority] int NOT NULL,
        [RuleType] nvarchar(max) NOT NULL,
        [MatchType] nvarchar(max) NOT NULL,
        [MatchValue] nvarchar(max) NOT NULL,
        [AssignToCategory] int NOT NULL,
        [AssignToSubCategory] int NOT NULL,
        [AssignToDepartment] nvarchar(max) NOT NULL,
        [IsEnabled] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_EmailProcessingRules] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_EmailProcessingRules_EmailMailboxes_MailboxId] FOREIGN KEY ([MailboxId]) REFERENCES [EmailMailboxes] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [RolePermissions] (
        [Id] int NOT NULL IDENTITY,
        [PlatformRoleId] int NOT NULL,
        [PlatformPermissionId] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RolePermissions_PlatformPermissions_PlatformPermissionId] FOREIGN KEY ([PlatformPermissionId]) REFERENCES [PlatformPermissions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RolePermissions_PlatformRoles_PlatformRoleId] FOREIGN KEY ([PlatformRoleId]) REFERENCES [PlatformRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [UserPlatformRoles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [PlatformRoleId] int NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        [RevokedAt] datetime2 NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_UserPlatformRoles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UserPlatformRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserPlatformRoles_PlatformRoles_PlatformRoleId] FOREIGN KEY ([PlatformRoleId]) REFERENCES [PlatformRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [SlaEscalationContacts] (
        [Id] int NOT NULL IDENTITY,
        [SlaPolicyId] uniqueidentifier NOT NULL,
        [Level] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Email] nvarchar(256) NOT NULL,
        [NotifyByEmail] bit NOT NULL,
        [NotifyBySystem] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_SlaEscalationContacts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SlaEscalationContacts_SLAs_SlaPolicyId] FOREIGN KEY ([SlaPolicyId]) REFERENCES [SLAs] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [SlaEscalationLevels] (
        [Id] int NOT NULL IDENTITY,
        [SlaPolicyId] uniqueidentifier NOT NULL,
        [Level] int NOT NULL,
        [TriggerAtMinutes] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_SlaEscalationLevels] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SlaEscalationLevels_SLAs_SlaPolicyId] FOREIGN KEY ([SlaPolicyId]) REFERENCES [SLAs] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [Tickets] (
        [Id] uniqueidentifier NOT NULL,
        [PublicId] int NULL,
        [Title] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Category] int NOT NULL,
        [Priority] int NOT NULL,
        [Status] int NOT NULL,
        [Source] int NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [AssignedToUserId] nvarchar(450) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [FirstResponseAt] datetime2 NULL,
        [ResolvedAt] datetime2 NULL,
        [SlaPolicyId] uniqueidentifier NULL,
        [SlaResponseDueAt] datetime2 NULL,
        [SlaResolutionDueAt] datetime2 NULL,
        [SlaResponseMet] bit NOT NULL,
        [SlaResolutionMet] bit NOT NULL,
        [SlaBreached] bit NOT NULL,
        [SlaEscalationLevel] int NOT NULL,
        [LastSlaEscalationAt] datetime2 NULL,
        [SubCategory] int NULL,
        [CategoryId] int NULL,
        [SubcategoryId] int NULL,
        [DepartmentId] int NULL,
        CONSTRAINT [PK_Tickets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Tickets_AspNetUsers_AssignedToUserId] FOREIGN KEY ([AssignedToUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Tickets_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Tickets_SLAs_SlaPolicyId] FOREIGN KEY ([SlaPolicyId]) REFERENCES [SLAs] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [CategoryEmailMappings] (
        [Id] int NOT NULL IDENTITY,
        [CategoryId] int NOT NULL,
        [EmailAddress] nvarchar(255) NOT NULL,
        [DisplayName] nvarchar(100) NULL,
        [SmtpServer] nvarchar(max) NULL,
        [SmtpPort] int NULL,
        [SmtpUseSsl] bit NOT NULL,
        [SmtpUsername] nvarchar(max) NULL,
        [SmtpPassword] nvarchar(max) NULL,
        [ImapServer] nvarchar(max) NULL,
        [ImapPort] int NULL,
        [ImapUseSsl] bit NOT NULL,
        [ImapUsername] nvarchar(max) NULL,
        [ImapPassword] nvarchar(max) NULL,
        [KeywordMappings] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CategoryEmailMappings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CategoryEmailMappings_TicketCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [TicketCategories] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketSubCategories] (
        [Id] int NOT NULL IDENTITY,
        [CategoryId] int NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TicketSubCategories] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketSubCategories_TicketCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [TicketCategories] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AutoAssignmentRuleAgents] (
        [Id] int NOT NULL IDENTITY,
        [RuleId] int NOT NULL,
        [AgentId] int NOT NULL,
        [Weight] int NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_AutoAssignmentRuleAgents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AutoAssignmentRuleAgents_Agents_AgentId] FOREIGN KEY ([AgentId]) REFERENCES [Agents] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AutoAssignmentRuleAgents_AutoAssignmentRules_RuleId] FOREIGN KEY ([RuleId]) REFERENCES [AutoAssignmentRules] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] int NOT NULL IDENTITY,
        [TicketId] uniqueidentifier NOT NULL,
        [Field] nvarchar(max) NOT NULL,
        [OldValue] nvarchar(max) NULL,
        [NewValue] nvarchar(max) NULL,
        [ChangedBy] nvarchar(450) NOT NULL,
        [ChangedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditLogs_AspNetUsers_ChangedBy] FOREIGN KEY ([ChangedBy]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AuditLogs_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [EmailProcessingLogs] (
        [Id] int NOT NULL IDENTITY,
        [Subject] nvarchar(max) NOT NULL,
        [From] nvarchar(max) NOT NULL,
        [ReceivedAt] datetime2 NOT NULL,
        [Processed] bit NOT NULL,
        [TicketId] uniqueidentifier NULL,
        [MessageId] nvarchar(max) NOT NULL,
        [FromEmail] nvarchar(max) NOT NULL,
        [ToEmail] nvarchar(max) NOT NULL,
        [Body] nvarchar(max) NOT NULL,
        [ProcessingStatus] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ProcessedAt] datetime2 NULL,
        [ErrorMessage] nvarchar(max) NULL,
        [MatchedRuleId] int NULL,
        CONSTRAINT [PK_EmailProcessingLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_EmailProcessingLogs_EmailProcessingRules_MatchedRuleId] FOREIGN KEY ([MatchedRuleId]) REFERENCES [EmailProcessingRules] ([Id]),
        CONSTRAINT [FK_EmailProcessingLogs_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketCollaborators] (
        [Id] int NOT NULL IDENTITY,
        [TicketId] uniqueidentifier NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [Role] nvarchar(max) NOT NULL,
        [AddedByUserId] nvarchar(450) NOT NULL,
        [AddedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketCollaborators] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketCollaborators_AspNetUsers_AddedByUserId] FOREIGN KEY ([AddedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TicketCollaborators_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TicketCollaborators_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketComments] (
        [Id] uniqueidentifier NOT NULL,
        [TicketId] uniqueidentifier NOT NULL,
        [Body] nvarchar(max) NOT NULL,
        [IsInternal] bit NOT NULL,
        [AuthorUserId] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketComments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketComments_AspNetUsers_AuthorUserId] FOREIGN KEY ([AuthorUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TicketComments_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketLinks] (
        [Id] int NOT NULL IDENTITY,
        [TicketId] uniqueidentifier NOT NULL,
        [ObjectType] int NOT NULL,
        [ObjectId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_TicketLinks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketLinks_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [CustomFields] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Label] nvarchar(200) NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [CategoryId] int NULL,
        [SubCategoryId] int NULL,
        [Options] nvarchar(1000) NULL,
        [Placeholder] nvarchar(500) NULL,
        [IsRequired] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [IsDeleted] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [ValidationRules] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CustomFields] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CustomFields_TicketCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [TicketCategories] ([Id]),
        CONSTRAINT [FK_CustomFields_TicketSubCategories_SubCategoryId] FOREIGN KEY ([SubCategoryId]) REFERENCES [TicketSubCategories] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [QuickTemplates] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Label] nvarchar(max) NOT NULL,
        [TitleTemplate] nvarchar(max) NOT NULL,
        [DescriptionTemplate] nvarchar(max) NOT NULL,
        [IconName] nvarchar(max) NOT NULL,
        [Category] nvarchar(max) NOT NULL,
        [Priority] int NOT NULL,
        [CategoryId] int NULL,
        [SubcategoryId] int NULL,
        [DepartmentId] int NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [IsDeleted] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_QuickTemplates] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuickTemplates_TicketCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [TicketCategories] ([Id]),
        CONSTRAINT [FK_QuickTemplates_TicketSubCategories_SubcategoryId] FOREIGN KEY ([SubcategoryId]) REFERENCES [TicketSubCategories] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [SubcategoryKeywords] (
        [Id] int NOT NULL IDENTITY,
        [SubcategoryId] int NOT NULL,
        [Keyword] nvarchar(100) NOT NULL,
        [Weight] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(450) NULL,
        [Description] nvarchar(500) NULL,
        CONSTRAINT [PK_SubcategoryKeywords] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SubcategoryKeywords_TicketSubCategories_SubcategoryId] FOREIGN KEY ([SubcategoryId]) REFERENCES [TicketSubCategories] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketAssignments] (
        [Id] int NOT NULL IDENTITY,
        [CategoryId] int NOT NULL,
        [SubCategoryId] int NULL,
        [AgentId] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [Category] int NULL,
        CONSTRAINT [PK_TicketAssignments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketAssignments_Agents_AgentId] FOREIGN KEY ([AgentId]) REFERENCES [Agents] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_TicketAssignments_TicketSubCategories_SubCategoryId] FOREIGN KEY ([SubCategoryId]) REFERENCES [TicketSubCategories] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketGroups] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [CategoryId] int NOT NULL,
        [SubCategoryId] int NULL,
        [IsActive] bit NOT NULL,
        [IsDeleted] bit NOT NULL,
        [AutoAssignmentEnabled] bit NOT NULL,
        [MaxTicketsPerAgent] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketGroups] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketGroups_TicketCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [TicketCategories] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_TicketGroups_TicketSubCategories_SubCategoryId] FOREIGN KEY ([SubCategoryId]) REFERENCES [TicketSubCategories] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [Attachments] (
        [Id] uniqueidentifier NOT NULL,
        [TicketId] uniqueidentifier NOT NULL,
        [CommentId] uniqueidentifier NULL,
        [FileName] nvarchar(max) NOT NULL,
        [ContentType] nvarchar(max) NOT NULL,
        [SizeBytes] bigint NOT NULL,
        [StoragePath] nvarchar(max) NOT NULL,
        [UploadedByUserId] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Attachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Attachments_AspNetUsers_UploadedByUserId] FOREIGN KEY ([UploadedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Attachments_TicketComments_CommentId] FOREIGN KEY ([CommentId]) REFERENCES [TicketComments] ([Id]),
        CONSTRAINT [FK_Attachments_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketFieldValues] (
        [Id] int NOT NULL IDENTITY,
        [TicketId] uniqueidentifier NOT NULL,
        [CustomFieldId] int NOT NULL,
        [Value] nvarchar(2000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketFieldValues] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketFieldValues_CustomFields_CustomFieldId] FOREIGN KEY ([CustomFieldId]) REFERENCES [CustomFields] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_TicketFieldValues_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AssignmentHistories] (
        [Id] int NOT NULL IDENTITY,
        [TicketId] uniqueidentifier NOT NULL,
        [PreviousAssigneeId] nvarchar(450) NULL,
        [NewAssigneeId] nvarchar(450) NULL,
        [PreviousAgentId] int NULL,
        [NewAgentId] int NULL,
        [PreviousGroupId] int NULL,
        [NewGroupId] int NULL,
        [AssignmentType] int NOT NULL,
        [Reason] int NOT NULL,
        [AutoAssignmentRuleId] int NULL,
        [AssignedByUserId] nvarchar(450) NULL,
        [Notes] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AssignmentHistories] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AssignmentHistories_Agents_NewAgentId] FOREIGN KEY ([NewAgentId]) REFERENCES [Agents] ([Id]),
        CONSTRAINT [FK_AssignmentHistories_Agents_PreviousAgentId] FOREIGN KEY ([PreviousAgentId]) REFERENCES [Agents] ([Id]),
        CONSTRAINT [FK_AssignmentHistories_AspNetUsers_AssignedByUserId] FOREIGN KEY ([AssignedByUserId]) REFERENCES [AspNetUsers] ([Id]),
        CONSTRAINT [FK_AssignmentHistories_AspNetUsers_NewAssigneeId] FOREIGN KEY ([NewAssigneeId]) REFERENCES [AspNetUsers] ([Id]),
        CONSTRAINT [FK_AssignmentHistories_AspNetUsers_PreviousAssigneeId] FOREIGN KEY ([PreviousAssigneeId]) REFERENCES [AspNetUsers] ([Id]),
        CONSTRAINT [FK_AssignmentHistories_AutoAssignmentRules_AutoAssignmentRuleId] FOREIGN KEY ([AutoAssignmentRuleId]) REFERENCES [AutoAssignmentRules] ([Id]),
        CONSTRAINT [FK_AssignmentHistories_TicketGroups_NewGroupId] FOREIGN KEY ([NewGroupId]) REFERENCES [TicketGroups] ([Id]),
        CONSTRAINT [FK_AssignmentHistories_TicketGroups_PreviousGroupId] FOREIGN KEY ([PreviousGroupId]) REFERENCES [TicketGroups] ([Id]),
        CONSTRAINT [FK_AssignmentHistories_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [AutoAssignmentRuleGroups] (
        [Id] int NOT NULL IDENTITY,
        [RuleId] int NOT NULL,
        [GroupId] int NOT NULL,
        [Weight] int NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_AutoAssignmentRuleGroups] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AutoAssignmentRuleGroups_AutoAssignmentRules_RuleId] FOREIGN KEY ([RuleId]) REFERENCES [AutoAssignmentRules] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AutoAssignmentRuleGroups_TicketGroups_GroupId] FOREIGN KEY ([GroupId]) REFERENCES [TicketGroups] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE TABLE [TicketGroupAgents] (
        [Id] int NOT NULL IDENTITY,
        [TicketGroupId] int NOT NULL,
        [AgentId] int NOT NULL,
        [IsActive] bit NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketGroupAgents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketGroupAgents_Agents_AgentId] FOREIGN KEY ([AgentId]) REFERENCES [Agents] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_TicketGroupAgents_TicketGroups_TicketGroupId] FOREIGN KEY ([TicketGroupId]) REFERENCES [TicketGroups] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Agents_UserId] ON [Agents] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AssignmentHistories_AssignedByUserId] ON [AssignmentHistories] ([AssignedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AssignmentHistories_AutoAssignmentRuleId] ON [AssignmentHistories] ([AutoAssignmentRuleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AssignmentHistories_NewAgentId] ON [AssignmentHistories] ([NewAgentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AssignmentHistories_NewAssigneeId] ON [AssignmentHistories] ([NewAssigneeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AssignmentHistories_NewGroupId] ON [AssignmentHistories] ([NewGroupId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AssignmentHistories_PreviousAgentId] ON [AssignmentHistories] ([PreviousAgentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AssignmentHistories_PreviousAssigneeId] ON [AssignmentHistories] ([PreviousAssigneeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AssignmentHistories_PreviousGroupId] ON [AssignmentHistories] ([PreviousGroupId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AssignmentHistories_TicketId] ON [AssignmentHistories] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Attachments_CommentId] ON [Attachments] ([CommentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Attachments_TicketId] ON [Attachments] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Attachments_UploadedByUserId] ON [Attachments] ([UploadedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_ChangedAt] ON [AuditLogs] ([ChangedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_ChangedBy] ON [AuditLogs] ([ChangedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_TicketId] ON [AuditLogs] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AutoAssignmentRuleAgents_AgentId] ON [AutoAssignmentRuleAgents] ([AgentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AutoAssignmentRuleAgents_RuleId] ON [AutoAssignmentRuleAgents] ([RuleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AutoAssignmentRuleGroups_GroupId] ON [AutoAssignmentRuleGroups] ([GroupId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AutoAssignmentRuleGroups_RuleId] ON [AutoAssignmentRuleGroups] ([RuleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CategoryEmailMappings_CategoryId_EmailAddress] ON [CategoryEmailMappings] ([CategoryId], [EmailAddress]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CustomFields_CategoryId] ON [CustomFields] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CustomFields_SubCategoryId] ON [CustomFields] ([SubCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_EmailMonitoringStatuses_Id] ON [EmailMonitoringStatuses] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_EmailProcessingLogs_MatchedRuleId] ON [EmailProcessingLogs] ([MatchedRuleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_EmailProcessingLogs_TicketId] ON [EmailProcessingLogs] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_EmailProcessingRules_MailboxId] ON [EmailProcessingRules] ([MailboxId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PlatformPermissions_Feature_Action] ON [PlatformPermissions] ([Feature], [Action]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PlatformRoles_RoleName] ON [PlatformRoles] ([RoleName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuickTemplates_CategoryId] ON [QuickTemplates] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuickTemplates_SubcategoryId] ON [QuickTemplates] ([SubcategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RolePermissions_PlatformPermissionId] ON [RolePermissions] ([PlatformPermissionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RolePermissions_PlatformRoleId_PlatformPermissionId] ON [RolePermissions] ([PlatformRoleId], [PlatformPermissionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SlaEscalationContacts_SlaPolicyId_Level_Email] ON [SlaEscalationContacts] ([SlaPolicyId], [Level], [Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SlaEscalationLevels_SlaPolicyId_Level] ON [SlaEscalationLevels] ([SlaPolicyId], [Level]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SubcategoryKeywords_SubcategoryId] ON [SubcategoryKeywords] ([SubcategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketAssignments_AgentId] ON [TicketAssignments] ([AgentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketAssignments_SubCategoryId] ON [TicketAssignments] ([SubCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketCollaborators_AddedByUserId] ON [TicketCollaborators] ([AddedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TicketCollaborators_TicketId_UserId] ON [TicketCollaborators] ([TicketId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketCollaborators_UserId] ON [TicketCollaborators] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketComments_AuthorUserId] ON [TicketComments] ([AuthorUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketComments_CreatedAt] ON [TicketComments] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketComments_TicketId] ON [TicketComments] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketFieldValues_CustomFieldId] ON [TicketFieldValues] ([CustomFieldId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketFieldValues_TicketId] ON [TicketFieldValues] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketGroupAgents_AgentId] ON [TicketGroupAgents] ([AgentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketGroupAgents_TicketGroupId] ON [TicketGroupAgents] ([TicketGroupId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketGroups_CategoryId] ON [TicketGroups] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketGroups_SubCategoryId] ON [TicketGroups] ([SubCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TicketLinks_TicketId_ObjectType_ObjectId] ON [TicketLinks] ([TicketId], [ObjectType], [ObjectId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tickets_AssignedToUserId] ON [Tickets] ([AssignedToUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tickets_CreatedAt] ON [Tickets] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tickets_CreatedByUserId] ON [Tickets] ([CreatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tickets_Priority] ON [Tickets] ([Priority]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tickets_SlaPolicyId] ON [Tickets] ([SlaPolicyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Tickets_Status] ON [Tickets] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TicketSubCategories_CategoryId] ON [TicketSubCategories] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_UserPlatformRoles_PlatformRoleId] ON [UserPlatformRoles] ([PlatformRoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_UserPlatformRoles_UserId_PlatformRoleId] ON [UserPlatformRoles] ([UserId], [PlatformRoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210201805_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251210201805_InitialCreate', N'9.0.7');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210202646_AddBranches'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [BranchId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210202646_AddBranches'
)
BEGIN
    CREATE TABLE [Branches] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(450) NOT NULL,
        [Code] nvarchar(450) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Address] nvarchar(max) NULL,
        [City] nvarchar(max) NULL,
        [State] nvarchar(max) NULL,
        [Country] nvarchar(max) NULL,
        [PostalCode] nvarchar(max) NULL,
        [Phone] nvarchar(max) NULL,
        [Email] nvarchar(max) NULL,
        [ManagerName] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [IsHeadquarters] bit NOT NULL,
        [SortOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Branches] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210202646_AddBranches'
)
BEGIN
    CREATE INDEX [IX_AspNetUsers_BranchId] ON [AspNetUsers] ([BranchId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210202646_AddBranches'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Branches_Code] ON [Branches] ([Code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210202646_AddBranches'
)
BEGIN
    CREATE INDEX [IX_Branches_Name] ON [Branches] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210202646_AddBranches'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD CONSTRAINT [FK_AspNetUsers_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251210202646_AddBranches'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251210202646_AddBranches', N'9.0.7');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [CannedResponses] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(max) NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [ShortCode] nvarchar(max) NULL,
        [CategoryId] int NULL,
        [IsPersonal] bit NOT NULL,
        [OwnerUserId] nvarchar(450) NULL,
        [IsActive] bit NOT NULL,
        [UseCount] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CannedResponses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CannedResponses_AspNetUsers_OwnerUserId] FOREIGN KEY ([OwnerUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [ContactSubmissions] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Email] nvarchar(200) NOT NULL,
        [Phone] nvarchar(20) NULL,
        [Subject] nvarchar(200) NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [Type] int NOT NULL,
        [IsProcessed] bit NOT NULL,
        [ConvertedToTicketId] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ProcessedAt] datetime2 NULL,
        CONSTRAINT [PK_ContactSubmissions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [CustomerProfiles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [CompanyName] nvarchar(100) NULL,
        [JobTitle] nvarchar(50) NULL,
        [Phone] nvarchar(20) NULL,
        [Address] nvarchar(500) NULL,
        [AvatarUrl] nvarchar(max) NULL,
        [PreferredLanguage] nvarchar(10) NULL,
        [Timezone] nvarchar(50) NULL,
        [EmailNotifications] bit NOT NULL,
        [TicketUpdateNotifications] bit NOT NULL,
        [MarketingEmails] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CustomerProfiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CustomerProfiles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [KnowledgeBaseCategories] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Slug] nvarchar(200) NOT NULL,
        [Description] nvarchar(500) NULL,
        [IconName] nvarchar(max) NULL,
        [ParentCategoryId] int NULL,
        [SortOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_KnowledgeBaseCategories] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_KnowledgeBaseCategories_KnowledgeBaseCategories_ParentCategoryId] FOREIGN KEY ([ParentCategoryId]) REFERENCES [KnowledgeBaseCategories] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [PortalAnnouncements] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [Type] int NOT NULL,
        [IsActive] bit NOT NULL,
        [IsPinned] bit NOT NULL,
        [StartsAt] datetime2 NULL,
        [ExpiresAt] datetime2 NULL,
        [CreatedById] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_PortalAnnouncements] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PortalAnnouncements_AspNetUsers_CreatedById] FOREIGN KEY ([CreatedById]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [ServiceStatuses] (
        [Id] int NOT NULL IDENTITY,
        [ServiceName] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [Status] int NOT NULL,
        [StatusMessage] nvarchar(500) NULL,
        [LastCheckedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsPublic] bit NOT NULL,
        [SortOrder] int NOT NULL,
        CONSTRAINT [PK_ServiceStatuses] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [TicketRelations] (
        [Id] int NOT NULL IDENTITY,
        [SourceTicketId] uniqueidentifier NOT NULL,
        [RelatedTicketId] uniqueidentifier NOT NULL,
        [RelationType] nvarchar(max) NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketRelations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketRelations_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TicketRelations_Tickets_RelatedTicketId] FOREIGN KEY ([RelatedTicketId]) REFERENCES [Tickets] ([Id]),
        CONSTRAINT [FK_TicketRelations_Tickets_SourceTicketId] FOREIGN KEY ([SourceTicketId]) REFERENCES [Tickets] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [TicketSatisfactions] (
        [Id] int NOT NULL IDENTITY,
        [TicketId] uniqueidentifier NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [Rating] int NOT NULL,
        [Feedback] nvarchar(max) NULL,
        [SatisfactionLevel] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_TicketSatisfactions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketSatisfactions_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TicketSatisfactions_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [TicketTemplates] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [TitleTemplate] nvarchar(max) NOT NULL,
        [BodyTemplate] nvarchar(max) NOT NULL,
        [CategoryId] int NULL,
        [SubcategoryId] int NULL,
        [DefaultPriority] int NOT NULL,
        [DefaultAssigneeId] nvarchar(450) NULL,
        [DefaultGroupId] int NULL,
        [IsActive] bit NOT NULL,
        [IsPublic] bit NOT NULL,
        [SortOrder] int NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketTemplates] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketTemplates_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TicketTemplates_AspNetUsers_DefaultAssigneeId] FOREIGN KEY ([DefaultAssigneeId]) REFERENCES [AspNetUsers] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [TicketTimeEntries] (
        [Id] int NOT NULL IDENTITY,
        [TicketId] uniqueidentifier NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [MinutesSpent] int NOT NULL,
        [Description] nvarchar(max) NULL,
        [StartTime] datetime2 NOT NULL,
        [EndTime] datetime2 NULL,
        [IsBillable] bit NOT NULL,
        [TimeEntryType] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketTimeEntries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketTimeEntries_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TicketTimeEntries_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [TicketWatchers] (
        [Id] int NOT NULL IDENTITY,
        [TicketId] uniqueidentifier NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [NotifyOnComment] bit NOT NULL,
        [NotifyOnStatusChange] bit NOT NULL,
        [NotifyOnAssignment] bit NOT NULL,
        [NotifyOnResolution] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketWatchers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketWatchers_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TicketWatchers_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [FAQs] (
        [Id] int NOT NULL IDENTITY,
        [Question] nvarchar(500) NOT NULL,
        [Answer] nvarchar(max) NOT NULL,
        [CategoryId] int NULL,
        [SortOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [IsFeatured] bit NOT NULL,
        [ViewCount] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_FAQs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FAQs_KnowledgeBaseCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [KnowledgeBaseCategories] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [KnowledgeBaseArticles] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [Slug] nvarchar(500) NOT NULL,
        [Summary] nvarchar(500) NULL,
        [Content] nvarchar(max) NOT NULL,
        [CategoryId] int NOT NULL,
        [AuthorId] nvarchar(450) NOT NULL,
        [Tags] nvarchar(max) NULL,
        [ViewCount] int NOT NULL,
        [HelpfulCount] int NOT NULL,
        [NotHelpfulCount] int NOT NULL,
        [IsPublished] bit NOT NULL,
        [IsFeatured] bit NOT NULL,
        [PublishedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [MetaDescription] nvarchar(160) NULL,
        [MetaKeywords] nvarchar(200) NULL,
        CONSTRAINT [PK_KnowledgeBaseArticles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_KnowledgeBaseArticles_AspNetUsers_AuthorId] FOREIGN KEY ([AuthorId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_KnowledgeBaseArticles_KnowledgeBaseCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [KnowledgeBaseCategories] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [ServiceIncidents] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Severity] int NOT NULL,
        [Status] int NOT NULL,
        [AffectedServiceId] int NULL,
        [StartedAt] datetime2 NOT NULL,
        [ResolvedAt] datetime2 NULL,
        [CreatedById] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ServiceIncidents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ServiceIncidents_AspNetUsers_CreatedById] FOREIGN KEY ([CreatedById]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ServiceIncidents_ServiceStatuses_AffectedServiceId] FOREIGN KEY ([AffectedServiceId]) REFERENCES [ServiceStatuses] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [KnowledgeBaseArticleFeedbacks] (
        [Id] int NOT NULL IDENTITY,
        [ArticleId] int NOT NULL,
        [UserId] nvarchar(450) NULL,
        [IsHelpful] bit NOT NULL,
        [Comment] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_KnowledgeBaseArticleFeedbacks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_KnowledgeBaseArticleFeedbacks_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_KnowledgeBaseArticleFeedbacks_KnowledgeBaseArticles_ArticleId] FOREIGN KEY ([ArticleId]) REFERENCES [KnowledgeBaseArticles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE TABLE [ServiceIncidentUpdates] (
        [Id] int NOT NULL IDENTITY,
        [IncidentId] int NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [Status] int NOT NULL,
        [CreatedById] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ServiceIncidentUpdates] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ServiceIncidentUpdates_AspNetUsers_CreatedById] FOREIGN KEY ([CreatedById]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ServiceIncidentUpdates_ServiceIncidents_IncidentId] FOREIGN KEY ([IncidentId]) REFERENCES [ServiceIncidents] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_CannedResponses_OwnerUserId] ON [CannedResponses] ([OwnerUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CustomerProfiles_UserId] ON [CustomerProfiles] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_FAQs_CategoryId] ON [FAQs] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_KnowledgeBaseArticleFeedbacks_ArticleId] ON [KnowledgeBaseArticleFeedbacks] ([ArticleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_KnowledgeBaseArticleFeedbacks_UserId] ON [KnowledgeBaseArticleFeedbacks] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_KnowledgeBaseArticles_AuthorId] ON [KnowledgeBaseArticles] ([AuthorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_KnowledgeBaseArticles_CategoryId] ON [KnowledgeBaseArticles] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE UNIQUE INDEX [IX_KnowledgeBaseArticles_Slug] ON [KnowledgeBaseArticles] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_KnowledgeBaseCategories_ParentCategoryId] ON [KnowledgeBaseCategories] ([ParentCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_PortalAnnouncements_CreatedById] ON [PortalAnnouncements] ([CreatedById]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_ServiceIncidents_AffectedServiceId] ON [ServiceIncidents] ([AffectedServiceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_ServiceIncidents_CreatedById] ON [ServiceIncidents] ([CreatedById]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_ServiceIncidentUpdates_CreatedById] ON [ServiceIncidentUpdates] ([CreatedById]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_ServiceIncidentUpdates_IncidentId] ON [ServiceIncidentUpdates] ([IncidentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_TicketRelations_CreatedByUserId] ON [TicketRelations] ([CreatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_TicketRelations_RelatedTicketId] ON [TicketRelations] ([RelatedTicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_TicketRelations_SourceTicketId] ON [TicketRelations] ([SourceTicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TicketSatisfactions_TicketId] ON [TicketSatisfactions] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_TicketSatisfactions_UserId] ON [TicketSatisfactions] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_TicketTemplates_CreatedByUserId] ON [TicketTemplates] ([CreatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_TicketTemplates_DefaultAssigneeId] ON [TicketTemplates] ([DefaultAssigneeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_TicketTimeEntries_TicketId] ON [TicketTimeEntries] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_TicketTimeEntries_UserId] ON [TicketTimeEntries] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TicketWatchers_TicketId_UserId] ON [TicketWatchers] ([TicketId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    CREATE INDEX [IX_TicketWatchers_UserId] ON [TicketWatchers] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073236_AddTicketEnhancements'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251211073236_AddTicketEnhancements', N'9.0.7');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211073249_AddCustomerPortal'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251211073249_AddCustomerPortal', N'9.0.7');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211150052_AddBrandingSettings'
)
BEGIN
    CREATE TABLE [BrandingSettings] (
        [Id] int NOT NULL IDENTITY,
        [LogoUrl] nvarchar(max) NULL,
        [LogoFileName] nvarchar(max) NULL,
        [FaviconUrl] nvarchar(max) NULL,
        [LoginTitle] nvarchar(max) NOT NULL,
        [LoginSubtitle] nvarchar(max) NOT NULL,
        [AppName] nvarchar(max) NOT NULL,
        [AppTagline] nvarchar(max) NULL,
        [PrimaryColor] nvarchar(max) NOT NULL,
        [SecondaryColor] nvarchar(max) NOT NULL,
        [FooterText] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [UpdatedById] nvarchar(450) NULL,
        CONSTRAINT [PK_BrandingSettings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_BrandingSettings_AspNetUsers_UpdatedById] FOREIGN KEY ([UpdatedById]) REFERENCES [AspNetUsers] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211150052_AddBrandingSettings'
)
BEGIN
    CREATE INDEX [IX_BrandingSettings_UpdatedById] ON [BrandingSettings] ([UpdatedById]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251211150052_AddBrandingSettings'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251211150052_AddBrandingSettings', N'9.0.7');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE TABLE [ChatCannedResponses] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(100) NOT NULL,
        [Shortcut] nvarchar(50) NULL,
        [Content] nvarchar(max) NOT NULL,
        [Category] nvarchar(100) NULL,
        [OwnerId] nvarchar(450) NULL,
        [IsPersonal] bit NOT NULL,
        [UsageCount] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ChatCannedResponses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChatCannedResponses_AspNetUsers_OwnerId] FOREIGN KEY ([OwnerId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE TABLE [Conversations] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(200) NULL,
        [Type] int NOT NULL,
        [AvatarUrl] nvarchar(500) NULL,
        [CreatedById] nvarchar(450) NULL,
        [LastMessagePreview] nvarchar(500) NULL,
        [LastMessageAt] datetime2 NULL,
        [IsArchived] bit NOT NULL,
        [LinkedTicketId] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Conversations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Conversations_AspNetUsers_CreatedById] FOREIGN KEY ([CreatedById]) REFERENCES [AspNetUsers] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE TABLE [UserPresences] (
        [UserId] nvarchar(450) NOT NULL,
        [Status] int NOT NULL,
        [StatusMessage] nvarchar(200) NULL,
        [StatusEmoji] nvarchar(50) NULL,
        [StatusExpiresAt] datetime2 NULL,
        [ConnectionId] nvarchar(100) NULL,
        [DeviceType] nvarchar(50) NULL,
        [LastActiveAt] datetime2 NOT NULL,
        [OnlineSince] datetime2 NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_UserPresences] PRIMARY KEY ([UserId]),
        CONSTRAINT [FK_UserPresences_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE TABLE [ChatMessages] (
        [Id] int NOT NULL IDENTITY,
        [ConversationId] int NOT NULL,
        [SenderId] nvarchar(450) NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [Type] int NOT NULL,
        [ParentMessageId] int NULL,
        [IsEdited] bit NOT NULL,
        [EditedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        [SystemData] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ChatMessages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChatMessages_AspNetUsers_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ChatMessages_ChatMessages_ParentMessageId] FOREIGN KEY ([ParentMessageId]) REFERENCES [ChatMessages] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ChatMessages_Conversations_ConversationId] FOREIGN KEY ([ConversationId]) REFERENCES [Conversations] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE TABLE [ConversationParticipants] (
        [Id] int NOT NULL IDENTITY,
        [ConversationId] int NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [Role] int NOT NULL,
        [NotificationPreference] int NOT NULL,
        [IsMuted] bit NOT NULL,
        [IsPinned] bit NOT NULL,
        [LastReadAt] datetime2 NULL,
        [UnreadCount] int NOT NULL,
        [HasLeft] bit NOT NULL,
        [JoinedAt] datetime2 NOT NULL,
        [LeftAt] datetime2 NULL,
        CONSTRAINT [PK_ConversationParticipants] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ConversationParticipants_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ConversationParticipants_Conversations_ConversationId] FOREIGN KEY ([ConversationId]) REFERENCES [Conversations] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE TABLE [MessageAttachments] (
        [Id] int NOT NULL IDENTITY,
        [MessageId] int NOT NULL,
        [FileName] nvarchar(255) NOT NULL,
        [FilePath] nvarchar(500) NOT NULL,
        [ContentType] nvarchar(100) NOT NULL,
        [FileSize] bigint NOT NULL,
        [ThumbnailPath] nvarchar(500) NULL,
        [Width] int NULL,
        [Height] int NULL,
        [DurationSeconds] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_MessageAttachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MessageAttachments_ChatMessages_MessageId] FOREIGN KEY ([MessageId]) REFERENCES [ChatMessages] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE TABLE [MessageReactions] (
        [Id] int NOT NULL IDENTITY,
        [MessageId] int NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [Emoji] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_MessageReactions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MessageReactions_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MessageReactions_ChatMessages_MessageId] FOREIGN KEY ([MessageId]) REFERENCES [ChatMessages] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE TABLE [MessageReadReceipts] (
        [Id] int NOT NULL IDENTITY,
        [MessageId] int NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [ReadAt] datetime2 NOT NULL,
        CONSTRAINT [PK_MessageReadReceipts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MessageReadReceipts_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MessageReadReceipts_ChatMessages_MessageId] FOREIGN KEY ([MessageId]) REFERENCES [ChatMessages] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_ChatCannedResponses_OwnerId] ON [ChatCannedResponses] ([OwnerId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_ChatCannedResponses_Shortcut] ON [ChatCannedResponses] ([Shortcut]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_ChatMessages_ConversationId] ON [ChatMessages] ([ConversationId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_ChatMessages_CreatedAt] ON [ChatMessages] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_ChatMessages_ParentMessageId] ON [ChatMessages] ([ParentMessageId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_ChatMessages_SenderId] ON [ChatMessages] ([SenderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ConversationParticipants_ConversationId_UserId] ON [ConversationParticipants] ([ConversationId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_ConversationParticipants_UserId] ON [ConversationParticipants] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_Conversations_CreatedById] ON [Conversations] ([CreatedById]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_Conversations_LastMessageAt] ON [Conversations] ([LastMessageAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_MessageAttachments_MessageId] ON [MessageAttachments] ([MessageId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MessageReactions_MessageId_UserId_Emoji] ON [MessageReactions] ([MessageId], [UserId], [Emoji]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_MessageReactions_UserId] ON [MessageReactions] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MessageReadReceipts_MessageId_UserId] ON [MessageReadReceipts] ([MessageId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    CREATE INDEX [IX_MessageReadReceipts_UserId] ON [MessageReadReceipts] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251213081547_AddChatEntities'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251213081547_AddChatEntities', N'9.0.7');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251214063416_AddCategoryAdmins'
)
BEGIN
    CREATE TABLE [CategoryAdmins] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [CategoryId] int NOT NULL,
        [CanViewTickets] bit NOT NULL,
        [CanManageAgents] bit NOT NULL,
        [CanViewReports] bit NOT NULL,
        [CanManageSubcategories] bit NOT NULL,
        [CanConfigureSettings] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CategoryId1] int NULL,
        CONSTRAINT [PK_CategoryAdmins] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CategoryAdmins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CategoryAdmins_TicketCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [TicketCategories] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CategoryAdmins_TicketCategories_CategoryId1] FOREIGN KEY ([CategoryId1]) REFERENCES [TicketCategories] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251214063416_AddCategoryAdmins'
)
BEGIN
    CREATE INDEX [IX_CategoryAdmins_CategoryId] ON [CategoryAdmins] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251214063416_AddCategoryAdmins'
)
BEGIN
    CREATE INDEX [IX_CategoryAdmins_CategoryId1] ON [CategoryAdmins] ([CategoryId1]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251214063416_AddCategoryAdmins'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CategoryAdmins_UserId_CategoryId] ON [CategoryAdmins] ([UserId], [CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251214063416_AddCategoryAdmins'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251214063416_AddCategoryAdmins', N'9.0.7');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251221144551_AddTicketParticipants'
)
BEGIN
    CREATE TABLE [TicketParticipants] (
        [Id] uniqueidentifier NOT NULL,
        [TicketId] uniqueidentifier NOT NULL,
        [Email] nvarchar(256) NOT NULL,
        [Name] nvarchar(256) NULL,
        [ParticipantType] nvarchar(50) NOT NULL,
        [AddedAt] datetime2 NOT NULL,
        [AddedByUserId] nvarchar(450) NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_TicketParticipants] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketParticipants_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251221144551_AddTicketParticipants'
)
BEGIN
    CREATE INDEX [IX_TicketParticipants_Email] ON [TicketParticipants] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251221144551_AddTicketParticipants'
)
BEGIN
    CREATE INDEX [IX_TicketParticipants_TicketId] ON [TicketParticipants] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251221144551_AddTicketParticipants'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TicketParticipants_TicketId_Email] ON [TicketParticipants] ([TicketId], [Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251221144551_AddTicketParticipants'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251221144551_AddTicketParticipants', N'9.0.7');
END;

COMMIT;
GO

