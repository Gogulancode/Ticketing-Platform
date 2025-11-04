using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Entities;

public class PlatformRole
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty; // Added for Infrastructure compatibility
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<UserPlatformRole> UserRoles { get; set; } = new List<UserPlatformRole>();
    public virtual ICollection<RolePermission> Permissions { get; set; } = new List<RolePermission>();
}

public class UserPlatformRole
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int PlatformRoleId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; } // Added for Infrastructure compatibility
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual PlatformRole PlatformRole { get; set; } = null!;
}