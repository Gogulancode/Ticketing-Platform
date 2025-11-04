using Microsoft.AspNetCore.Mvc;

namespace ERPTraining.API.Controllers;

/// <summary>
/// Health check controller for API monitoring
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Health")]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Health check endpoint
    /// </summary>
    /// <returns>Simple health status</returns>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow, message = "API is running successfully" });
    }

    /// <summary>
    /// Test endpoint to verify API connectivity
    /// </summary>
    /// <returns>Test response</returns>
    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new { 
            message = "API connection test successful", 
            timestamp = DateTime.UtcNow,
            server = "ERP Training API",
            version = "1.0"
        });
    }
}
