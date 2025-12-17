using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Chat;

/// <summary>
/// Represents a single chat message
/// </summary>
public class ChatMessage
{
    [Key]
    public int Id { get; set; }

    public int ConversationId { get; set; }

    [ForeignKey("ConversationId")]
    public virtual Conversation Conversation { get; set; } = null!;

    [Required]
    [MaxLength(450)]
    public string SenderId { get; set; } = null!;

    [ForeignKey("SenderId")]
    public virtual User Sender { get; set; } = null!;

    /// <summary>
    /// Message content (plain text or markdown)
    /// </summary>
    [Required]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Type of message
    /// </summary>
    public MessageType Type { get; set; } = MessageType.Text;

    /// <summary>
    /// Parent message ID for threaded replies
    /// </summary>
    public int? ParentMessageId { get; set; }

    [ForeignKey("ParentMessageId")]
    public virtual ChatMessage? ParentMessage { get; set; }

    /// <summary>
    /// Whether the message has been edited
    /// </summary>
    public bool IsEdited { get; set; } = false;

    /// <summary>
    /// When the message was edited
    /// </summary>
    public DateTime? EditedAt { get; set; }

    /// <summary>
    /// Whether the message is deleted (soft delete)
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// When the message was deleted
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    /// <summary>
    /// System message data (for join/leave notifications etc.)
    /// </summary>
    [MaxLength(1000)]
    public string? SystemData { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<ChatMessage> Replies { get; set; } = new List<ChatMessage>();
    public virtual ICollection<MessageAttachment> Attachments { get; set; } = new List<MessageAttachment>();
    public virtual ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
    public virtual ICollection<MessageReadReceipt> ReadReceipts { get; set; } = new List<MessageReadReceipt>();
}

public enum MessageType
{
    Text = 0,
    Image = 1,
    File = 2,
    Voice = 3,
    System = 4,      // Join, leave, etc.
    TicketLink = 5   // Reference to a ticket
}
