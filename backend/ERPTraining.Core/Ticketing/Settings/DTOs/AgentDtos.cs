using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.Core.Ticketing.Settings.DTOs;

public record AgentDto(
    int Id,
    string UserId,
    string Name,
    string Email,
    string Department,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record GroupAgentDto(
    int TicketGroupId,
    int AgentId,
    int MembershipId,
    bool IsActive,
    DateTime AssignedAt,
    // Flattened agent info for convenience in UI
    string AgentName,
    string AgentEmail
);

public record AddAgentToGroupRequest(int AgentId);
