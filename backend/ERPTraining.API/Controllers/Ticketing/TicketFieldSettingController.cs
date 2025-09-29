using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Core.DTOs.Ticketing;
using Microsoft.AspNetCore.Authorization;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/tickets/settings/ticket-fields")]
[Authorize]
public class TicketFieldSettingController : ControllerBase
{
    private readonly ITicketFieldSettingService _fieldSettingService;
    private readonly ILogger<TicketFieldSettingController> _logger;

    public TicketFieldSettingController(ITicketFieldSettingService fieldSettingService, ILogger<TicketFieldSettingController> logger)
    {
        _fieldSettingService = fieldSettingService;
        _logger = logger;
    }

    /// <summary>
    /// Get all active ticket field settings ordered by display order
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketFieldSettingDto>>> GetAll()
    {
        try
        {
            var fieldSettings = await _fieldSettingService.GetAllAsync();
            return Ok(fieldSettings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ticket field settings");
            return StatusCode(500, "An error occurred while retrieving field settings");
        }
    }

    /// <summary>
    /// Get field settings for a specific category
    /// </summary>
    [HttpGet("category/{categoryId}")]
    public async Task<ActionResult<IEnumerable<TicketFieldSettingDto>>> GetByCategory(int categoryId)
    {
        try
        {
            var fieldSettings = await _fieldSettingService.GetByCategoryIdAsync(categoryId);
            return Ok(fieldSettings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving field settings for category {CategoryId}", categoryId);
            return StatusCode(500, "An error occurred while retrieving field settings for the category");
        }
    }

    /// <summary>
    /// Get ticket field setting by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TicketFieldSettingDto>> GetById(int id)
    {
        try
        {
            var fieldSetting = await _fieldSettingService.GetByIdAsync(id);
            if (fieldSetting == null)
            {
                return NotFound($"Field setting with ID {id} not found");
            }

            return Ok(fieldSetting);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving field setting with ID {FieldId}", id);
            return StatusCode(500, "An error occurred while retrieving the field setting");
        }
    }

    /// <summary>
    /// Create a new ticket field setting
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TicketFieldSettingDto>> Create([FromBody] CreateTicketFieldSettingDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdFieldSetting = await _fieldSettingService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = createdFieldSetting.Id }, createdFieldSetting);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while creating field setting: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating field setting");
            return StatusCode(500, "An error occurred while creating the field setting");
        }
    }

    /// <summary>
    /// Update an existing ticket field setting
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<TicketFieldSettingDto>> Update(int id, [FromBody] UpdateTicketFieldSettingDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedFieldSetting = await _fieldSettingService.UpdateAsync(id, dto);
            return Ok(updatedFieldSetting);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while updating field setting: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating field setting with ID {FieldId}", id);
            return StatusCode(500, "An error occurred while updating the field setting");
        }
    }

    /// <summary>
    /// Delete a ticket field setting (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var success = await _fieldSettingService.DeleteAsync(id);
            if (!success)
            {
                return NotFound($"Field setting with ID {id} not found");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting field setting with ID {FieldId}", id);
            return StatusCode(500, "An error occurred while deleting the field setting");
        }
    }

    /// <summary>
    /// Reorder field settings for a category
    /// </summary>
    [HttpPost("category/{categoryId}/reorder")]
    public async Task<ActionResult> ReorderFields(int categoryId, [FromBody] List<int> fieldIds)
    {
        try
        {
            var success = await _fieldSettingService.ReorderFieldsAsync(categoryId, fieldIds);
            if (!success)
            {
                return BadRequest("Unable to reorder fields. Some field IDs may not exist.");
            }

            return Ok(new { message = "Fields reordered successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering fields for category {CategoryId}", categoryId);
            return StatusCode(500, "An error occurred while reordering the fields");
        }
    }
}