using ERPTraining.Core.Ticketing.Settings.DTOs;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("tickets/settings/groups/{groupId:int}/members")]
[Authorize]
public class TicketGroupMembersController : ControllerBase
{
    private readonly IA_TicketSettingsService _service;
    private readonly ILogger<TicketGroupMembersController> _logger;

    public TicketGroupMembersController(IA_TicketSettingsService service, ILogger<TicketGroupMembersController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private static GroupAgentDto Map(ERPTraining.Core.Entities.Ticketing.TicketGroupAgent m) => new(
        m.TicketGroupId,
        m.AgentId,
        m.Id,
        m.IsActive,
        m.AssignedAt,
        m.Agent?.Name ?? string.Empty,
        m.Agent?.Email ?? string.Empty
    );

    // GET: api/tickets/settings/groups/{groupId}/members
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GroupAgentDto>>> GetMembers(int groupId, [FromQuery] bool includeInactive = false)
    {
        var list = await _service.GetGroupMembersAsync(groupId, includeInactive);
        return Ok(list.Select(Map));
    }

    // POST: api/tickets/settings/groups/{groupId}/members
    [HttpPost]
    public async Task<ActionResult<GroupAgentDto>> AddMember(int groupId, [FromBody] AddAgentToGroupRequest request, CancellationToken ct)
    {
        if (request.AgentId <= 0) return BadRequest("AgentId is required");
        var member = await _service.AddAgentToGroupAsync(groupId, request.AgentId, ct);
        // fetch with agent
        var full = (await _service.GetGroupMembersAsync(groupId, includeInactive: true)).First(x => x.Id == member.Id);
        return CreatedAtAction(nameof(GetMembers), new { groupId }, Map(full));
    }

    // DELETE: api/tickets/settings/groups/{groupId}/members/{membershipId}
    [HttpDelete("{membershipId:int}")]
    public async Task<IActionResult> RemoveMember(int groupId, int membershipId, CancellationToken ct)
    {
        var ok = await _service.RemoveAgentFromGroupAsync(membershipId, ct);
        if (!ok) return NotFound();
        return NoContent();
    }
}
