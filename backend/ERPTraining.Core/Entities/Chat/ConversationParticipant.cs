using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Chat;

/// <summary>
/// Represents a user's participation in a conversation
/// </summary>
public class ConversationParticipant
{
    [Key]
    public int Id { get; set; }

    public int ConversationId { get; set; }

    [ForeignKey("ConversationId")]
    public virtual Conversation Conversation { get; set; } = null!;

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Role in the conversation (for groups/channels)
    /// </summary>
    public ParticipantRole Role { get; set; } = ParticipantRole.Member;

    /// <summary>
    /// Custom notification settings for this conversation
    /// </summary>
    public NotificationPreference NotificationPreference { get; set; } = NotificationPreference.All;

    /// <summary>
    /// Whether the user has muted this conversation
    /// </summary>
    public bool IsMuted { get; set; } = false;

    /// <summary>
    /// Whether the user has pinned this conversation
    /// </summary>
    public bool IsPinned { get; set; } = false;

    /// <summary>
    /// Last time user read messages in this conversation
    /// </summary>
    public DateTime? LastReadAt { get; set; }

    /// <summary>
    /// Count of unread messages
    /// </summary>
    public int UnreadCount { get; set; } = 0;

    /// <summary>
    /// Whether the user has left the conversation (for groups)
    /// </summary>
    public bool HasLeft { get; set; } = false;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LeftAt { get; set; }
}

public enum ParticipantRole
{
    Member = 0,
    Admin = 1,
    Owner = 2
}

public enum NotificationPreference
{
    All = 0,           // All messages
    Mentions = 1,      // Only @mentions
    None = 2           // No notifications
}
