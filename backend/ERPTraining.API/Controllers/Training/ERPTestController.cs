using Microsoft.AspNetCore.Mvc;
using ERPTraining.Infrastructure.Services;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ERPTestController : ControllerBase
{
    private readonly ILogger<ERPTestController> _logger;
    private readonly IERPIntegrationService _erpIntegrationService;

    public ERPTestController(ILogger<ERPTestController> logger, IERPIntegrationService erpIntegrationService)
    {
        _logger = logger;
        _erpIntegrationService = erpIntegrationService;
    }

    /// <summary>
    /// Test ERP authentication
    /// </summary>
    [HttpGet("test-auth")]
    public async Task<IActionResult> TestAuthentication()
    {
        Response.Headers["Access-Control-Allow-Origin"] = "*";
        Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";

        try
        {
            _logger.LogInformation("Testing ERP authentication");
            
            var isAuthenticated = await _erpIntegrationService.TestAuthenticationAsync();
            
            var result = new
            {
                success = isAuthenticated,
                message = isAuthenticated ? "Successfully authenticated with ERP system" : "Failed to authenticate with ERP system",
                timestamp = DateTime.UtcNow,
                credentials = new
                {
                    baseUrl = "http://110.5.79.24:440/api",
                    username = "api@babajishivram.com",
                    hasPassword = true
                }
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing ERP authentication");
            return StatusCode(500, new 
            { 
                success = false,
                message = $"Error testing authentication: {ex.Message}",
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Test ERP user data retrieval
    /// </summary>
    [HttpGet("test-users")]
    public async Task<IActionResult> TestUserRetrieval()
    {
        Response.Headers["Access-Control-Allow-Origin"] = "*";
        Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";

        try
        {
            _logger.LogInformation("Testing ERP user data retrieval");
            
            var usersResponse = await _erpIntegrationService.GetUserMasterListAsync();
            
            var result = new
            {
                success = usersResponse.Success,
                message = usersResponse.Message,
                userCount = usersResponse.Data?.Count ?? 0,
                sampleUsers = usersResponse.Data?.Take(3).Select(u => new
                {
                    userId = u.UserId,
                    userName = u.UserName,
                    fullName = u.FullName,
                    email = u.Email,
                    department = u.Department
                }),
                timestamp = DateTime.UtcNow
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing ERP user retrieval");
            return StatusCode(500, new 
            { 
                success = false,
                message = $"Error testing user retrieval: {ex.Message}",
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Test ERP role data retrieval
    /// </summary>
    [HttpGet("test-roles")]
    public async Task<IActionResult> TestRoleRetrieval()
    {
        Response.Headers["Access-Control-Allow-Origin"] = "*";
        Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";

        try
        {
            _logger.LogInformation("Testing ERP role data retrieval");
            
            var rolesResponse = await _erpIntegrationService.GetRoleDetailsAsync();
            
            var result = new
            {
                success = rolesResponse.Success,
                message = rolesResponse.Message,
                roleCount = rolesResponse.Data?.Count ?? 0,
                sampleRoles = rolesResponse.Data?.Take(3).Select(r => new
                {
                    roleId = r.RoleId,
                    roleName = r.RoleName,
                    description = r.Description,
                    isActive = r.IsActive
                }),
                timestamp = DateTime.UtcNow
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing ERP role retrieval");
            return StatusCode(500, new 
            { 
                success = false,
                message = $"Error testing role retrieval: {ex.Message}",
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Test overall ERP connectivity
    /// </summary>
    [HttpGet("test-all")]
    public async Task<IActionResult> TestAll()
    {
        Response.Headers["Access-Control-Allow-Origin"] = "*";
        Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";

        try
        {
            _logger.LogInformation("Testing complete ERP connectivity");

            var startTime = DateTime.UtcNow;
            
            // Test authentication
            var authTest = await _erpIntegrationService.TestAuthenticationAsync();
            
            // Test users if auth successful
            var usersResponse = authTest ? await _erpIntegrationService.GetUserMasterListAsync() : null;
            
            // Test roles if auth successful
            var rolesResponse = authTest ? await _erpIntegrationService.GetRoleDetailsAsync() : null;
            
            var endTime = DateTime.UtcNow;
            
            var result = new
            {
                overallSuccess = authTest && (usersResponse?.Success == true || rolesResponse?.Success == true),
                testDuration = (endTime - startTime).TotalMilliseconds,
                authentication = new
                {
                    success = authTest,
                    message = authTest ? "Authentication successful" : "Authentication failed"
                },
                users = new
                {
                    success = usersResponse?.Success ?? false,
                    message = usersResponse?.Message ?? "Not tested due to auth failure",
                    count = usersResponse?.Data?.Count ?? 0
                },
                roles = new
                {
                    success = rolesResponse?.Success ?? false,
                    message = rolesResponse?.Message ?? "Not tested due to auth failure", 
                    count = rolesResponse?.Data?.Count ?? 0
                },
                credentials = new
                {
                    baseUrl = "http://110.5.79.24:440/api",
                    username = "api@babajishivram.com"
                },
                timestamp = DateTime.UtcNow
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in comprehensive ERP test");
            return StatusCode(500, new 
            { 
                success = false,
                message = $"Error in comprehensive test: {ex.Message}",
                timestamp = DateTime.UtcNow
            });
        }
    }
}
