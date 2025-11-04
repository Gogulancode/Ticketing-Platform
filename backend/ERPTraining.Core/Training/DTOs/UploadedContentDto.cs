using ERPTraining.Core.Training.Entities;

namespace ERPTraining.Core.DTOs;

public class CreateUploadedContentDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
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
}
