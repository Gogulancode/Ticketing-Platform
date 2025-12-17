using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Chat;

/// <summary>
/// Tracks user online status and presence
/// </summary>
public class UserPresence
{
    [Key]
    [MaxLength(450)]
    public string UserId { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Current presence status
    /// </summary>
    public PresenceStatus Status { get; set; } = PresenceStatus.Offline;

    /// <summary>
    /// Custom status message
    /// </summary>
    [MaxLength(200)]
    public string? StatusMessage { get; set; }

    /// <summary>
    /// Custom status emoji
    /// </summary>
    [MaxLength(50)]
    public string? StatusEmoji { get; set; }

    /// <summary>
    /// When the custom status expires
    /// </summary>
    public DateTime? StatusExpiresAt { get; set; }

    /// <summary>
    /// SignalR connection ID (for real-time updates)
    /// </summary>
    [MaxLength(100)]
    public string? ConnectionId { get; set; }

    /// <summary>
    /// Device type of current connection
    /// </summary>
    [MaxLength(50)]
    public string? DeviceType { get; set; }

    /// <summary>
    /// Last time user was active
    /// </summary>
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the user came online
    /// </summary>
    public DateTime? OnlineSince { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum PresenceStatus
{
    Offline = 0,
    Online = 1,
    Away = 2,
    Busy = 3,        // Do Not Disturb
    Invisible = 4    // Appear offline
}
