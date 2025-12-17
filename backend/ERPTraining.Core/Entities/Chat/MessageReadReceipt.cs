using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Chat;

/// <summary>
/// Tracks when users have read messages
/// </summary>
public class MessageReadReceipt
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

    public DateTime ReadAt { get; set; } = DateTime.UtcNow;
}
