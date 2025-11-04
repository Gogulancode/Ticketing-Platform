namespace ERPTraining.Core.Training.Entities;

public class Question
{
    public int Id { get; set; }
    public int AssessmentId { get; set; }
    public string Text { get; set; } = string.Empty;
    public QuestionType Type { get; set; }
    public string[] Options { get; set; } = Array.Empty<string>();
    public string[] CorrectAnswers { get; set; } = Array.Empty<string>();
    public string? Explanation { get; set; }
    public int Points { get; set; } = 1;
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Assessment Assessment { get; set; } = null!;
    public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();
}

public enum QuestionType
{
    MultipleChoice,
    TrueFalse,
    ShortAnswer,
    Essay
}