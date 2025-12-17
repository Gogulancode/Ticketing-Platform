using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Data;

namespace ERPTraining.API.Controllers.Ticketing;

/// <summary>
/// API controller for managing Category Admins
/// </summary>
[ApiController]
[Route("api/tickets/settings/category-admins")]
public class CategoryAdminController : ControllerBase
{
    private readonly ICategoryAdminService _categoryAdminService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CategoryAdminController> _logger;

    public CategoryAdminController(
        ICategoryAdminService categoryAdminService,
        ApplicationDbContext context,
        ILogger<CategoryAdminController> logger)
    {
        _categoryAdminService = categoryAdminService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all category admins
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryAdminDto>>> GetAll()
    {
        try
        {
            var categoryAdmins = await _categoryAdminService.GetAllAsync();
            var dtos = categoryAdmins.Select(MapToDto).ToList();
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all category admins");
            return StatusCode(500, new { error = "Failed to get category admins" });
        }
    }

    /// <summary>
    /// Get category admin by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryAdminDto>> GetById(int id)
    {
        try
        {
            var categoryAdmin = await _categoryAdminService.GetByIdAsync(id);
            if (categoryAdmin == null)
                return NotFound(new { error = "Category admin not found" });

            return Ok(MapToDto(categoryAdmin));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category admin {Id}", id);
            return StatusCode(500, new { error = "Failed to get category admin" });
        }
    }

    /// <summary>
    /// Get all category admins for a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<CategoryAdminDto>>> GetByUserId(string userId)
    {
        try
        {
            var categoryAdmins = await _categoryAdminService.GetByUserIdAsync(userId);
            var dtos = categoryAdmins.Select(MapToDto).ToList();
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category admins for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to get category admins" });
        }
    }

    /// <summary>
    /// Get all admins for a specific category
    /// </summary>
    [HttpGet("category/{categoryId}")]
    public async Task<ActionResult<IEnumerable<CategoryAdminDto>>> GetByCategoryId(int categoryId)
    {
        try
        {
            var categoryAdmins = await _categoryAdminService.GetByCategoryIdAsync(categoryId);
            var dtos = categoryAdmins.Select(MapToDto).ToList();
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admins for category {CategoryId}", categoryId);
            return StatusCode(500, new { error = "Failed to get category admins" });
        }
    }

    /// <summary>
    /// Get category admin permissions for the current user
    /// </summary>
    [HttpGet("my-permissions")]
    public async Task<ActionResult<CategoryAdminPermissions>> GetMyPermissions()
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var permissions = await _categoryAdminService.GetPermissionsAsync(userId);
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permissions for current user");
            return StatusCode(500, new { error = "Failed to get permissions" });
        }
    }

    /// <summary>
    /// Get category admin permissions for a specific user
    /// </summary>
    [HttpGet("permissions/{userId}")]
    public async Task<ActionResult<CategoryAdminPermissions>> GetUserPermissions(string userId)
    {
        try
        {
            var permissions = await _categoryAdminService.GetPermissionsAsync(userId);
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permissions for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to get permissions" });
        }
    }

    /// <summary>
    /// Check if a user is a category admin
    /// </summary>
    [HttpGet("check/{userId}")]
    public async Task<ActionResult<object>> CheckIsCategoryAdmin(string userId)
    {
        try
        {
            var isCategoryAdmin = await _categoryAdminService.IsCategoryAdminAsync(userId);
            var categoryIds = await _categoryAdminService.GetAdminCategoryIdsAsync(userId);
            
            return Ok(new 
            { 
                isCategoryAdmin, 
                categoryIds = categoryIds.ToList() 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking category admin status for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to check category admin status" });
        }
    }

    /// <summary>
    /// Create a new category admin assignment
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CategoryAdminDto>> Create([FromBody] CategoryAdminCreateRequest request)
    {
        try
        {
            // Validate user exists
            var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
            if (!userExists)
                return BadRequest(new { error = "User not found" });

            // Validate category exists
            var categoryExists = await _context.TicketCategories.AnyAsync(c => c.Id == request.CategoryId);
            if (!categoryExists)
                return BadRequest(new { error = "Category not found" });

            var categoryAdmin = await _categoryAdminService.CreateAsync(request);
            
            // Reload with navigation properties
            var result = await _categoryAdminService.GetByIdAsync(categoryAdmin.Id);
            
            return CreatedAtAction(nameof(GetById), new { id = categoryAdmin.Id }, MapToDto(result!));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category admin");
            return StatusCode(500, new { error = "Failed to create category admin" });
        }
    }

    /// <summary>
    /// Update category admin permissions
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryAdminDto>> Update(int id, [FromBody] CategoryAdminUpdateRequest request)
    {
        try
        {
            var categoryAdmin = await _categoryAdminService.UpdateAsync(id, request);
            if (categoryAdmin == null)
                return NotFound(new { error = "Category admin not found" });

            // Reload with navigation properties
            var result = await _categoryAdminService.GetByIdAsync(id);
            
            return Ok(MapToDto(result!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category admin {Id}", id);
            return StatusCode(500, new { error = "Failed to update category admin" });
        }
    }

    /// <summary>
    /// Delete a category admin assignment
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var success = await _categoryAdminService.DeleteAsync(id);
            if (!success)
                return NotFound(new { error = "Category admin not found" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category admin {Id}", id);
            return StatusCode(500, new { error = "Failed to delete category admin" });
        }
    }

    /// <summary>
    /// Get available users who can be assigned as category admins
    /// </summary>
    [HttpGet("available-users")]
    public async Task<ActionResult<IEnumerable<object>>> GetAvailableUsers()
    {
        try
        {
            var users = await _context.Users
                .Where(u => u.IsActive)
                .Select(u => new
                {
                    id = u.Id,
                    firstName = u.FirstName,
                    lastName = u.LastName,
                    email = u.Email,
                    fullName = u.FirstName + " " + u.LastName,
                    department = u.Department,
                    isAgent = u.IsAgent
                })
                .OrderBy(u => u.firstName)
                .ThenBy(u => u.lastName)
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available users");
            return StatusCode(500, new { error = "Failed to get available users" });
        }
    }

    private static CategoryAdminDto MapToDto(ERPTraining.Core.Entities.Ticketing.CategoryAdmin ca)
    {
        return new CategoryAdminDto
        {
            Id = ca.Id,
            UserId = ca.UserId,
            UserName = ca.User != null ? $"{ca.User.FirstName} {ca.User.LastName}".Trim() : "",
            UserEmail = ca.User?.Email ?? "",
            CategoryId = ca.CategoryId,
            CategoryName = ca.Category?.Name ?? "",
            CanViewTickets = ca.CanViewTickets,
            CanManageAgents = ca.CanManageAgents,
            CanViewReports = ca.CanViewReports,
            CanManageSubcategories = ca.CanManageSubcategories,
            CanConfigureSettings = ca.CanConfigureSettings,
            IsActive = ca.IsActive,
            CreatedAt = ca.CreatedAt,
            UpdatedAt = ca.UpdatedAt
        };
    }
}

/// <summary>
/// DTO for Category Admin
/// </summary>
public class CategoryAdminDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public bool CanViewTickets { get; set; }
    public bool CanManageAgents { get; set; }
    public bool CanViewReports { get; set; }
    public bool CanManageSubcategories { get; set; }
    public bool CanConfigureSettings { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
