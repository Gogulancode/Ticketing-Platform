namespace ERPTraining.Core.DTOs;

public class ModuleDto
{
    public int Id { get; set; }
    public int? OriginalModuleId { get; set; } // Original ID from JSON
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string EstimatedTime { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string[] Prerequisites { get; set; } = Array.Empty<string>();
    public string[] LearningObjectives { get; set; } = Array.Empty<string>();
    public bool IsActive { get; set; }
    public int Order { get; set; }
    public string? ErpModuleId { get; set; }
    public int Progress { get; set; }
    public bool IsLocked { get; set; }
    public List<SectionDto> Sections { get; set; } = new();
}

public class CreateModuleDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string EstimatedTime { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string[] Prerequisites { get; set; } = Array.Empty<string>();
    public string[] LearningObjectives { get; set; } = Array.Empty<string>();
    public int Order { get; set; }
    public string? ErpModuleId { get; set; }
}

public class UpdateModuleDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string EstimatedTime { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string[] Prerequisites { get; set; } = Array.Empty<string>();
    public string[] LearningObjectives { get; set; } = Array.Empty<string>();
    public bool IsActive { get; set; }
    public int Order { get; set; }
    public string? ErpModuleId { get; set; }
}
