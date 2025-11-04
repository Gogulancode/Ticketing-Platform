namespace ERPTraining.Core.DTOs
{
    public class PlatformRoleDto
    {
        public int Id { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<PlatformPermissionDto> Permissions { get; set; } = new();
    }
    
    public class CreatePlatformRoleDto
    {
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<int> PermissionIds { get; set; } = new();
    }
    
    public class UpdatePlatformRoleDto
    {
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public List<int> PermissionIds { get; set; } = new();
    }
}
