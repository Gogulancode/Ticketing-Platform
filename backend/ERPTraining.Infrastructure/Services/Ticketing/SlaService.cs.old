using ERPTraining.Core.DTOs.Ticketing.Sla;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class SlaService : ISlaService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<SlaService> _logger;

    public SlaService(
        ApplicationDbContext context, 
        INotificationService notificationService,
        ILogger<SlaService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    // SLA Policy Management
    public async Task<IEnumerable<SlaPolicyDto>> GetAllPoliciesAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.SlaPolicies
            .Include(s => s.Priority)
            .Include(s => s.EscalationContacts.Where(c => c.IsActive))
            .AsQueryable();

        if (!includeInactive)
            query = query.Where(s => s.IsActive);

        var policies = await query
            .OrderBy(s => s.Priority != null ? s.Priority.Level : 0)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        return policies.Select(MapToDto);
    }

    public async Task<SlaPolicyDto?> GetPolicyByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var policy = await _context.SlaPolicies
            .Include(s => s.Priority)
            .Include(s => s.EscalationContacts.Where(c => c.IsActive))
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        return policy != null ? MapToDto(policy) : null;
    }

    public async Task<SlaPolicyDto?> GetPolicyByPriorityAsync(int priorityId, CancellationToken cancellationToken = default)
    {
        var policy = await _context.SlaPolicies
            .Include(s => s.Priority)
            .Include(s => s.EscalationContacts.Where(c => c.IsActive))
            .FirstOrDefaultAsync(s => s.PriorityId == priorityId && s.IsActive, cancellationToken);

        return policy != null ? MapToDto(policy) : null;
    }

    public async Task<SlaPolicyDto> CreatePolicyAsync(CreateSlaPolicyRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));
            
        if (request.ResponseTimeMinutes <= 0)
            throw new ArgumentException("Response time must be greater than 0", nameof(request.ResponseTimeMinutes));
            
        if (request.ResolutionTimeMinutes <= 0)
            throw new ArgumentException("Resolution time must be greater than 0", nameof(request.ResolutionTimeMinutes));

        // Check if priority already has an SLA policy
        var existingPolicy = await _context.SlaPolicies
            .FirstOrDefaultAsync(s => s.PriorityId == request.PriorityId && s.IsActive, cancellationToken);
            
        if (existingPolicy != null)
            throw new InvalidOperationException($"Priority already has an active SLA policy: {existingPolicy.Name}");

        var policy = new SlaPolicy
        {
            Name = request.Name.Trim(),
            PriorityId = request.PriorityId,
            ResponseTimeMinutes = request.ResponseTimeMinutes,
            ResolutionTimeMinutes = request.ResolutionTimeMinutes,
            EscalationLevel1Minutes = request.EscalationLevel1Minutes,
            EscalationLevel2Minutes = request.EscalationLevel2Minutes,
            EscalationLevel3Minutes = request.EscalationLevel3Minutes,
            IsActive = request.IsActive ?? true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SlaPolicies.Add(policy);
        await _context.SaveChangesAsync(cancellationToken);

        // Load the created policy with navigation properties
        var createdPolicy = await _context.SlaPolicies
            .Include(s => s.Priority)
            .Include(s => s.EscalationContacts)
            .FirstAsync(s => s.Id == policy.Id, cancellationToken);

        _logger.LogInformation("Created SLA policy {PolicyName} for priority {PriorityId}", policy.Name, policy.PriorityId);
        
        return MapToDto(createdPolicy);
    }

    public async Task<SlaPolicyDto?> UpdatePolicyAsync(int id, UpdateSlaPolicyRequest request, CancellationToken cancellationToken = default)
    {
        var policy = await _context.SlaPolicies
            .Include(s => s.Priority)
            .Include(s => s.EscalationContacts)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (policy == null)
            return null;

        if (!string.IsNullOrWhiteSpace(request.Name))
            policy.Name = request.Name.Trim();

        if (request.PriorityId.HasValue)
        {
            // Check if another policy exists for this priority
            var conflictingPolicy = await _context.SlaPolicies
                .FirstOrDefaultAsync(s => s.PriorityId == request.PriorityId.Value && s.Id != id && s.IsActive, cancellationToken);
                
            if (conflictingPolicy != null)
                throw new InvalidOperationException($"Priority already has an active SLA policy: {conflictingPolicy.Name}");
                
            policy.PriorityId = request.PriorityId.Value;
        }

        if (request.ResponseTimeMinutes.HasValue && request.ResponseTimeMinutes.Value > 0)
            policy.ResponseTimeMinutes = request.ResponseTimeMinutes.Value;

        if (request.ResolutionTimeMinutes.HasValue && request.ResolutionTimeMinutes.Value > 0)
            policy.ResolutionTimeMinutes = request.ResolutionTimeMinutes.Value;

        policy.EscalationLevel1Minutes = request.EscalationLevel1Minutes;
        policy.EscalationLevel2Minutes = request.EscalationLevel2Minutes;
        policy.EscalationLevel3Minutes = request.EscalationLevel3Minutes;

        if (request.IsActive.HasValue)
            policy.IsActive = request.IsActive.Value;

        policy.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Updated SLA policy {PolicyId}: {PolicyName}", id, policy.Name);
        
        return MapToDto(policy);
    }

    public async Task<bool> DeletePolicyAsync(int id, CancellationToken cancellationToken = default)
    {
        var policy = await _context.SlaPolicies.FindAsync(new object[] { id }, cancellationToken);
        if (policy == null)
            return false;

        // Soft delete - set to inactive
        policy.IsActive = false;
        policy.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Soft deleted SLA policy {PolicyId}: {PolicyName}", id, policy.Name);
        
        return true;
    }

    // Escalation Contacts Management
    public async Task<IEnumerable<SlaEscalationContactDto>> GetEscalationContactsAsync(int slaPolicyId, CancellationToken cancellationToken = default)
    {
        var contacts = await _context.SlaEscalationContacts
            .Where(c => c.SlaPolicyId == slaPolicyId && c.IsActive)
            .OrderBy(c => c.Level)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

        return contacts.Select(MapContactToDto);
    }

    public async Task<SlaEscalationContactDto?> GetEscalationContactByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var contact = await _context.SlaEscalationContacts
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        return contact != null ? MapContactToDto(contact) : null;
    }

    public async Task<SlaEscalationContactDto> CreateEscalationContactAsync(int slaPolicyId, CreateSlaEscalationContactRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));
            
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required", nameof(request.Email));

        if (request.Level < 1 || request.Level > 3)
            throw new ArgumentException("Level must be between 1 and 3", nameof(request.Level));

        // Verify the SLA policy exists
        var policyExists = await _context.SlaPolicies
            .AnyAsync(s => s.Id == slaPolicyId, cancellationToken);
            
        if (!policyExists)
            throw new ArgumentException("SLA Policy not found", nameof(slaPolicyId));

        var contact = new SlaEscalationContact
        {
            SlaPolicyId = slaPolicyId,
            Level = request.Level,
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            NotifyByEmail = request.NotifyByEmail ?? true,
            NotifyBySystem = request.NotifyBySystem ?? true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SlaEscalationContacts.Add(contact);
        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Created escalation contact {ContactName} for SLA policy {SlaPolicyId} at level {Level}", 
            contact.Name, slaPolicyId, request.Level);

        return MapContactToDto(contact);
    }

    public async Task<SlaEscalationContactDto?> UpdateEscalationContactAsync(int id, UpdateSlaEscalationContactRequest request, CancellationToken cancellationToken = default)
    {
        var contact = await _context.SlaEscalationContacts
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (contact == null)
            return null;

        if (request.Level.HasValue && (request.Level.Value >= 1 && request.Level.Value <= 3))
            contact.Level = request.Level.Value;

        if (!string.IsNullOrWhiteSpace(request.Name))
            contact.Name = request.Name.Trim();

        if (!string.IsNullOrWhiteSpace(request.Email))
            contact.Email = request.Email.Trim().ToLowerInvariant();

        if (request.NotifyByEmail.HasValue)
            contact.NotifyByEmail = request.NotifyByEmail.Value;

        if (request.NotifyBySystem.HasValue)
            contact.NotifyBySystem = request.NotifyBySystem.Value;

        if (request.IsActive.HasValue)
            contact.IsActive = request.IsActive.Value;

        contact.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Updated escalation contact {ContactId}: {ContactName}", id, contact.Name);

        return MapContactToDto(contact);
    }

    public async Task<bool> DeleteEscalationContactAsync(int id, CancellationToken cancellationToken = default)
    {
        var contact = await _context.SlaEscalationContacts.FindAsync(new object[] { id }, cancellationToken);
        if (contact == null)
            return false;

        // Soft delete
        contact.IsActive = false;
        contact.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Soft deleted escalation contact {ContactId}: {ContactName}", id, contact.Name);

        return true;
    }

    // SLA Evaluation & Tracking
    public async Task<SlaStatusDto?> EvaluateTicketSlaAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        var ticket = await _context.Tickets
            .Include(t => t.SlaPolicy)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket?.SlaPolicy == null)
            return null;

        var now = DateTime.UtcNow;
        var responseTimeRemaining = ticket.SlaResponseDueAt.HasValue ? (TimeSpan?)(ticket.SlaResponseDueAt.Value - now) : null;
        var resolutionTimeRemaining = ticket.SlaResolutionDueAt.HasValue ? (TimeSpan?)(ticket.SlaResolutionDueAt.Value - now) : null;

        return new SlaStatusDto(
            ticket.SlaPolicy.Id,
            ticket.SlaPolicy.Name,
            ticket.SlaResponseMet,
            ticket.SlaResolutionMet,
            ticket.SlaBreached,
            ticket.SlaEscalationLevel,
            ticket.SlaResponseDueAt,
            ticket.SlaResolutionDueAt,
            ticket.LastSlaEscalationAt,
            responseTimeRemaining,
            resolutionTimeRemaining
        );
    }

    public async Task<bool> AssignSlaToTicketAsync(Guid ticketId, int? priorityId = null, CancellationToken cancellationToken = default)
    {
        var ticket = await _context.Tickets.FindAsync(new object[] { ticketId }, cancellationToken);
        if (ticket == null)
            return false;

        // Get priority from ticket or parameter
        var effectivePriorityId = priorityId ?? await GetTicketPriorityIdAsync(ticket);
        if (!effectivePriorityId.HasValue)
            return false;

        // Find SLA policy for this priority
        var slaPolicy = await _context.SlaPolicies
            .FirstOrDefaultAsync(s => s.PriorityId == effectivePriorityId.Value && s.IsActive, cancellationToken);

        if (slaPolicy == null)
            return false;

        // Assign SLA to ticket
        var now = DateTime.UtcNow;
        ticket.SlaPolicyId = slaPolicy.Id;
        ticket.SlaResponseDueAt = now.AddMinutes(slaPolicy.ResponseTimeMinutes);
        ticket.SlaResolutionDueAt = now.AddMinutes(slaPolicy.ResolutionTimeMinutes);
        ticket.SlaResponseMet = false;
        ticket.SlaResolutionMet = false;
        ticket.SlaBreached = false;
        ticket.SlaEscalationLevel = 0;

        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Assigned SLA policy {SlaPolicyId} to ticket {TicketId}", slaPolicy.Id, ticketId);

        return true;
    }

    public async Task<bool> UpdateTicketSlaStatusAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        var ticket = await _context.Tickets
            .Include(t => t.SlaPolicy)
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket?.SlaPolicy == null)
            return false;

        var now = DateTime.UtcNow;
        var updated = false;

        // Check response SLA
        if (!ticket.SlaResponseMet && ticket.FirstResponseAt.HasValue)
        {
            ticket.SlaResponseMet = ticket.SlaResponseDueAt.HasValue && 
                ticket.FirstResponseAt.Value <= ticket.SlaResponseDueAt.Value;
            updated = true;
        }

        // Check resolution SLA
        if (!ticket.SlaResolutionMet && ticket.ResolvedAt.HasValue)
        {
            ticket.SlaResolutionMet = ticket.SlaResolutionDueAt.HasValue && 
                ticket.ResolvedAt.Value <= ticket.SlaResolutionDueAt.Value;
            updated = true;
        }

        // Check for breaches
        var wasBreached = ticket.SlaBreached;
        if (!ticket.SlaResponseMet && ticket.SlaResponseDueAt.HasValue && now > ticket.SlaResponseDueAt.Value)
        {
            ticket.SlaBreached = true;
            updated = true;
        }
        if (!ticket.SlaResolutionMet && ticket.SlaResolutionDueAt.HasValue && now > ticket.SlaResolutionDueAt.Value)
        {
            ticket.SlaBreached = true;
            updated = true;
        }

        if (updated)
        {
            await _context.SaveChangesAsync(cancellationToken);
            
            // If newly breached, trigger escalation
            if (!wasBreached && ticket.SlaBreached)
            {
                await TriggerEscalationAsync(ticketId, false, cancellationToken);
            }
        }

        return updated;
    }

    public async Task<IEnumerable<SlaStatusDto>> GetBreachedSlasAsync(DateTime? since = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tickets
            .Include(t => t.SlaPolicy)
            .Where(t => t.SlaPolicy != null && t.SlaBreached);

        if (since.HasValue)
            query = query.Where(t => t.CreatedAt >= since.Value);

        var tickets = await query.ToListAsync(cancellationToken);
        
        return tickets.Select(ticket => new SlaStatusDto(
            ticket.SlaPolicy!.Id,
            ticket.SlaPolicy.Name,
            ticket.SlaResponseMet,
            ticket.SlaResolutionMet,
            ticket.SlaBreached,
            ticket.SlaEscalationLevel,
            ticket.SlaResponseDueAt,
            ticket.SlaResolutionDueAt,
            ticket.LastSlaEscalationAt,
            null,
            null
        ));
    }

    // Escalation & Notifications
    public async Task<bool> TriggerEscalationAsync(Guid ticketId, bool forceEscalation = false, CancellationToken cancellationToken = default)
    {
        var ticket = await _context.Tickets
            .Include(t => t.SlaPolicy)
            .ThenInclude(sp => sp!.EscalationContacts.Where(c => c.IsActive))
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket?.SlaPolicy == null)
            return false;

        var now = DateTime.UtcNow;
        var slaPolicy = ticket.SlaPolicy;
        
        // Determine escalation level
        int newEscalationLevel = ticket.SlaEscalationLevel;
        
        if (forceEscalation || ticket.SlaBreached)
        {
            // Check which escalation level should be triggered based on time elapsed
            var timeSinceBreach = now - (ticket.LastSlaEscalationAt ?? ticket.SlaResolutionDueAt ?? ticket.CreatedAt);
            
            if (slaPolicy.EscalationLevel3Minutes.HasValue && 
                timeSinceBreach.TotalMinutes >= slaPolicy.EscalationLevel3Minutes.Value &&
                ticket.SlaEscalationLevel < 3)
            {
                newEscalationLevel = 3;
            }
            else if (slaPolicy.EscalationLevel2Minutes.HasValue && 
                     timeSinceBreach.TotalMinutes >= slaPolicy.EscalationLevel2Minutes.Value &&
                     ticket.SlaEscalationLevel < 2)
            {
                newEscalationLevel = 2;
            }
            else if (slaPolicy.EscalationLevel1Minutes.HasValue && 
                     timeSinceBreach.TotalMinutes >= slaPolicy.EscalationLevel1Minutes.Value &&
                     ticket.SlaEscalationLevel < 1)
            {
                newEscalationLevel = 1;
            }
        }

        // If no escalation needed, return
        if (newEscalationLevel <= ticket.SlaEscalationLevel && !forceEscalation)
            return false;

        // Update ticket escalation level
        ticket.SlaEscalationLevel = newEscalationLevel;
        ticket.LastSlaEscalationAt = now;

        await _context.SaveChangesAsync(cancellationToken);

        // Send notifications
        await SendSlaBreachNotificationAsync(ticketId, newEscalationLevel, cancellationToken);

        _logger.LogWarning("SLA escalation triggered for ticket {TicketId} to level {EscalationLevel}", 
            ticketId, newEscalationLevel);

        return true;
    }

    public async Task<bool> SendSlaBreachNotificationAsync(Guid ticketId, int escalationLevel, CancellationToken cancellationToken = default)
    {
        var ticket = await _context.Tickets
            .Include(t => t.SlaPolicy)
            .ThenInclude(sp => sp!.EscalationContacts.Where(c => c.IsActive && c.Level == escalationLevel))
            .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket?.SlaPolicy == null)
            return false;

        var contacts = ticket.SlaPolicy.EscalationContacts.Where(c => c.Level == escalationLevel).ToList();
        if (!contacts.Any())
            return false;

        var ticketNumber = ticket.PublicId?.ToString() ?? ticket.Id.ToString();
        var emailRecipients = contacts.Where(c => c.NotifyByEmail).Select(c => c.Email).ToList();
        var systemNotificationRecipients = contacts.Where(c => c.NotifyBySystem).ToList();

        // Send email notifications
        if (emailRecipients.Any())
        {
            await _notificationService.SendSlaBreachEmailAsync(
                ticketNumber,
                ticket.Title,
                ticket.SlaPolicy.Name,
                escalationLevel,
                DateTime.UtcNow,
                emailRecipients,
                cancellationToken
            );
        }

        // Send system notifications (if we have user IDs for the contacts)
        // This would require extending the escalation contact model to include user references
        
        _logger.LogInformation("Sent SLA breach notifications for ticket {TicketId} at escalation level {EscalationLevel} to {ContactCount} contacts", 
            ticketId, escalationLevel, contacts.Count);

        return true;
    }

    public async Task<bool> CheckAndTriggerEscalationsAsync(CancellationToken cancellationToken = default)
    {
        // Get all tickets with active SLA policies that might need escalation
        var tickets = await _context.Tickets
            .Include(t => t.SlaPolicy)
            .Where(t => t.SlaPolicy != null && 
                       t.ResolvedAt == null && // Not resolved yet
                       (t.SlaBreached || 
                        (t.SlaResponseDueAt.HasValue && DateTime.UtcNow > t.SlaResponseDueAt.Value) ||
                        (t.SlaResolutionDueAt.HasValue && DateTime.UtcNow > t.SlaResolutionDueAt.Value)))
            .ToListAsync(cancellationToken);

        var escalationCount = 0;
        
        foreach (var ticket in tickets)
        {
            try
            {
                // Update SLA status first
                await UpdateTicketSlaStatusAsync(ticket.Id, cancellationToken);
                
                // Try to trigger escalation
                var escalated = await TriggerEscalationAsync(ticket.Id, false, cancellationToken);
                if (escalated)
                    escalationCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing SLA escalation for ticket {TicketId}", ticket.Id);
            }
        }

        _logger.LogInformation("Processed {TicketCount} tickets for SLA escalation, triggered {EscalationCount} escalations", 
            tickets.Count, escalationCount);

        return escalationCount > 0;
    }

    // SLA Analytics
    public async Task<object> GetSlaPolicyStatsAsync(int slaPolicyId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tickets
            .Where(t => t.SlaPolicyId == slaPolicyId);

        if (fromDate.HasValue)
            query = query.Where(t => t.CreatedAt >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(t => t.CreatedAt <= toDate.Value);

        var stats = await query
            .GroupBy(t => 1) // Group all results
            .Select(g => new
            {
                TotalTickets = g.Count(),
                ResponseMet = g.Count(t => t.SlaResponseMet),
                ResolutionMet = g.Count(t => t.SlaResolutionMet),
                Breached = g.Count(t => t.SlaBreached),
                EscalationLevel1 = g.Count(t => t.SlaEscalationLevel >= 1),
                EscalationLevel2 = g.Count(t => t.SlaEscalationLevel >= 2),
                EscalationLevel3 = g.Count(t => t.SlaEscalationLevel >= 3),
            })
            .FirstOrDefaultAsync(cancellationToken);

        return stats ?? new { TotalTickets = 0, ResponseMet = 0, ResolutionMet = 0, Breached = 0, EscalationLevel1 = 0, EscalationLevel2 = 0, EscalationLevel3 = 0 };
    }

    public async Task<object> GetOverallSlaPerformanceAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tickets
            .Include(t => t.SlaPolicy)
            .Where(t => t.SlaPolicy != null);

        if (fromDate.HasValue)
            query = query.Where(t => t.CreatedAt >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(t => t.CreatedAt <= toDate.Value);

        var overallStats = await query
            .GroupBy(t => 1)
            .Select(g => new
            {
                TotalTicketsWithSla = g.Count(),
                ResponseSlaMetCount = g.Count(t => t.SlaResponseMet),
                ResolutionSlaMetCount = g.Count(t => t.SlaResolutionMet),
                BreachedCount = g.Count(t => t.SlaBreached),
                AverageResponseTimeMinutes = g.Where(t => t.FirstResponseAt.HasValue)
                    .Average(t => EF.Functions.DateDiffMinute(t.CreatedAt, t.FirstResponseAt!.Value)),
                AverageResolutionTimeMinutes = g.Where(t => t.ResolvedAt.HasValue)
                    .Average(t => EF.Functions.DateDiffMinute(t.CreatedAt, t.ResolvedAt!.Value))
            })
            .FirstOrDefaultAsync(cancellationToken);

        var policyBreakdown = await query
            .GroupBy(t => new { t.SlaPolicy!.Id, t.SlaPolicy.Name })
            .Select(g => new
            {
                SlaPolicyId = g.Key.Id,
                SlaPolicyName = g.Key.Name,
                TicketCount = g.Count(),
                ResponseMetPercentage = g.Count() > 0 ? (double)g.Count(t => t.SlaResponseMet) / g.Count() * 100 : 0,
                ResolutionMetPercentage = g.Count() > 0 ? (double)g.Count(t => t.SlaResolutionMet) / g.Count() * 100 : 0,
                BreachedPercentage = g.Count() > 0 ? (double)g.Count(t => t.SlaBreached) / g.Count() * 100 : 0
            })
            .ToListAsync(cancellationToken);

        return new
        {
            Overall = overallStats,
            ByPolicy = policyBreakdown
        };
    }

    // Helper methods
    private static SlaPolicyDto MapToDto(SlaPolicy policy)
    {
        return new SlaPolicyDto(
            policy.Id,
            policy.Name,
            policy.PriorityId,
            policy.Priority?.Name ?? "Unknown",
            policy.ResponseTimeMinutes,
            policy.ResolutionTimeMinutes,
            policy.EscalationLevel1Minutes,
            policy.EscalationLevel2Minutes,
            policy.EscalationLevel3Minutes,
            policy.IsActive,
            policy.CreatedAt,
            policy.UpdatedAt,
            policy.EscalationContacts?.Count ?? 0
        );
    }

    private static SlaEscalationContactDto MapContactToDto(SlaEscalationContact contact)
    {
        return new SlaEscalationContactDto(
            contact.Id,
            contact.SlaPolicyId,
            contact.Level,
            contact.Name,
            contact.Email,
            contact.NotifyByEmail,
            contact.NotifyBySystem,
            contact.IsActive,
            contact.CreatedAt,
            contact.UpdatedAt
        );
    }

    private async Task<int?> GetTicketPriorityIdAsync(Ticket ticket)
    {
        // This method should map the ticket's priority to the priority ID
        // Implementation depends on how priorities are stored in the ticket
        // For now, assuming we need to look up based on the enum value
        var priority = await _context.TicketPriorities
            .FirstOrDefaultAsync(p => p.Name == ticket.Priority.ToString());
            
        return priority?.Id;
    }
}