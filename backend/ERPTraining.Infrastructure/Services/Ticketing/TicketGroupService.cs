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

    public async Task<IEnumerable<TicketGroupDto>> GetAllAsync()
    {
        var groups = await _context.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .Include(g => g.GroupAgents.Where(ga => ga.IsActive))
                .ThenInclude(ga => ga.Agent)
            .Where(g => g.IsActive)
            .OrderBy(g => g.Category!.Name)
            .ThenBy(g => g.Name)
            .ToListAsync();

        return groups.Select(MapToDto);
    }

    public async Task<TicketGroupDto?> GetByIdAsync(int id)
    {
        var group = await _context.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .Include(g => g.GroupAgents.Where(ga => ga.IsActive))
                .ThenInclude(ga => ga.Agent)
            .FirstOrDefaultAsync(g => g.Id == id && g.IsActive);

        return group != null ? MapToDto(group) : null;
    }

    public async Task<TicketGroupDto> CreateAsync(TicketGroupDto dto)
    {
        // Check for duplicate name in the same category/subcategory
        var existingGroup = await _context.TicketGroups
            .FirstOrDefaultAsync(g => g.Name == dto.Name && 
                                    g.CategoryId == dto.CategoryId && 
                                    g.SubCategoryId == dto.SubCategoryId && 
                                    g.IsActive);

        if (existingGroup != null)
        {
            var scope = dto.SubCategoryId.HasValue ? "subcategory" : "category";
            throw new InvalidOperationException($"Group with name '{dto.Name}' already exists in this {scope}.");
        }

        var group = new TicketGroup
        {
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            SubCategoryId = dto.SubCategoryId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TicketGroups.Add(group);
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

        return MapToDto(group);
    }

    public async Task<TicketGroupDto?> UpdateAsync(int id, TicketGroupDto dto)
    {
        var group = await _context.TicketGroups
            .FirstOrDefaultAsync(g => g.Id == id && g.IsActive);

        if (group == null)
            return null;

        // Check for duplicate name (excluding current group)
        var existingGroup = await _context.TicketGroups
            .FirstOrDefaultAsync(g => g.Name == dto.Name && 
                                    g.CategoryId == dto.CategoryId && 
                                    g.SubCategoryId == dto.SubCategoryId && 
                                    g.Id != id && 
                                    g.IsActive);

        if (existingGroup != null)
        {
            var scope = dto.SubCategoryId.HasValue ? "subcategory" : "category";
            throw new InvalidOperationException($"Group with name '{dto.Name}' already exists in this {scope}.");
        }

        group.Name = dto.Name;
        group.Description = dto.Description;
        group.CategoryId = dto.CategoryId;
        group.SubCategoryId = dto.SubCategoryId;
        group.UpdatedAt = DateTime.UtcNow;

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

        return MapToDto(group);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var group = await _context.TicketGroups
            .FirstOrDefaultAsync(g => g.Id == id && g.IsActive);

        if (group == null)
            return false;

        // Soft delete the group and its agent assignments
        group.IsActive = false;
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

    public async Task<IEnumerable<TicketGroupDto>> GetByCategoryIdAsync(int categoryId)
    {
        var groups = await _context.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .Include(g => g.GroupAgents.Where(ga => ga.IsActive))
                .ThenInclude(ga => ga.Agent)
            .Where(g => g.CategoryId == categoryId && g.IsActive)
            .OrderBy(g => g.Name)
            .ToListAsync();

        return groups.Select(MapToDto);
    }

    public async Task<IEnumerable<TicketGroupDto>> GetBySubCategoryIdAsync(int subCategoryId)
    {
        var groups = await _context.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .Include(g => g.GroupAgents.Where(ga => ga.IsActive))
                .ThenInclude(ga => ga.Agent)
            .Where(g => g.SubCategoryId == subCategoryId && g.IsActive)
            .OrderBy(g => g.Name)
            .ToListAsync();

        return groups.Select(MapToDto);
    }

    public async Task<bool> AssignAgentToGroupAsync(int groupId, int agentId)
    {
        // Check if group exists
        var group = await _context.TicketGroups
            .FirstOrDefaultAsync(g => g.Id == groupId && g.IsActive);

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
            .AnyAsync(g => g.Id == id && g.IsActive);
    }

    private static TicketGroupDto MapToDto(TicketGroup group)
    {
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
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt,
            GroupAgents = group.GroupAgents.Select(ga => new TicketGroupAgentDto
            {
                Id = ga.Id,
                TicketGroupId = ga.TicketGroupId,
                AgentId = ga.AgentId,
                AgentName = ga.Agent.Name,
                AgentEmail = ga.Agent.Email,
                IsActive = ga.IsActive,
                AssignedAt = ga.AssignedAt
            }).ToList()
        };
    }
}