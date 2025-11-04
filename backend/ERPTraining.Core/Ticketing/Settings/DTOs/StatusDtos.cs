namespace ERPTraining.Core.Ticketing.Settings.DTOs;

public record TicketStatusDto(
    int Id,
    string Name,
    int WorkflowOrder,
    bool IsActive,
    string Color,
    bool IsDefault,
    bool IsClosedStatus,
    int[] AllowedTransitions
);

public record CreateTicketStatusRequest
{
    public string Name { get; init; } = string.Empty;
    public int? WorkflowOrder { get; init; }
    public bool? IsActive { get; init; }
    public string? Color { get; init; }
    public bool? IsDefault { get; init; }
    public bool? IsClosedStatus { get; init; }
    // Accept array; backend will serialize to comma-separated string
    public int[]? AllowedTransitions { get; init; }
}

public record UpdateTicketStatusRequest
{
    public string? Name { get; init; }
    public int? WorkflowOrder { get; init; }
    public bool IsActive { get; init; }
    public string? Color { get; init; }
    public bool? IsDefault { get; init; }
    public bool? IsClosedStatus { get; init; }
    public int[]? AllowedTransitions { get; init; }
}
