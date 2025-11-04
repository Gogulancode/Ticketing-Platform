namespace ERPTraining.Core.Training.Entities;

public class UserAnswer
{
    public int Id { get; set; }
    public int AssessmentAttemptId { get; set; }
    public int QuestionId { get; set; }
    public string[] SelectedAnswers { get; set; } = Array.Empty<string>();
    public string? TextAnswer { get; set; }
    public bool IsCorrect { get; set; }
    public int PointsEarned { get; set; }
    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual AssessmentAttempt AssessmentAttempt { get; set; } = null!;
    public virtual Question Question { get; set; } = null!;
}
