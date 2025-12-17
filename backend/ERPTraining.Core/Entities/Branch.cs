namespace ERPTraining.Core.Entities;

/// <summary>
/// Represents a branch/location for the organization.
/// Used for branch-wise ticket tracking and analytics.
/// </summary>
public class Branch
{
    public int Id { get; set; }
    
    /// <summary>
    /// Display name of the branch
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Short code for the branch (e.g., "HQ", "NYC", "MUM")
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional description of the branch
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Street address
    /// </summary>
    public string? Address { get; set; }
    
    /// <summary>
    /// City name
    /// </summary>
    public string? City { get; set; }
    
    /// <summary>
    /// State/Province
    /// </summary>
    public string? State { get; set; }
    
    /// <summary>
    /// Country
    /// </summary>
    public string? Country { get; set; }
    
    /// <summary>
    /// Postal/ZIP code
    /// </summary>
    public string? PostalCode { get; set; }
    
    /// <summary>
    /// Contact phone number for the branch
    /// </summary>
    public string? Phone { get; set; }
    
    /// <summary>
    /// Contact email for the branch
    /// </summary>
    public string? Email { get; set; }
    
    /// <summary>
    /// Branch manager's name
    /// </summary>
    public string? ManagerName { get; set; }
    
    /// <summary>
    /// Whether the branch is active
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Whether this branch is the headquarters/main office
    /// </summary>
    public bool IsHeadquarters { get; set; } = false;
    
    /// <summary>
    /// Display order for sorting
    /// </summary>
    public int SortOrder { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
