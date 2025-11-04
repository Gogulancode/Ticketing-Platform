using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Training.Entities;

public class LearningRecommendation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string RecommendationType { get; set; } = string.Empty; // MistakeBasedReview, AdvancedTopic, Prerequisites
    public int Priority { get; set; } = 5; // 1-10 scale
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ModuleId { get; set; }
    public int? SectionId { get; set; }
    public int? ContentId { get; set; }
    public int? AssessmentId { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Module? Module { get; set; }
    public virtual Section? Section { get; set; }
    public virtual UploadedContent? Content { get; set; }
    public virtual Assessment? Assessment { get; set; }
}
