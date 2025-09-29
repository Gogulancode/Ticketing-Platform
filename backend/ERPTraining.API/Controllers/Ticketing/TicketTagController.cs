using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Core.DTOs.Ticketing;
using Microsoft.AspNetCore.Authorization;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/tickets/settings/tags")]
// [Authorize] // Temporarily disabled for testing
public class TicketTagController : ControllerBase
{
    private readonly ITicketTagService _tagService;
    private readonly ILogger<TicketTagController> _logger;

    public TicketTagController(ITicketTagService tagService, ILogger<TicketTagController> logger)
    {
        _tagService = tagService;
        _logger = logger;
    }

    /// <summary>
    /// Get all active ticket tags
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketTagDto>>> GetAll()
    {
        try
        {
            // Use real service to get tags from database
            var tags = await _tagService.GetAllAsync();
            _logger.LogInformation("Returning {Count} real tags from database", tags.Count());
            return Ok(tags);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ticket tags");
            return StatusCode(500, "An error occurred while retrieving tags");
        }
    }

    /// <summary>
    /// Get ticket tag by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TicketTagDto>> GetById(int id)
    {
        try
        {
            var tag = await _tagService.GetByIdAsync(id);
            if (tag == null)
            {
                return NotFound($"Tag with ID {id} not found");
            }

            return Ok(tag);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ticket tag with ID {TagId}", id);
            return StatusCode(500, "An error occurred while retrieving the tag");
        }
    }

    /// <summary>
    /// Create a new ticket tag
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TicketTagDto>> Create([FromBody] CreateTicketTagDto dto)
    {
        try
        {
            _logger.LogInformation("🔄 RAW REQUEST - Creating tag with data: {@TagData}", dto);
            _logger.LogInformation("🔄 Creating tag: {TagName} for SubCategory: {SubCategoryId}", dto?.Name ?? "null", dto?.SubCategoryId ?? -999);
            
            if (dto == null)
            {
                _logger.LogWarning("❌ DTO is null");
                return BadRequest("Request body is null");
            }
            
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("❌ Model state invalid: {ModelErrors}", string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                return BadRequest(ModelState);
            }

            var createdTag = await _tagService.CreateAsync(dto);
            _logger.LogInformation("✅ Tag created successfully: {TagId} - {TagName}", createdTag.Id, createdTag.Name);
            
            return CreatedAtAction(nameof(GetById), new { id = createdTag.Id }, createdTag);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "⚠️ Invalid operation while creating tag: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error creating ticket tag: {TagName} - Full exception: {FullException}", dto?.Name ?? "unknown", ex.ToString());
            return StatusCode(500, $"An error occurred while creating the tag: {ex.Message}");
        }
    }

    /// <summary>
    /// Update an existing ticket tag
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<TicketTagDto>> Update(int id, [FromBody] UpdateTicketTagDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedTag = await _tagService.UpdateAsync(id, dto);
            return Ok(updatedTag);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while updating tag: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating ticket tag with ID {TagId}", id);
            return StatusCode(500, "An error occurred while updating the tag");
        }
    }

    /// <summary>
    /// Delete a ticket tag (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var success = await _tagService.DeleteAsync(id);
            if (!success)
            {
                return NotFound($"Tag with ID {id} not found");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ticket tag with ID {TagId}", id);
            return StatusCode(500, "An error occurred while deleting the tag");
        }
    }

    /// <summary>
    /// Get all tags for a specific subcategory
    /// </summary>
    [HttpGet("subcategory/{subCategoryId}")]
    public async Task<ActionResult<IEnumerable<TicketTagDto>>> GetBySubCategory(int subCategoryId)
    {
        try
        {
            var tags = await _tagService.GetBySubCategoryIdAsync(subCategoryId);
            return Ok(tags);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tags for subcategory {SubCategoryId}", subCategoryId);
            return StatusCode(500, "An error occurred while retrieving tags for the subcategory");
        }
    }
}