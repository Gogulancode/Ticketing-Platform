using ERPTraining.Core.DTOs;

namespace ERPTraining.Core.Interfaces;

public interface IERPApiService
{
    Task<string?> LoginAsync(string email, string password);
    Task<List<ERPModuleDto>> GetModulesAsync(string token);
    Task<List<ERPSectionDto>> GetSectionsAsync(string token);
    Task<List<ERPUserDto>> GetUsersAsync(string token);
    Task<List<ERPRoleDto>> GetRolesAsync(string token);
    Task<List<ERPRoleDetailsDto>> GetRoleDetailsAsync(string token);
    Task<List<ERPRoleDetailApiDto>> GetAllRoleDetailsAsync(string token);
    Task<List<ERPUserMasterApiDto>> GetUserMasterListAsync(string token);
    Task<bool> EnsureAuthenticatedAsync();
    string? GetCurrentToken();
}

public interface IERPSyncService
{
    Task SyncModulesAsync();
    Task SyncSectionsAsync();
    Task SyncUsersAsync();
    Task SyncERPUsersAsync(); // New method for ERP user sync
    Task SyncRolesAsync();
    Task SyncRoleDetailsAsync();
    Task SyncAllDataAsync();
    Task<bool> EnsureERPTokenAsync();
}
