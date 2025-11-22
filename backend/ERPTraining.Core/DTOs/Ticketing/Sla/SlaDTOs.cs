namespace ERPTraining.Core.DTOs.Ticketing.Sla;

public record SlaPolicyDto(
    Guid Id,
    string Name,
    string? Description,
    int Category,
    int Priority,
    int FirstResponseMins,
    int ResolutionMins,
    int? EscalationTime,
    bool IsActive,
    bool IsDeleted,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int EscalationContactsCount,
    List<SlaEscalationLevelDto>? EscalationLevels = null
);

public record CreateSlaPolicyRequest(
    string Name,
    string? Description,
    int Category,
    int Priority,
    int FirstResponseMins,
    int ResolutionMins,
    List<CreateSlaEscalationLevelRequest>? EscalationLevels = null
);

public record UpdateSlaPolicyRequest(
    string Name,
    string? Description,
    bool IsActive,
    int Category,
    int Priority,
    int FirstResponseMins,
    int ResolutionMins,
    List<CreateSlaEscalationLevelRequest>? EscalationLevels = null
);

public record SlaEscalationContactDto(
    int Id,
    Guid SlaPolicyId,
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
    Guid SlaPolicyId,
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