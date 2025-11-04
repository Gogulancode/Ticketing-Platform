using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.DTOs;

namespace ERPTraining.API.Controllers;

public class JsonImportRequest
{
    public string JsonContent { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
// [Authorize(Roles = "Admin")] // Temporarily commented out for testing
public class RoleModuleImportController : ControllerBase
{
    private readonly IRoleModuleImportService _roleModuleImportService;
    private readonly ILogger<RoleModuleImportController> _logger;

    public RoleModuleImportController(
        IRoleModuleImportService roleModuleImportService,
        ILogger<RoleModuleImportController> logger)
    {
        _roleModuleImportService = roleModuleImportService;
        _logger = logger;
    }

    /// <summary>
    /// Import role-module access from JSON file
    /// </summary>
    [HttpPost("import-json")]
    public async Task<ActionResult> ImportFromJson(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided");

            if (!file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                return BadRequest("File must be a JSON file");

            using var reader = new StreamReader(file.OpenReadStream());
            var jsonContent = await reader.ReadToEndAsync();

            var result = await _roleModuleImportService.ImportRoleModuleAccessFromJsonAsync(jsonContent);

            if (result)
                return Ok(new { message = "Role module access imported successfully" });
            else
                return BadRequest(new { message = "Failed to import role module access" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing role module access from JSON");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Import role-module access from JSON string
    /// </summary>
    [HttpPost("import-json-string")]
    public async Task<ActionResult> ImportFromJsonString([FromBody] JsonImportRequest request)
    {
        try
        {
            if (request == null || string.IsNullOrEmpty(request.JsonContent))
                return BadRequest("JSON content is required");

            var result = await _roleModuleImportService.ImportRoleModuleAccessFromJsonAsync(request.JsonContent);

            if (result)
                return Ok(new { message = "Role module access imported successfully" });
            else
                return BadRequest(new { message = "Failed to import role module access" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing role module access from JSON string");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Import user role module section data (your specific format)
    /// </summary>
    [HttpPost("import-user-role-sections")]
    public async Task<ActionResult> ImportUserRoleSections([FromBody] List<UserRoleModuleSectionDto> userRoleModuleSections)
    {
        try
        {
            if (userRoleModuleSections == null || !userRoleModuleSections.Any())
                return BadRequest("User role module section data is required");

            var result = await _roleModuleImportService.ImportUserRoleModuleSectionAsync(userRoleModuleSections);

            if (result)
                return Ok(new { 
                    message = "User role module section access imported successfully",
                    processedCount = userRoleModuleSections.Count
                });
            else
                return BadRequest(new { message = "Failed to import user role module section access" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing user role module section access");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Validate JSON structure before import
    /// </summary>
    [HttpPost("validate-json")]
    public async Task<ActionResult> ValidateJson([FromBody] string jsonContent)
    {
        try
        {
            var validationErrors = await _roleModuleImportService.ValidateJsonStructureAsync(jsonContent);
            
            if (validationErrors.Any())
                return BadRequest(new { errors = validationErrors });
            else
                return Ok(new { message = "JSON structure is valid" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating JSON");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get role module access data
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetRoleModuleAccess([FromQuery] string? roleId, [FromQuery] int? moduleId)
    {
        try
        {
            var roleModuleAccess = await _roleModuleImportService.GetRoleModuleAccessAsync(roleId, moduleId);
            return Ok(roleModuleAccess);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role module access");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update role module access
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateRoleModuleAccess(int id, [FromBody] UpdateRoleModuleAccessDto dto)
    {
        try
        {
            var roleModuleAccess = new Core.Entities.RoleModuleAccess
            {
                CanView = dto.CanView,
                CanEdit = dto.CanEdit,
                CanDelete = dto.CanDelete,
                IsActive = dto.IsActive
            };

            var result = await _roleModuleImportService.UpdateRoleModuleAccessAsync(id, roleModuleAccess);
            
            if (result)
                return Ok(new { message = "Role module access updated successfully" });
            else
                return NotFound(new { message = "Role module access not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role module access");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete role module access
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteRoleModuleAccess(int id)
    {
        try
        {
            var result = await _roleModuleImportService.DeleteRoleModuleAccessAsync(id);
            
            if (result)
                return Ok(new { message = "Role module access deleted successfully" });
            else
                return NotFound(new { message = "Role module access not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role module access");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public class UpdateRoleModuleAccessDto
{
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    public bool IsActive { get; set; } = true;
}
