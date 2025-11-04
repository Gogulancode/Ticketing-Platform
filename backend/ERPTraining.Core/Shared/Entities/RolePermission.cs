namespace ERPTraining.Core.Entities
{
    public class RolePermission
    {
        public int Id { get; set; }
        
        public int PlatformRoleId { get; set; }
        public virtual PlatformRole PlatformRole { get; set; } = null!;
        
        public int PlatformPermissionId { get; set; }
        public virtual PlatformPermission PlatformPermission { get; set; } = null!;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
