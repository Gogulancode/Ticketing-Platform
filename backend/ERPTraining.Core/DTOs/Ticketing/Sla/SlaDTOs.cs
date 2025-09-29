namespace ERPTraining.Core.DTOs.Ticketing.Sla;

public record SlaPolicyDto(
    int Id,
    string Name,
    int PriorityId,
    string PriorityName,
    int ResponseTimeMinutes,
    int ResolutionTimeMinutes,
    int? EscalationLevel1Minutes,
    int? EscalationLevel2Minutes,
    int? EscalationLevel3Minutes,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int EscalationContactsCount
);

public record CreateSlaPolicyRequest(
    string Name,
    int PriorityId,
    int ResponseTimeMinutes,
    int ResolutionTimeMinutes,
    int? EscalationLevel1Minutes,
    int? EscalationLevel2Minutes,
    int? EscalationLevel3Minutes,
    bool? IsActive
);

public record UpdateSlaPolicyRequest(
    string? Name,
    int? PriorityId,
    int? ResponseTimeMinutes,
    int? ResolutionTimeMinutes,
    int? EscalationLevel1Minutes,
    int? EscalationLevel2Minutes,
    int? EscalationLevel3Minutes,
    bool? IsActive
);

public record SlaEscalationContactDto(
    int Id,
    int SlaPolicyId,
    int Level,
    string Name,
    string Email,
    bool NotifyByEmail,
    bool NotifyBySystem,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateSlaEscalationContactRequest(
    int Level,
    string Name,
    string Email,
    bool? NotifyByEmail,
    bool? NotifyBySystem
);

public record UpdateSlaEscalationContactRequest(
    int? Level,
    string? Name,
    string? Email,
    bool? NotifyByEmail,
    bool? NotifyBySystem,
    bool? IsActive
);

public record SlaStatusDto(
    int SlaPolicyId,
    string SlaPolicyName,
    bool ResponseMet,
    bool ResolutionMet,
    bool IsBreached,
    int EscalationLevel,
    DateTime? ResponseDueAt,
    DateTime? ResolutionDueAt,
    DateTime? LastEscalationAt,
    TimeSpan? ResponseTimeRemaining,
    TimeSpan? ResolutionTimeRemaining
);

public record TriggerSlaEscalationRequest(
    Guid TicketId,
    bool ForceEscalation = false
);