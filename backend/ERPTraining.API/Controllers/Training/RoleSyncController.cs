using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/role-sync")]
// [Authorize] - Temporarily disabled for testing
public class RoleSyncController : ControllerBase
{
    private readonly IRoleSyncService _roleSyncService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RoleSyncController> _logger;

    public RoleSyncController(
        IRoleSyncService roleSyncService, 
        ApplicationDbContext context,
        ILogger<RoleSyncController> logger)
    {
        _roleSyncService = roleSyncService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get the current synchronization status
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<RoleSyncStatus>> GetSyncStatus()
    {
        try
        {
            var status = await _roleSyncService.GetSyncStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sync status");
            return StatusCode(500, new { message = "Error getting sync status" });
        }
    }

    /// <summary>
    /// Test connection to the external API
    /// </summary>
    [HttpPost("test")]
    public async Task<ActionResult<RoleSyncResult>> TestConnection()
    {
        try
        {
            var result = await _roleSyncService.TestConnectionAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing connection");
            return StatusCode(500, new RoleSyncResult 
            { 
                Success = false, 
                Message = "Error testing connection: " + ex.Message,
                SyncTime = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Test connection to the ERP system (alternative endpoint)
    /// </summary>
    [HttpPost("test-connection")]
    public async Task<ActionResult<object>> TestERPConnection()
    {
        try
        {
            _logger.LogInformation("Testing connection to ERP system for role sync");
            
            var result = await _roleSyncService.TestConnectionAsync();
            
            var response = new
            {
                Success = result.Success,
                Message = result.Message,
                AuthenticationStatus = result.Success ? "Connected" : "Failed",
                RoleEndpointStatus = result.Success ? "Connected" : "Failed",
                ApiUrl = "http://110.5.79.24:440/api",
                TestTime = DateTime.UtcNow,
                Details = new
                {
                    AuthEndpoint = "http://110.5.79.24:440/api/Account/Login",
                    RoleEndpoint = "http://110.5.79.24:440/api/CHAImport/GetRoleDetails",
                    Credentials = "api@babajishivram.com"
                }
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing role sync connection");
            return StatusCode(500, new 
            { 
                Success = false, 
                Message = "Error testing connection: " + ex.Message,
                TestTime = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Perform manual synchronization with external API
    /// </summary>
    [HttpPost("sync")]
    public async Task<ActionResult<RoleSyncResult>> ManualSync()
    {
        try
        {
            var result = await _roleSyncService.SyncRolesAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing manual sync");
            return StatusCode(500, new RoleSyncResult 
            { 
                Success = false, 
                Message = "Error performing sync: " + ex.Message,
                SyncTime = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Get synchronization history logs
    /// </summary>
    [HttpGet("logs")]
    public async Task<ActionResult<List<object>>> GetSyncLogs([FromQuery] int limit = 10)
    {
        try
        {
            var logs = await _context.RoleSyncLogs
                .OrderByDescending(l => l.SyncTime)
                .Take(limit)
                .Select(l => new
                {
                    l.Id,
                    l.SyncTime,
                    l.Success,
                    l.Message,
                    l.SyncedCount,
                    l.NewCount,
                    l.UpdatedCount,
                    l.ResponseTimeMs
                })
                .ToListAsync();

            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sync logs");
            return StatusCode(500, new { message = "Error getting sync logs" });
        }
    }

    /// <summary>
    /// Get all roles from local role master table
    /// </summary>
    [HttpGet("roles")]
    public async Task<ActionResult<IEnumerable<RoleMaster>>> GetRoles()
    {
        try
        {
            var roles = await _context.RoleMasters.OrderBy(r => r.RoleId).ToListAsync();
            return Ok(roles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting roles");
            return StatusCode(500, new { message = "Error getting roles" });
        }
    }

    /// <summary>
    /// Get role by ID from local role master table
    /// </summary>
    [HttpGet("roles/{id}")]
    public async Task<ActionResult<RoleMaster>> GetRole(int id)
    {
        try
        {
            var role = await _context.RoleMasters.FindAsync(id);
            if (role == null)
            {
                return NotFound(new { message = $"Role with ID {id} not found" });
            }
            return Ok(role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role {RoleId}", id);
            return StatusCode(500, new { message = "Error getting role" });
        }
    }

    /// <summary>
    /// Get detailed sync statistics
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult<object>> GetSyncStatistics()
    {
        try
        {
            var totalSyncs = await _context.RoleSyncLogs.CountAsync();
            var successfulSyncs = await _context.RoleSyncLogs.CountAsync(l => l.Success);
            var failedSyncs = totalSyncs - successfulSyncs;
            
            var lastWeekSyncs = await _context.RoleSyncLogs
                .Where(l => l.SyncTime >= DateTime.UtcNow.AddDays(-7))
                .CountAsync();

            var averageResponseTime = await _context.RoleSyncLogs
                .Where(l => l.Success && l.ResponseTimeMs > 0)
                .AverageAsync(l => (double?)l.ResponseTimeMs) ?? 0;

            var lastSuccessfulSync = await _context.RoleSyncLogs
                .Where(l => l.Success)
                .OrderByDescending(l => l.SyncTime)
                .FirstOrDefaultAsync();

            var statistics = new
            {
                TotalSyncs = totalSyncs,
                SuccessfulSyncs = successfulSyncs,
                FailedSyncs = failedSyncs,
                SuccessRate = totalSyncs > 0 ? (double)successfulSyncs / totalSyncs * 100 : 0,
                LastWeekSyncs = lastWeekSyncs,
                AverageResponseTimeMs = averageResponseTime,
                LastSuccessfulSync = lastSuccessfulSync?.SyncTime,
                LastSuccessfulSyncRoles = lastSuccessfulSync?.SyncedCount ?? 0
            };

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sync statistics");
            return StatusCode(500, new { message = "Error getting sync statistics" });
        }
    }

    /// <summary>
    /// Create or update a role locally (for manual role management)
    /// </summary>
    [HttpPost("roles")]
    public async Task<ActionResult<RoleMaster>> CreateRole([FromBody] RoleMaster role)
    {
        try
        {
            // No need to check for duplicate ID since Id is auto-generated
            // Set timestamps and default values
            role.RoleId = 0; // Let Entity Framework generate the RoleId
            role.CreatedAt = DateTime.UtcNow;
            role.UpdatedAt = DateTime.UtcNow;
            if (role.IsActive == default) role.IsActive = true;
            if (role.IsERPRole == default) role.IsERPRole = false;
            _context.RoleMasters.Add(role);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRole), new { id = role.RoleId }, role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role");
            return StatusCode(500, new { message = "Error creating role" });
        }
    }

    /// <summary>
    /// Update an existing role locally
    /// </summary>
    [HttpPut("roles/{id}")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] RoleMaster role)
    {
        try
        {
            if (id != role.RoleId)
            {
                return BadRequest(new { message = "Role ID mismatch" });
            }

            var existing = await _context.RoleMasters.FindAsync(id);
            if (existing == null)
            {
                return NotFound(new { message = $"Role with ID {id} not found" });
            }

            existing.RoleName = role.RoleName;
            existing.Remarks = role.Remarks;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role {RoleId}", id);
            return StatusCode(500, new { message = "Error updating role" });
        }
    }

    /// <summary>
    /// Delete a role locally
    /// </summary>
    [HttpDelete("roles/{id}")]
    public async Task<IActionResult> DeleteRole(int id)
    {
        try
        {
            var role = await _context.RoleMasters.FindAsync(id);
            if (role == null)
            {
                return NotFound(new { message = $"Role with ID {id} not found" });
            }

            _context.RoleMasters.Remove(role);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Role {role.RoleName} deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role {RoleId}", id);
            return StatusCode(500, new { message = "Error deleting role" });
        }
    }
}
