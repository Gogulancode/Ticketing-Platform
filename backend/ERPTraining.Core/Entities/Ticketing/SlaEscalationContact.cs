using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.Entities.Ticketing;

public class SlaEscalationContact
{
    public int Id { get; set; }
    
    public Guid SlaPolicyId { get; set; }
    public SlaPolicy SlaPolicy { get; set; } = null!;
    
    [Required]
    [Range(1, 3)]
    public int Level { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(256)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    public bool NotifyByEmail { get; set; } = true;
    public bool NotifyBySystem { get; set; } = true;
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}