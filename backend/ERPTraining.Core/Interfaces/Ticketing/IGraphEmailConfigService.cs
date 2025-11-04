using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.Core.Interfaces.Ticketing;

public interface IGraphEmailConfigService
{
    Task<IEnumerable<GraphEmailConfigDto>> GetAllAsync();
    Task<GraphEmailConfigDto?> GetByIdAsync(int id);
    Task<GraphEmailConfig?> GetEntityByIdAsync(int id);
    Task<GraphEmailConfigDto?> GetActiveByCategoryIdAsync(int? categoryId);
    Task<GraphEmailConfigDto> CreateAsync(CreateGraphEmailConfigDto dto);
    Task<GraphEmailConfigDto> UpdateAsync(int id, UpdateGraphEmailConfigDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> TestConnectionAsync(int id);
    Task<bool> ExistsAsync(int id);
}