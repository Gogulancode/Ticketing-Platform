using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Chat;

/// <summary>
/// Represents a file attachment in a chat message
/// </summary>
public class MessageAttachment
{
    [Key]
    public int Id { get; set; }

    public int MessageId { get; set; }

    [ForeignKey("MessageId")]
    public virtual ChatMessage Message { get; set; } = null!;

    /// <summary>
    /// Original filename
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Stored file path/URL
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// MIME type of the file
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// Thumbnail URL for images/videos
    /// </summary>
    [MaxLength(500)]
    public string? ThumbnailPath { get; set; }

    /// <summary>
    /// Width for images/videos
    /// </summary>
    public int? Width { get; set; }

    /// <summary>
    /// Height for images/videos
    /// </summary>
    public int? Height { get; set; }

    /// <summary>
    /// Duration in seconds for audio/video
    /// </summary>
    public int? DurationSeconds { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
