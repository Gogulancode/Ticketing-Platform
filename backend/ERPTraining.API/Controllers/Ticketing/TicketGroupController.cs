using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Core.DTOs.Ticketing;
using Microsoft.AspNetCore.Authorization;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/tickets/settings/groups")]
[Route("api/tickets/settings/agent-groups")] // Alias for frontend compatibility
// Temporarily disabled for testing: [Authorize]
public class TicketGroupController_Disabled : ControllerBase
{
    private readonly ITicketGroupService _groupService;
    private readonly ILogger<TicketGroupController_Disabled> _logger;

    public TicketGroupController_Disabled(ITicketGroupService groupService, ILogger<TicketGroupController_Disabled> logger)
    {
        _groupService = groupService;
        _logger = logger;
    }

    /// <summary>
    /// Get all active ticket groups
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketGroupDto>>> GetAll()
    {
        try
        {
            var groups = await _groupService.GetAllAsync();
            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ticket groups");
            return StatusCode(500, "An error occurred while retrieving groups");
        }
    }

    /// <summary>
    /// Get ticket group by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TicketGroupDto>> GetById(int id)
    {
        try
        {
            var group = await _groupService.GetByIdAsync(id);
            if (group == null)
            {
                return NotFound($"Group with ID {id} not found");
            }

            return Ok(group);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving group with ID {GroupId}", id);
            return StatusCode(500, "An error occurred while retrieving the group");
        }
    }

    /// <summary>
    /// Create a new ticket group
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TicketGroupDto>> Create([FromBody] TicketGroupDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdGroup = await _groupService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = createdGroup.Id }, createdGroup);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while creating group: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating group");
            return StatusCode(500, "An error occurred while creating the group");
        }
    }

    /// <summary>
    /// Update an existing ticket group
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<TicketGroupDto>> Update(int id, [FromBody] TicketGroupDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedGroup = await _groupService.UpdateAsync(id, dto);
            if (updatedGroup == null)
            {
                return NotFound($"Group with ID {id} not found");
            }

            return Ok(updatedGroup);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while updating group: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating group with ID {GroupId}", id);
            return StatusCode(500, "An error occurred while updating the group");
        }
    }

    /// <summary>
    /// Delete a ticket group (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var success = await _groupService.DeleteAsync(id);
            if (!success)
            {
                return NotFound($"Group with ID {id} not found");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting group with ID {GroupId}", id);
            return StatusCode(500, "An error occurred while deleting the group");
        }
    }

    /// <summary>
    /// Get all groups for a specific category
    /// </summary>
    [HttpGet("category/{categoryId}")]
    public async Task<ActionResult<IEnumerable<TicketGroupDto>>> GetByCategory(int categoryId)
    {
        try
        {
            var groups = await _groupService.GetByCategoryIdAsync(categoryId);
            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving groups for category {CategoryId}", categoryId);
            return StatusCode(500, "An error occurred while retrieving groups for the category");
        }
    }

    /// <summary>
    /// Get all groups for a specific subcategory
    /// </summary>
    [HttpGet("subcategory/{subCategoryId}")]
    public async Task<ActionResult<IEnumerable<TicketGroupDto>>> GetBySubCategory(int subCategoryId)
    {
        try
        {
            var groups = await _groupService.GetBySubCategoryIdAsync(subCategoryId);
            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving groups for subcategory {SubCategoryId}", subCategoryId);
            return StatusCode(500, "An error occurred while retrieving groups for the subcategory");
        }
    }

    /// <summary>
    /// Assign an agent to a group
    /// </summary>
    [HttpPost("{groupId}/agents/{agentId}")]
    public async Task<ActionResult> AssignAgentToGroup(int groupId, int agentId)
    {
        try
        {
            var success = await _groupService.AssignAgentToGroupAsync(groupId, agentId);
            if (!success)
            {
                return BadRequest($"Unable to assign agent {agentId} to group {groupId}. Group or agent may not exist.");
            }

            return Ok(new { message = "Agent assigned to group successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning agent {AgentId} to group {GroupId}", agentId, groupId);
            return StatusCode(500, "An error occurred while assigning the agent to the group");
        }
    }

    /// <summary>
    /// Remove an agent from a group
    /// </summary>
    [HttpDelete("{groupId}/agents/{agentId}")]
    public async Task<ActionResult> RemoveAgentFromGroup(int groupId, int agentId)
    {
        try
        {
            var success = await _groupService.RemoveAgentFromGroupAsync(groupId, agentId);
            if (!success)
            {
                return NotFound($"Agent {agentId} is not assigned to group {groupId}");
            }

            return Ok(new { message = "Agent removed from group successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing agent {AgentId} from group {GroupId}", agentId, groupId);
            return StatusCode(500, "An error occurred while removing the agent from the group");
        }
    }

    /// <summary>
    /// Get all agents assigned to a specific group
    /// </summary>
    [HttpGet("{groupId}/agents")]
    public async Task<ActionResult<IEnumerable<TicketGroupAgentDto>>> GetGroupAgents(int groupId)
    {
        try
        {
            var groupAgents = await _groupService.GetGroupAgentsAsync(groupId);
            return Ok(groupAgents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving agents for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving agents for the group");
        }
    }
}