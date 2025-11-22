using ERPTraining.Core.DTOs.Ticketing.Sla;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Data;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class SimpleSlaService : ISlaService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SimpleSlaService> _logger;
    private readonly INotificationService _notificationService;

    public SimpleSlaService(ApplicationDbContext context, ILogger<SimpleSlaService> logger, INotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<IEnumerable<SlaPolicyDto>> GetAllPoliciesAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.SlaPolicies
            .Include(p => p.EscalationContacts)
            .Include(p => p.EscalationLevels)
            .AsQueryable()
            .Where(p => !p.IsDeleted);

        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        var policies = await query.ToListAsync(cancellationToken);

        return policies.Select(MapPolicyToDto);
    }

    public async Task<SlaPolicyDto?> GetPolicyByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var policy = await _context.SlaPolicies
            .Include(p => p.EscalationContacts)
            .Include(p => p.EscalationLevels)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);

        if (policy == null) return null;

        return MapPolicyToDto(policy);
    }

    public async Task<SlaPolicyDto> CreatePolicyAsync(CreateSlaPolicyRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Policy name is required", nameof(request.Name));

        if (request.FirstResponseMins <= 0)
            throw new ArgumentException("Response time must be greater than zero", nameof(request.FirstResponseMins));

        if (request.ResolutionMins <= 0)
            throw new ArgumentException("Resolution time must be greater than zero", nameof(request.ResolutionMins));

        ValidateEscalationLevels(request.EscalationLevels);

        var duplicatePolicy = await _context.SlaPolicies
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.Category == request.Category &&
                     p.Priority == request.Priority &&
                     !p.IsDeleted,
                cancellationToken);

        if (duplicatePolicy is not null)
        {
            throw new InvalidOperationException("An SLA policy already exists for the selected priority. Please update the existing policy instead of creating a new one.");
        }

        var policy = new SlaPolicy
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = true,
            IsDeleted = false,
            Category = request.Category,
            Priority = request.Priority,
            FirstResponseMins = request.FirstResponseMins,
            ResolutionMins = request.ResolutionMins,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SlaPolicies.Add(policy);

        if (request.EscalationLevels != null && request.EscalationLevels.Any())
        {
            foreach (var levelRequest in request.EscalationLevels)
            {
                var level = new SlaEscalationLevel
                {
                    SlaPolicyId = policy.Id,
                    Level = levelRequest.Level,
                    TriggerAtMinutes = levelRequest.TriggerAtMinutes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SlaEscalationLevels.Add(level);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created SLA policy {PolicyName} with priority {Priority}", policy.Name, policy.Priority);

        var savedPolicy = await _context.SlaPolicies
            .Include(p => p.EscalationContacts)
            .Include(p => p.EscalationLevels)
            .FirstOrDefaultAsync(p => p.Id == policy.Id, cancellationToken);

        return MapPolicyToDto(savedPolicy!);
    }

    public async Task<SlaPolicyDto?> UpdatePolicyAsync(Guid id, UpdateSlaPolicyRequest request, CancellationToken cancellationToken = default)
    {
        var policy = await _context.SlaPolicies
            .Include(p => p.EscalationLevels)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);
            
        if (policy == null) return null;

        if (request.FirstResponseMins <= 0)
            throw new ArgumentException("Response time must be greater than zero", nameof(request.FirstResponseMins));

        if (request.ResolutionMins <= 0)
            throw new ArgumentException("Resolution time must be greater than zero", nameof(request.ResolutionMins));

        ValidateEscalationLevels(request.EscalationLevels);

        var isPriorityChanging = policy.Category != request.Category || policy.Priority != request.Priority;

        if (isPriorityChanging)
        {
            var conflictingPolicy = await _context.SlaPolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    p => p.Id != id &&
                         p.Category == request.Category &&
                         p.Priority == request.Priority &&
                         !p.IsDeleted,
                    cancellationToken);

            if (conflictingPolicy is not null)
            {
                throw new InvalidOperationException("An SLA policy already exists for the selected priority. Please adjust that policy instead of assigning the same priority twice.");
            }
        }

        // Update all fields from the request
        policy.Name = request.Name.Trim();
        policy.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        policy.IsActive = request.IsActive;
        policy.Category = request.Category;
        policy.Priority = request.Priority;
        policy.FirstResponseMins = request.FirstResponseMins;
        policy.ResolutionMins = request.ResolutionMins;
        policy.UpdatedAt = DateTime.UtcNow;

        // Update escalation levels
        if (request.EscalationLevels != null)
        {
            // Remove existing levels
            _context.SlaEscalationLevels.RemoveRange(policy.EscalationLevels);
            
            // Add new levels
            foreach (var levelRequest in request.EscalationLevels)
            {
                var level = new SlaEscalationLevel
                {
                    SlaPolicyId = policy.Id,
                    Level = levelRequest.Level,
                    TriggerAtMinutes = levelRequest.TriggerAtMinutes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SlaEscalationLevels.Add(level);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated SLA policy {PolicyId} ({PolicyName})", policy.Id, policy.Name);

        policy = await _context.SlaPolicies
            .Include(p => p.EscalationContacts)
            .Include(p => p.EscalationLevels)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        return MapPolicyToDto(policy!);
    }

    private static void ValidateEscalationLevels(IEnumerable<CreateSlaEscalationLevelRequest>? levels)
    {
        if (levels is null) return;

        var levelGroups = levels.GroupBy(level => level.Level).ToList();

        if (levelGroups.Any(group => group.Key < 1 || group.Key > 3))
            throw new ArgumentException("Escalation levels must be between 1 and 3.", nameof(levels));

        if (levelGroups.Any(group => group.Count() > 1))
            throw new ArgumentException("Duplicate escalation level definitions are not allowed.", nameof(levels));

        if (levelGroups.SelectMany(group => group).Any(level => level.TriggerAtMinutes <= 0))
            throw new ArgumentException("Escalation trigger times must be greater than zero.", nameof(levels));
    }

    private static SlaPolicyDto MapPolicyToDto(SlaPolicy policy)
    {
        return new SlaPolicyDto(
            policy.Id,
            policy.Name ?? string.Empty,
            policy.Description,
            policy.Category,
            policy.Priority,
            policy.FirstResponseMins,
            policy.ResolutionMins,
            policy.EscalationTime,
            policy.IsActive,
            policy.IsDeleted,
            policy.CreatedAt,
            policy.UpdatedAt,
            policy.EscalationContacts?.Count ?? 0,
            policy.EscalationLevels?.Select(level => new SlaEscalationLevelDto(
                level.Id,
                level.SlaPolicyId,
                level.Level,
                level.TriggerAtMinutes,
                level.CreatedAt,
                level.UpdatedAt
            )).ToList()
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

    public async Task<bool> DeletePolicyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var policy = await _context.SlaPolicies.FindAsync(id);
        if (policy == null) return false;

        if (policy.IsDeleted)
        {
            return false;
        }

        policy.IsActive = false;
        policy.IsDeleted = true;
        policy.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Soft deleted SLA policy {PolicyId} ({PolicyName})", policy.Id, policy.Name);

        return true;
    }

    // Escalation Contact methods
    public async Task<IEnumerable<SlaEscalationContactDto>> GetEscalationContactsAsync(Guid? slaPolicyId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.SlaEscalationContacts.AsQueryable();

        if (slaPolicyId.HasValue)
        {
            query = query.Where(contact => contact.SlaPolicyId == slaPolicyId.Value);
        }

        var contacts = await query
            .OrderBy(contact => contact.SlaPolicyId)
            .ThenBy(contact => contact.Level)
            .ThenBy(contact => contact.Name)
            .ToListAsync(cancellationToken);

        return contacts.Select(MapContactToDto);
    }

    public async Task<SlaEscalationContactDto?> GetEscalationContactByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var contact = await _context.SlaEscalationContacts
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        return contact is null ? null : MapContactToDto(contact);
    }

    public async Task<SlaEscalationContactDto> CreateEscalationContactAsync(Guid slaPolicyId, CreateSlaEscalationContactRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Contact name is required.", nameof(request.Name));

        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Contact email is required.", nameof(request.Email));

        if (request.Level < 1 || request.Level > 3)
            throw new ArgumentException("Escalation level must be between 1 and 3.", nameof(request.Level));

        var policyExists = await _context.SlaPolicies
            .AnyAsync(p => p.Id == slaPolicyId && !p.IsDeleted, cancellationToken);

        if (!policyExists)
            throw new ArgumentException("SLA policy not found.", nameof(slaPolicyId));

        var contact = new SlaEscalationContact
        {
            SlaPolicyId = slaPolicyId,
            Level = request.Level,
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            NotifyByEmail = request.NotifyByEmail ?? true,
            NotifyBySystem = request.NotifyBySystem ?? true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SlaEscalationContacts.Add(contact);
        await _context.SaveChangesAsync(cancellationToken);

        return MapContactToDto(contact);
    }

    public async Task<SlaEscalationContactDto?> UpdateEscalationContactAsync(int id, UpdateSlaEscalationContactRequest request, CancellationToken cancellationToken = default)
    {
        var contact = await _context.SlaEscalationContacts
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (contact is null)
            return null;

        if (request.Level.HasValue)
        {
            if (request.Level.Value < 1 || request.Level.Value > 3)
                throw new ArgumentException("Escalation level must be between 1 and 3.", nameof(request.Level));

            contact.Level = request.Level.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
            contact.Name = request.Name.Trim();

        if (!string.IsNullOrWhiteSpace(request.Email))
            contact.Email = request.Email.Trim();

        if (request.NotifyByEmail.HasValue)
            contact.NotifyByEmail = request.NotifyByEmail.Value;

        if (request.NotifyBySystem.HasValue)
            contact.NotifyBySystem = request.NotifyBySystem.Value;

        if (request.IsActive.HasValue)
            contact.IsActive = request.IsActive.Value;

        contact.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MapContactToDto(contact);
    }

    public async Task<bool> DeleteEscalationContactAsync(int id, CancellationToken cancellationToken = default)
    {
        var contact = await _context.SlaEscalationContacts
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (contact is null)
            return false;

        _context.SlaEscalationContacts.Remove(contact);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    // Stub implementations for other required methods
    public Task<SlaPolicyDto?> GetPolicyByPriorityAsync(int priorityId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<SlaStatusDto?> EvaluateTicketSlaAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<bool> AssignSlaToTicketAsync(Guid ticketId, int? priorityId = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<bool> UpdateTicketSlaStatusAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<SlaStatusDto>> GetBreachedSlasAsync(DateTime? since = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public async Task<bool> TriggerEscalationAsync(Guid ticketId, bool forceEscalation = false, CancellationToken cancellationToken = default)
    {
        try
        {
            var ticket = await _context.Tickets
                .Include(t => t.SlaPolicy)
                .FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);
                
            if (ticket == null)
            {
                _logger.LogWarning("Ticket {TicketId} not found for SLA escalation", ticketId);
                return false;
            }

            if (ticket.SlaPolicyId == null)
            {
                _logger.LogWarning("Ticket {TicketId} does not have an SLA policy assigned", ticketId);
                return false;
            }

            // Get escalation contacts for this ticket's SLA policy
            var contacts = await _context.SlaEscalationContacts
                .Where(c => c.SlaPolicyId == ticket.SlaPolicyId && c.IsActive && c.NotifyByEmail)
                .ToListAsync(cancellationToken);
            
            if (!contacts.Any())
            {
                _logger.LogWarning("No active escalation contacts found for SLA policy {SlaPolicyId} on ticket {TicketId}", 
                    ticket.SlaPolicyId, ticketId);
                return false;
            }

            var slaPolicyName = ticket.SlaPolicy?.Name ?? "SLA Policy";
            
            foreach (var contact in contacts)
            {
                await _notificationService.SendSlaBreachEmailAsync(
                    ticket.PublicId?.ToString() ?? ticket.Id.ToString(),
                    ticket.Title,
                    slaPolicyName,
                    contact.Level,
                    DateTime.UtcNow, // breach time
                    new[] { contact.Email },
                    cancellationToken);
                    
                _logger.LogInformation("Sent SLA escalation email to {Email} (Level {Level}) for ticket #{TicketNumber}", 
                    contact.Email, contact.Level, ticket.PublicId);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to trigger SLA escalation for ticket {TicketId}", ticketId);
            return false;
        }
    }

    public async Task<bool> SendSlaBreachNotificationAsync(Guid ticketId, int escalationLevel, CancellationToken cancellationToken = default)
    {
        return await TriggerEscalationAsync(ticketId, false, cancellationToken);
    }

    public async Task<bool> CheckAndTriggerEscalationsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Checking for SLA escalations...");
            
            // This would typically check for tickets that have breached their SLA
            // For now, just return true as this is a background service method
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check and trigger SLA escalations");
            return false;
        }
    }

    public Task<object> GetSlaPolicyStatsAsync(Guid slaPolicyId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<object> GetOverallSlaPerformanceAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<SlaStatusDto?> GetTicketSlaStatusAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task TriggerSlaEscalationAsync(TriggerSlaEscalationRequest request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task ProcessSlaBreachesAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<SlaStatusDto>> GetBreachedTicketsAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<SlaPolicyDto?> GetPolicyForTicketAsync(int categoryId, int priorityId, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }
}