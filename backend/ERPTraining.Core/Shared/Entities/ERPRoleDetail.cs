using ERPTraining.Core.Training.Entities;

namespace ERPTraining.Core.Entities;

public class ERPRoleDetail
{
    public int Id { get; set; }
    
    // ERP System IDs (from API response)
    public int ERPRoleId { get; set; }        // lRoleId from API
    public int ERPModuleId { get; set; }      // lModuleId from API  
    public int ERPTaskId { get; set; }        // lTaskId from API (Section ID)
    public string RoleDetailName { get; set; } = string.Empty; // sTaskId from API
    
    // Our internal IDs (mapped from ERP IDs)
    public int? RoleId { get; set; }          // Maps to our RoleMasters.RoleId
    public int? ModuleId { get; set; }        // Maps to our Modules.ModuleId
    public int? SectionId { get; set; }       // Maps to our Sections.SectionId
    
    // Status and permissions
    public bool IsActive { get; set; } = true;
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    
    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsERPSynced { get; set; } = true; // Indicates this came from ERP
    
    // Navigation properties
    public virtual RoleMaster? Role { get; set; }
    public virtual Module? Module { get; set; }
    public virtual Section? Section { get; set; }
}
