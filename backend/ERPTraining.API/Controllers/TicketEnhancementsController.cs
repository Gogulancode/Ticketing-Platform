using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ERPTraining.API.Controllers;

/// <summary>
/// Controller for enhanced ticket features
/// </summary>
[ApiController]
[Route("tickets")]
[Authorize]
public class TicketEnhancementsController : ControllerBase
{
    private readonly ITicketEnhancementService _enhancementService;
    private readonly ILogger<TicketEnhancementsController> _logger;

    public TicketEnhancementsController(
        ITicketEnhancementService enhancementService,
        ILogger<TicketEnhancementsController> logger)
    {
        _enhancementService = enhancementService;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    #region Watchers

    /// <summary>
    /// Get all watchers for a ticket
    /// </summary>
    [HttpGet("{ticketId:guid}/watchers")]
    public async Task<IActionResult> GetWatchers(Guid ticketId)
    {
        try
        {
            var watchers = await _enhancementService.GetWatchersAsync(ticketId);
            return Ok(watchers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting watchers for ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to get watchers" });
        }
    }

    /// <summary>
    /// Add a watcher to a ticket
    /// </summary>
    [HttpPost("{ticketId:guid}/watchers")]
    public async Task<IActionResult> AddWatcher(Guid ticketId, [FromBody] AddWatcherDto dto)
    {
        try
        {
            var watcher = await _enhancementService.AddWatcherAsync(ticketId, dto, GetUserId());
            return Ok(watcher);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding watcher to ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to add watcher" });
        }
    }

    /// <summary>
    /// Watch a ticket (current user)
    /// </summary>
    [HttpPost("{ticketId:guid}/watch")]
    public async Task<IActionResult> WatchTicket(Guid ticketId)
    {
        try
        {
            var dto = new AddWatcherDto { UserId = GetUserId() };
            var watcher = await _enhancementService.AddWatcherAsync(ticketId, dto, GetUserId());
            return Ok(watcher);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error watching ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to watch ticket" });
        }
    }

    /// <summary>
    /// Unwatch a ticket (current user)
    /// </summary>
    [HttpDelete("{ticketId:guid}/watch")]
    public async Task<IActionResult> UnwatchTicket(Guid ticketId)
    {
        try
        {
            var result = await _enhancementService.RemoveWatcherAsync(ticketId, GetUserId());
            return result ? Ok(new { message = "Unwatched successfully" }) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unwatching ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to unwatch ticket" });
        }
    }

    /// <summary>
    /// Check if current user is watching a ticket
    /// </summary>
    [HttpGet("{ticketId:guid}/watching")]
    public async Task<IActionResult> IsWatching(Guid ticketId)
    {
        try
        {
            var isWatching = await _enhancementService.IsWatchingAsync(ticketId, GetUserId());
            return Ok(new { isWatching });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking watch status for ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to check watch status" });
        }
    }

    /// <summary>
    /// Remove a watcher from a ticket
    /// </summary>
    [HttpDelete("{ticketId:guid}/watchers/{userId}")]
    public async Task<IActionResult> RemoveWatcher(Guid ticketId, string userId)
    {
        try
        {
            var result = await _enhancementService.RemoveWatcherAsync(ticketId, userId);
            return result ? Ok(new { message = "Watcher removed" }) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing watcher from ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to remove watcher" });
        }
    }

    #endregion

    #region Time Tracking

    /// <summary>
    /// Get all time entries for a ticket
    /// </summary>
    [HttpGet("{ticketId:guid}/time-entries")]
    public async Task<IActionResult> GetTimeEntries(Guid ticketId)
    {
        try
        {
            var entries = await _enhancementService.GetTimeEntriesAsync(ticketId);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting time entries for ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to get time entries" });
        }
    }

    /// <summary>
    /// Get time summary for a ticket
    /// </summary>
    [HttpGet("{ticketId:guid}/time-summary")]
    public async Task<IActionResult> GetTimeSummary(Guid ticketId)
    {
        try
        {
            var summary = await _enhancementService.GetTimeSummaryAsync(ticketId);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting time summary for ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to get time summary" });
        }
    }

    /// <summary>
    /// Add a time entry to a ticket
    /// </summary>
    [HttpPost("{ticketId:guid}/time-entries")]
    public async Task<IActionResult> CreateTimeEntry(Guid ticketId, [FromBody] CreateTimeEntryDto dto)
    {
        try
        {
            var entry = await _enhancementService.CreateTimeEntryAsync(ticketId, dto, GetUserId());
            return Ok(entry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating time entry for ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to create time entry" });
        }
    }

    /// <summary>
    /// Update a time entry
    /// </summary>
    [HttpPut("time-entries/{entryId:int}")]
    public async Task<IActionResult> UpdateTimeEntry(int entryId, [FromBody] UpdateTimeEntryDto dto)
    {
        try
        {
            var entry = await _enhancementService.UpdateTimeEntryAsync(entryId, dto, GetUserId());
            return entry != null ? Ok(entry) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating time entry {EntryId}", entryId);
            return StatusCode(500, new { error = "Failed to update time entry" });
        }
    }

    /// <summary>
    /// Delete a time entry
    /// </summary>
    [HttpDelete("time-entries/{entryId:int}")]
    public async Task<IActionResult> DeleteTimeEntry(int entryId)
    {
        try
        {
            var result = await _enhancementService.DeleteTimeEntryAsync(entryId, GetUserId());
            return result ? Ok(new { message = "Time entry deleted" }) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting time entry {EntryId}", entryId);
            return StatusCode(500, new { error = "Failed to delete time entry" });
        }
    }

    #endregion

    #region Satisfaction Rating

    /// <summary>
    /// Get satisfaction rating for a ticket
    /// </summary>
    [HttpGet("{ticketId:guid}/satisfaction")]
    public async Task<IActionResult> GetSatisfaction(Guid ticketId)
    {
        try
        {
            var satisfaction = await _enhancementService.GetSatisfactionAsync(ticketId);
            return satisfaction != null ? Ok(satisfaction) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting satisfaction for ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to get satisfaction rating" });
        }
    }

    /// <summary>
    /// Submit satisfaction rating for a ticket
    /// </summary>
    [HttpPost("{ticketId:guid}/satisfaction")]
    public async Task<IActionResult> CreateSatisfaction(Guid ticketId, [FromBody] CreateSatisfactionRatingDto dto)
    {
        try
        {
            if (dto.Rating < 1 || dto.Rating > 5)
            {
                return BadRequest(new { error = "Rating must be between 1 and 5" });
            }

            var satisfaction = await _enhancementService.CreateSatisfactionAsync(ticketId, dto, GetUserId());
            return Ok(satisfaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating satisfaction rating for ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to submit satisfaction rating" });
        }
    }

    /// <summary>
    /// Get satisfaction summary (CSAT metrics)
    /// </summary>
    [HttpGet("satisfaction/summary")]
    public async Task<IActionResult> GetSatisfactionSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int? branchId)
    {
        try
        {
            var summary = await _enhancementService.GetSatisfactionSummaryAsync(startDate, endDate, branchId);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting satisfaction summary");
            return StatusCode(500, new { error = "Failed to get satisfaction summary" });
        }
    }

    #endregion

    #region Related Tickets

    /// <summary>
    /// Get related tickets
    /// </summary>
    [HttpGet("{ticketId:guid}/relations")]
    public async Task<IActionResult> GetRelatedTickets(Guid ticketId)
    {
        try
        {
            var relations = await _enhancementService.GetRelatedTicketsAsync(ticketId);
            return Ok(relations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting related tickets for {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to get related tickets" });
        }
    }

    /// <summary>
    /// Link tickets together
    /// </summary>
    [HttpPost("{ticketId:guid}/relations")]
    public async Task<IActionResult> CreateRelation(Guid ticketId, [FromBody] CreateTicketRelationDto dto)
    {
        try
        {
            var relation = await _enhancementService.CreateRelationAsync(ticketId, dto, GetUserId());
            return Ok(relation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating ticket relation for {TicketId}", ticketId);
            return StatusCode(500, new { error = "Failed to create ticket relation" });
        }
    }

    /// <summary>
    /// Remove a ticket relation
    /// </summary>
    [HttpDelete("relations/{relationId:int}")]
    public async Task<IActionResult> DeleteRelation(int relationId)
    {
        try
        {
            var result = await _enhancementService.DeleteRelationAsync(relationId);
            return result ? Ok(new { message = "Relation removed" }) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting relation {RelationId}", relationId);
            return StatusCode(500, new { error = "Failed to delete relation" });
        }
    }

    #endregion
}

/// <summary>
/// Controller for ticket templates
/// </summary>
[ApiController]
[Route("tickets/templates")]
[Authorize]
public class TicketTemplatesController : ControllerBase
{
    private readonly ITicketEnhancementService _enhancementService;
    private readonly ILogger<TicketTemplatesController> _logger;

    public TicketTemplatesController(
        ITicketEnhancementService enhancementService,
        ILogger<TicketTemplatesController> logger)
    {
        _enhancementService = enhancementService;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    /// <summary>
    /// Get all ticket templates
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTemplates(
        [FromQuery] bool includeInactive = false,
        [FromQuery] bool publicOnly = false)
    {
        try
        {
            var templates = await _enhancementService.GetTemplatesAsync(includeInactive, publicOnly);
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ticket templates");
            return StatusCode(500, new { error = "Failed to get templates" });
        }
    }

    /// <summary>
    /// Get a specific template
    /// </summary>
    [HttpGet("{templateId:int}")]
    public async Task<IActionResult> GetTemplate(int templateId)
    {
        try
        {
            var template = await _enhancementService.GetTemplateByIdAsync(templateId);
            return template != null ? Ok(template) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting template {TemplateId}", templateId);
            return StatusCode(500, new { error = "Failed to get template" });
        }
    }

    /// <summary>
    /// Create a new template
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTicketTemplateDto dto)
    {
        try
        {
            var template = await _enhancementService.CreateTemplateAsync(dto, GetUserId());
            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template");
            return StatusCode(500, new { error = "Failed to create template" });
        }
    }

    /// <summary>
    /// Update a template
    /// </summary>
    [HttpPut("{templateId:int}")]
    public async Task<IActionResult> UpdateTemplate(int templateId, [FromBody] UpdateTicketTemplateDto dto)
    {
        try
        {
            var template = await _enhancementService.UpdateTemplateAsync(templateId, dto);
            return template != null ? Ok(template) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating template {TemplateId}", templateId);
            return StatusCode(500, new { error = "Failed to update template" });
        }
    }

    /// <summary>
    /// Delete a template
    /// </summary>
    [HttpDelete("{templateId:int}")]
    public async Task<IActionResult> DeleteTemplate(int templateId)
    {
        try
        {
            var result = await _enhancementService.DeleteTemplateAsync(templateId);
            return result ? Ok(new { message = "Template deleted" }) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting template {TemplateId}", templateId);
            return StatusCode(500, new { error = "Failed to delete template" });
        }
    }
}

/// <summary>
/// Controller for canned responses
/// </summary>
[ApiController]
[Route("tickets/canned-responses")]
[Authorize]
public class CannedResponsesController : ControllerBase
{
    private readonly ITicketEnhancementService _enhancementService;
    private readonly ILogger<CannedResponsesController> _logger;

    public CannedResponsesController(
        ITicketEnhancementService enhancementService,
        ILogger<CannedResponsesController> logger)
    {
        _enhancementService = enhancementService;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    /// <summary>
    /// Get all canned responses
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCannedResponses([FromQuery] int? categoryId)
    {
        try
        {
            var responses = await _enhancementService.GetCannedResponsesAsync(GetUserId(), categoryId);
            return Ok(responses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting canned responses");
            return StatusCode(500, new { error = "Failed to get canned responses" });
        }
    }

    /// <summary>
    /// Get a canned response by short code
    /// </summary>
    [HttpGet("by-shortcode/{shortCode}")]
    public async Task<IActionResult> GetByShortCode(string shortCode)
    {
        try
        {
            var response = await _enhancementService.GetCannedResponseByShortCodeAsync(shortCode, GetUserId());
            return response != null ? Ok(response) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting canned response by shortcode {ShortCode}", shortCode);
            return StatusCode(500, new { error = "Failed to get canned response" });
        }
    }

    /// <summary>
    /// Get a specific canned response
    /// </summary>
    [HttpGet("{responseId:int}")]
    public async Task<IActionResult> GetCannedResponse(int responseId)
    {
        try
        {
            var response = await _enhancementService.GetCannedResponseByIdAsync(responseId);
            return response != null ? Ok(response) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting canned response {ResponseId}", responseId);
            return StatusCode(500, new { error = "Failed to get canned response" });
        }
    }

    /// <summary>
    /// Create a new canned response
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateCannedResponse([FromBody] CreateCannedResponseDto dto)
    {
        try
        {
            var response = await _enhancementService.CreateCannedResponseAsync(dto, GetUserId());
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating canned response");
            return StatusCode(500, new { error = "Failed to create canned response" });
        }
    }

    /// <summary>
    /// Update a canned response
    /// </summary>
    [HttpPut("{responseId:int}")]
    public async Task<IActionResult> UpdateCannedResponse(int responseId, [FromBody] UpdateCannedResponseDto dto)
    {
        try
        {
            var response = await _enhancementService.UpdateCannedResponseAsync(responseId, dto, GetUserId());
            return response != null ? Ok(response) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating canned response {ResponseId}", responseId);
            return StatusCode(500, new { error = "Failed to update canned response" });
        }
    }

    /// <summary>
    /// Delete a canned response
    /// </summary>
    [HttpDelete("{responseId:int}")]
    public async Task<IActionResult> DeleteCannedResponse(int responseId)
    {
        try
        {
            var result = await _enhancementService.DeleteCannedResponseAsync(responseId, GetUserId());
            return result ? Ok(new { message = "Canned response deleted" }) : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting canned response {ResponseId}", responseId);
            return StatusCode(500, new { error = "Failed to delete canned response" });
        }
    }

    /// <summary>
    /// Increment usage count when a canned response is used
    /// </summary>
    [HttpPost("{responseId:int}/use")]
    public async Task<IActionResult> IncrementUsage(int responseId)
    {
        try
        {
            await _enhancementService.IncrementCannedResponseUsageAsync(responseId);
            return Ok(new { message = "Usage incremented" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing usage for canned response {ResponseId}", responseId);
            return StatusCode(500, new { error = "Failed to increment usage" });
        }
    }
}
