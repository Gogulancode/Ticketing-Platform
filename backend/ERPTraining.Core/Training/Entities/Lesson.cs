namespace ERPTraining.Core.Training.Entities;

public class Lesson
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public LessonType Type { get; set; }
    public string Duration { get; set; } = string.Empty;
    public int SectionId { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
    public string? VideoUrl { get; set; }
    public string? DocumentContent { get; set; }
    public string? ScribeLink { get; set; }
    public string[] InteractiveSteps { get; set; } = Array.Empty<string>();
    public bool HasAssessment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Section Section { get; set; } = null!;
    public virtual ICollection<UserLessonProgress> UserProgress { get; set; } = new List<UserLessonProgress>();
}

public enum LessonType
{
    Video,
    Document,
    Interactive,
    Quiz
}
