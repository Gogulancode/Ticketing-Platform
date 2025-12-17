using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Chat;

/// <summary>
/// Pre-defined response templates for quick replies
/// </summary>
public class CannedResponse
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Short name/title for the response
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Keyboard shortcut (e.g., "/greeting", "/thanks")
    /// </summary>
    [MaxLength(50)]
    public string? Shortcut { get; set; }

    /// <summary>
    /// The response content (can include variables like {{name}})
    /// </summary>
    [Required]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Category for organization
    /// </summary>
    [MaxLength(100)]
    public string? Category { get; set; }

    /// <summary>
    /// Owner user ID (null = shared/team template)
    /// </summary>
    [MaxLength(450)]
    public string? OwnerId { get; set; }

    [ForeignKey("OwnerId")]
    public virtual User? Owner { get; set; }

    /// <summary>
    /// Whether this is a personal or shared template
    /// </summary>
    public bool IsPersonal { get; set; } = true;

    /// <summary>
    /// Usage count for sorting by popularity
    /// </summary>
    public int UsageCount { get; set; } = 0;

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
