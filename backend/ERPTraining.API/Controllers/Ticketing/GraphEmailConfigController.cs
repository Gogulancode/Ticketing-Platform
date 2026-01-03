using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Core.DTOs.Ticketing;
using Microsoft.AspNetCore.Authorization;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("tickets/settings/email-config")]
[Authorize]
public class GraphEmailConfigController_Disabled : ControllerBase
{
    private readonly IGraphEmailConfigService _emailConfigService;
    private readonly ILogger<GraphEmailConfigController_Disabled> _logger;

    public GraphEmailConfigController_Disabled(IGraphEmailConfigService emailConfigService, ILogger<GraphEmailConfigController_Disabled> logger)
    {
        _emailConfigService = emailConfigService;
        _logger = logger;
    }

    /// <summary>
    /// Get all active Graph email configurations
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GraphEmailConfigDto>>> GetAll()
    {
        try
        {
            var configs = await _emailConfigService.GetAllAsync();
            return Ok(configs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving email configurations");
            return StatusCode(500, "An error occurred while retrieving email configurations");
        }
    }

    /// <summary>
    /// Get Graph email configuration by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<GraphEmailConfigDto>> GetById(int id)
    {
        try
        {
            var config = await _emailConfigService.GetByIdAsync(id);
            if (config == null)
            {
                return NotFound($"Email configuration with ID {id} not found");
            }

            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving email configuration with ID {ConfigId}", id);
            return StatusCode(500, "An error occurred while retrieving the email configuration");
        }
    }

    /// <summary>
    /// Create a new Graph email configuration
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<GraphEmailConfigDto>> Create([FromBody] CreateGraphEmailConfigDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdConfig = await _emailConfigService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = createdConfig.Id }, createdConfig);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while creating email configuration: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating email configuration");
            return StatusCode(500, "An error occurred while creating the email configuration");
        }
    }

    /// <summary>
    /// Update an existing Graph email configuration
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<GraphEmailConfigDto>> Update(int id, [FromBody] UpdateGraphEmailConfigDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedConfig = await _emailConfigService.UpdateAsync(id, dto);
            return Ok(updatedConfig);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while updating email configuration: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email configuration with ID {ConfigId}", id);
            return StatusCode(500, "An error occurred while updating the email configuration");
        }
    }

    /// <summary>
    /// Delete a Graph email configuration (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var success = await _emailConfigService.DeleteAsync(id);
            if (!success)
            {
                return NotFound($"Email configuration with ID {id} not found");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting email configuration with ID {ConfigId}", id);
            return StatusCode(500, "An error occurred while deleting the email configuration");
        }
    }

    /// <summary>
    /// Get active email configuration for a specific category
    /// </summary>
    [HttpGet("category/{categoryId}")]
    public async Task<ActionResult<GraphEmailConfigDto>> GetByCategory(int categoryId)
    {
        try
        {
            var config = await _emailConfigService.GetActiveByCategoryIdAsync(categoryId);
            if (config == null)
            {
                return NotFound($"No active email configuration found for category {categoryId}");
            }

            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving email configuration for category {CategoryId}", categoryId);
            return StatusCode(500, "An error occurred while retrieving email configuration for the category");
        }
    }

    /// <summary>
    /// Test email configuration connection
    /// </summary>
    [HttpPost("{id}/test-connection")]
    public async Task<ActionResult> TestConnection(int id)
    {
        try
        {
            var success = await _emailConfigService.TestConnectionAsync(id);
            if (!success)
            {
                return BadRequest($"Connection test failed for configuration {id}");
            }

            return Ok(new { message = "Connection test successful" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing connection for email configuration {ConfigId}", id);
            return StatusCode(500, "An error occurred while testing the connection");
        }
    }
}