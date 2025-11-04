using ERPTraining.Core.DTOs.Ticketing;

namespace ERPTraining.Core.Interfaces.Ticketing;

public interface ITicketFieldSettingService
{
    Task<IEnumerable<TicketFieldSettingDto>> GetAllAsync();
    Task<IEnumerable<TicketFieldSettingDto>> GetByCategoryIdAsync(int categoryId);
    Task<TicketFieldSettingDto?> GetByIdAsync(int id);
    Task<TicketFieldSettingDto> CreateAsync(CreateTicketFieldSettingDto dto);
    Task<TicketFieldSettingDto> UpdateAsync(int id, UpdateTicketFieldSettingDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<bool> ReorderFieldsAsync(int categoryId, List<int> fieldIds);
}