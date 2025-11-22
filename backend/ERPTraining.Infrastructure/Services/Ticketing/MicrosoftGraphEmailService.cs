using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.Kiota.Authentication.Azure;
using Azure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Entities.Tickets;
using ERPTraining.Core.Models.Ticketing;
using ApplicationUser = ERPTraining.Core.Entities.User;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class MicrosoftGraphEmailService : IEmailService
{
    private readonly GraphServiceClient _graphServiceClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MicrosoftGraphEmailService> _logger;
    private readonly string _serviceAccountEmail;

    public MicrosoftGraphEmailService(
        IConfiguration configuration,
        ILogger<MicrosoftGraphEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _serviceAccountEmail = configuration["MicrosoftGraph:ServiceAccountEmail"] ?? "ithelpdesk@babajishivram.com";

        // Initialize Graph client with app-only authentication
        var clientId = configuration["MicrosoftGraph:ClientId"];
        var tenantId = configuration["MicrosoftGraph:TenantId"];
        var clientSecret = configuration["MicrosoftGraph:ClientSecret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new InvalidOperationException("Microsoft Graph configuration is missing. Please check ClientId, TenantId, and ClientSecret.");
        }

        var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        _graphServiceClient = new GraphServiceClient(credential);

        _logger.LogInformation("Microsoft Graph Email Service initialized for {Email}", _serviceAccountEmail);
    }

    /// <summary>
    /// Gets unread emails from the service account inbox
    /// </summary>
    public async Task<IList<EmailMessage>> GetUnreadEmailsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Fetching unread emails from {Email}", _serviceAccountEmail);

            var messages = await _graphServiceClient.Users[_serviceAccountEmail]
                .Messages
                .GetAsync((requestConfiguration) =>
                {
                    requestConfiguration.QueryParameters.Filter = "isRead eq false";
                    requestConfiguration.QueryParameters.Select = new string[] { 
                        "id", "subject", "body", "from", "toRecipients", "ccRecipients", 
                        "receivedDateTime", "importance", "hasAttachments", "conversationId" 
                    };
                    requestConfiguration.QueryParameters.Top = _configuration.GetValue<int>("EmailSettings:MaxEmailsPerBatch", 10);
                    requestConfiguration.QueryParameters.Orderby = new string[] { "receivedDateTime desc" };
                }, cancellationToken);

            var emailMessages = new List<EmailMessage>();

            if (messages?.Value != null)
            {
                foreach (var message in messages.Value)
                {
                    emailMessages.Add(new EmailMessage
                    {
                        Id = message.Id,
                        Subject = message.Subject ?? string.Empty,
                        Body = message.Body?.Content ?? string.Empty,
                        FromEmail = message.From?.EmailAddress?.Address ?? string.Empty,
                        FromName = message.From?.EmailAddress?.Name ?? string.Empty,
                        ToEmails = message.ToRecipients?.Select(r => r.EmailAddress?.Address ?? string.Empty).ToList() ?? new List<string>(),
                        CcEmails = message.CcRecipients?.Select(r => r.EmailAddress?.Address ?? string.Empty).ToList() ?? new List<string>(),
                        ReceivedDate = message.ReceivedDateTime?.DateTime ?? DateTime.UtcNow,
                        HasAttachments = message.HasAttachments ?? false,
                        ConversationId = message.ConversationId ?? string.Empty,
                        Priority = ConvertImportance(message.Importance)
                    });
                }

                _logger.LogInformation("Retrieved {Count} unread emails", emailMessages.Count);
            }

            return emailMessages;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching unread emails from {Email}", _serviceAccountEmail);
            throw;
        }
    }

    /// <summary>
    /// Sends an email using Microsoft Graph API
    /// </summary>
    public async Task SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        bool isHtml = true,
        IEnumerable<OutgoingEmailAttachment>? attachments = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Sending email to {ToEmail} with subject: {Subject}", toEmail, subject);

            var message = new Message
            {
                Subject = subject,
                Body = new ItemBody
                {
                    ContentType = isHtml ? BodyType.Html : BodyType.Text,
                    Content = body
                },
                ToRecipients = new List<Recipient>
                {
                    new Recipient
                    {
                        EmailAddress = new EmailAddress
                        {
                            Address = toEmail
                        }
                    }
                }
            };

            if (attachments != null)
            {
                var fileAttachments = new List<Microsoft.Graph.Models.Attachment>();

                foreach (var attachment in attachments)
                {
                    if (attachment?.Content == null || attachment.Content.Length == 0)
                    {
                        continue;
                    }

                    var contentType = string.IsNullOrWhiteSpace(attachment.ContentType)
                        ? "application/octet-stream"
                        : attachment.ContentType;

                    fileAttachments.Add(new Microsoft.Graph.Models.FileAttachment
                    {
                        OdataType = "#microsoft.graph.fileAttachment",
                        Name = attachment.FileName,
                        ContentType = contentType,
                        ContentBytes = attachment.Content
                    });
                }

                if (fileAttachments.Count > 0)
                {
                    message.Attachments = fileAttachments;
                }
            }

            // Try to send email using the service account with proper application permissions
            await _graphServiceClient.Users[_serviceAccountEmail]
                .SendMail
                .PostAsync(new Microsoft.Graph.Users.Item.SendMail.SendMailPostRequestBody
                {
                    Message = message,
                    SaveToSentItems = true
                }, requestConfiguration: config =>
                {
                    // Ensure we're using application permissions
                    config.Headers.Add("ConsistencyLevel", "eventual");
                }, cancellationToken);

            _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {ToEmail}", toEmail);
            throw;
        }
    }

    /// <summary>
    /// Sends ticket status update email with reopen functionality
    /// </summary>
    public async Task SendTicketStatusUpdateAsync(Ticket ticket, string toEmail, string newStatus, CancellationToken cancellationToken = default)
    {
        try
        {
            string subject = $"Ticket #{ticket.PublicId?.ToString() ?? ticket.Id.ToString().Substring(0, 8)} - Status Updated to {newStatus}";
            
            string body = GenerateStatusUpdateEmailBody(ticket, newStatus);

            await SendEmailAsync(toEmail, subject, body, true, attachments: null, cancellationToken: cancellationToken);

            _logger.LogInformation("Status update email sent for ticket {TicketId} to {Email}", ticket.Id, toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending status update email for ticket {TicketId}", ticket.Id);
            throw;
        }
    }

    /// <summary>
    /// Marks an email as read
    /// </summary>
    public async Task MarkEmailAsReadAsync(string emailId, CancellationToken cancellationToken = default)
    {
        try
        {
            await _graphServiceClient.Users[_serviceAccountEmail]
                .Messages[emailId]
                .PatchAsync(new Message { IsRead = true }, requestConfiguration: null, cancellationToken);

            _logger.LogDebug("Email {EmailId} marked as read", emailId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking email {EmailId} as read", emailId);
            throw;
        }
    }

    /// <summary>
    /// Moves an email to a specified folder
    /// </summary>
    public async Task MoveEmailToFolderAsync(string emailId, string folderName, CancellationToken cancellationToken = default)
    {
        try
        {
            // First, get or create the folder
            var folderId = await GetOrCreateFolderAsync(folderName, cancellationToken);

            // Move the email
            await _graphServiceClient.Users[_serviceAccountEmail]
                .Messages[emailId]
                .Move
                .PostAsync(new Microsoft.Graph.Users.Item.Messages.Item.Move.MovePostRequestBody
                {
                    DestinationId = folderId
                }, requestConfiguration: null, cancellationToken);

            _logger.LogDebug("Email {EmailId} moved to folder {FolderName}", emailId, folderName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error moving email {EmailId} to folder {FolderName}", emailId, folderName);
            throw;
        }
    }

    /// <summary>
    /// Gets or creates a mail folder
    /// </summary>
    private async Task<string> GetOrCreateFolderAsync(string folderName, CancellationToken cancellationToken = default)
    {
        try
        {
            // Try to find existing folder
            var folders = await _graphServiceClient.Users[_serviceAccountEmail]
                .MailFolders
                .GetAsync((requestConfiguration) =>
                {
                    requestConfiguration.QueryParameters.Filter = $"displayName eq '{folderName}'";
                }, cancellationToken);

            if (folders?.Value?.Any() == true)
            {
                return folders.Value.First().Id!;
            }

            // Create new folder
            var newFolder = await _graphServiceClient.Users[_serviceAccountEmail]
                .MailFolders
                .PostAsync(new MailFolder
                {
                    DisplayName = folderName
                }, requestConfiguration: null, cancellationToken);

            _logger.LogInformation("Created new mail folder: {FolderName}", folderName);
            return newFolder!.Id!;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting or creating folder {FolderName}", folderName);
            throw;
        }
    }

    /// <summary>
    /// Generates HTML email body for status updates with reopen functionality
    /// </summary>
    private string GenerateStatusUpdateEmailBody(Ticket ticket, string newStatus)
    {
        string reopenButton = "";
        if (newStatus.Equals("Resolved", StringComparison.OrdinalIgnoreCase))
        {
            string reopenUrl = $"{_configuration["ExternalApis:BsBaseUrl"]}/api/tickets/reopen/{ticket.Id}";
            reopenButton = $@"
                <div style='margin: 20px 0; text-align: center;'>
                    <p style='margin-bottom: 10px;'>Not satisfied with the resolution?</p>
                    <a href='{reopenUrl}' 
                       style='background-color: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'>
                        Reopen Ticket
                    </a>
                </div>";
        }

        return $@"
            <html>
            <body style='font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;'>
                <div style='max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
                    <h2 style='color: #333; margin-top: 0;'>Ticket Status Update</h2>
                    
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                        <p><strong>Ticket Number:</strong> #{ticket.PublicId?.ToString() ?? ticket.Id.ToString().Substring(0, 8)}</p>
                        <p><strong>Subject:</strong> {ticket.Title}</p>
                        <p><strong>Status:</strong> <span style='color: #28a745; font-weight: bold;'>{newStatus}</span></p>
                        <p><strong>Updated:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
                    </div>

                    {reopenButton}

                    <div style='border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px; font-size: 12px; color: #666;'>
                        <p>This is an automated message from the Helpdesk System.</p>
                        <p>If you have any questions, please contact our support team.</p>
                    </div>
                </div>
            </body>
            </html>";
    }

    /// <summary>
    /// Gets attachments from an email message
    /// </summary>
    public async Task<IList<EmailAttachment>> GetEmailAttachmentsAsync(string emailId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Fetching attachments for email {EmailId}", emailId);

            var attachments = await _graphServiceClient.Users[_serviceAccountEmail]
                .Messages[emailId]
                .Attachments
                .GetAsync((requestConfiguration) =>
                {
                    requestConfiguration.QueryParameters.Select = new string[] { "id", "name", "contentType", "size" };
                }, cancellationToken);

            var emailAttachments = new List<EmailAttachment>();

            if (attachments?.Value != null)
            {
                foreach (var attachment in attachments.Value)
                {
                    if (attachment is FileAttachment fileAttachment)
                    {
                        // Get the actual attachment content
                        var fullAttachment = await _graphServiceClient.Users[_serviceAccountEmail]
                            .Messages[emailId]
                            .Attachments[attachment.Id]
                            .GetAsync(cancellationToken: cancellationToken);

                        if (fullAttachment is FileAttachment fullFileAttachment && fullFileAttachment.ContentBytes != null)
                        {
                            emailAttachments.Add(new EmailAttachment
                            {
                                Id = fullFileAttachment.Id ?? string.Empty,
                                FileName = fullFileAttachment.Name ?? "unknown",
                                ContentType = fullFileAttachment.ContentType ?? "application/octet-stream",
                                Size = fullFileAttachment.Size ?? 0,
                                ContentBytes = fullFileAttachment.ContentBytes
                            });
                        }
                    }
                }

                _logger.LogInformation("Retrieved {Count} attachments for email {EmailId}", emailAttachments.Count, emailId);
            }

            return emailAttachments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching attachments for email {EmailId}", emailId);
            throw;
        }
    }

    /// <summary>
    /// Converts Graph API Importance to our priority system
    /// </summary>
    private int ConvertImportance(Importance? importance)
    {
        return importance switch
        {
            Importance.High => 3,
            Importance.Normal => 2,
            Importance.Low => 1,
            _ => 2
        };
    }

    /// <summary>
    /// Sends email notification when a ticket is assigned to an agent
    /// </summary>
    public async Task SendTicketAssignmentNotificationAsync(Ticket ticket, ApplicationUser agent, CancellationToken cancellationToken = default)
    {
        try
        {
            var ticketNumber = ticket.PublicId?.ToString() ?? ticket.Id.ToString().Substring(0, 8);
            var subject = $"[Ticket #{ticketNumber}] Assigned to You - {ticket.Title}";
            
            var body = $@"
<html>
<body style='font-family: Arial, sans-serif;'>
    <h2 style='color: #2563eb;'>New Ticket Assigned to You</h2>
    <p>Dear {agent.FirstName} {agent.LastName},</p>
    
    <p>A new support ticket has been assigned to you:</p>
    
    <div style='background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;'>
        <p><strong>Ticket Number:</strong> #{ticketNumber}</p>
        <p><strong>Title:</strong> {ticket.Title}</p>
        <p><strong>Priority:</strong> {ticket.Priority}</p>
        <p><strong>Status:</strong> {ticket.Status}</p>
        <p><strong>Created:</strong> {ticket.CreatedAt:yyyy-MM-dd HH:mm}</p>
    </div>
    
    <p><strong>Description:</strong></p>
    <div style='background-color: #ffffff; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0;'>
        {ticket.Description?.Replace("\n", "<br/>")}
    </div>
    
    <p>Please review and respond to this ticket at your earliest convenience.</p>
    
    <p style='margin-top: 30px;'>
        Best regards,<br/>
        Support Team
    </p>
    
    <hr style='margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;'/>
    <p style='font-size: 12px; color: #6b7280;'>
        This is an automated notification. Please do not reply to this email.
    </p>
</body>
</html>";

            await SendEmailAsync(agent.Email!, subject, body, true, attachments: null, cancellationToken: cancellationToken);
            _logger.LogInformation("Sent assignment notification to agent {AgentEmail} for ticket #{TicketNumber}", agent.Email, ticketNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send ticket assignment notification to {AgentEmail}", agent.Email);
        }
    }

    /// <summary>
    /// Sends email notification when someone is added as a collaborator to a ticket
    /// </summary>
    public async Task SendCollaboratorAddedNotificationAsync(Ticket ticket, ApplicationUser collaborator, ApplicationUser addedBy, CancellationToken cancellationToken = default)
    {
        try
        {
            var ticketNumber = ticket.PublicId?.ToString() ?? ticket.Id.ToString().Substring(0, 8);
            var subject = $"[Ticket #{ticketNumber}] You've been added as a Collaborator - {ticket.Title}";
            
            var body = $@"
<html>
<body style='font-family: Arial, sans-serif;'>
    <h2 style='color: #059669;'>Added as Ticket Collaborator</h2>
    <p>Dear {collaborator.FirstName} {collaborator.LastName},</p>
    
    <p>You have been added as a collaborator on the following support ticket by <strong>{addedBy.FirstName} {addedBy.LastName}</strong>:</p>
    
    <div style='background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;'>
        <p><strong>Ticket Number:</strong> #{ticketNumber}</p>
        <p><strong>Title:</strong> {ticket.Title}</p>
        <p><strong>Priority:</strong> {ticket.Priority}</p>
        <p><strong>Status:</strong> {ticket.Status}</p>
        <p><strong>Created:</strong> {ticket.CreatedAt:yyyy-MM-dd HH:mm}</p>
    </div>
    
    <p><strong>Description:</strong></p>
    <div style='background-color: #ffffff; border-left: 4px solid #059669; padding: 15px; margin: 15px 0;'>
        {ticket.Description?.Replace("\n", "<br/>")}
    </div>
    
    <p>As a collaborator, you will receive updates on this ticket and can contribute to its resolution.</p>
    
    <p style='margin-top: 30px;'>
        Best regards,<br/>
        Support Team
    </p>
    
    <hr style='margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;'/>
    <p style='font-size: 12px; color: #6b7280;'>
        This is an automated notification. Please do not reply to this email.
    </p>
</body>
</html>";

            await SendEmailAsync(collaborator.Email!, subject, body, true, attachments: null, cancellationToken: cancellationToken);
            _logger.LogInformation("Sent collaborator notification to {CollaboratorEmail} for ticket #{TicketNumber}", collaborator.Email, ticketNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send collaborator notification to {CollaboratorEmail}", collaborator.Email);
        }
    }

    /// <summary>
    /// Sends email notification when a ticket is resolved
    /// </summary>
    public async Task SendTicketResolvedNotificationAsync(Ticket ticket, ApplicationUser creator, string? resolutionNotes, CancellationToken cancellationToken = default)
    {
        try
        {
            var ticketNumber = ticket.PublicId?.ToString() ?? ticket.Id.ToString().Substring(0, 8);
            var subject = $"[Ticket #{ticketNumber}] Resolved - {ticket.Title}";
            
            // Generate reopen link (will be handled by a new endpoint)
            var reopenLink = $"http://localhost:5015/api/tickets-v2/{ticket.Id}/reopen";
            
            var body = $@"
<html>
<body style='font-family: Arial, sans-serif;'>
    <h2 style='color: #16a34a;'>✅ Your Ticket Has Been Resolved</h2>
    <p>Dear {creator.FirstName} {creator.LastName},</p>
    
    <p>We're writing to inform you that your support ticket has been resolved:</p>
    
    <div style='background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;'>
        <p><strong>Ticket Number:</strong> #{ticketNumber}</p>
        <p><strong>Title:</strong> {ticket.Title}</p>
        <p><strong>Status:</strong> Resolved</p>
        <p><strong>Resolved On:</strong> {ticket.ResolvedAt?.ToString("yyyy-MM-dd HH:mm") ?? DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")}</p>
    </div>
    
    <p><strong>Original Issue:</strong></p>
    <div style='background-color: #ffffff; border-left: 4px solid #16a34a; padding: 15px; margin: 15px 0;'>
        {ticket.Description?.Replace("\n", "<br/>")}
    </div>
    
    {(!string.IsNullOrEmpty(resolutionNotes) ? $@"
    <p><strong>Resolution Notes:</strong></p>
    <div style='background-color: #ecfdf5; border-left: 4px solid #16a34a; padding: 15px; margin: 15px 0;'>
        {resolutionNotes.Replace("\n", "<br/>")}
    </div>
    " : "")}
    
    <div style='background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
        <p style='margin: 0; color: #92400e;'><strong>Not Satisfied?</strong></p>
        <p style='margin: 10px 0 0 0; color: #92400e;'>If the issue is not fully resolved or you need further assistance, you can reopen this ticket by clicking the button below:</p>
        <div style='margin-top: 15px;'>
            <a href='{reopenLink}' style='background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;'>
                🔄 Reopen Ticket
            </a>
        </div>
    </div>
    
    <p style='margin-top: 30px;'>
        Thank you for using our support system.<br/>
        <br/>
        Best regards,<br/>
        Support Team
    </p>
    
    <hr style='margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;'/>
    <p style='font-size: 12px; color: #6b7280;'>
        This is an automated notification from the IT Help Desk system.
    </p>
</body>
</html>";

            await SendEmailAsync(creator.Email!, subject, body, true, attachments: null, cancellationToken: cancellationToken);
            _logger.LogInformation("Sent resolution notification to {CreatorEmail} for ticket #{TicketNumber}", creator.Email, ticketNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send resolution notification to {CreatorEmail}", creator.Email);
        }
    }
}

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

/// <summary>
/// Represents an email attachment from Graph API
/// </summary>
public class EmailAttachment
{
    public string Id { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public int Size { get; set; }
    public byte[]? ContentBytes { get; set; }
}