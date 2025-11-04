namespace ERPTraining.Core.Entities.Tickets;

public class TicketStatus
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int WorkflowOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public string Color { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false;
    public bool IsClosedStatus { get; set; } = false;
    public string? AllowedTransitions { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}