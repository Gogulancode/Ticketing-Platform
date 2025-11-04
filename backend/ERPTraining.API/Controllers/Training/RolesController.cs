using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly IRoleMasterService _roleService;

    public RolesController(IRoleMasterService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var roles = await _roleService.GetAllAsync();
    return Ok(roles.Select(r => new { id = r.Id, name = r.Name, description = r.Description, isActive = r.IsActive, createdAt = r.CreatedAt, updatedAt = r.UpdatedAt, identityRoleId = r.IdentityRoleId }));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetById(int id)
    {
        var role = await _roleService.GetByIdAsync(id);
        if (role == null) return NotFound();
    return Ok(new { id = role.Id, name = role.Name, description = role.Description, isActive = role.IsActive, createdAt = role.CreatedAt, updatedAt = role.UpdatedAt, identityRoleId = role.IdentityRoleId });
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] CreateRoleMasterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Role name is required");
        var created = await _roleService.CreateAsync(dto);
    return CreatedAtAction(nameof(GetById), new { id = created.Id }, new { id = created.Id, name = created.Name, description = created.Description, isActive = created.IsActive, identityRoleId = created.IdentityRoleId });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<object>> Update(int id, [FromBody] UpdateRoleMasterDto dto)
    {
        var updated = await _roleService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
    return Ok(new { id = updated.Id, name = updated.Name, description = updated.Description, isActive = updated.IsActive, identityRoleId = updated.IdentityRoleId });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var success = await _roleService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPut("{id}/toggle-status")]
    public async Task<ActionResult> ToggleStatus(int id, [FromBody] ToggleRoleStatusRequest request)
    {
        var success = await _roleService.ToggleStatusAsync(id, request.IsActive);
        if (!success) return NotFound();
        return Ok(new { message = $"Role {(request.IsActive ? "enabled" : "disabled")} successfully" });
    }
}
