namespace ERPTraining.Core.Interfaces.Ticketing;

public interface INotificationService
{
    Task<bool> SendSlaBreachEmailAsync(
        string ticketNumber, 
        string ticketTitle, 
        string slaPolicyName, 
        int escalationLevel, 
        DateTime breachTime, 
        IEnumerable<string> recipientEmails,
        CancellationToken cancellationToken = default);
        
    Task<bool> SendSystemNotificationAsync(
        string userId, 
        string title, 
        string message, 
        string? actionUrl = null,
        CancellationToken cancellationToken = default);
        
    Task<bool> SendSlaWarningEmailAsync(
        string ticketNumber, 
        string ticketTitle, 
        string slaPolicyName, 
        TimeSpan timeRemaining, 
        IEnumerable<string> recipientEmails,
        CancellationToken cancellationToken = default);
}