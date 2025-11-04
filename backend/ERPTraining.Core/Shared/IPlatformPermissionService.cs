using ERPTraining.Core.DTOs;

namespace ERPTraining.Core.Interfaces
{
    public interface IPlatformPermissionService
    {
        Task<IEnumerable<PlatformPermissionDto>> GetAllPermissionsAsync();
        Task<PlatformPermissionDto?> GetPermissionByIdAsync(int id);
        Task<PlatformPermissionDto> CreatePermissionAsync(CreatePlatformPermissionDto createDto);
        Task<PlatformPermissionDto?> UpdatePermissionAsync(int id, CreatePlatformPermissionDto updateDto);
        Task<bool> DeletePermissionAsync(int id);
        Task<IEnumerable<PlatformPermissionDto>> GetPermissionsByFeatureAsync(string feature);
        Task InitializeDefaultPermissionsAsync();
    }
}
