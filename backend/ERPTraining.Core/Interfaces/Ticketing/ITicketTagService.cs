using ERPTraining.Core.DTOs.Ticketing;

namespace ERPTraining.Core.Interfaces.Ticketing;

public interface ITicketTagService
{
    Task<IEnumerable<TicketTagDto>> GetAllAsync(bool includeInactive = false);
    Task<IEnumerable<TicketTagDto>> GetBySubCategoryIdAsync(int subCategoryId);
    Task<TicketTagDto?> GetByIdAsync(int id);
    Task<TicketTagDto> CreateAsync(CreateTicketTagDto dto);
    Task<TicketTagDto> UpdateAsync(int id, UpdateTicketTagDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}