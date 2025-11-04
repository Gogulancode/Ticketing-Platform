namespace ERPTraining.Core.DTOs;

public class SectionDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; }
    public string? ErpSectionId { get; set; }
    public List<LessonDto> Lessons { get; set; } = new();
}

public class CreateSectionDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public int Order { get; set; }
    public string? ErpSectionId { get; set; }
}

public class UpdateSectionDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int Order { get; set; }
    public string? ErpSectionId { get; set; }
}
