using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.DTOs;
using System.Text.Json;

namespace ERPTraining.API.Controllers.Diagnostics;

[ApiController]
[Route("api/[controller]")]
public class DiagnosticsController : ControllerBase
{
    private readonly IERPApiService _erpApiService;
    private readonly ILogger<DiagnosticsController> _logger;
    private readonly IConfiguration _configuration;

    public DiagnosticsController(
        IERPApiService erpApiService, 
        ILogger<DiagnosticsController> logger,
        IConfiguration configuration)
    {
        _erpApiService = erpApiService;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpGet("test-erp-connection")]
    public async Task<IActionResult> TestErpConnection()
    {
        var result = new
        {
            timestamp = DateTime.UtcNow,
            tests = new List<object>()
        };

        try
        {
            // Test 1: Check ERP API configuration
            var erpConfig = new
            {
                baseUrl = _configuration["ERPApi:BaseUrl"],
                adminEmail = _configuration["ERPApi:AdminEmail"],
                hasPassword = !string.IsNullOrEmpty(_configuration["ERPApi:AdminPassword"])
            };

            ((List<object>)result.tests).Add(new
            {
                test = "ERP Configuration",
                status = "✅ OK",
                data = erpConfig
            });

            // Test 2: Try to login with test credentials
            _logger.LogInformation("Testing ERP login with: gogulan@moojic.com");
            
            var erpToken = await _erpApiService.LoginAsync("gogulan@moojic.com", "Gogulan@20$@025");
            
            if (!string.IsNullOrEmpty(erpToken))
            {
                ((List<object>)result.tests).Add(new
                {
                    test = "ERP Login Test",
                    status = "✅ SUCCESS",
                    message = "Login successful, token received",
                    tokenPreview = erpToken.Length > 50 ? erpToken.Substring(0, 50) + "..." : erpToken
                });

                // Test 3: Try to get user list
                try
                {
                    var users = await _erpApiService.GetUserMasterListAsync(erpToken);
                    ((List<object>)result.tests).Add(new
                    {
                        test = "Get User List",
                        status = "✅ SUCCESS",
                        userCount = users?.Count ?? 0,
                        message = $"Retrieved {users?.Count ?? 0} users from ERP"
                    });
                }
                catch (Exception ex)
                {
                    ((List<object>)result.tests).Add(new
                    {
                        test = "Get User List",
                        status = "❌ FAILED",
                        error = ex.Message
                    });
                }
            }
            else
            {
                ((List<object>)result.tests).Add(new
                {
                    test = "ERP Login Test",
                    status = "❌ FAILED",
                    message = "Login returned null or empty token",
                    possibleReasons = new[]
                    {
                        "Invalid credentials",
                        "ERP API unreachable",
                        "Network/firewall blocking connection",
                        "ERP API endpoint changed"
                    }
                });
            }

        }
        catch (Exception ex)
        {
            ((List<object>)result.tests).Add(new
            {
                test = "ERP Connection",
                status = "❌ ERROR",
                error = ex.Message,
                stackTrace = ex.StackTrace
            });
        }

        return Ok(result);
    }

    [HttpPost("test-login")]
    public async Task<IActionResult> TestLogin([FromBody] DiagnosticLoginRequest request)
    {
        var diagnostics = new
        {
            timestamp = DateTime.UtcNow,
            request = new
            {
                email = request.Email,
                hasPassword = !string.IsNullOrEmpty(request.Password)
            },
            steps = new List<object>()
        };

        try
        {
            // Step 1: Test ERP Login
            _logger.LogInformation("Diagnostic: Testing ERP login for {Email}", request.Email);
            var erpToken = await _erpApiService.LoginAsync(request.Email, request.Password);

            if (string.IsNullOrEmpty(erpToken))
            {
                ((List<object>)diagnostics.steps).Add(new
                {
                    step = 1,
                    name = "ERP Authentication",
                    status = "❌ FAILED",
                    message = "ERP API returned null/empty token",
                    action = "Check ERP API connectivity and credentials"
                });
            }
            else
            {
                ((List<object>)diagnostics.steps).Add(new
                {
                    step = 1,
                    name = "ERP Authentication",
                    status = "✅ SUCCESS",
                    tokenLength = erpToken.Length,
                    tokenPreview = erpToken.Substring(0, Math.Min(30, erpToken.Length)) + "..."
                });

                // Step 2: Check if we can get user details
                try
                {
                    var users = await _erpApiService.GetUserMasterListAsync(erpToken);
                    var user = users?.FirstOrDefault(u => 
                        u.sEmail?.Equals(request.Email, StringComparison.OrdinalIgnoreCase) == true);

                    if (user != null)
                    {
                        ((List<object>)diagnostics.steps).Add(new
                        {
                            step = 2,
                            name = "User Details Lookup",
                            status = "✅ SUCCESS",
                            userId = user.lId,
                            userName = user.sName,
                            email = user.sEmail
                        });
                    }
                    else
                    {
                        ((List<object>)diagnostics.steps).Add(new
                        {
                            step = 2,
                            name = "User Details Lookup",
                            status = "⚠️ WARNING",
                            message = "User authenticated but not found in user list",
                            totalUsers = users?.Count ?? 0
                        });
                    }
                }
                catch (Exception ex)
                {
                    ((List<object>)diagnostics.steps).Add(new
                    {
                        step = 2,
                        name = "User Details Lookup",
                        status = "❌ ERROR",
                        error = ex.Message
                    });
                }
            }

            return Ok(diagnostics);
        }
        catch (Exception ex)
        {
            ((List<object>)diagnostics.steps).Add(new
            {
                step = 0,
                name = "Exception",
                status = "❌ ERROR",
                error = ex.Message,
                type = ex.GetType().Name
            });

            return Ok(diagnostics);
        }
    }
}

public class DiagnosticLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
