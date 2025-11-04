using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.DTOs;

namespace ERPTraining.API.Controllers;

/// <summary>
/// Controller for ERP data synchronization operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("ERP Sync")]
[Authorize(Roles = "Admin")]
public class ERPSyncController : ControllerBase
{
    private readonly IERPSyncService _erpSyncService;
    private readonly IERPApiService _erpApiService;
    private readonly ILogger<ERPSyncController> _logger;

    public ERPSyncController(
        IERPSyncService erpSyncService,
        IERPApiService erpApiService,
        ILogger<ERPSyncController> logger)
    {
        _erpSyncService = erpSyncService;
        _erpApiService = erpApiService;
        _logger = logger;
    }

    /// <summary>
    /// Synchronizes all data from ERP system
    /// </summary>
    [HttpPost("sync-all")]
    public async Task<IActionResult> SyncAllData()
    {
        try
        {
            await _erpSyncService.SyncAllDataAsync();
            return Ok(new { message = "ERP data synchronization completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync ERP data");
            return StatusCode(500, new { message = "Failed to sync ERP data", error = ex.Message });
        }
    }

    /// <summary>
    /// Synchronizes modules from ERP system
    /// </summary>
    [HttpPost("sync-modules")]
    public async Task<IActionResult> SyncModules()
    {
        try
        {
            await _erpSyncService.SyncModulesAsync();
            return Ok(new { message = "Modules synchronized successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync modules");
            return StatusCode(500, new { message = "Failed to sync modules", error = ex.Message });
        }
    }

    /// <summary>
    /// Synchronizes sections from ERP system
    /// </summary>
    [HttpPost("sync-sections")]
    public async Task<IActionResult> SyncSections()
    {
        try
        {
            await _erpSyncService.SyncSectionsAsync();
            return Ok(new { message = "Sections synchronized successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync sections");
            return StatusCode(500, new { message = "Failed to sync sections", error = ex.Message });
        }
    }

    /// <summary>
    /// Synchronizes users from ERP system
    /// </summary>
    [HttpPost("sync-users")]
    public async Task<IActionResult> SyncUsers()
    {
        try
        {
            await _erpSyncService.SyncUsersAsync();
            return Ok(new { message = "Users synchronized successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync users");
            return StatusCode(500, new { message = "Failed to sync users", error = ex.Message });
        }
    }

    /// <summary>
    /// Synchronizes roles from ERP system
    /// </summary>
    [HttpPost("sync-roles")]
    public async Task<IActionResult> SyncRoles()
    {
        try
        {
            await _erpSyncService.SyncRolesAsync();
            return Ok(new { message = "Roles synchronized successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync roles");
            return StatusCode(500, new { message = "Failed to sync roles", error = ex.Message });
        }
    }

    /// <summary>
    /// Synchronizes ERP users from UserMasterList endpoint with role assignment
    /// </summary>
    [HttpPost("sync-erp-users")]
    public async Task<IActionResult> SyncERPUsers()
    {
        try
        {
            await _erpSyncService.SyncERPUsersAsync();
            return Ok(new { message = "ERP users synchronized successfully with role assignments" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync ERP users");
            return StatusCode(500, new { message = "Failed to sync ERP users", error = ex.Message });
        }
    }

    /// <summary>
    /// Tests ERP API connectivity
    /// </summary>
    [HttpGet("test-connection")]
    public async Task<IActionResult> TestERPConnection()
    {
        try
        {
            var hasToken = await _erpSyncService.EnsureERPTokenAsync();
            if (hasToken)
            {
                return Ok(new { message = "ERP connection successful", hasValidToken = true });
            }
            else
            {
                return BadRequest(new { message = "Failed to connect to ERP system", hasValidToken = false });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ERP connection test failed");
            return StatusCode(500, new { message = "ERP connection test failed", error = ex.Message });
        }
    }

    /// <summary>
    /// Gets current ERP token status
    /// </summary>
    [HttpGet("token-status")]
    public IActionResult GetTokenStatus()
    {
        try
        {
            var currentToken = _erpApiService.GetCurrentToken();
            return Ok(new 
            { 
                hasToken = !string.IsNullOrEmpty(currentToken),
                tokenPreview = string.IsNullOrEmpty(currentToken) ? null : currentToken.Substring(0, Math.Min(20, currentToken.Length)) + "..."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get token status");
            return StatusCode(500, new { message = "Failed to get token status", error = ex.Message });
        }
    }
}
