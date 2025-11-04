namespace ERPTraining.Core.Ticketing.Settings.DTOs;

public record CategoryEmailMappingDto(
    int Id,
    int CategoryId,
    string CategoryName,
    string EmailAddress,
    string? DisplayName,
    string? SmtpServer,
    int? SmtpPort,
    bool SmtpUseSsl,
    string? SmtpUsername,
    string? ImapServer,
    int? ImapPort,
    bool ImapUseSsl,
    string? ImapUsername,
    string? KeywordMappings,
    bool IsActive
);

public record CreateCategoryEmailMappingRequest(
    int CategoryId,
    string EmailAddress,
    string? DisplayName,
    string? SmtpServer,
    int? SmtpPort,
    bool SmtpUseSsl,
    string? SmtpUsername,
    string? SmtpPassword,
    string? ImapServer,
    int? ImapPort,
    bool ImapUseSsl,
    string? ImapUsername,
    string? ImapPassword,
    string? KeywordMappings
);

public record UpdateCategoryEmailMappingRequest(
    string? EmailAddress,
    string? DisplayName,
    string? SmtpServer,
    int? SmtpPort,
    bool? SmtpUseSsl,
    string? SmtpUsername,
    string? SmtpPassword,
    string? ImapServer,
    int? ImapPort,
    bool? ImapUseSsl,
    string? ImapUsername,
    string? ImapPassword,
    string? KeywordMappings,
    bool? IsActive
);

public record EmailMonitoringStatusDto(
    bool IsRunning,
    DateTime LastCheck,
    string[] MonitoredEmails,
    int ProcessedToday,
    int ErrorsToday
);

public record EmailConfigurationTestRequest(
    string EmailAddress,
    string? SmtpServer,
    int? SmtpPort,
    bool SmtpUseSsl,
    string? SmtpUsername,
    string? SmtpPassword,
    string? ImapServer,
    int? ImapPort,
    bool ImapUseSsl,
    string? ImapUsername,
    string? ImapPassword
);

public record EmailConfigurationTestResult(
    bool SmtpSuccess,
    string? SmtpError,
    bool ImapSuccess,
    string? ImapError
);