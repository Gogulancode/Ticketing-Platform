namespace ERPTraining.Core.Interfaces.Ticketing;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body, bool isHtml = true, CancellationToken cancellationToken = default);
}

public interface IEmailToTicketProcessor
{
    Task ProcessEmailsAsync(CancellationToken cancellationToken = default);
}