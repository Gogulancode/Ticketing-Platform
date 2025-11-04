using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Training.Entities;

public class UserLessonProgress
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int LessonId { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int TimeSpentMinutes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Lesson Lesson { get; set; } = null!;
}

public class UserModuleProgress
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int CompletedSections { get; set; }
    public int TotalSections { get; set; }
    public double ProgressPercentage { get; set; }
    public double CompletionPercentage { get; set; } // Added for Infrastructure compatibility
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Module Module { get; set; } = null!;
}