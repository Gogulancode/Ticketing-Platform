using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Interfaces;

public interface IRoleMasterService
{
    Task<IEnumerable<RoleMasterDto>> GetAllAsync();
    Task<RoleMasterDto?> GetByIdAsync(int id);
    Task<RoleMasterDto> CreateAsync(CreateRoleMasterDto dto);
    Task<RoleMasterDto?> UpdateAsync(int id, UpdateRoleMasterDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> ToggleStatusAsync(int id, bool isActive);
}
