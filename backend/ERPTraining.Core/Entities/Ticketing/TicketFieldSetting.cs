using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPTraining.Core.Entities.Tickets;

namespace ERPTraining.Core.Entities.Ticketing;

[Table("TicketFieldSettings")]
public class TicketFieldSetting
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [Required]
    [StringLength(100)]
    public string FieldName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string FieldType { get; set; } = string.Empty; // "Dropdown", "Text", "Date", "Number"

    public bool IsMandatory { get; set; } = false;

    public bool IsActive { get; set; } = true;

    [StringLength(1000)]
    public string? Options { get; set; } // JSON array for dropdown options

    [StringLength(200)]
    public string? PlaceholderText { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("CategoryId")]
    public virtual TicketCategory? Category { get; set; }
}