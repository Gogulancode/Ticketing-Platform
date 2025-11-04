using ERPTraining.Core.Entities.Email;

namespace ERPTraining.Core.Interfaces.Email
{
    public interface IEmailService
    {
        // SMTP Configuration
        Task<bool> TestSmtpConnectionAsync(EmailSettings settings);
        Task<EmailSettings?> GetEmailSettingsAsync();
        Task SaveEmailSettingsAsync(EmailSettings settings);

        // Email Sending
        Task<bool> SendEmailAsync(string to, string subject, string body, string? cc = null, string? bcc = null);
        Task<bool> SendEmailWithAttachmentsAsync(string to, string subject, string body, List<string> attachmentPaths);

        // Office 365 Integration
        Task<bool> ConnectToOffice365Async(string clientId, string clientSecret, string tenantId);
        Task<bool> AuthorizeOffice365AccessAsync(string authorizationCode);
        
        // Email Processing
        Task ProcessIncomingEmailsAsync();
        Task<EmailProcessingStats> GetProcessingStatsAsync();
        
        // Mailbox Management
        Task<List<EmailMailbox>> GetEmailMailboxesAsync();
        Task<EmailMailbox> CreateEmailMailboxAsync(EmailMailbox mailbox);
        Task<EmailMailbox> UpdateEmailMailboxAsync(EmailMailbox mailbox);
        Task<bool> DeleteEmailMailboxAsync(int mailboxId);
        
        // Processing Rules
        Task<List<EmailProcessingRule>> GetProcessingRulesAsync(int? mailboxId = null);
        Task<EmailProcessingRule> CreateProcessingRuleAsync(EmailProcessingRule rule);
        Task<EmailProcessingRule> UpdateProcessingRuleAsync(EmailProcessingRule rule);
        Task<bool> DeleteProcessingRuleAsync(int ruleId);
        
        // Email Log
        Task<List<EmailProcessingLog>> GetProcessingLogAsync(int page = 1, int pageSize = 20);
        Task<EmailProcessingLog?> GetProcessingLogByIdAsync(int logId);
        
        // Ticket Creation from Email
        Task<Guid?> CreateTicketFromEmailAsync(EmailProcessingLog emailLog);
    }

    public interface IEmailProcessingService
    {
        Task StartAsync();
        Task StopAsync();
        Task<bool> IsRunningAsync();
        Task ProcessEmailsNowAsync();
    }

    public interface IOffice365Service
    {
        Task<bool> AuthenticateAsync(string clientId, string clientSecret, string tenantId);
        Task<List<EmailMessage>> GetInboxEmailsAsync(string mailbox, int maxCount = 50);
        Task<bool> SendEmailAsync(EmailMessage message);
        Task<bool> ReplyToEmailAsync(string messageId, string replyBody);
        Task<bool> ForwardEmailAsync(string messageId, string forwardTo, string? note = null);
        Task<bool> MarkAsReadAsync(string messageId);
    }

    // DTO Classes
    public class EmailMessage
    {
        public string Id { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string? Cc { get; set; }
        public string? Bcc { get; set; }
        public DateTime ReceivedDate { get; set; }
        public bool IsRead { get; set; }
        public List<EmailAttachmentDto> Attachments { get; set; } = new();
        public bool HasAttachments => Attachments.Any();
    }

    public class EmailAttachmentDto
    {
        public string Name { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long Size { get; set; }
        public byte[]? Content { get; set; }
    }

    public class SmtpConfig
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 587;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool UseSSL { get; set; } = true;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
    }

    public class Office365Config
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string TenantId { get; set; } = string.Empty;
        public string RedirectUri { get; set; } = "http://localhost:5015/api/email/oauth/callback";
        public List<string> Scopes { get; set; } = new() { "https://graph.microsoft.com/Mail.ReadWrite", "https://graph.microsoft.com/Mail.Send" };
    }
}
