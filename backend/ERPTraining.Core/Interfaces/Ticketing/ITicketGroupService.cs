using ERPTraining.Core.DTOs.Ticketing;

namespace ERPTraining.Core.Interfaces.Ticketing;

public interface ITicketGroupService
{
    Task<IEnumerable<TicketGroupDto>> GetAllAsync(bool includeInactive = false);
    Task<TicketGroupDto?> GetByIdAsync(int id);
    Task<TicketGroupDto> CreateAsync(TicketGroupDto dto);
    Task<TicketGroupDto?> UpdateAsync(int id, TicketGroupDto dto);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<TicketGroupDto>> GetByCategoryIdAsync(int categoryId, bool includeInactive = false);
    Task<IEnumerable<TicketGroupDto>> GetBySubCategoryIdAsync(int subCategoryId, bool includeInactive = false);
    Task<bool> AssignAgentToGroupAsync(int groupId, int agentId);
    Task<bool> RemoveAgentFromGroupAsync(int groupId, int agentId);
    Task<IEnumerable<TicketGroupAgentDto>> GetGroupAgentsAsync(int groupId);
    Task<bool> ExistsAsync(int id);
}