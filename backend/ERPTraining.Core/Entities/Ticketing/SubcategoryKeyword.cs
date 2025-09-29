using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing;

/// <summary>
/// Entity for mapping keywords to subcategories for auto assignment
/// </summary>
[Table("SubcategoryKeywords")]
public class SubcategoryKeyword
{
    /// <summary>
    /// Primary key
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Reference to the subcategory
    /// </summary>
    [Required]
    public int SubcategoryId { get; set; }

    /// <summary>
    /// Navigation property to subcategory
    /// </summary>
    [ForeignKey(nameof(SubcategoryId))]
    public virtual ERPTraining.Core.Entities.Tickets.TicketSubCategory Subcategory { get; set; } = null!;

    /// <summary>
    /// The keyword that triggers assignment to this subcategory
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Keyword { get; set; } = string.Empty;

    /// <summary>
    /// Weight/priority of this keyword (higher = more important)
    /// </summary>
    public int Weight { get; set; } = 1;

    /// <summary>
    /// Whether this keyword mapping is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When this keyword mapping was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When this keyword mapping was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created this mapping
    /// </summary>
    [StringLength(450)]
    public string? CreatedByUserId { get; set; }

    /// <summary>
    /// Optional description for this keyword mapping
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }
}