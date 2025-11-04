using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.Entities
{
    public class PlatformPermission
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string PermissionName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string Feature { get; set; } = string.Empty; // Dashboard, Modules, ContentManagement, etc.
        
        [Required]
        [StringLength(50)]
        public string Action { get; set; } = string.Empty; // Create, Read, Update, Delete, View
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
