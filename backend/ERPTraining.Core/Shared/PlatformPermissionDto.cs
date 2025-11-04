namespace ERPTraining.Core.DTOs
{
    public class PlatformPermissionDto
    {
        public int Id { get; set; }
        public string PermissionName { get; set; } = string.Empty;
        public string Feature { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
    
    public class CreatePlatformPermissionDto
    {
        public string PermissionName { get; set; } = string.Empty;
        public string Feature { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
    
    public class UserPermissionDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public List<string> PlatformRoles { get; set; } = new();
        public List<string> ERPRoles { get; set; } = new();
        public List<PlatformPermissionDto> Permissions { get; set; } = new();
    }
}
