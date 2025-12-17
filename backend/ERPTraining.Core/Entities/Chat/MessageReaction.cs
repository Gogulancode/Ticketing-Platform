using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Chat;

/// <summary>
/// Represents an emoji reaction to a message
/// </summary>
public class MessageReaction
{
    [Key]
    public int Id { get; set; }

    public int MessageId { get; set; }

    [ForeignKey("MessageId")]
    public virtual ChatMessage Message { get; set; } = null!;

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Emoji character or shortcode
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Emoji { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
