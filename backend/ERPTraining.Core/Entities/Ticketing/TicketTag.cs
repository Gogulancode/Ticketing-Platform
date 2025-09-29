using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing;

[Table("TicketTags")]
public class TicketTag
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int SubCategoryId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties - temporarily removed to avoid EF conflicts
    // TODO: Re-enable after fixing entity namespace conflicts
    // [ForeignKey("SubCategoryId")]
    // public virtual ERPTraining.Core.Entities.Tickets.TicketSubCategory SubCategory { get; set; } = null!;
}