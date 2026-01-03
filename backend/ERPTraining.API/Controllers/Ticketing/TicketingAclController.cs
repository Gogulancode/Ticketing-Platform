using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ERPTraining.Core.Services;
using ERPTraining.Core.DTOs;
using System.Security.Claims;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("ticketing/acl")]
[Authorize]
public class TicketingAclController : ControllerBase
{
    private readonly ITicketingAclService _aclService;

    public TicketingAclController(ITicketingAclService aclService)
    {
        _aclService = aclService;
    }

    private string GetCurrentUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                    User.FindFirst("sub")?.Value ?? 
                    User.FindFirst("userid")?.Value;
        
        // For development: return admin user ID if no authenticated user
        return userId ?? "d87fc841-ec2f-4613-93c8-cc5015a592a6";
    }

    /// <summary>
    /// Get current user's ticketing permissions
    /// </summary>
    [HttpGet("permissions")]
    public async Task<ActionResult<TicketingPermissions>> GetMyPermissions()
    {
        try
        {
            var userId = GetCurrentUserId();
            var permissions = await _aclService.GetUserTicketingPermissionsAsync(userId);
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving permissions: {ex.Message}");
        }
    }

    /// <summary>
    /// Get user's accessible ticketing pages
    /// </summary>
    [HttpGet("pages")]
    public async Task<ActionResult<List<TicketingPageAccess>>> GetMyPages()
    {
        try
        {
            var userId = GetCurrentUserId();
            var pages = await _aclService.GetUserPagesAsync(userId);
            return Ok(pages);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving pages: {ex.Message}");
        }
    }

    /// <summary>
    /// Check if user can access a specific page
    /// </summary>
    [HttpGet("can-access/{pageName}")]
    public async Task<ActionResult<bool>> CanAccessPage(string pageName)
    {
        try
        {
            var userId = GetCurrentUserId();
            var canAccess = await _aclService.CanAccessPageAsync(userId, pageName);
            return Ok(canAccess);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error checking page access: {ex.Message}");
        }
    }

    /// <summary>
    /// Check if user can perform a specific action
    /// </summary>
    [HttpGet("can-perform/{action}")]
    public async Task<ActionResult<bool>> CanPerformAction(string action, [FromQuery] string? ticketId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var canPerform = await _aclService.CanPerformActionAsync(userId, action, ticketId);
            return Ok(canPerform);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error checking action permission: {ex.Message}");
        }
    }

    /// <summary>
    /// Convert a user to agent (Admin only)
    /// </summary>
    [HttpPost("convert-to-agent/{targetUserId}")]
    public async Task<ActionResult> ConvertUserToAgent(string targetUserId)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // Check if current user is admin
            var isAdmin = await _aclService.IsTicketingAdminAsync(userId);
            if (!isAdmin)
            {
                return BadRequest(new { Message = "Only ticketing admins can convert users to agents" });
            }

            var result = await _aclService.ConvertUserToAgentAsync(targetUserId);
            if (result)
            {
                return Ok(new { Message = "User successfully converted to agent", UserId = targetUserId });
            }
            else
            {
                return BadRequest(new { Message = "Failed to convert user to agent", UserId = targetUserId });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error converting user to agent: {ex.Message}");
        }
    }

    /// <summary>
    /// Remove agent access from user (Admin only)
    /// </summary>
    [HttpPost("remove-agent-access/{targetUserId}")]
    public async Task<ActionResult> RemoveAgentAccess(string targetUserId)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // Check if current user is admin
            var isAdmin = await _aclService.IsTicketingAdminAsync(userId);
            if (!isAdmin)
            {
                return Forbid("Only ticketing admins can remove agent access");
            }

            var result = await _aclService.RemoveAgentAccessAsync(targetUserId);
            if (result)
            {
                return Ok(new { Message = "Agent access successfully removed", UserId = targetUserId });
            }
            else
            {
                return BadRequest(new { Message = "Failed to remove agent access", UserId = targetUserId });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error removing agent access: {ex.Message}");
        }
    }

    /// <summary>
    /// Get user's role status in ticketing system
    /// </summary>
    [HttpGet("role-status")]
    public async Task<ActionResult> GetRoleStatus()
    {
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = await _aclService.IsTicketingAdminAsync(userId);
            var isAgent = await _aclService.IsTicketingAgentAsync(userId);

            return Ok(new
            {
                UserId = userId,
                IsTicketingAdmin = isAdmin,
                IsTicketingAgent = isAgent,
                IsTicketingUser = !isAdmin && !isAgent
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving role status: {ex.Message}");
        }
    }
}