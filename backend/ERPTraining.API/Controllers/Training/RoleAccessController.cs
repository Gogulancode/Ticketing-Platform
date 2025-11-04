using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoleAccessController : ControllerBase
{
    private readonly IRoleAccessService _roleAccessService;
    private readonly RoleManager<IdentityRole> _roleManager;

    public RoleAccessController(IRoleAccessService roleAccessService, RoleManager<IdentityRole> roleManager)
    {
        _roleAccessService = roleAccessService;
        _roleManager = roleManager;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<RoleAccessDto>>> GetAll()
    {
        var data = await _roleAccessService.GetAllRoleAccessAsync();
        return Ok(data);
    }

    [HttpGet("role/{roleId}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<RoleAccessDto>>> GetByRole(string roleId)
    {
        var data = await _roleAccessService.GetRoleAccessByRoleIdAsync(roleId);
        return Ok(data);
    }

    [HttpPut("role/{roleId}")]
    public async Task<ActionResult> Update(string roleId, [FromBody] UpdateRoleAccessDto dto)
    {
        var success = await _roleAccessService.UpdateRoleAccessAsync(roleId, dto);
        if (!success) return NotFound(new { message = "Role not found or update failed" });
        return Ok(new { message = "Role access updated" });
    }

    [HttpGet("roles-summary")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<RoleWithAccessDto>>> RolesSummary()
    {
        var data = await _roleAccessService.GetRolesWithAccessAsync();
        return Ok(data);
    }

    [HttpGet("check-access")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> CheckAccess([FromQuery] string userId, [FromQuery] int moduleId, [FromQuery] int sectionId)
    {
        var has = await _roleAccessService.HasAccessToSectionAsync(userId, moduleId, sectionId);
        return Ok(new { hasAccess = has });
    }

    [HttpPost("seed-data")]
    public async Task<ActionResult> SeedData()
    {
        var seeded = await _roleAccessService.SeedRoleModuleSectionDataAsync();
        return Ok(new { success = seeded });
    }
}
