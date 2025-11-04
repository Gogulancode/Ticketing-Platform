using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlatformPermissionController : ControllerBase
    {
        private readonly IPlatformPermissionService _permissionService;

        public PlatformPermissionController(IPlatformPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PlatformPermissionDto>>> GetAllPermissions()
        {
            var permissions = await _permissionService.GetAllPermissionsAsync();
            return Ok(permissions);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PlatformPermissionDto>> GetPermissionById(int id)
        {
            var permission = await _permissionService.GetPermissionByIdAsync(id);
            if (permission == null)
                return NotFound($"Permission with ID {id} not found");

            return Ok(permission);
        }

        [HttpGet("features/{feature}")]
        public async Task<ActionResult<IEnumerable<PlatformPermissionDto>>> GetPermissionsByFeature(string feature)
        {
            var permissions = await _permissionService.GetPermissionsByFeatureAsync(feature);
            return Ok(permissions);
        }

        [HttpPost]
        public async Task<ActionResult<PlatformPermissionDto>> CreatePermission([FromBody] CreatePlatformPermissionDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var permission = await _permissionService.CreatePermissionAsync(createDto);
                return CreatedAtAction(nameof(GetPermissionById), new { id = permission.Id }, permission);
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to create permission: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<PlatformPermissionDto>> UpdatePermission(int id, [FromBody] CreatePlatformPermissionDto updateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var permission = await _permissionService.UpdatePermissionAsync(id, updateDto);
                if (permission == null)
                    return NotFound($"Permission with ID {id} not found");

                return Ok(permission);
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to update permission: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePermission(int id)
        {
            var success = await _permissionService.DeletePermissionAsync(id);
            if (!success)
                return NotFound($"Permission with ID {id} not found");

            return NoContent();
        }

        [HttpPost("initialize")]
        public async Task<ActionResult> InitializeDefaultPermissions()
        {
            try
            {
                await _permissionService.InitializeDefaultPermissionsAsync();
                return Ok("Default permissions initialized successfully");
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to initialize permissions: {ex.Message}");
            }
        }
    }
}
