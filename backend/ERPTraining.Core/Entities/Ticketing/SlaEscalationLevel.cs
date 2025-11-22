namespace ERPTraining.Core.Entities.Ticketing;

public class SlaEscalationLevel
{
    public int Id { get; set; }
    public Guid SlaPolicyId { get; set; }
    public int Level { get; set; } // 1, 2, or 3
    public int TriggerAtMinutes { get; set; } // When to trigger this escalation level
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public SlaPolicy? SlaPolicy { get; set; }
}
