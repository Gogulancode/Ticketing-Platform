using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using ERPTraining.Core.Entities;
using ERPTraining.Core.DTOs;

namespace ERPTraining.API.Controllers
{
    public class AssignRoleRequest
    {
        public string Email { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class UserManagementController : ControllerBase
    {
        private readonly UserManager<User> _userManager;

        public UserManagementController(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        [HttpPost("create-training-admin")]
        public async Task<ActionResult> CreateTrainingAdminUser()
        {
            try
            {
                // Check if admin user already exists
                var existingUser = await _userManager.FindByEmailAsync("admin@training.com");
                if (existingUser != null)
                {
                    return Ok(new { Message = "Training admin user already exists", UserId = existingUser.Id, Email = existingUser.Email });
                }

                // Create training admin user
                var adminUser = new User
                {
                    UserName = "admin@training.com",
                    Email = "admin@training.com",
                    FirstName = "Training",
                    LastName = "Administrator",
                    Department = "IT",
                    JoinDate = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(adminUser, "Admin123!");
                
                if (result.Succeeded)
                {
                    return Ok(new { Message = "Training admin user created successfully", UserId = adminUser.Id, Email = adminUser.Email });
                }
                else
                {
                    return BadRequest(new { Message = "Failed to create training admin user", Errors = result.Errors });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error creating training admin user", Error = ex.Message });
            }
        }

        [HttpPost("create-admin")]
        public async Task<ActionResult> CreateAdminUser()
        {
            try
            {
                // Check if admin user already exists
                var existingUser = await _userManager.FindByEmailAsync("admin@erptraining.com");
                if (existingUser != null)
                {
                    return Ok(new { Message = "Admin user already exists", UserId = existingUser.Id });
                }

                // Create admin user
                var adminUser = new User
                {
                    UserName = "admin",
                    Email = "admin@erptraining.com",
                    FirstName = "System",
                    LastName = "Administrator",
                    Department = "IT",
                    JoinDate = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(adminUser, "Admin123!");
                
                if (result.Succeeded)
                {
                    return Ok(new { Message = "Admin user created successfully", UserId = adminUser.Id });
                }
                else
                {
                    return BadRequest(new { Message = "Failed to create admin user", Errors = result.Errors });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error creating admin user", Error = ex.Message });
            }
        }

        [HttpGet("users")]
        public ActionResult GetAllUsers()
        {
            try
            {
                var users = _userManager.Users
                    .Where(u => u.IsActive)
                    .Select(u => new
                    {
                        u.Id,
                        u.UserName,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        u.Department,
                        u.IsActive
                    })
                    .ToList();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error retrieving users", Error = ex.Message });
            }
        }

        [HttpPost("assign-admin-role/{userId}")]
        public async Task<ActionResult> AssignAdminRole(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found", UserId = userId });
                }

                // Add Admin role to user
                var result = await _userManager.AddToRoleAsync(user, "Admin");
                
                if (result.Succeeded)
                {
                    return Ok(new { Message = "Admin role assigned successfully", UserId = userId, Email = user.Email });
                }
                else
                {
                    return BadRequest(new { Message = "Failed to assign admin role", Errors = result.Errors });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error assigning admin role", Error = ex.Message });
            }
        }

        [HttpPost("assign-role")]
        public async Task<ActionResult> AssignRole([FromBody] AssignRoleRequest request)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found", Email = request.Email });
                }

                var result = await _userManager.AddToRoleAsync(user, request.RoleName);
                
                if (result.Succeeded)
                {
                    return Ok(new { Message = $"{request.RoleName} role assigned successfully", UserId = user.Id, Email = user.Email });
                }
                else
                {
                    return BadRequest(new { Message = $"Failed to assign {request.RoleName} role", Errors = result.Errors });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error assigning role", Error = ex.Message });
            }
        }

        [HttpPost("initialize-system")]
        public async Task<ActionResult> InitializeSystem()
        {
            try
            {
                // Create admin user if not exists
                var adminResult = await CreateAdminUser();
                
                return Ok(new { Message = "System initialized successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error initializing system", Error = ex.Message });
            }
        }
    }
}
