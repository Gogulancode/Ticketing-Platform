using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Training.Entities;

public class Module
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string EstimatedTime { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string[] Prerequisites { get; set; } = Array.Empty<string>();
    public string[] LearningObjectives { get; set; } = Array.Empty<string>();
    public bool IsActive { get; set; } = true;
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ERP Integration fields
    public int? ERPID { get; set; } // The actual ERP Module ID (lId from ERP API)
    public bool IsERPModule { get; set; } = false;
    public DateTime? LastSyncedFromERP { get; set; }
    public string ERPSource { get; set; } = "Local"; // "ERP" or "Local"

    // Navigation properties
    public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
    public virtual ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    public virtual ICollection<UserModuleProgress> UserProgress { get; set; } = new List<UserModuleProgress>();
    public virtual ICollection<RoleModuleSection> RoleModuleSections { get; set; } = new List<RoleModuleSection>();
}
