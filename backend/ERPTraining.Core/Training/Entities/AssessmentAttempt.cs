using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Training.Entities;

public class AssessmentAttempt
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int AssessmentId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public bool Passed { get; set; }
    public int AttemptNumber { get; set; }
    public int TimeSpent { get; set; } // in seconds
    public AssessmentStatus Status { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Assessment Assessment { get; set; } = null!;
    public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();
}

public enum AssessmentStatus
{
    InProgress,
    Completed,
    Abandoned,
    TimeExpired
}
