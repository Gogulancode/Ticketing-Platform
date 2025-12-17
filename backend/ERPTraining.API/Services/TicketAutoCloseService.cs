using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.API.Services;

/// <summary>
/// Background service that automatically closes resolved tickets after 48 hours
/// if the user has not reopened them.
/// </summary>
public class TicketAutoCloseService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TicketAutoCloseService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(15); // Check every 15 minutes
    private readonly int _autoCloseHours = 48;

    public TicketAutoCloseService(
        IServiceProvider serviceProvider,
        ILogger<TicketAutoCloseService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Ticket Auto-Close Service started. Will check for expired resolved tickets every {Interval} minutes.", 
            _checkInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredResolvedTickets(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Ticket Auto-Close Service");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task ProcessExpiredResolvedTickets(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var cutoffTime = DateTime.UtcNow.AddHours(-_autoCloseHours);

        // Find all resolved tickets (status = 4) that were resolved more than 48 hours ago
        var expiredTickets = await context.Tickets
            .Where(t => t.Status == 4 // Resolved
                && t.ResolvedAt != null 
                && t.ResolvedAt < cutoffTime)
            .ToListAsync(stoppingToken);

        if (expiredTickets.Count == 0)
        {
            _logger.LogDebug("No expired resolved tickets found.");
            return;
        }

        _logger.LogInformation("Found {Count} resolved tickets past the 48-hour reopen window. Auto-closing...", 
            expiredTickets.Count);

        foreach (var ticket in expiredTickets)
        {
            try
            {
                var oldStatus = ticket.Status;
                ticket.Status = 5; // Closed
                ticket.UpdatedAt = DateTime.UtcNow;

                // Add audit log
                var auditLog = new AuditLog
                {
                    TicketId = ticket.Id,
                    Field = "Status",
                    OldValue = "Resolved",
                    NewValue = "Closed (Auto-closed after 48 hours)",
                    ChangedByUserId = "SYSTEM",
                    ChangedAt = DateTime.UtcNow
                };
                context.AuditLogs.Add(auditLog);

                // Add a system comment
                var autoCloseComment = new TicketComment
                {
                    Id = Guid.NewGuid(),
                    TicketId = ticket.Id,
                    Body = "This ticket was automatically closed after 48 hours without being reopened.",
                    IsInternal = false,
                    AuthorUserId = "SYSTEM",
                    CreatedAt = DateTime.UtcNow
                };
                context.TicketComments.Add(autoCloseComment);

                _logger.LogInformation("Auto-closed ticket {TicketId} (#{PublicId}). Was resolved at {ResolvedAt}.",
                    ticket.Id, ticket.PublicId, ticket.ResolvedAt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to auto-close ticket {TicketId}", ticket.Id);
            }
        }

        await context.SaveChangesAsync(stoppingToken);
        
        _logger.LogInformation("Successfully auto-closed {Count} tickets.", expiredTickets.Count);
    }
}
