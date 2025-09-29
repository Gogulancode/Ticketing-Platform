using ERPTraining.Core.Ticketing.Settings.DTOs;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using Microsoft.AspNetCore.Mvc;
using AgentEntity = ERPTraining.Core.Entities.Ticketing.Agent;
using TicketGroupEntity = ERPTraining.Core.Entities.Ticketing.TicketGroup;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/tickets/settings/agents")]
public class AgentsController : ControllerBase
{
    private readonly IA_TicketSettingsService _service;
    private readonly ILogger<AgentsController> _logger;

    public AgentsController(IA_TicketSettingsService service, ILogger<AgentsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private static AgentDto Map(AgentEntity a) => new(
        a.Id, a.UserId, a.Name, a.Email, a.Department, a.IsActive, a.CreatedAt, a.UpdatedAt
    );

    private static TicketGroupDto MapGroup(TicketGroupEntity g)
    {
        var agentCount = g.GroupAgents?.Count(a => a.IsActive) ?? 0;
        return new TicketGroupDto(
            g.Id,
            g.Name,
            g.Description,
            g.IsActive,
            g.CategoryId,
            g.Category?.Name ?? string.Empty,
            g.SubCategoryId,
            g.SubCategory?.Name,
            agentCount,
            g.CreatedAt,
            g.UpdatedAt
        );
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AgentDto>>> GetAgents([FromQuery] bool includeInactive = false)
    {
        var list = await _service.GetAgentsAsync(includeInactive);
        return Ok(list.Select(Map));
    }

    // GET: api/tickets/settings/agents/unassigned
    // Returns agents that are not assigned to any group yet
    [HttpGet("unassigned")]
    public async Task<ActionResult<IEnumerable<AgentDto>>> GetUnassignedAgents([FromQuery] bool includeInactive = false)
    {
        var list = await _service.GetUnassignedAgentsAsync(includeInactive);
        return Ok(list.Select(Map));
    }

    // GET: api/tickets/settings/agents-with-groups
    // Returns agents and their active groups (deduplicated) to avoid N+1 calls from frontend
    [HttpGet("agents-with-groups")]
    [HttpGet("/api/tickets/settings/agents-with-groups")] // alternate absolute route for direct calls
    public async Task<ActionResult<IEnumerable<object>>> GetAgentsWithGroups([FromQuery] bool includeInactive = false)
    {
        var agents = await _service.GetAgentsAsync(includeInactive);
        // Preload memberships for all agents in one query
        var agentIds = agents.Select(a => a.Id).ToList();
        var memberships = await _service.GetGroupMembershipsForAgentsAsync(agentIds, includeInactive);

        var grouped = memberships
            .GroupBy(m => m.AgentId)
            .ToDictionary(g => g.Key, g => g
                .Select(m => m.TicketGroup)
                .Where(gp => gp != null)
                .Distinct()!);

        var result = agents.Select(a => new {
            Agent = Map(a),
            Groups = (grouped.TryGetValue(a.Id, out var gs) ? gs : Array.Empty<ERPTraining.Core.Entities.Ticketing.TicketGroup>())
                .Select(MapGroup)
        });
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AgentDto>> GetAgent(int id)
    {
        var a = await _service.GetAgentAsync(id);
        if (a == null) return NotFound();
        return Ok(Map(a));
    }

    // GET: api/tickets/settings/agents/{id}/groups
    [HttpGet("{id:int}/groups")]
    public async Task<ActionResult<IEnumerable<TicketGroupDto>>> GetAgentGroups(int id, [FromQuery] bool includeInactive = false)
    {
        // Validate agent exists (optional but helpful)
        var agent = await _service.GetAgentAsync(id);
        if (agent == null) return NotFound($"Agent {id} not found");

        var groups = await _service.GetGroupsForAgentAsync(id, includeInactive);
        return Ok(groups.Select(MapGroup));
    }

    // GET: api/tickets/settings/agents/for-category/{categoryId}
    [HttpGet("for-category/{categoryId:int}")]
    public async Task<ActionResult<IEnumerable<object>>> GetAgentsForCategory(int categoryId, [FromQuery] int? subcategoryId = null)
    {
        try 
        {
            var groups = await _service.GetGroupsAsync(categoryId, subcategoryId, false);
            
            var agents = new List<object>();
            foreach (var group in groups)
            {
                var groupMembers = await _service.GetGroupMembersAsync(group.Id);
                foreach (var member in groupMembers)
                {
                    var agent = await _service.GetAgentAsync(member.AgentId);
                    if (agent != null && agent.IsActive)
                    {
                        agents.Add(new 
                        {
                            id = agent.Id,
                            userId = agent.UserId,
                            name = agent.Name,
                            email = agent.Email,
                            department = agent.Department,
                            departmentName = agent.Department, // For compatibility
                            isActive = agent.IsActive,
                            groupId = group.Id,
                            groupName = group.Name,
                            assignedToCategory = categoryId,
                            assignedToSubcategory = subcategoryId
                        });
                    }
                }
            }
            
            // Remove duplicates by userId
            var uniqueAgents = agents
                .GroupBy(a => ((dynamic)a).userId)
                .Select(g => g.First())
                .OrderBy(a => ((dynamic)a).name)
                .ToList();
            
            _logger.LogInformation("Found {Count} agents for category {CategoryId}, subcategory {SubcategoryId}", 
                uniqueAgents.Count, categoryId, subcategoryId);
            
            return Ok(uniqueAgents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agents for category {CategoryId}, subcategory {SubcategoryId}", categoryId, subcategoryId);
            return BadRequest($"Error loading agents for category: {ex.Message}");
        }
    }
}
