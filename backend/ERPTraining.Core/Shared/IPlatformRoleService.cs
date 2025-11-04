using ERPTraining.Core.DTOs;

namespace ERPTraining.Core.Interfaces
{
    public interface IPlatformRoleService
    {
        Task<IEnumerable<PlatformRoleDto>> GetAllRolesAsync();
        Task<PlatformRoleDto?> GetRoleByIdAsync(int id);
        Task<PlatformRoleDto> CreateRoleAsync(CreatePlatformRoleDto createDto);
        Task<PlatformRoleDto?> UpdateRoleAsync(int id, UpdatePlatformRoleDto updateDto);
        Task<bool> DeleteRoleAsync(int id);
        Task<bool> AssignRoleToUserAsync(string userId, int roleId);
        Task<bool> RemoveRoleFromUserAsync(string userId, int roleId);
        Task<UserPermissionDto?> GetUserPermissionsAsync(string userId);
        Task<bool> UserHasPermissionAsync(string userId, string feature, string action);
    }
}
