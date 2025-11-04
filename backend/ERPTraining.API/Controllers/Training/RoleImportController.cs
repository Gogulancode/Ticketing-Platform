using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoleImportController : ControllerBase
{
    private readonly IRoleImportService _roleImportService;

    public RoleImportController(IRoleImportService roleImportService)
    {
        _roleImportService = roleImportService;
    }

    [HttpPost("import-from-json")]
    public async Task<IActionResult> ImportRolesFromJson([FromBody] string jsonContent)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(jsonContent))
            {
                return BadRequest("JSON content is required");
            }

            var result = await _roleImportService.ImportRolesFromJsonAsync(jsonContent);
            
            if (result)
            {
                return Ok(new { message = "Roles imported successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to import roles" });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error importing roles: {ex.Message}" });
        }
    }

    [HttpPost("import-from-file")]
    public async Task<IActionResult> ImportRolesFromFile(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("File is required");
            }

            if (!file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Only JSON files are supported");
            }

            using var reader = new StreamReader(file.OpenReadStream());
            var jsonContent = await reader.ReadToEndAsync();

            var result = await _roleImportService.ImportRolesFromJsonAsync(jsonContent);
            
            if (result)
            {
                return Ok(new { message = "Roles imported successfully from file" });
            }
            else
            {
                return BadRequest(new { message = "Failed to import roles from file" });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error importing roles from file: {ex.Message}" });
        }
    }

    [HttpGet("template")]
    public IActionResult GetImportTemplate()
    {
        var template = new
        {
            roles = new[]
            {
                new
                {
                    roleName = "Sample Role",
                    erpRoleId = "1",
                    description = "Description of the role",
                    moduleAccess = new[]
                    {
                        new
                        {
                            moduleId = 1,
                            moduleName = "ERP Training Module",
                            canEdit = false,
                            canDelete = false,
                            sections = new[]
                            {
                                new
                                {
                                    sectionId = 1,
                                    sectionName = "Section Name",
                                    description = "Section Description",
                                    // ERPPageId = // TEMP COMMENT FOR MIGRATION"1.1",
                                    order = 1,
                                    canView = true,
                                    canEdit = false,
                                    canDelete = false
                                }
                            }
                        }
                    }
                }
            }
        };

        return Ok(template);
    }
}
