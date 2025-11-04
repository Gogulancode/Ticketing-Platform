using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.Entities;

public class RoleMaster
{
    [Key]
    public int RoleId { get; set; } // Primary key matching existing database structure
    
    public int? ERPRoleId { get; set; } // ERP Role ID (nullable for platform-created roles)
    
    [Required]
    public string RoleName { get; set; } = string.Empty;
    
    public string? Remarks { get; set; }
    
    public bool IsActive { get; set; } = true; // Active/Inactive status
    
    public bool IsERPRole { get; set; } = false; // Flag to identify ERP vs platform roles
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
