using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ERPController : ControllerBase
{
    private readonly IERPApiService _erpApiService;
    private readonly IERPSyncService _erpSyncService;
    private readonly ILogger<ERPController> _logger;

    public ERPController(
        IERPApiService erpApiService,
        IERPSyncService erpSyncService,
        ILogger<ERPController> logger)
    {
        _erpApiService = erpApiService;
        _erpSyncService = erpSyncService;
        _logger = logger;
    }

    /// <summary>
    /// Test ERP API connection
    /// </summary>
    [HttpPost("test-connection")]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            var isAuthenticated = await _erpApiService.EnsureAuthenticatedAsync();
            
            if (isAuthenticated)
            {
                return Ok(new { success = true, message = "Successfully connected to ERP API" });
            }
            
            return BadRequest(new { success = false, message = "Failed to connect to ERP API" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing ERP connection");
            return StatusCode(500, new { success = false, message = "Internal server error", error = ex.Message });
        }
    }

    /// <summary>
    /// Sync modules from ERP
    /// </summary>
    [HttpPost("sync-modules")]
    public async Task<IActionResult> SyncModules()
    {
        try
        {
            await _erpSyncService.SyncModulesAsync();
            return Ok(new { success = true, message = "Modules synchronized successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing modules from ERP");
            return StatusCode(500, new { success = false, message = "Failed to sync modules", error = ex.Message });
        }
    }

    /// <summary>
    /// Sync sections from ERP
    /// </summary>
    [HttpPost("sync-sections")]
    public async Task<IActionResult> SyncSections()
    {
        try
        {
            await _erpSyncService.SyncSectionsAsync();
            return Ok(new { success = true, message = "Sections synchronized successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing sections from ERP");
            return StatusCode(500, new { success = false, message = "Failed to sync sections", error = ex.Message });
        }
    }

    /// <summary>
    /// Sync users from ERP
    /// </summary>
    [HttpPost("sync-users")]
    public async Task<IActionResult> SyncUsers()
    {
        try
        {
            await _erpSyncService.SyncUsersAsync();
            return Ok(new { success = true, message = "Users synchronized successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing users from ERP");
            return StatusCode(500, new { success = false, message = "Failed to sync users", error = ex.Message });
        }
    }

    /// <summary>
    /// Sync roles from ERP
    /// </summary>
    [HttpPost("sync-roles")]
    public async Task<IActionResult> SyncRoles()
    {
        try
        {
            await _erpSyncService.SyncRolesAsync();
            return Ok(new { success = true, message = "Roles synchronized successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing roles from ERP");
            return StatusCode(500, new { success = false, message = "Failed to sync roles", error = ex.Message });
        }
    }

    /// <summary>
    /// Sync all data from ERP (modules, sections, users, roles)
    /// </summary>
    [HttpPost("sync-all")]
    public async Task<IActionResult> SyncAll()
    {
        try
        {
            await _erpSyncService.SyncModulesAsync();
            await _erpSyncService.SyncSectionsAsync();
            await _erpSyncService.SyncUsersAsync();
            await _erpSyncService.SyncRolesAsync();
            
            return Ok(new { success = true, message = "All data synchronized successfully from ERP" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing all data from ERP");
            return StatusCode(500, new { success = false, message = "Failed to sync all data", error = ex.Message });
        }
    }

    /// <summary>
    /// Get ERP modules data (for testing)
    /// </summary>
    [HttpGet("modules")]
    public async Task<IActionResult> GetERPModules()
    {
        try
        {
            var token = _erpApiService.GetCurrentToken();
            if (string.IsNullOrEmpty(token))
            {
                var isAuthenticated = await _erpApiService.EnsureAuthenticatedAsync();
                if (!isAuthenticated)
                {
                    return Unauthorized(new { message = "Failed to authenticate with ERP API" });
                }
                token = _erpApiService.GetCurrentToken()!;
            }

            var modules = await _erpApiService.GetModulesAsync(token);
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ERP modules");
            return StatusCode(500, new { success = false, message = "Failed to get ERP modules", error = ex.Message });
        }
    }

    /// <summary>
    /// Get ERP sections data (for testing)
    /// </summary>
    [HttpGet("sections")]
    public async Task<IActionResult> GetERPSections()
    {
        try
        {
            var token = _erpApiService.GetCurrentToken();
            if (string.IsNullOrEmpty(token))
            {
                var isAuthenticated = await _erpApiService.EnsureAuthenticatedAsync();
                if (!isAuthenticated)
                {
                    return Unauthorized(new { message = "Failed to authenticate with ERP API" });
                }
                token = _erpApiService.GetCurrentToken()!;
            }

            var sections = await _erpApiService.GetSectionsAsync(token);
            return Ok(sections);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ERP sections");
            return StatusCode(500, new { success = false, message = "Failed to get ERP sections", error = ex.Message });
        }
    }

    /// <summary>
    /// Get current ERP authentication status
    /// </summary>
    [HttpGet("auth-status")]
    public IActionResult GetAuthStatus()
    {
        try
        {
            var token = _erpApiService.GetCurrentToken();
            var isAuthenticated = !string.IsNullOrEmpty(token);

            return Ok(new
            {
                isAuthenticated = isAuthenticated,
                hasToken = token != null,
                message = isAuthenticated ? "Authenticated with ERP API" : "Not authenticated with ERP API"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking ERP auth status");
            return StatusCode(500, new { success = false, message = "Failed to check auth status", error = ex.Message });
        }
    }
}
