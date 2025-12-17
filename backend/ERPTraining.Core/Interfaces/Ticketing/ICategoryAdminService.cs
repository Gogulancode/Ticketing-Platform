using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.Core.Interfaces.Ticketing;

/// <summary>
/// Service interface for managing Category Admins
/// </summary>
public interface ICategoryAdminService
{
    /// <summary>
    /// Get all category admins
    /// </summary>
    Task<IEnumerable<CategoryAdmin>> GetAllAsync();

    /// <summary>
    /// Get category admin by ID
    /// </summary>
    Task<CategoryAdmin?> GetByIdAsync(int id);

    /// <summary>
    /// Get all categories a user is admin of
    /// </summary>
    Task<IEnumerable<CategoryAdmin>> GetByUserIdAsync(string userId);

    /// <summary>
    /// Get all admins for a specific category
    /// </summary>
    Task<IEnumerable<CategoryAdmin>> GetByCategoryIdAsync(int categoryId);

    /// <summary>
    /// Check if a user is a category admin for any category
    /// </summary>
    Task<bool> IsCategoryAdminAsync(string userId);

    /// <summary>
    /// Check if a user is admin for a specific category
    /// </summary>
    Task<bool> IsCategoryAdminForCategoryAsync(string userId, int categoryId);

    /// <summary>
    /// Get the list of category IDs a user is admin of
    /// </summary>
    Task<IEnumerable<int>> GetAdminCategoryIdsAsync(string userId);

    /// <summary>
    /// Create a new category admin assignment
    /// </summary>
    Task<CategoryAdmin> CreateAsync(CategoryAdminCreateRequest request);

    /// <summary>
    /// Update category admin permissions
    /// </summary>
    Task<CategoryAdmin?> UpdateAsync(int id, CategoryAdminUpdateRequest request);

    /// <summary>
    /// Delete a category admin assignment
    /// </summary>
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Get category admin permissions for a user
    /// </summary>
    Task<CategoryAdminPermissions> GetPermissionsAsync(string userId);
}

/// <summary>
/// Request to create a new category admin
/// </summary>
public class CategoryAdminCreateRequest
{
    public string UserId { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public bool CanViewTickets { get; set; } = true;
    public bool CanManageAgents { get; set; } = true;
    public bool CanViewReports { get; set; } = true;
    public bool CanManageSubcategories { get; set; } = true;
    public bool CanConfigureSettings { get; set; } = false;
}

/// <summary>
/// Request to update category admin permissions
/// </summary>
public class CategoryAdminUpdateRequest
{
    public bool? CanViewTickets { get; set; }
    public bool? CanManageAgents { get; set; }
    public bool? CanViewReports { get; set; }
    public bool? CanManageSubcategories { get; set; }
    public bool? CanConfigureSettings { get; set; }
    public bool? IsActive { get; set; }
}

/// <summary>
/// Aggregated permissions for a category admin user
/// </summary>
public class CategoryAdminPermissions
{
    public string UserId { get; set; } = string.Empty;
    public bool IsCategoryAdmin { get; set; }
    public List<int> CategoryIds { get; set; } = new();
    public List<CategoryPermission> Categories { get; set; } = new();
}

/// <summary>
/// Permissions for a specific category
/// </summary>
public class CategoryPermission
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public bool CanViewTickets { get; set; }
    public bool CanManageAgents { get; set; }
    public bool CanViewReports { get; set; }
    public bool CanManageSubcategories { get; set; }
    public bool CanConfigureSettings { get; set; }
}
