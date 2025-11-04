using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoleMastersController : ControllerBase
    {
        /// <summary>
        /// Get all role masters
        /// </summary>
        [HttpGet]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult<IEnumerable<object>>> GetAllRoleMasters()
        {
            await Task.CompletedTask;
            
            // Return mock data for now
            var roleMasters = new[]
            {
                new { id = 1, name = "Administrator", description = "Full system access", isActive = true },
                new { id = 2, name = "Manager", description = "Management level access", isActive = true },
                new { id = 3, name = "User", description = "Standard user access", isActive = true },
                new { id = 4, name = "QA", description = "Quality assurance access", isActive = true },
                new { id = 5, name = "Trainee", description = "Training access only", isActive = false }
            };
            
            return Ok(roleMasters);
        }

        /// <summary>
        /// Get role master by ID
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> GetRoleMasterById(int id)
        {
            await Task.CompletedTask;
            
            // Return mock data
            var roleMaster = new { id = id, name = $"Role {id}", description = $"Role {id} description", isActive = true };
            return Ok(roleMaster);
        }

        /// <summary>
        /// Create a new role master
        /// </summary>
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<object>> CreateRoleMaster([FromBody] object createDto)
        {
            await Task.CompletedTask;
            
            // Return mock response
            var newRole = new { id = 999, name = "New Role", description = "New role description", isActive = true };
            return CreatedAtAction(nameof(GetRoleMasterById), new { id = 999 }, newRole);
        }
    }
}
