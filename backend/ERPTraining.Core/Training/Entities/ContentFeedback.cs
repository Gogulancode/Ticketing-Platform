using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Training.Entities;

public class ContentFeedback
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public int? ContentId { get; set; }
    public int? AssessmentId { get; set; }
    public int Rating { get; set; } // 1-5 scale
    public string? FeedbackText { get; set; }
    public bool IsHelpful { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual UploadedContent? Content { get; set; }
    public virtual Assessment? Assessment { get; set; }
}
