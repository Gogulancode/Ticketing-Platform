using ERPTraining.Core.DTOs.Ticketing;

namespace ERPTraining.Core.Interfaces.Ticketing;

public interface ITicketGroupService
{
    Task<IEnumerable<TicketGroupDto>> GetAllAsync();
    Task<TicketGroupDto?> GetByIdAsync(int id);
    Task<TicketGroupDto> CreateAsync(TicketGroupDto dto);
    Task<TicketGroupDto?> UpdateAsync(int id, TicketGroupDto dto);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<TicketGroupDto>> GetByCategoryIdAsync(int categoryId);
    Task<IEnumerable<TicketGroupDto>> GetBySubCategoryIdAsync(int subCategoryId);
    Task<bool> AssignAgentToGroupAsync(int groupId, int agentId);
    Task<bool> RemoveAgentFromGroupAsync(int groupId, int agentId);
    Task<IEnumerable<TicketGroupAgentDto>> GetGroupAgentsAsync(int groupId);
    Task<bool> ExistsAsync(int id);
}