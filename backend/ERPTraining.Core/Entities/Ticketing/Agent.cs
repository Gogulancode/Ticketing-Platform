using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Entities.Ticketing;

public class Agent
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public int? AgentGroupId { get; set; }
    public bool IsActive { get; set; } = true;
    public int MaxTicketsCapacity { get; set; }
    public int CurrentTicketCount { get; set; }
    public string AvailabilityStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public virtual User User { get; set; } = null!;
}