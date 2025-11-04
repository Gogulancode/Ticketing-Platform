using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Training.Entities;

public class TrainingAnnouncement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
    public string Type { get; set; } = "General"; // General, NewModule, Assessment, Maintenance, Mistake
    public string? TargetRoles { get; set; } // JSON array of role IDs
    public string? TargetUsers { get; set; } // JSON array of user IDs
    public int? ModuleId { get; set; }
    public int? SectionId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime PublishDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Creator { get; set; } = null!;
    public virtual Module? Module { get; set; }
    public virtual Section? Section { get; set; }
    public virtual ICollection<UserAnnouncementRead> UserReads { get; set; } = new List<UserAnnouncementRead>();
}
