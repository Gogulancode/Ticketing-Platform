namespace ERPTraining.Core.Models.Ticketing;

/// <summary>
/// Represents an email message from Graph API
/// </summary>
public class EmailMessage
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public List<string> ToEmails { get; set; } = new();
    public List<string> CcEmails { get; set; } = new();
    public DateTime ReceivedDate { get; set; }
    public bool HasAttachments { get; set; }
    public string ConversationId { get; set; } = string.Empty;
    public int Priority { get; set; }
}