using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlatformRoleController : ControllerBase
    {
        private readonly IPlatformRoleService _roleService;

        public PlatformRoleController(IPlatformRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PlatformRoleDto>>> GetAllRoles()
        {
            var roles = await _roleService.GetAllRolesAsync();
            return Ok(roles);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PlatformRoleDto>> GetRoleById(int id)
        {
            var role = await _roleService.GetRoleByIdAsync(id);
            if (role == null)
                return NotFound($"Role with ID {id} not found");

            return Ok(role);
        }

        [HttpPost]
        public async Task<ActionResult<PlatformRoleDto>> CreateRole([FromBody] CreatePlatformRoleDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var role = await _roleService.CreateRoleAsync(createDto);
                return CreatedAtAction(nameof(GetRoleById), new { id = role.Id }, role);
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to create role: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<PlatformRoleDto>> UpdateRole(int id, [FromBody] UpdatePlatformRoleDto updateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var role = await _roleService.UpdateRoleAsync(id, updateDto);
                if (role == null)
                    return NotFound($"Role with ID {id} not found");

                return Ok(role);
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to update role: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRole(int id)
        {
            var success = await _roleService.DeleteRoleAsync(id);
            if (!success)
                return NotFound($"Role with ID {id} not found");

            return NoContent();
        }

        [HttpPost("{roleId}/users/{userId}")]
        public async Task<ActionResult> AssignRoleToUser(int roleId, string userId)
        {
            var success = await _roleService.AssignRoleToUserAsync(userId, roleId);
            if (!success)
                return BadRequest("Failed to assign role to user");

            return Ok();
        }

        [HttpDelete("{roleId}/users/{userId}")]
        public async Task<ActionResult> RemoveRoleFromUser(int roleId, string userId)
        {
            var success = await _roleService.RemoveRoleFromUserAsync(userId, roleId);
            if (!success)
                return NotFound("User role assignment not found");

            return NoContent();
        }

        [HttpGet("users/{userId}/permissions")]
        public async Task<ActionResult<UserPermissionDto>> GetUserPermissions(string userId)
        {
            var permissions = await _roleService.GetUserPermissionsAsync(userId);
            if (permissions == null)
                return NotFound($"User with ID {userId} not found");

            return Ok(permissions);
        }

        [HttpGet("users/{userId}/permissions/{feature}/{action}")]
        public async Task<ActionResult<bool>> CheckUserPermission(string userId, string feature, string action)
        {
            var hasPermission = await _roleService.UserHasPermissionAsync(userId, feature, action);
            return Ok(hasPermission);
        }
    }
}
