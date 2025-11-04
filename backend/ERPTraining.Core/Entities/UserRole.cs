using Microsoft.AspNetCore.Identity;

namespace ERPTraining.Core.Entities;

public class UserRole
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty; // Stored as string (AspNetRoles.Id)
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual IdentityRole? Role { get; set; } // Navigation to AspNetRoles (uses RoleId as FK)
}
