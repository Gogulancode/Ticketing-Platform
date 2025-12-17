using Microsoft.AspNetCore.Identity;

namespace ERPTraining.Core.Entities;

public class User : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string Department { get; set; } = string.Empty;
    public string? Position { get; set; }
    public bool IsAgent { get; set; } = false;
    public DateTime JoinDate { get; set; }
    public string? Avatar { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Branch association for branch-wise analytics
    public int? BranchId { get; set; }
    public virtual Branch? Branch { get; set; }

    // Navigation properties
    public virtual ICollection<UserPlatformRole> PlatformRoles { get; set; } = new List<UserPlatformRole>();
}