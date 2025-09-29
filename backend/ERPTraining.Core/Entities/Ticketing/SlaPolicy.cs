using System.ComponentModel.DataAnnotations;
using ERPTraining.Core.Entities.Tickets;

namespace ERPTraining.Core.Entities.Ticketing;

public class SlaPolicy
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    public int PriorityId { get; set; }
    public Tickets.TicketPriority? Priority { get; set; }
    
    [Required]
    public int ResponseTimeMinutes { get; set; }
    
    [Required]
    public int ResolutionTimeMinutes { get; set; }
    
    public int? EscalationLevel1Minutes { get; set; }
    public int? EscalationLevel2Minutes { get; set; }
    public int? EscalationLevel3Minutes { get; set; }
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<SlaEscalationContact> EscalationContacts { get; set; } = new List<SlaEscalationContact>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}