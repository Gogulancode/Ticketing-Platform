namespace ERPTraining.Core.Training.Entities;

public class Assessment
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public int? SectionId { get; set; }
    public int? LessonId { get; set; }
    public int PassingScore { get; set; }
    public int TimeLimit { get; set; } // in minutes
    public int MaxAttempts { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsRequired { get; set; }
    public AssessmentTriggerType TriggerType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Module Module { get; set; } = null!;
    public virtual Section? Section { get; set; }
    public virtual Lesson? Lesson { get; set; }
    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
    public virtual ICollection<AssessmentAttempt> Attempts { get; set; } = new List<AssessmentAttempt>();
}

public enum AssessmentTriggerType
{
    SectionCompletion,
    ModuleCompletion,
    LessonCompletion
}
