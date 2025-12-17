using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Chat;

/// <summary>
/// Represents a chat conversation (1:1 or group)
/// </summary>
public class Conversation
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Display name for group conversations (null for 1:1)
    /// </summary>
    [MaxLength(200)]
    public string? Name { get; set; }

    /// <summary>
    /// Type: Direct (1:1), Group, or Channel
    /// </summary>
    public ConversationType Type { get; set; } = ConversationType.Direct;

    /// <summary>
    /// Avatar/icon URL for group conversations
    /// </summary>
    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// ID of user who created the conversation (for groups)
    /// </summary>
    [MaxLength(450)]
    public string? CreatedById { get; set; }

    [ForeignKey("CreatedById")]
    public virtual User? CreatedBy { get; set; }

    /// <summary>
    /// Last message preview for quick display
    /// </summary>
    [MaxLength(500)]
    public string? LastMessagePreview { get; set; }

    /// <summary>
    /// Timestamp of last message for sorting
    /// </summary>
    public DateTime? LastMessageAt { get; set; }

    /// <summary>
    /// Whether the conversation is archived
    /// </summary>
    public bool IsArchived { get; set; } = false;

    /// <summary>
    /// Linked ticket ID if this conversation was converted to a ticket
    /// </summary>
    public int? LinkedTicketId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}

public enum ConversationType
{
    Direct = 0,    // 1:1 conversation
    Group = 1,     // Multi-user group chat
    Channel = 2    // Topic-based channel (like Slack)
}
