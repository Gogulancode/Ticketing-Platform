using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Entities;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly UserManager<User> _userManager;

        public TestController(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet("admin-info")]
        public async Task<IActionResult> GetAdminInfo()
        {
            try
            {
                var adminUser = await _userManager.FindByEmailAsync("admin@erptraining.com");
                
                if (adminUser == null)
                {
                    return Ok(new { message = "Admin user not found in database" });
                }

                return Ok(new 
                { 
                    email = adminUser.Email,
                    userName = adminUser.UserName,
                    isEmailConfirmed = adminUser.EmailConfirmed,
                    hasPasswordHash = !string.IsNullOrEmpty(adminUser.PasswordHash),
                    lockoutEnabled = adminUser.LockoutEnabled,
                    accessFailedCount = adminUser.AccessFailedCount,
                    roles = await _userManager.GetRolesAsync(adminUser)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("test-login")]
        public async Task<IActionResult> TestLogin([FromBody] TestLoginRequest request)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return Ok(new { success = false, message = "User not found" });
                }

                var result = await _userManager.CheckPasswordAsync(user, request.Password);
                return Ok(new { 
                    success = result, 
                    message = result ? "Password correct" : "Password incorrect",
                    email = user.Email
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    public class TestLoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
