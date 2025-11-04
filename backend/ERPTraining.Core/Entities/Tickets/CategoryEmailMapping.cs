namespace ERPTraining.Core.Entities.Tickets;

public class CategoryEmailMapping
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string EmailAddress { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    
    // SMTP Configuration
    public string? SmtpServer { get; set; }
    public int? SmtpPort { get; set; }
    public bool SmtpUseSsl { get; set; } = true;
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; } // Should be encrypted in production
    
    // IMAP Configuration
    public string? ImapServer { get; set; }
    public int? ImapPort { get; set; }
    public bool ImapUseSsl { get; set; } = true;
    public string? ImapUsername { get; set; }
    public string? ImapPassword { get; set; } // Should be encrypted in production
    
    // Auto-assignment Keywords (JSON)
    public string? KeywordMappings { get; set; }
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual TicketCategory Category { get; set; } = null!;
}

public class EmailMonitoringStatus
{
    public int Id { get; set; }
    public bool IsRunning { get; set; }
    public DateTime LastCheck { get; set; }
    public string MonitoredEmails { get; set; } = string.Empty; // JSON array of email addresses
    public int ProcessedToday { get; set; }
    public int ErrorsToday { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}