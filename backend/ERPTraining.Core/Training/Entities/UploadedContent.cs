using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Training.Entities;

public class UploadedContent
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ContentType Type { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public int? SectionId { get; set; }
    public int? LessonId { get; set; }
    public string UploadedById { get; set; } = string.Empty;
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string[] AccessRoles { get; set; } = Array.Empty<string>();
    public string? ScribeLink { get; set; }
    public string? VideoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Module Module { get; set; } = null!;
    public virtual Section? Section { get; set; }
    public virtual Lesson? Lesson { get; set; }
    public virtual User UploadedBy { get; set; } = null!;
}

public enum ContentType
{
    Document,
    Video,
    Image,
    Interactive
}
