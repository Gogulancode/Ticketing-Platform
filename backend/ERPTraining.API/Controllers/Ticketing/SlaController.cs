using ERPTraining.Core.DTOs.Ticketing.Sla;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Services.Ticketing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("tickets/settings/sla")]
[Authorize]
public class SlaController : ControllerBase
{
    private readonly ISlaService _slaService;
    private readonly ILogger<SlaController> _logger;

    public SlaController(ISlaService slaService, ILogger<SlaController> logger)
    {
        _slaService = slaService;
        _logger = logger;
    }

    // SLA Policy Management

    /// <summary>
    /// Get all SLA policies
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SlaPolicyDto>>> GetSlaPolicies(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var policies = await _slaService.GetAllPoliciesAsync(includeInactive, cancellationToken);
            return Ok(policies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving SLA policies");
            return BadRequest($"Error retrieving SLA policies: {ex.Message}");
        }
    }

    /// <summary>
    /// Get SLA policy by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SlaPolicyDto>> GetSlaPolicy(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!Guid.TryParse(id, out var guidId))
                return BadRequest("Invalid policy ID format");

            var policy = await _slaService.GetPolicyByIdAsync(guidId, cancellationToken);
            if (policy == null)
                return NotFound($"SLA policy with ID {id} not found");

            return Ok(policy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving SLA policy {PolicyId}", id);
            return BadRequest($"Error retrieving SLA policy: {ex.Message}");
        }
    }

    /// <summary>
    /// Get SLA policy by priority ID
    /// </summary>
    [HttpGet("by-priority/{priorityId:int}")]
    public async Task<ActionResult<SlaPolicyDto>> GetSlaPolicyByPriority(int priorityId, CancellationToken cancellationToken = default)
    {
        try
        {
            var policy = await _slaService.GetPolicyByPriorityAsync(priorityId, cancellationToken);
            if (policy == null)
                return NotFound($"No SLA policy found for priority ID {priorityId}");

            return Ok(policy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving SLA policy for priority {PriorityId}", priorityId);
            return BadRequest($"Error retrieving SLA policy: {ex.Message}");
        }
    }

    /// <summary>
    /// Create a new SLA policy
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SlaPolicyDto>> CreateSlaPolicy(
        [FromBody] CreateSlaPolicyRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var policy = await _slaService.CreatePolicyAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetSlaPolicy), new { id = policy.Id }, policy);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating SLA policy");
            return BadRequest($"Error creating SLA policy: {ex.Message}");
        }
    }

    /// <summary>
    /// Update an existing SLA policy
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SlaPolicyDto>> UpdateSlaPolicy(
        string id,
        [FromBody] UpdateSlaPolicyRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!Guid.TryParse(id, out var guidId))
                return BadRequest("Invalid policy ID format");

            var policy = await _slaService.UpdatePolicyAsync(guidId, request, cancellationToken);
            if (policy == null)
                return NotFound($"SLA policy with ID {id} not found");

            return Ok(policy);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating SLA policy {PolicyId}", id);
            return BadRequest($"Error updating SLA policy: {ex.Message}");
        }
    }

    /// <summary>
    /// Delete (deactivate) an SLA policy
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSlaPolicy(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!Guid.TryParse(id, out var guidId))
                return BadRequest("Invalid policy ID format");

            var success = await _slaService.DeletePolicyAsync(guidId, cancellationToken);
            if (!success)
                return NotFound($"SLA policy with ID {id} not found");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting SLA policy {PolicyId}", id);
            return BadRequest($"Error deleting SLA policy: {ex.Message}");
        }
    }

    // Escalation Contacts Management

    /// <summary>
    /// Get all escalation contacts (optionally filtered by policy)
    /// </summary>
    [HttpGet("contacts")]
    public async Task<ActionResult<IEnumerable<SlaEscalationContactDto>>> GetAllEscalationContacts(
        [FromQuery] Guid? policyId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var contacts = await _slaService.GetEscalationContactsAsync(policyId, cancellationToken);
            return Ok(contacts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving escalation contacts");
            return BadRequest($"Error retrieving escalation contacts: {ex.Message}");
        }
    }

    /// <summary>
    /// Get escalation contacts for an SLA policy
    /// </summary>
    [HttpGet("{slaPolicyId:guid}/contacts")]
    public async Task<ActionResult<IEnumerable<SlaEscalationContactDto>>> GetEscalationContacts(
        Guid slaPolicyId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var contacts = await _slaService.GetEscalationContactsAsync(slaPolicyId, cancellationToken);
            return Ok(contacts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving escalation contacts for SLA policy {SlaPolicyId}", slaPolicyId);
            return BadRequest($"Error retrieving escalation contacts: {ex.Message}");
        }
    }

    /// <summary>
    /// Get escalation contact by ID
    /// </summary>
    [HttpGet("contacts/{contactId:int}")]
    public async Task<ActionResult<SlaEscalationContactDto>> GetEscalationContact(
        int contactId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var contact = await _slaService.GetEscalationContactByIdAsync(contactId, cancellationToken);
            if (contact == null)
                return NotFound($"Escalation contact with ID {contactId} not found");

            return Ok(contact);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving escalation contact {ContactId}", contactId);
            return BadRequest($"Error retrieving escalation contact: {ex.Message}");
        }
    }

    /// <summary>
    /// Add escalation contact to SLA policy
    /// </summary>
    [HttpPost("{slaPolicyId:guid}/contacts")]
    public async Task<ActionResult<SlaEscalationContactDto>> CreateEscalationContact(
        Guid slaPolicyId,
        [FromBody] CreateSlaEscalationContactRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var contact = await _slaService.CreateEscalationContactAsync(slaPolicyId, request, cancellationToken);
            return CreatedAtAction(nameof(GetEscalationContact), new { contactId = contact.Id }, contact);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating escalation contact for SLA policy {SlaPolicyId}", slaPolicyId);
            return BadRequest($"Error creating escalation contact: {ex.Message}");
        }
    }

    /// <summary>
    /// Update escalation contact
    /// </summary>
    [HttpPut("contacts/{contactId:int}")]
    public async Task<ActionResult<SlaEscalationContactDto>> UpdateEscalationContact(
        int contactId,
        [FromBody] UpdateSlaEscalationContactRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var contact = await _slaService.UpdateEscalationContactAsync(contactId, request, cancellationToken);
            if (contact == null)
                return NotFound($"Escalation contact with ID {contactId} not found");

            return Ok(contact);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating escalation contact {ContactId}", contactId);
            return BadRequest($"Error updating escalation contact: {ex.Message}");
        }
    }

    /// <summary>
    /// Delete (deactivate) escalation contact
    /// </summary>
    [HttpDelete("contacts/{contactId:int}")]
    public async Task<IActionResult> DeleteEscalationContact(int contactId, CancellationToken cancellationToken = default)
    {
        try
        {
            var success = await _slaService.DeleteEscalationContactAsync(contactId, cancellationToken);
            if (!success)
                return NotFound($"Escalation contact with ID {contactId} not found");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting escalation contact {ContactId}", contactId);
            return BadRequest($"Error deleting escalation contact: {ex.Message}");
        }
    }

    // SLA Evaluation & Monitoring

    /// <summary>
    /// Evaluate SLA status for a ticket
    /// </summary>
    [HttpGet("evaluate/{ticketId:guid}")]
    public async Task<ActionResult<SlaStatusDto>> EvaluateTicketSla(Guid ticketId, CancellationToken cancellationToken = default)
    {
        try
        {
            var status = await _slaService.EvaluateTicketSlaAsync(ticketId, cancellationToken);
            if (status == null)
                return NotFound($"No SLA assigned to ticket {ticketId}");

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating SLA for ticket {TicketId}", ticketId);
            return BadRequest($"Error evaluating ticket SLA: {ex.Message}");
        }
    }

    /// <summary>
    /// Assign SLA policy to ticket based on priority
    /// </summary>
    [HttpPost("assign/{ticketId:guid}")]
    public async Task<IActionResult> AssignSlaToTicket(
        Guid ticketId,
        [FromQuery] int? priorityId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var success = await _slaService.AssignSlaToTicketAsync(ticketId, priorityId, cancellationToken);
            if (!success)
                return NotFound($"Could not assign SLA to ticket {ticketId}. Ticket or priority not found, or no SLA policy available.");

            return Ok(new { message = "SLA successfully assigned to ticket" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning SLA to ticket {TicketId}", ticketId);
            return BadRequest($"Error assigning SLA to ticket: {ex.Message}");
        }
    }

    /// <summary>
    /// Get breached SLAs
    /// </summary>
    [HttpGet("breached")]
    public async Task<ActionResult<IEnumerable<SlaStatusDto>>> GetBreachedSlas(
        [FromQuery] DateTime? since = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var breachedSlas = await _slaService.GetBreachedSlasAsync(since, cancellationToken);
            return Ok(breachedSlas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving breached SLAs");
            return BadRequest($"Error retrieving breached SLAs: {ex.Message}");
        }
    }

    /// <summary>
    /// Trigger SLA escalation for a ticket
    /// </summary>
    [HttpPost("escalate/{ticketId:guid}")]
    public async Task<IActionResult> TriggerEscalation(
        Guid ticketId,
        [FromBody] TriggerSlaEscalationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var success = await _slaService.TriggerEscalationAsync(ticketId, request.ForceEscalation, cancellationToken);
            if (!success)
                return NotFound($"Could not trigger escalation for ticket {ticketId}. Ticket not found or no SLA assigned.");

            return Ok(new { message = "SLA escalation triggered successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering SLA escalation for ticket {TicketId}", ticketId);
            return BadRequest($"Error triggering SLA escalation: {ex.Message}");
        }
    }

    /// <summary>
    /// Process all pending SLA escalations (for background service)
    /// </summary>
    [HttpPost("process-escalations")]
    public async Task<IActionResult> ProcessEscalations(CancellationToken cancellationToken = default)
    {
        try
        {
            var processed = await _slaService.CheckAndTriggerEscalationsAsync(cancellationToken);
            return Ok(new { message = $"SLA escalation processing completed", escalationsTriggered = processed });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SLA escalations");
            return BadRequest($"Error processing SLA escalations: {ex.Message}");
        }
    }

    // SLA Analytics

    /// <summary>
    /// Get statistics for a specific SLA policy
    /// </summary>
    [HttpGet("{slaPolicyId:guid}/stats")]
    public async Task<ActionResult<object>> GetSlaPolicyStats(
        Guid slaPolicyId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var stats = await _slaService.GetSlaPolicyStatsAsync(slaPolicyId, fromDate, toDate, cancellationToken);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving SLA policy statistics for {SlaPolicyId}", slaPolicyId);
            return BadRequest($"Error retrieving SLA policy statistics: {ex.Message}");
        }
    }

    /// <summary>
    /// Get overall SLA performance statistics
    /// </summary>
    [HttpGet("performance")]
    public async Task<ActionResult<object>> GetOverallSlaPerformance(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var performance = await _slaService.GetOverallSlaPerformanceAsync(fromDate, toDate, cancellationToken);
            return Ok(performance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving overall SLA performance");
            return BadRequest($"Error retrieving overall SLA performance: {ex.Message}");
        }
    }
}