using ERPTraining.Core.Interfaces.Ticketing;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class NotificationService : INotificationService
{
    private readonly IEmailConfigurationService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IEmailConfigurationService emailService,
        ILogger<NotificationService> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<bool> SendSlaBreachEmailAsync(
        string ticketNumber, 
        string ticketTitle, 
        string slaPolicyName, 
        int escalationLevel, 
        DateTime breachTime, 
        IEnumerable<string> recipientEmails,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var recipients = recipientEmails.ToList();
            if (!recipients.Any())
                return false;

            var subject = $"[SLA Breach - Level {escalationLevel}] Ticket #{ticketNumber} requires immediate attention";
            
            var body = $@"
<html>
<body>
    <h2>SLA Breach Alert - Escalation Level {escalationLevel}</h2>
    
    <div style='background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px;'>
        <strong>⚠️ SLA Policy ""{slaPolicyName}"" has been breached</strong>
    </div>
    
    <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
        <tr style='background-color: #f8f9fa;'>
            <td style='padding: 10px; border: 1px solid #ddd; font-weight: bold;'>Ticket Number:</td>
            <td style='padding: 10px; border: 1px solid #ddd;'>#{ticketNumber}</td>
        </tr>
        <tr>
            <td style='padding: 10px; border: 1px solid #ddd; font-weight: bold;'>Title:</td>
            <td style='padding: 10px; border: 1px solid #ddd;'>{ticketTitle}</td>
        </tr>
        <tr style='background-color: #f8f9fa;'>
            <td style='padding: 10px; border: 1px solid #ddd; font-weight: bold;'>SLA Policy:</td>
            <td style='padding: 10px; border: 1px solid #ddd;'>{slaPolicyName}</td>
        </tr>
        <tr>
            <td style='padding: 10px; border: 1px solid #ddd; font-weight: bold;'>Escalation Level:</td>
            <td style='padding: 10px; border: 1px solid #ddd;'><strong style='color: #dc3545;'>Level {escalationLevel}</strong></td>
        </tr>
        <tr style='background-color: #f8f9fa;'>
            <td style='padding: 10px; border: 1px solid #ddd; font-weight: bold;'>Breach Time:</td>
            <td style='padding: 10px; border: 1px solid #ddd;'>{breachTime:yyyy-MM-dd HH:mm:ss} UTC</td>
        </tr>
    </table>
    
    <div style='margin: 20px 0;'>
        <p><strong>Action Required:</strong> Please review and take immediate action on this ticket.</p>
        <p><a href='#' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View Ticket</a></p>
    </div>
    
    <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;'>
        <p>This is an automated notification from the ERP Training Platform Ticketing System.</p>
        <p>If you received this email in error, please contact the system administrator.</p>
    </div>
</body>
</html>";

            // Use the existing email service to send the notification
            // This assumes the EmailConfigurationService has methods for sending emails
            // You might need to adapt this based on the actual implementation
            
            foreach (var email in recipients)
            {
                // Since we don't have direct access to email sending in the current EmailConfigurationService,
                // we'll log the notification for now and recommend implementing email sending
                _logger.LogWarning("SLA Breach Email would be sent to {Email}: {Subject}", email, subject);
                
                // TODO: Implement actual email sending when email service supports it
                // await _emailService.SendEmailAsync(email, subject, body, cancellationToken);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SLA breach email for ticket {TicketNumber} at escalation level {EscalationLevel}", 
                ticketNumber, escalationLevel);
            return false;
        }
    }

    public async Task<bool> SendSystemNotificationAsync(
        string userId, 
        string title, 
        string message, 
        string? actionUrl = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // For now, we'll log system notifications
            // In a real implementation, this would save to a notifications table
            // or push to a real-time notification system
            
            _logger.LogInformation("System Notification for user {UserId}: {Title} - {Message}", 
                userId, title, message);
                
            if (!string.IsNullOrEmpty(actionUrl))
            {
                _logger.LogInformation("Action URL: {ActionUrl}", actionUrl);
            }

            // TODO: Implement actual system notification storage/delivery
            // This could involve:
            // 1. Saving to a UserNotifications table
            // 2. Pushing via SignalR for real-time notifications
            // 3. Integration with mobile push notifications
            
            await Task.CompletedTask; // Placeholder for async operations
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send system notification to user {UserId}: {Title}", 
                userId, title);
            return false;
        }
    }

    public async Task<bool> SendSlaWarningEmailAsync(
        string ticketNumber, 
        string ticketTitle, 
        string slaPolicyName, 
        TimeSpan timeRemaining, 
        IEnumerable<string> recipientEmails,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var recipients = recipientEmails.ToList();
            if (!recipients.Any())
                return false;

            var subject = $"[SLA Warning] Ticket #{ticketNumber} - {timeRemaining.TotalMinutes:F0} minutes remaining";
            
            var body = $@"
<html>
<body>
    <h2>SLA Warning Alert</h2>
    
    <div style='background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px;'>
        <strong>⏰ SLA deadline approaching for ticket #{ticketNumber}</strong>
    </div>
    
    <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
        <tr style='background-color: #f8f9fa;'>
            <td style='padding: 10px; border: 1px solid #ddd; font-weight: bold;'>Ticket Number:</td>
            <td style='padding: 10px; border: 1px solid #ddd;'>#{ticketNumber}</td>
        </tr>
        <tr>
            <td style='padding: 10px; border: 1px solid #ddd; font-weight: bold;'>Title:</td>
            <td style='padding: 10px; border: 1px solid #ddd;'>{ticketTitle}</td>
        </tr>
        <tr style='background-color: #f8f9fa;'>
            <td style='padding: 10px; border: 1px solid #ddd; font-weight: bold;'>SLA Policy:</td>
            <td style='padding: 10px; border: 1px solid #ddd;'>{slaPolicyName}</td>
        </tr>
        <tr>
            <td style='padding: 10px; border: 1px solid #ddd; font-weight: bold;'>Time Remaining:</td>
            <td style='padding: 10px; border: 1px solid #ddd;'><strong style='color: #fd7e14;'>{timeRemaining.TotalMinutes:F0} minutes</strong></td>
        </tr>
    </table>
    
    <div style='margin: 20px 0;'>
        <p><strong>Action Recommended:</strong> Please review this ticket to avoid SLA breach.</p>
        <p><a href='#' style='background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View Ticket</a></p>
    </div>
    
    <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;'>
        <p>This is an automated notification from the ERP Training Platform Ticketing System.</p>
    </div>
</body>
</html>";

            foreach (var email in recipients)
            {
                _logger.LogInformation("SLA Warning Email would be sent to {Email}: {Subject}", email, subject);
                
                // TODO: Implement actual email sending
                // await _emailService.SendEmailAsync(email, subject, body, cancellationToken);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SLA warning email for ticket {TicketNumber}", ticketNumber);
            return false;
        }
    }
}