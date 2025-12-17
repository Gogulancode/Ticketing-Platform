using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Services.Ticketing;

/// <summary>
/// Background service that monitors tickets for SLA breaches and triggers escalation emails
/// </summary>
public class SlaMonitoringBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SlaMonitoringBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5); // Check every 5 minutes

    public SlaMonitoringBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<SlaMonitoringBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SLA Monitoring Background Service started - checking every {Interval} minutes", _checkInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndTriggerSlaEscalationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SLA Monitoring Background Service");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("SLA Monitoring Background Service is stopping");
    }

    private async Task CheckAndTriggerSlaEscalationsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        _logger.LogDebug("🔍 Checking for SLA breaches...");

        var now = DateTime.UtcNow;

        // Get all open tickets with SLA policies assigned
        var ticketsWithSla = await context.Tickets
            .Include(t => t.SlaPolicy)
                .ThenInclude(p => p!.EscalationContacts)
            .Include(t => t.SlaPolicy)
                .ThenInclude(p => p!.EscalationLevels)
            .Where(t => t.SlaPolicyId != null)
            .Where(t => t.Status != 5 && t.Status != 6) // Not Resolved or Closed
            .Where(t => !t.SlaBreached) // Not already marked as breached
            .ToListAsync(cancellationToken);

        var escalationsTriggered = 0;

        foreach (var ticket in ticketsWithSla)
        {
            if (ticket.SlaPolicy == null) continue;

            var policy = ticket.SlaPolicy;
            var ticketAge = (now - ticket.CreatedAt).TotalMinutes;

            // Check if SLA has been breached (response or resolution time exceeded)
            var isResponseBreached = ticket.FirstResponseAt == null && 
                                     ticketAge > policy.FirstResponseMins;
            var isResolutionBreached = ticket.ResolvedAt == null && 
                                       ticketAge > policy.ResolutionMins;

            if (!isResponseBreached && !isResolutionBreached) continue;

            // Determine which escalation level to trigger based on time elapsed
            var escalationLevels = policy.EscalationLevels?.OrderBy(l => l.Level).ToList() ?? new();
            var contacts = policy.EscalationContacts?.Where(c => c.IsActive && c.NotifyByEmail).ToList() ?? new();

            if (!contacts.Any())
            {
                _logger.LogDebug("No active escalation contacts for policy {PolicyName} on ticket #{TicketNumber}", 
                    policy.Name, ticket.PublicId);
                continue;
            }

            // Find the appropriate escalation level based on time
            int targetLevel = 0;
            foreach (var level in escalationLevels)
            {
                if (ticketAge >= level.TriggerAtMinutes)
                {
                    targetLevel = level.Level;
                }
            }

            // If no escalation level defined, default to level 1 when breached
            if (targetLevel == 0 && (isResponseBreached || isResolutionBreached))
            {
                targetLevel = 1;
            }

            // Check if we've already sent this escalation level
            if (ticket.SlaEscalationLevel >= targetLevel) continue;

            // Get contacts for this escalation level
            var levelContacts = contacts.Where(c => c.Level == targetLevel).ToList();
            if (!levelContacts.Any())
            {
                // If no contacts for this specific level, try level 1 contacts
                levelContacts = contacts.Where(c => c.Level == 1).ToList();
            }

            if (!levelContacts.Any())
            {
                _logger.LogDebug("No contacts found for escalation level {Level} on ticket #{TicketNumber}", 
                    targetLevel, ticket.PublicId);
                continue;
            }

            // Send escalation emails
            var breachType = isResponseBreached ? "Response Time" : "Resolution Time";
            
            foreach (var contact in levelContacts)
            {
                try
                {
                    await notificationService.SendSlaBreachEmailAsync(
                        ticket.PublicId?.ToString() ?? ticket.Id.ToString(),
                        ticket.Title,
                        $"{policy.Name} ({breachType})",
                        targetLevel,
                        now,
                        new[] { contact.Email },
                        cancellationToken);

                    _logger.LogInformation(
                        "📧 Sent SLA escalation email to {Email} (Level {Level}) for ticket #{TicketNumber} - {BreachType} breach",
                        contact.Email, targetLevel, ticket.PublicId, breachType);

                    escalationsTriggered++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send SLA escalation email to {Email} for ticket #{TicketNumber}",
                        contact.Email, ticket.PublicId);
                }
            }

            // Update ticket escalation tracking
            ticket.SlaEscalationLevel = targetLevel;
            ticket.LastSlaEscalationAt = now;
            ticket.SlaBreached = true;
            ticket.UpdatedAt = now;
        }

        if (escalationsTriggered > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("✅ SLA check completed - {Count} escalation(s) triggered", escalationsTriggered);
        }
        else
        {
            _logger.LogDebug("✅ SLA check completed - no escalations needed");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("SLA Monitoring Background Service is stopping");
        await base.StopAsync(cancellationToken);
    }
}
