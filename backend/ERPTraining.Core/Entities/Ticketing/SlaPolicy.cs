using System.ComponentModel.DataAnnotations;
using ERPTraining.Core.Entities.Tickets;

namespace ERPTraining.Core.Entities.Ticketing;

public class SlaPolicy
{
    public Guid Id { get; set; }
    
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    
    public int Category { get; set; }
    public int Priority { get; set; }
    
    [Required]
    public int FirstResponseMins { get; set; }
    
    [Required]
    public int ResolutionMins { get; set; }
    
    public int? EscalationTime { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<SlaEscalationContact> EscalationContacts { get; set; } = new List<SlaEscalationContact>();
    public ICollection<SlaEscalationLevel> EscalationLevels { get; set; } = new List<SlaEscalationLevel>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}