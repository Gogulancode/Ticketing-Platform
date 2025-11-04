using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Training.Entities;

public class UserContentProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public int ContentId { get; set; }
    public string Status { get; set; } = "NotStarted"; // NotStarted, InProgress, Completed
    public int TimeSpent { get; set; } = 0; // in minutes
    public decimal CompletionPercentage { get; set; } = 0;
    public DateTime LastAccessed { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual UploadedContent Content { get; set; } = null!;
}
