using System.Collections.Generic;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;
using ApplicationUser = ERPTraining.Core.Entities.User;

namespace ERPTraining.Core.Interfaces.Ticketing;

public interface IEmailService
{
    Task SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        bool isHtml = true,
        IEnumerable<OutgoingEmailAttachment>? attachments = null,
        CancellationToken cancellationToken = default);
    Task SendTicketAssignmentNotificationAsync(Ticket ticket, ApplicationUser agent, CancellationToken cancellationToken = default);
    Task SendCollaboratorAddedNotificationAsync(Ticket ticket, ApplicationUser collaborator, ApplicationUser addedBy, CancellationToken cancellationToken = default);
    Task SendTicketResolvedNotificationAsync(Ticket ticket, ApplicationUser creator, string? resolutionNotes, CancellationToken cancellationToken = default);
}

public sealed record OutgoingEmailAttachment(string FileName, string ContentType, byte[] Content);

public interface IEmailToTicketProcessor
{
    Task ProcessEmailsAsync(CancellationToken cancellationToken = default);
}