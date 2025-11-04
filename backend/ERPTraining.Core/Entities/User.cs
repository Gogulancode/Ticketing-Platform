using Microsoft.AspNetCore.Identity;

using ERPTraining.Core.Training.Entities;

namespace ERPTraining.Core.Entities;

public class User : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string Department { get; set; } = string.Empty;
    public DateTime JoinDate { get; set; }
    public string? Avatar { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // ERP Integration properties for Infrastructure compatibility
    public int? ERPUserId { get; set; }
    public bool IsERPUser { get; set; } = false;
    public DateTime? LastSyncedFromERP { get; set; }
    public string? ERPSource { get; set; }

    // Navigation properties
    public virtual ICollection<UserModuleProgress> ModuleProgress { get; set; } = new List<UserModuleProgress>();
    public virtual ICollection<AssessmentAttempt> AssessmentAttempts { get; set; } = new List<AssessmentAttempt>();
    public virtual ICollection<UploadedContent> UploadedContents { get; set; } = new List<UploadedContent>();
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<UserPlatformRole> PlatformRoles { get; set; } = new List<UserPlatformRole>(); // Added for Infrastructure compatibility
}