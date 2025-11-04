namespace ERPTraining.Core.Models.Ticketing;

public class EmailConfiguration
{
    public bool EnableGraphApi { get; set; }
    public string ProcessedFolder { get; set; } = "Processed";
    public string ErrorFolder { get; set; } = "EmailErrors";
    public int MaxEmailsPerBatch { get; set; } = 10;
    public int ProcessingIntervalMinutes { get; set; } = 5;
    public string DefaultFromEmail { get; set; } = string.Empty;
    public string DefaultFromName { get; set; } = string.Empty;
    public List<EmailAccount> EmailAccounts { get; set; } = new();
    public AutoAssignmentRules AutoAssignmentRules { get; set; } = new();
    public NotificationSettings NotificationSettings { get; set; } = new();
}

public class EmailAccount
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public List<string> Categories { get; set; } = new();
    public string ClientId { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string? Department { get; set; }
    public List<string>? Keywords { get; set; }
    public int? DefaultPriority { get; set; }
    public string? DefaultAssignee { get; set; }
}

public class AutoAssignmentRules
{
    public bool EnableCategoryMapping { get; set; } = true;
    public bool EnableKeywordDetection { get; set; } = true;
    public bool EnablePriorityDetection { get; set; } = true;
    public List<string> UrgentKeywords { get; set; } = new();
    public List<string> HighKeywords { get; set; } = new();
    public int DefaultPriority { get; set; } = 2;
    public string DefaultCategory { get; set; } = "General";
}

public class NotificationSettings
{
    public bool EnableStatusNotifications { get; set; } = true;
    public bool EnableAutoReply { get; set; } = true;
    public bool EnableReopenOption { get; set; } = true;
    public int ReopenWindowHours { get; set; } = 72;
    public string AutoReplyTemplate { get; set; } = string.Empty;
    public bool SendToRequesterOnly { get; set; } = true;
    public bool IncludeTicketHistory { get; set; } = false;
}