using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.Core.Entities.Email;

public class EmailSettings 
{ 
    public int Id { get; set; } 
    public string Host { get; set; } = string.Empty; 
    public int Port { get; set; } = 587; 
    public string Username { get; set; } = string.Empty; 
    public string Password { get; set; } = string.Empty; 
    public bool UseSsl { get; set; } = true; 
    
    // Additional properties expected by Infrastructure services
    public string SmtpServer { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
public class EmailMailbox 
{ 
    public int Id { get; set; } 
    public string Address { get; set; } = string.Empty; 
    public bool Active { get; set; } = true; 
    
    // Additional properties expected by Infrastructure services
    public string EmailAddress { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public string DefaultDepartment { get; set; } = string.Empty;
    public int DefaultPriority { get; set; } = 3;
    public int DefaultCategory { get; set; } = 1;
    public int DefaultSubCategory { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual List<EmailProcessingRule> ProcessingRules { get; set; } = new();
}
public class EmailProcessingRule 
{ 
    public int Id { get; set; } 
    public string Pattern { get; set; } = string.Empty; 
    public string Action { get; set; } = string.Empty; 
    public int? MailboxId { get; set; } 
    
    // Additional properties expected by Infrastructure services
    public int Priority { get; set; } = 1;
    public string RuleType { get; set; } = string.Empty;
    public string MatchType { get; set; } = string.Empty;
    public string MatchValue { get; set; } = string.Empty;
    public int AssignToCategory { get; set; } = 1;
    public int AssignToSubCategory { get; set; } = 1;
    public string AssignToDepartment { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual EmailMailbox? Mailbox { get; set; }
}
public class EmailProcessingLog 
{ 
    public int Id { get; set; } 
    public string Subject { get; set; } = string.Empty; 
    public string From { get; set; } = string.Empty; 
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow; 
    public bool Processed { get; set; } 
    public Guid? TicketId { get; set; } 
    
    // Additional properties expected by Infrastructure services
    public string MessageId { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string ToEmail { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string ProcessingStatus { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public int? MatchedRuleId { get; set; }
    
    // Navigation properties
    public virtual Ticket? Ticket { get; set; }
    public virtual EmailProcessingRule? MatchedRule { get; set; }
}
public class EmailAttachment { public int Id { get; set; } public int ProcessingLogId { get; set; } public string FileName { get; set; } = string.Empty; public long SizeBytes { get; set; } }
public class EmailProcessingStats 
{ 
    public int Id { get; set; } 
    public int TotalProcessed { get; set; } 
    public int TicketsCreated { get; set; } 
    public int Errors { get; set; } 
    public DateTime LastRunAt { get; set; } = DateTime.UtcNow; 
    
    // Additional properties expected by Infrastructure services
    public int TotalEmailsToday { get; set; } = 0;
    public int ProcessedEmailsToday { get; set; } = 0;
    public int FailedEmailsToday { get; set; } = 0;
    public int TicketsCreatedToday { get; set; } = 0;
    public DateTime? LastProcessedTime { get; set; }
    public bool IsServiceRunning { get; set; } = false;
    public int ActiveMailboxes { get; set; } = 0;
    public string RuleMatchCounts { get; set; } = string.Empty;
}
