using ERPTraining.Core.DTOs.Ticketing.Sla;
using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.Core.Interfaces.Ticketing;

public interface ISlaService
{
    // SLA Policy Management
    Task<IEnumerable<SlaPolicyDto>> GetAllPoliciesAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<SlaPolicyDto?> GetPolicyByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SlaPolicyDto?> GetPolicyByPriorityAsync(int priorityId, CancellationToken cancellationToken = default);
    Task<SlaPolicyDto> CreatePolicyAsync(CreateSlaPolicyRequest request, CancellationToken cancellationToken = default);
    Task<SlaPolicyDto?> UpdatePolicyAsync(Guid id, UpdateSlaPolicyRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeletePolicyAsync(Guid id, CancellationToken cancellationToken = default);
    
    // Escalation Contacts Management
    Task<IEnumerable<SlaEscalationContactDto>> GetEscalationContactsAsync(Guid? slaPolicyId = null, CancellationToken cancellationToken = default);
    Task<SlaEscalationContactDto?> GetEscalationContactByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<SlaEscalationContactDto> CreateEscalationContactAsync(Guid slaPolicyId, CreateSlaEscalationContactRequest request, CancellationToken cancellationToken = default);
    Task<SlaEscalationContactDto?> UpdateEscalationContactAsync(int id, UpdateSlaEscalationContactRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteEscalationContactAsync(int id, CancellationToken cancellationToken = default);
    
    // SLA Evaluation & Tracking
    Task<SlaStatusDto?> EvaluateTicketSlaAsync(Guid ticketId, CancellationToken cancellationToken = default);
    Task<bool> AssignSlaToTicketAsync(Guid ticketId, int? priorityId = null, CancellationToken cancellationToken = default);
    Task<bool> UpdateTicketSlaStatusAsync(Guid ticketId, CancellationToken cancellationToken = default);
    Task<IEnumerable<SlaStatusDto>> GetBreachedSlasAsync(DateTime? since = null, CancellationToken cancellationToken = default);
    
    // Escalation & Notifications
    Task<bool> TriggerEscalationAsync(Guid ticketId, bool forceEscalation = false, CancellationToken cancellationToken = default);
    Task<bool> SendSlaBreachNotificationAsync(Guid ticketId, int escalationLevel, CancellationToken cancellationToken = default);
    Task<bool> CheckAndTriggerEscalationsAsync(CancellationToken cancellationToken = default); // For background service
    
    // SLA Analytics
    Task<object> GetSlaPolicyStatsAsync(Guid slaPolicyId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<object> GetOverallSlaPerformanceAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
}