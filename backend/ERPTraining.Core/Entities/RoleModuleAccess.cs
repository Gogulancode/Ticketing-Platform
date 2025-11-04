using ERPTraining.Core.Training.Entities;

namespace ERPTraining.Core.Entities;

public class RoleModuleAccess
{
    public int Id { get; set; }
    public string RoleId { get; set; } = string.Empty; // Role GUID from Identity
    public int ModuleId { get; set; }
    public int? SectionId { get; set; } // Nullable - if null, role has access to entire module
    public string SectionName { get; set; } = string.Empty; // Add section name from your data
    public string? ErpRoleId { get; set; } // Your original role ID from JSON
    public string? ErpModuleId { get; set; } // Your original module ID from JSON  
    public string? ErpSectionId { get; set; } // Your original section ID from JSON
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Module Module { get; set; } = null!;
    public virtual Section? Section { get; set; }
}
