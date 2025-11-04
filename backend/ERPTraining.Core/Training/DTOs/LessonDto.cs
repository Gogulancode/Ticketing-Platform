using ERPTraining.Core.Training.Entities;

namespace ERPTraining.Core.DTOs;

public class LessonDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public LessonType Type { get; set; }
    public string Duration { get; set; } = string.Empty;
    public int SectionId { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; }
    public string? VideoUrl { get; set; }
    public string? DocumentContent { get; set; }
    public string? ScribeLink { get; set; }
    public string[] InteractiveSteps { get; set; } = Array.Empty<string>();
    public bool HasAssessment { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsLocked { get; set; }
}

public class CreateLessonDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public LessonType Type { get; set; }
    public string Duration { get; set; } = string.Empty;
    public int SectionId { get; set; }
    public int Order { get; set; }
    public string? VideoUrl { get; set; }
    public string? DocumentContent { get; set; }
    public string? ScribeLink { get; set; }
    public string[] InteractiveSteps { get; set; } = Array.Empty<string>();
    public bool HasAssessment { get; set; }
}

public class UpdateLessonDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public LessonType Type { get; set; }
    public string Duration { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int Order { get; set; }
    public string? VideoUrl { get; set; }
    public string? DocumentContent { get; set; }
    public string? ScribeLink { get; set; }
    public string[] InteractiveSteps { get; set; } = Array.Empty<string>();
    public bool HasAssessment { get; set; }
}
