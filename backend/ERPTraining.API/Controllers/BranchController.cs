using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities;
using ERPTraining.Infrastructure.Data;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/branches")]
public class BranchController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BranchController> _logger;

    public BranchController(ApplicationDbContext context, ILogger<BranchController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all branches
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<object>> GetBranches(
        [FromQuery] bool includeInactive = false,
        [FromQuery] string search = "")
    {
        try
        {
            var query = _context.Branches.AsQueryable();

            if (!includeInactive)
            {
                query = query.Where(b => b.IsActive);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(b =>
                    b.Name.ToLower().Contains(searchLower) ||
                    b.Code.ToLower().Contains(searchLower) ||
                    (b.City != null && b.City.ToLower().Contains(searchLower)));
            }

            var branches = await query
                .OrderBy(b => b.SortOrder)
                .ThenBy(b => b.Name)
                .Select(b => new
                {
                    b.Id,
                    b.Name,
                    b.Code,
                    b.Description,
                    b.Address,
                    b.City,
                    b.State,
                    b.Country,
                    b.PostalCode,
                    b.Phone,
                    b.Email,
                    b.ManagerName,
                    b.IsActive,
                    b.IsHeadquarters,
                    b.SortOrder,
                    b.CreatedAt,
                    b.UpdatedAt,
                    UserCount = b.Users.Count(u => u.IsActive)
                })
                .ToListAsync();

            return Ok(new { branches, total = branches.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting branches");
            return StatusCode(500, new { message = "Error retrieving branches", error = ex.Message });
        }
    }

    /// <summary>
    /// Get branch by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetBranch(int id)
    {
        try
        {
            var branch = await _context.Branches
                .Where(b => b.Id == id)
                .Select(b => new
                {
                    b.Id,
                    b.Name,
                    b.Code,
                    b.Description,
                    b.Address,
                    b.City,
                    b.State,
                    b.Country,
                    b.PostalCode,
                    b.Phone,
                    b.Email,
                    b.ManagerName,
                    b.IsActive,
                    b.IsHeadquarters,
                    b.SortOrder,
                    b.CreatedAt,
                    b.UpdatedAt,
                    UserCount = b.Users.Count(u => u.IsActive),
                    Users = b.Users.Where(u => u.IsActive).Select(u => new
                    {
                        u.Id,
                        u.UserName,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        FullName = u.FirstName + " " + u.LastName,
                        u.Department,
                        u.IsAgent
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (branch == null)
            {
                return NotFound(new { message = $"Branch with ID {id} not found" });
            }

            return Ok(branch);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting branch {BranchId}", id);
            return StatusCode(500, new { message = "Error retrieving branch", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new branch
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<object>> CreateBranch([FromBody] CreateBranchRequest request)
    {
        try
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Branch name is required" });
            }

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Branch code is required" });
            }

            // Check for duplicate code
            var existingBranch = await _context.Branches
                .FirstOrDefaultAsync(b => b.Code.ToLower() == request.Code.ToLower());

            if (existingBranch != null)
            {
                return Conflict(new { message = $"A branch with code '{request.Code}' already exists" });
            }

            var branch = new Branch
            {
                Name = request.Name,
                Code = request.Code.ToUpper(),
                Description = request.Description,
                Address = request.Address,
                City = request.City,
                State = request.State,
                Country = request.Country,
                PostalCode = request.PostalCode,
                Phone = request.Phone,
                Email = request.Email,
                ManagerName = request.ManagerName,
                IsActive = true,
                IsHeadquarters = request.IsHeadquarters,
                SortOrder = request.SortOrder ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created new branch: {BranchName} ({BranchCode})", branch.Name, branch.Code);

            return CreatedAtAction(nameof(GetBranch), new { id = branch.Id }, new
            {
                success = true,
                message = "Branch created successfully",
                branch = new
                {
                    branch.Id,
                    branch.Name,
                    branch.Code,
                    branch.Description,
                    branch.City,
                    branch.IsActive
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating branch");
            return StatusCode(500, new { message = "Error creating branch", error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing branch
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<object>> UpdateBranch(int id, [FromBody] UpdateBranchRequest request)
    {
        try
        {
            var branch = await _context.Branches.FindAsync(id);
            if (branch == null)
            {
                return NotFound(new { message = $"Branch with ID {id} not found" });
            }

            // Check for duplicate code if code is being changed
            if (!string.IsNullOrWhiteSpace(request.Code) && 
                request.Code.ToUpper() != branch.Code)
            {
                var existingBranch = await _context.Branches
                    .FirstOrDefaultAsync(b => b.Code.ToLower() == request.Code.ToLower() && b.Id != id);

                if (existingBranch != null)
                {
                    return Conflict(new { message = $"A branch with code '{request.Code}' already exists" });
                }
            }

            // Update fields
            if (!string.IsNullOrWhiteSpace(request.Name)) branch.Name = request.Name;
            if (!string.IsNullOrWhiteSpace(request.Code)) branch.Code = request.Code.ToUpper();
            if (request.Description != null) branch.Description = request.Description;
            if (request.Address != null) branch.Address = request.Address;
            if (request.City != null) branch.City = request.City;
            if (request.State != null) branch.State = request.State;
            if (request.Country != null) branch.Country = request.Country;
            if (request.PostalCode != null) branch.PostalCode = request.PostalCode;
            if (request.Phone != null) branch.Phone = request.Phone;
            if (request.Email != null) branch.Email = request.Email;
            if (request.ManagerName != null) branch.ManagerName = request.ManagerName;
            if (request.IsActive.HasValue) branch.IsActive = request.IsActive.Value;
            if (request.SortOrder.HasValue) branch.SortOrder = request.SortOrder.Value;
            if (request.IsHeadquarters.HasValue) branch.IsHeadquarters = request.IsHeadquarters.Value;

            branch.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated branch {BranchId}: {BranchName}", id, branch.Name);

            return Ok(new
            {
                success = true,
                message = "Branch updated successfully",
                branch = new
                {
                    branch.Id,
                    branch.Name,
                    branch.Code,
                    branch.Description,
                    branch.City,
                    branch.IsActive,
                    branch.UpdatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating branch {BranchId}", id);
            return StatusCode(500, new { message = "Error updating branch", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete (deactivate) a branch
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<object>> DeleteBranch(int id)
    {
        try
        {
            var branch = await _context.Branches.FindAsync(id);
            if (branch == null)
            {
                return NotFound(new { message = $"Branch with ID {id} not found" });
            }

            // Check if branch has active users
            var activeUserCount = await _context.Users.CountAsync(u => u.BranchId == id && u.IsActive);
            if (activeUserCount > 0)
            {
                return BadRequest(new 
                { 
                    message = $"Cannot delete branch with {activeUserCount} active users. Please reassign users first or deactivate the branch instead." 
                });
            }

            // Soft delete - just deactivate
            branch.IsActive = false;
            branch.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deactivated branch {BranchId}: {BranchName}", id, branch.Name);

            return Ok(new
            {
                success = true,
                message = "Branch deactivated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting branch {BranchId}", id);
            return StatusCode(500, new { message = "Error deleting branch", error = ex.Message });
        }
    }

    /// <summary>
    /// Get branch statistics for analytics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetBranchStats()
    {
        try
        {
            var stats = await _context.Branches
                .Where(b => b.IsActive)
                .Select(b => new
                {
                    b.Id,
                    b.Name,
                    b.Code,
                    b.City,
                    TotalUsers = b.Users.Count(),
                    ActiveUsers = b.Users.Count(u => u.IsActive),
                    Agents = b.Users.Count(u => u.IsActive && u.IsAgent)
                })
                .ToListAsync();

            return Ok(new
            {
                branches = stats,
                summary = new
                {
                    totalBranches = stats.Count,
                    totalUsers = stats.Sum(s => s.TotalUsers),
                    totalActiveUsers = stats.Sum(s => s.ActiveUsers),
                    totalAgents = stats.Sum(s => s.Agents)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting branch statistics");
            return StatusCode(500, new { message = "Error retrieving branch statistics", error = ex.Message });
        }
    }

    /// <summary>
    /// Get branches for dropdown/select (minimal data)
    /// </summary>
    [HttpGet("lookup")]
    public async Task<ActionResult<IEnumerable<object>>> GetBranchLookup()
    {
        try
        {
            var branches = await _context.Branches
                .Where(b => b.IsActive)
                .OrderBy(b => b.SortOrder)
                .ThenBy(b => b.Name)
                .Select(b => new
                {
                    b.Id,
                    b.Name,
                    b.Code,
                    b.City
                })
                .ToListAsync();

            return Ok(branches);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting branch lookup");
            return StatusCode(500, new { message = "Error retrieving branches", error = ex.Message });
        }
    }
}

// Request DTOs
public class CreateBranchRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ManagerName { get; set; }
    public int? SortOrder { get; set; }
    public bool IsHeadquarters { get; set; } = false;
}

public class UpdateBranchRequest
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ManagerName { get; set; }
    public bool? IsActive { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsHeadquarters { get; set; }
}
