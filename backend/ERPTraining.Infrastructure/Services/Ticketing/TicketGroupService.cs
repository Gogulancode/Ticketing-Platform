using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class TicketGroupService : ITicketGroupService
{
    private readonly ApplicationDbContext _context;

    public TicketGroupService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TicketGroupDto>> GetAllAsync(bool includeInactive = false)
    {
        var groups = await _context.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .Include(g => g.GroupAgents.Where(ga => ga.IsActive))
                .ThenInclude(ga => ga.Agent)
            .Where(g => !g.IsDeleted && (includeInactive || g.IsActive))
            .OrderBy(g => g.Category!.Name)
            .ThenBy(g => g.Name)
            .ToListAsync();

        var ticketCounts = await CalculateTicketCountsAsync(groups);

        return groups.Select(g => MapToDto(g, ticketCounts.GetValueOrDefault(g.Id)));
    }

    public async Task<TicketGroupDto?> GetByIdAsync(int id)
    {
        var group = await _context.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .Include(g => g.GroupAgents.Where(ga => ga.IsActive))
                .ThenInclude(ga => ga.Agent)
            .FirstOrDefaultAsync(g => g.Id == id && !g.IsDeleted);

        if (group == null)
        {
            return null;
        }

        var ticketCounts = await CalculateTicketCountsAsync(new List<TicketGroup> { group });
        return MapToDto(group, ticketCounts.GetValueOrDefault(group.Id));
    }

    public async Task<TicketGroupDto> CreateAsync(TicketGroupDto dto)
    {
        var normalizedSubCategoryId = NormalizeSubCategoryId(dto.SubCategoryId);

        // Check for duplicate name in the same category/subcategory
        var existingGroup = await _context.TicketGroups
            .FirstOrDefaultAsync(g => g.Name == dto.Name && 
                                    g.CategoryId == dto.CategoryId && 
                                    g.SubCategoryId == normalizedSubCategoryId && 
                                    !g.IsDeleted);

        if (existingGroup != null)
        {
            var scope = normalizedSubCategoryId.HasValue ? "subcategory" : "category";
            throw new InvalidOperationException($"Group with name '{dto.Name}' already exists in this {scope}.");
        }

        var requestedAgentIds = ExtractAgentIds(dto);
        if (requestedAgentIds == null || requestedAgentIds.Count == 0)
        {
            throw new InvalidOperationException("At least one agent must be assigned to the group.");
        }

        var group = new TicketGroup
        {
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            SubCategoryId = normalizedSubCategoryId,
            IsActive = dto.IsActive,
            IsDeleted = false,
            AutoAssignmentEnabled = dto.AutoAssignmentEnabled,
            MaxTicketsPerAgent = dto.MaxTicketsPerAgent > 0 ? dto.MaxTicketsPerAgent : 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TicketGroups.Add(group);
        await _context.SaveChangesAsync();

        await SyncGroupAgentsAsync(group.Id, requestedAgentIds);
        await _context.SaveChangesAsync();

        // Reload with navigation properties
        await _context.Entry(group)
            .Reference(g => g.Category)
            .LoadAsync();

        if (group.SubCategoryId.HasValue)
        {
            await _context.Entry(group)
                .Reference(g => g.SubCategory)
                .LoadAsync();
        }

        await _context.Entry(group)
            .Collection(g => g.GroupAgents)
            .Query()
            .Where(ga => ga.IsActive)
            .Include(ga => ga.Agent)
            .LoadAsync();

        var ticketCounts = await CalculateTicketCountsAsync(new List<TicketGroup> { group });
        return MapToDto(group, ticketCounts.GetValueOrDefault(group.Id));
    }

    public async Task<TicketGroupDto?> UpdateAsync(int id, TicketGroupDto dto)
    {
        var group = await _context.TicketGroups
            .FirstOrDefaultAsync(g => g.Id == id && !g.IsDeleted);

        if (group == null)
            return null;

        var normalizedSubCategoryId = NormalizeSubCategoryId(dto.SubCategoryId);

        // Only check for duplicate name if name/category/subcategory are being changed
        if (group.Name != dto.Name || group.CategoryId != dto.CategoryId || group.SubCategoryId != normalizedSubCategoryId)
        {
            var existingGroup = await _context.TicketGroups
                .FirstOrDefaultAsync(g => g.Name == dto.Name && 
                                        g.CategoryId == dto.CategoryId && 
                                        g.SubCategoryId == normalizedSubCategoryId && 
                                        g.Id != id && 
                                        !g.IsDeleted);

            if (existingGroup != null)
            {
                var scope = normalizedSubCategoryId.HasValue ? "subcategory" : "category";
                throw new InvalidOperationException($"Group with name '{dto.Name}' already exists in this {scope}.");
            }
        }

        var requestedAgentIds = ExtractAgentIds(dto);
        if (requestedAgentIds != null && requestedAgentIds.Count == 0)
        {
            throw new InvalidOperationException("At least one agent must be assigned to the group.");
        }

        group.Name = dto.Name;
        group.Description = dto.Description;
        group.CategoryId = dto.CategoryId;
        group.SubCategoryId = normalizedSubCategoryId;
        group.IsActive = dto.IsActive;
        group.AutoAssignmentEnabled = dto.AutoAssignmentEnabled;
        group.MaxTicketsPerAgent = dto.MaxTicketsPerAgent > 0 ? dto.MaxTicketsPerAgent : group.MaxTicketsPerAgent;
        group.UpdatedAt = DateTime.UtcNow;

        await SyncGroupAgentsAsync(group.Id, requestedAgentIds);
        await _context.SaveChangesAsync();

        // Reload with navigation properties
        await _context.Entry(group)
            .Reference(g => g.Category)
            .LoadAsync();

        if (group.SubCategoryId.HasValue)
        {
            await _context.Entry(group)
                .Reference(g => g.SubCategory)
                .LoadAsync();
        }

        await _context.Entry(group)
            .Collection(g => g.GroupAgents)
            .Query()
            .Where(ga => ga.IsActive)
            .Include(ga => ga.Agent)
            .LoadAsync();

        var ticketCounts = await CalculateTicketCountsAsync(new List<TicketGroup> { group });
        return MapToDto(group, ticketCounts.GetValueOrDefault(group.Id));
    }

    public async Task<bool> DeleteAsync(int id)
    {
        // Find the group regardless of IsActive status (in case it's already soft-deleted)
        var group = await _context.TicketGroups
            .FirstOrDefaultAsync(g => g.Id == id);

        if (group == null)
            return false;

        // If already deleted, return success (idempotent operation)
        if (group.IsDeleted)
            return true;

        // Soft delete the group and its agent assignments
        group.IsActive = false;
        group.IsDeleted = true;
        group.UpdatedAt = DateTime.UtcNow;

        // Also deactivate all agent assignments
        var groupAgents = await _context.TicketGroupAgents
            .Where(ga => ga.TicketGroupId == id && ga.IsActive)
            .ToListAsync();

        foreach (var groupAgent in groupAgents)
        {
            groupAgent.IsActive = false;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<TicketGroupDto>> GetByCategoryIdAsync(int categoryId, bool includeInactive = false)
    {
        var groups = await _context.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .Include(g => g.GroupAgents.Where(ga => ga.IsActive))
                .ThenInclude(ga => ga.Agent)
            .Where(g => g.CategoryId == categoryId && !g.IsDeleted && (includeInactive || g.IsActive))
            .OrderBy(g => g.Name)
            .ToListAsync();

        var ticketCounts = await CalculateTicketCountsAsync(groups);
        return groups.Select(g => MapToDto(g, ticketCounts.GetValueOrDefault(g.Id)));
    }

    public async Task<IEnumerable<TicketGroupDto>> GetBySubCategoryIdAsync(int subCategoryId, bool includeInactive = false)
    {
        var groups = await _context.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .Include(g => g.GroupAgents.Where(ga => ga.IsActive))
                .ThenInclude(ga => ga.Agent)
            .Where(g => g.SubCategoryId == subCategoryId && !g.IsDeleted && (includeInactive || g.IsActive))
            .OrderBy(g => g.Name)
            .ToListAsync();

        var ticketCounts = await CalculateTicketCountsAsync(groups);
        return groups.Select(g => MapToDto(g, ticketCounts.GetValueOrDefault(g.Id)));
    }

    public async Task<bool> AssignAgentToGroupAsync(int groupId, int agentId)
    {
        // Check if group exists
        var group = await _context.TicketGroups
            .FirstOrDefaultAsync(g => g.Id == groupId && g.IsActive && !g.IsDeleted);

        if (group == null)
            return false;

        // Check if agent exists
        var agent = await _context.Agents
            .FirstOrDefaultAsync(a => a.Id == agentId && a.IsActive);

        if (agent == null)
            return false;

        // Check if assignment already exists
        var existingAssignment = await _context.TicketGroupAgents
            .FirstOrDefaultAsync(ga => ga.TicketGroupId == groupId && ga.AgentId == agentId);

        if (existingAssignment != null)
        {
            if (!existingAssignment.IsActive)
            {
                // Reactivate the assignment
                existingAssignment.IsActive = true;
                existingAssignment.AssignedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            return true;
        }

        // Create new assignment
        var groupAgent = new TicketGroupAgent
        {
            TicketGroupId = groupId,
            AgentId = agentId,
            IsActive = true,
            AssignedAt = DateTime.UtcNow
        };

        _context.TicketGroupAgents.Add(groupAgent);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveAgentFromGroupAsync(int groupId, int agentId)
    {
        var groupAgent = await _context.TicketGroupAgents
            .FirstOrDefaultAsync(ga => ga.TicketGroupId == groupId && ga.AgentId == agentId && ga.IsActive);

        if (groupAgent == null)
            return false;

        // Soft delete the assignment
        groupAgent.IsActive = false;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<TicketGroupAgentDto>> GetGroupAgentsAsync(int groupId)
    {
        var groupAgents = await _context.TicketGroupAgents
            .Include(ga => ga.Agent)
            .Where(ga => ga.TicketGroupId == groupId && ga.IsActive)
            .OrderBy(ga => ga.Agent.Name)
            .ToListAsync();

        return groupAgents.Select(ga => new TicketGroupAgentDto
        {
            Id = ga.Id,
            TicketGroupId = ga.TicketGroupId,
            AgentId = ga.AgentId,
            AgentName = ga.Agent.Name,
            AgentEmail = ga.Agent.Email,
            IsActive = ga.IsActive,
            AssignedAt = ga.AssignedAt
        });
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.TicketGroups
            .AnyAsync(g => g.Id == id && g.IsActive && !g.IsDeleted);
    }

    private static int? NormalizeSubCategoryId(int? subCategoryId)
    {
        return subCategoryId.HasValue && subCategoryId.Value > 0 ? subCategoryId : null;
    }

    private static List<int>? ExtractAgentIds(TicketGroupDto dto)
    {
        IEnumerable<int>? ids = null;

        if (dto.AssignedAgentIds != null)
        {
            ids = dto.AssignedAgentIds;
        }
        else if (dto.GroupAgents?.Any() == true)
        {
            ids = dto.GroupAgents.Select(ga => ga.AgentId);
        }

        if (ids == null)
        {
            return null;
        }

        return ids
            .Where(id => id > 0)
            .Distinct()
            .ToList();
    }

    private async Task SyncGroupAgentsAsync(int groupId, List<int>? desiredAgentIds)
    {
        if (desiredAgentIds == null)
        {
            return;
        }

        var desiredSet = desiredAgentIds
            .Where(id => id > 0)
            .Distinct()
            .ToHashSet();

        var existingAssignments = await _context.TicketGroupAgents
            .Where(ga => ga.TicketGroupId == groupId)
            .ToListAsync();

        foreach (var assignment in existingAssignments)
        {
            var shouldBeActive = desiredSet.Contains(assignment.AgentId);
            if (shouldBeActive && !assignment.IsActive)
            {
                assignment.IsActive = true;
                assignment.AssignedAt = DateTime.UtcNow;
            }
            else if (!shouldBeActive && assignment.IsActive)
            {
                assignment.IsActive = false;
            }
        }

        var existingAgentIds = existingAssignments
            .Select(ga => ga.AgentId)
            .ToHashSet();

        foreach (var agentId in desiredSet.Where(id => !existingAgentIds.Contains(id)))
        {
            _context.TicketGroupAgents.Add(new TicketGroupAgent
            {
                TicketGroupId = groupId,
                AgentId = agentId,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            });
        }
    }

    private async Task<Dictionary<int, int>> CalculateTicketCountsAsync(IReadOnlyCollection<TicketGroup> groups)
    {
        if (groups == null || groups.Count == 0)
        {
            return new Dictionary<int, int>();
        }

        var userIds = groups
            .SelectMany(g => g.GroupAgents ?? Enumerable.Empty<TicketGroupAgent>())
            .Where(ga => ga.IsActive && ga.Agent != null && !string.IsNullOrEmpty(ga.Agent.UserId))
            .Select(ga => ga.Agent!.UserId!)
            .Distinct()
            .ToList();

        if (!userIds.Any())
        {
            return groups.ToDictionary(g => g.Id, _ => 0);
        }

        var ticketCountsByUser = await _context.Tickets
            .Where(t => t.AssignedToUserId != null && userIds.Contains(t.AssignedToUserId))
            .GroupBy(t => t.AssignedToUserId)
            .Select(g => new { UserId = g.Key!, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var response = new Dictionary<int, int>();
        foreach (var group in groups)
        {
            var total = group.GroupAgents?
                .Where(ga => ga.IsActive && ga.Agent != null && !string.IsNullOrEmpty(ga.Agent.UserId))
                .Select(ga => ga.Agent!.UserId!)
                .Distinct()
                .Sum(userId => ticketCountsByUser.TryGetValue(userId, out var count) ? count : 0) ?? 0;

            response[group.Id] = total;
        }

        return response;
    }

    private static TicketGroupDto MapToDto(TicketGroup group, int totalTickets = 0)
    {
        var activeAssignments = group.GroupAgents?
            .Where(ga => ga.IsActive)
            .ToList() ?? new List<TicketGroupAgent>();

        return new TicketGroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            CategoryId = group.CategoryId,
            CategoryName = group.Category?.Name,
            SubCategoryId = group.SubCategoryId,
            SubCategoryName = group.SubCategory?.Name,
            IsActive = group.IsActive,
            IsDeleted = group.IsDeleted,
            AutoAssignmentEnabled = group.AutoAssignmentEnabled,
            MaxTicketsPerAgent = group.MaxTicketsPerAgent,
            AssignedAgentIds = activeAssignments
                .Select(ga => ga.AgentId)
                .Distinct()
                .ToList(),
            TotalTickets = totalTickets,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt,
            GroupAgents = activeAssignments.Select(ga => new TicketGroupAgentDto
            {
                Id = ga.Id,
                TicketGroupId = ga.TicketGroupId,
                AgentId = ga.AgentId,
                AgentName = ga.Agent?.Name,
                AgentEmail = ga.Agent?.Email,
                IsActive = ga.IsActive,
                AssignedAt = ga.AssignedAt
            }).ToList()
        };
    }
}