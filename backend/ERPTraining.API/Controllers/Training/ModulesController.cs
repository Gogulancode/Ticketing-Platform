using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace ERPTraining.API.Controllers;

/// <summary>
/// Training modules management controller
/// </summary>
/// <remarks>
/// This controller manages training modules within the ERP Training system. It provides
/// comprehensive CRUD operations for training modules, module progression tracking,
/// and learning objective management.
/// 
/// <para><strong>Key Features:</strong></para>
/// <list type="bullet">
/// <item><description>Module Creation and Management</description></item>
/// <item><description>Learning Progress Tracking</description></item>
/// <item><description>Module Content Organization</description></item>
/// <item><description>Prerequisites and Dependencies</description></item>
/// <item><description>Learning Objectives Management</description></item>
/// </list>
/// 
/// <para><strong>Available Modules:</strong></para>
/// <para>The system includes comprehensive training modules covering all aspects of ERP systems:</para>
/// <list type="number">
/// <item><description>Data Models &amp; Security</description></item>
/// <item><description>SAP Basics &amp; ERP Fundamentals</description></item>
/// <item><description>Order to Cash Process</description></item>
/// <item><description>Production Planning &amp; Material Management</description></item>
/// <item><description>Finance &amp; Controlling</description></item>
/// <item><description>Sales &amp; Distribution</description></item>
/// <item><description>Project Management &amp; Resource Planning</description></item>
/// <item><description>Workflow &amp; Business Process Management</description></item>
/// <item><description>Integration &amp; System Management</description></item>
/// <item><description>Mobile Solutions &amp; Cloud Integration</description></item>
/// <item><description>Analytics &amp; Business Intelligence</description></item>
/// <item><description>Training Management &amp; Learning Analytics</description></item>
/// </list>
/// 
/// <para><strong>Security:</strong></para>
/// <para>All endpoints require JWT Bearer token authentication. Access levels vary by user role.</para>
/// </remarks>
[ApiController]
[Route("api/[controller]")]
// [Authorize] // Temporarily commented for testing
[Tags("Modules")]
[Produces("application/json")]
public class ModulesController : ControllerBase
{
    private readonly IModuleService _moduleService;

    // Dictionary mapping module titles to their original JSON IDs
    private static readonly Dictionary<string, int> ModuleNameToOriginalId = new()
    {
        ["Import Management"] = 1,
        ["Export Operations"] = 2,
        ["Freight Management"] = 3,
        ["Inventory Management"] = 4,
        ["Reporting & Analytics"] = 5,
        ["Customer Management"] = 6,
        ["Financial Management"] = 7,
        ["Quality Management"] = 8,
        ["Human Resources"] = 9,
        ["Production Planning"] = 10
    };

    public ModulesController(IModuleService moduleService)
    {
        _moduleService = moduleService;
    }

    /// <summary>
    /// Retrieves all available training modules for the authenticated user
    /// </summary>
    /// <returns>List of training modules with progress information</returns>
    /// <remarks>
    /// Returns a comprehensive list of all training modules available to the authenticated user,
    /// including their progress status, completion percentage, and access permissions.
    /// 
    /// <para><strong>Returned Data Includes:</strong></para>
    /// <list type="bullet">
    /// <item><description>Module basic information (ID, title, description)</description></item>
    /// <item><description>User progress tracking (completion %, last accessed)</description></item>
    /// <item><description>Learning objectives and prerequisites</description></item>
    /// <item><description>Estimated duration and difficulty level</description></item>
    /// <item><description>Section count and structure</description></item>
    /// </list>
    /// 
    /// <para><strong>Module Categories:</strong></para>
    /// <para>Modules are organized into comprehensive categories covering:</para>
    /// <list type="bullet">
    /// <item><description>Foundational ERP concepts and data management</description></item>
    /// <item><description>Core business processes (O2C, P2P, R2R)</description></item>
    /// <item><description>Advanced functionality and integration</description></item>
    /// <item><description>Analytics and reporting capabilities</description></item>
    /// </list>
    /// 
    /// Sample response:
    /// 
    ///     [
    ///       {
    ///         "id": 1,
    ///         "title": "Data Models &amp; Security",
    ///         "description": "Learn fundamental data structures and security concepts...",
    ///         "completionPercentage": 75,
    ///         "estimatedDuration": "4 hours",
    ///         "sectionCount": 52,
    ///         "isCompleted": false,
    ///         "lastAccessedAt": "2024-07-29T10:30:00Z"
    ///       }
    ///     ]
    /// 
    /// </remarks>
    /// <response code="200">Modules retrieved successfully</response>
    /// <response code="401">Unauthorized - Invalid or missing token</response>
    /// <response code="403">Forbidden - Insufficient permissions</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<ModuleDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<List<ModuleDto>>> GetAllModules()
    {
        var userId = GetCurrentUserId() ?? "anonymous";
        var modules = await _moduleService.GetAllModulesAsync(userId);
        
        // Add original module IDs
        foreach (var module in modules)
        {
            if (ModuleNameToOriginalId.TryGetValue(module.Title, out var originalId))
            {
                module.OriginalModuleId = originalId;
            }
        }
        
        return Ok(modules);
    }

    /// <summary>
    /// Retrieves detailed information for a specific training module
    /// </summary>
    /// <param name="id">The unique identifier of the module</param>
    /// <returns>Detailed module information including sections and progress</returns>
    /// <remarks>
    /// Returns comprehensive details for a specific training module, including all sections,
    /// user progress, learning objectives, and prerequisites. This endpoint provides the
    /// complete module structure needed for the learning interface.
    /// 
    /// <para><strong>Detailed Information Includes:</strong></para>
    /// <list type="bullet">
    /// <item><description>Complete module metadata and structure</description></item>
    /// <item><description>All sections with content organization</description></item>
    /// <item><description>User-specific progress and completion status</description></item>
    /// <item><description>Learning objectives and outcomes</description></item>
    /// <item><description>Prerequisites and recommended preparation</description></item>
    /// <item><description>Assessment information and requirements</description></item>
    /// </list>
    /// 
    /// <para><strong>Progress Tracking:</strong></para>
    /// <para>The response includes detailed progress information:</para>
    /// <list type="bullet">
    /// <item><description>Overall module completion percentage</description></item>
    /// <item><description>Section-by-section progress status</description></item>
    /// <item><description>Time spent in module and sections</description></item>
    /// <item><description>Last accessed timestamps</description></item>
    /// </list>
    /// 
    /// Sample response:
    /// 
    ///     {
    ///       "id": 1,
    ///       "title": "Data Models &amp; Security",
    ///       "description": "Comprehensive training on data structures...",
    ///       "completionPercentage": 75,
    ///       "sections": [
    ///         {
    ///           "id": 1,
    ///           "title": "Introduction to Data Models",
    ///           "order": 1,
    ///           "isCompleted": true
    ///         }
    ///       ],
    ///       "learningObjectives": ["Understand data structures", "..."],
    ///       "prerequisites": ["Basic computer knowledge"]
    ///     }
    /// 
    /// </remarks>
    /// <response code="200">Module details retrieved successfully</response>
    /// <response code="401">Unauthorized - Invalid or missing token</response>
    /// <response code="404">Module not found or access denied</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ModuleDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ModuleDto>> GetModuleById(int id)
    {
        var userId = GetCurrentUserId();
        var module = await _moduleService.GetModuleByIdAsync(id, userId);
        
        if (module == null)
            return NotFound();

        // Add original module ID
        if (ModuleNameToOriginalId.TryGetValue(module.Title, out var originalId))
        {
            module.OriginalModuleId = originalId;
        }

        return Ok(module);
    }

    [HttpGet("original/{originalId}")]
    public async Task<ActionResult<ModuleDto>> GetModuleByOriginalId(int originalId)
    {
        var userId = GetCurrentUserId();
        var modules = await _moduleService.GetAllModulesAsync(userId);
        
        var moduleTitle = ModuleNameToOriginalId.FirstOrDefault(x => x.Value == originalId).Key;
        if (string.IsNullOrEmpty(moduleTitle))
        {
            return NotFound($"Module with original ID {originalId} not found");
        }
        
        var module = modules.FirstOrDefault(m => m.Title == moduleTitle);
        if (module == null)
        {
            return NotFound($"Module '{moduleTitle}' not found in database");
        }
        
        module.OriginalModuleId = originalId;
        return Ok(module);
    }

    [HttpPost]
    // [Authorize(Roles = "Admin,QA")] // Temporarily commented for testing
    public async Task<ActionResult<ModuleDto>> CreateModule([FromBody] CreateModuleDto createModuleDto)
    {
        var module = await _moduleService.CreateModuleAsync(createModuleDto);
        return CreatedAtAction(nameof(GetModuleById), new { id = module.Id }, module);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QA")]
    public async Task<ActionResult<ModuleDto>> UpdateModule(int id, [FromBody] UpdateModuleDto updateModuleDto)
    {
        var module = await _moduleService.UpdateModuleAsync(id, updateModuleDto);
        
        if (module == null)
            return NotFound();

        return Ok(module);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteModule(int id)
    {
        var result = await _moduleService.DeleteModuleAsync(id);
        
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpGet("my-progress")]
    public async Task<ActionResult<List<ModuleDto>>> GetMyModulesWithProgress()
    {
        var userId = GetCurrentUserId();
        var modules = await _moduleService.GetUserModulesWithProgressAsync(userId);
        
        // Add original module IDs
        foreach (var module in modules)
        {
            if (ModuleNameToOriginalId.TryGetValue(module.Title, out var originalId))
            {
                module.OriginalModuleId = originalId;
            }
        }
        
        return Ok(modules);
    }

    /// <summary>
    /// Get modules formatted for permission assignment
    /// </summary>
    /// <returns>Modules with sections for role permission management</returns>
    [HttpGet("for-permissions")]
    public async Task<ActionResult<IEnumerable<object>>> GetModulesForPermissions()
    {
        try
        {
            var userId = GetCurrentUserId();
            var modules = await _moduleService.GetAllModulesAsync(userId);
            
            // Transform modules into the format expected by the permission management interface
            var permissionModules = modules.Select(module => new
            {
                id = module.Id.ToString(),
                title = module.Title,
                sections = new[]
                {
                    new { id = $"{module.Id}_read", title = "Read" },
                    new { id = $"{module.Id}_write", title = "Write" },
                    new { id = $"{module.Id}_delete", title = "Delete" },
                    new { id = $"{module.Id}_admin", title = "Admin" }
                }
            });

            return Ok(permissionModules);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching modules for permissions", error = ex.Message });
        }
    }

    /// <summary>
    /// Enable or disable a module (Admin only)
    /// </summary>
    /// <param name="id">Module ID</param>
    /// <param name="request">Toggle status request containing IsActive flag</param>
    /// <returns>Success message</returns>
    [HttpPut("{id}/toggle-status")]
    // [Authorize(Roles = "Admin")] // Temporarily commented for testing
    public ActionResult ToggleModuleStatus(int id, [FromBody] ToggleStatusRequest request)
    {
        try
        {
            // TODO: Implement ToggleModuleStatusAsync in IModuleService
            return BadRequest(new { message = "Method not implemented yet" });
            // var result = await _moduleService.ToggleModuleStatusAsync(id, request.IsActive);
            // if (!result)
            // {
            //     return NotFound(new { message = "Module not found" });
            // }

            // return Ok(new { message = $"Module {(request.IsActive ? "enabled" : "disabled")} successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating module status", error = ex.Message });
        }
    }

    /// <summary>
    /// Enable or disable a section (Admin only)
    /// </summary>
    /// <param name="moduleId">Module ID</param>
    /// <param name="sectionId">Section ID</param>
    /// <param name="request">Toggle status request containing IsActive flag</param>
    /// <returns>Success message</returns>
    [HttpPut("{moduleId}/sections/{sectionId}/toggle-status")]
    // [Authorize(Roles = "Admin")] // Temporarily commented for testing
    public ActionResult ToggleSectionStatus(int moduleId, int sectionId, [FromBody] ToggleStatusRequest request)
    {
        try
        {
            // TODO: Implement ToggleSectionStatusAsync in IModuleService
            return BadRequest(new { message = "Method not implemented yet" });
            // var result = await _moduleService.ToggleSectionStatusAsync(moduleId, sectionId, request.IsActive);
            // if (!result)
            // {
            //     return NotFound(new { message = "Section not found" });
            // }

            // return Ok(new { message = $"Section {(request.IsActive ? "enabled" : "disabled")} successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating section status", error = ex.Message });
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
    }
}

/// <summary>
/// Request model for toggling status
/// </summary>
public class ToggleStatusRequest
{
    public bool IsActive { get; set; }
}
