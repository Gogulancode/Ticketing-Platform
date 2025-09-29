using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPTraining.Core.Entities.Tickets;

namespace ERPTraining.Core.Entities.Ticketing;

[Table("GraphEmailConfigs")]
public class GraphEmailConfig
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string TenantId { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string ClientId { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string ClientSecret { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public int? CategoryId { get; set; }

    public bool ProcessIncomingEmails { get; set; } = true;
    
    public bool CreateTicketsFromEmails { get; set; } = true;
    
    public bool SendNotifications { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("CategoryId")]
    public virtual TicketCategory? Category { get; set; }
}