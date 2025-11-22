namespace ERPTraining.Core.DTOs.Ticketing.Sla;

public record SlaEscalationLevelDto(
    int Id,
    Guid SlaPolicyId,
    int Level,
    int TriggerAtMinutes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateSlaEscalationLevelRequest(
    int Level,
    int TriggerAtMinutes
);
