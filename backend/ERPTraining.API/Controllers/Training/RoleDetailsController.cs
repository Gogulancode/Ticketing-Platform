using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Entities;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoleDetailsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RoleDetailsController> _logger;

    public RoleDetailsController(ApplicationDbContext context, ILogger<RoleDetailsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ERPRoleDetail>>> GetRoleDetails()
    {
        try
        {
            var roleDetails = await _context.ERPRoleDetails
                .Include(rd => rd.Role)
                .Include(rd => rd.Module)
                .Include(rd => rd.Section)
                .Where(rd => rd.IsActive)
                .ToListAsync();

            return Ok(roleDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role details");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("role/{roleId}")]
    public async Task<ActionResult<IEnumerable<ERPRoleDetail>>> GetRoleDetailsByRole(int roleId)
    {
        try
        {
            var roleDetails = await _context.ERPRoleDetails
                .Include(rd => rd.Module)
                .Include(rd => rd.Section)
                .Where(rd => rd.RoleId == roleId && rd.IsActive)
                .ToListAsync();

            return Ok(roleDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role details for role {RoleId}", roleId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("role/{roleId}/modules")]
    public async Task<ActionResult<IEnumerable<object>>> GetModulesByRole(int roleId)
    {
        try
        {
            var modules = await _context.ERPRoleDetails
                .Where(rd => rd.RoleId == roleId && rd.IsActive)
                .Include(rd => rd.Module)
                .GroupBy(rd => rd.ModuleId)
                .Select(g => new
                {
                    ModuleId = g.Key,
                    ModuleName = g.First().Module!.Title,
                    SectionCount = g.Count(),
                    CanView = g.Any(rd => rd.CanView),
                    CanEdit = g.Any(rd => rd.CanEdit),
                    CanDelete = g.Any(rd => rd.CanDelete),
                    Sections = g.Select(rd => new
                    {
                        SectionId = rd.SectionId,
                        SectionName = rd.Section != null ? rd.Section.Title : rd.RoleDetailName,
                        CanView = rd.CanView,
                        CanEdit = rd.CanEdit,
                        CanDelete = rd.CanDelete
                    }).ToList()
                })
                .ToListAsync();

            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting modules for role {RoleId}", roleId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("role/{roleId}/modules")]
    public async Task<ActionResult> UpdateRoleModuleAccess(int roleId, [FromBody] RoleModuleAccessRequest request)
    {
        try
        {
            // Remove existing role details for this role
            var existingDetails = await _context.ERPRoleDetails
                .Where(rd => rd.RoleId == roleId)
                .ToListAsync();
            
            _context.ERPRoleDetails.RemoveRange(existingDetails);

            // Add new role details based on request
            foreach (var moduleAccess in request.ModuleAccess)
            {
                if (moduleAccess.SectionIds?.Any() == true)
                {
                    // Add section-level permissions
                    foreach (var sectionId in moduleAccess.SectionIds)
                    {
                        var section = await _context.Sections.FindAsync(sectionId);
                        var roleDetail = new ERPRoleDetail
                        {
                            RoleId = roleId,
                            ModuleId = moduleAccess.ModuleId,
                            SectionId = sectionId,
                            RoleDetailName = section?.Title ?? $"Section {sectionId}",
                            IsActive = true,
                            CanView = true,
                            CanEdit = moduleAccess.CanEdit ?? false,
                            CanDelete = moduleAccess.CanDelete ?? false,
                            IsERPSynced = false,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        _context.ERPRoleDetails.Add(roleDetail);
                    }
                }
                else
                {
                    // Add module-level permission (all sections)
                    var module = await _context.Modules.FindAsync(moduleAccess.ModuleId);
                    var roleDetail = new ERPRoleDetail
                    {
                        RoleId = roleId,
                        ModuleId = moduleAccess.ModuleId,
                        SectionId = null, // Module-level access
                        RoleDetailName = module?.Title ?? $"Module {moduleAccess.ModuleId}",
                        IsActive = true,
                        CanView = true,
                        CanEdit = moduleAccess.CanEdit ?? false,
                        CanDelete = moduleAccess.CanDelete ?? false,
                        IsERPSynced = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.ERPRoleDetails.Add(roleDetail);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Role module access updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role module access for role {RoleId}", roleId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}/permissions")]
    public async Task<ActionResult> UpdateRoleDetailPermissions(int id, [FromBody] RoleDetailPermissionRequest request)
    {
        try
        {
            var roleDetail = await _context.ERPRoleDetails.FindAsync(id);
            if (roleDetail == null)
            {
                return NotFound($"Role detail with ID {id} not found");
            }

            roleDetail.CanView = request.CanView;
            roleDetail.CanEdit = request.CanEdit;
            roleDetail.CanDelete = request.CanDelete;
            roleDetail.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(roleDetail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating permissions for role detail {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("role/{roleId}/sections")]
    public async Task<ActionResult<IEnumerable<object>>> GetSectionsByRole(int roleId)
    {
        try
        {
            var roleDetails = await _context.ERPRoleDetails
                .Where(rd => rd.RoleId == roleId && rd.IsActive)
                .Include(rd => rd.Module) // Include Module instead of Section
                .OrderBy(rd => rd.RoleDetailName)
                .Select(rd => new
                {
                    Id = rd.Id,
                    SectionId = rd.ERPTaskId,
                    SectionName = rd.RoleDetailName,
                    ModuleId = rd.ModuleId,
                    ModuleName = rd.Module != null ? rd.Module.Title : "Unknown Module",
                    CanView = rd.CanView,
                    CanEdit = rd.CanEdit,
                    CanDelete = rd.CanDelete,
                    IsERPSynced = rd.IsERPSynced
                })
                .ToListAsync();

            return Ok(roleDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sections for role {RoleId}", roleId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("role/{roleId}/sections")]
    public async Task<ActionResult> UpdateRoleSectionAccess(int roleId, [FromBody] RoleSectionAccessRequest request)
    {
        try
        {
            // Remove existing role details for this role
            var existingDetails = await _context.ERPRoleDetails
                .Where(rd => rd.RoleId == roleId)
                .ToListAsync();
            
            _context.ERPRoleDetails.RemoveRange(existingDetails);

            // Add new section-level role details
            foreach (var sectionAccess in request.SectionAccess)
            {
                var roleDetail = new ERPRoleDetail
                {
                    RoleId = roleId,
                    ModuleId = sectionAccess.ModuleId ?? 1, // Default module if not specified
                    SectionId = sectionAccess.SectionId,
                    ERPTaskId = sectionAccess.SectionId,
                    RoleDetailName = sectionAccess.SectionName ?? $"Section {sectionAccess.SectionId}",
                    IsActive = true,
                    CanView = sectionAccess.CanView ?? true,
                    CanEdit = sectionAccess.CanEdit ?? false,
                    CanDelete = sectionAccess.CanDelete ?? false,
                    IsERPSynced = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ERPRoleDetails.Add(roleDetail);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Role section access updated successfully", sectionsAdded = request.SectionAccess.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role section access for role {RoleId}", roleId);
            return StatusCode(500, "Internal server error");
        }
    }
}

public class RoleModuleAccessRequest
{
    public List<ModuleAccessItem> ModuleAccess { get; set; } = new();
}

public class ModuleAccessItem
{
    public int ModuleId { get; set; }
    public List<int>? SectionIds { get; set; }
    public bool? CanEdit { get; set; }
    public bool? CanDelete { get; set; }
}

public class RoleDetailPermissionRequest
{
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
}

public class RoleSectionAccessRequest
{
    public List<SectionAccess> SectionAccess { get; set; } = new();
}

public class SectionAccess
{
    public int SectionId { get; set; }
    public string? SectionName { get; set; }
    public int? ModuleId { get; set; }
    public bool? CanView { get; set; }
    public bool? CanEdit { get; set; }
    public bool? CanDelete { get; set; }
}
