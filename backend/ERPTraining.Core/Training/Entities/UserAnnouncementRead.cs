using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Training.Entities;

public class UserAnnouncementRead
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public Guid AnnouncementId { get; set; }
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual TrainingAnnouncement Announcement { get; set; } = null!;
}
