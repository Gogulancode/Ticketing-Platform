using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Interfaces;

public interface IRoleModuleImportService
{
    Task<bool> ImportRoleModuleAccessFromJsonAsync(string jsonContent);
    Task<bool> ImportRoleModuleAccessAsync(List<RoleModuleImportDto> roleModuleData);
    Task<bool> ImportRoleModuleAccessAlternativeAsync(List<RoleModuleMapping> roleModuleMappings);
    Task<bool> ImportUserRoleModuleSectionAsync(List<UserRoleModuleSectionDto> userRoleModuleSections);
    Task<List<RoleModuleAccess>> GetRoleModuleAccessAsync(string? roleId = null, int? moduleId = null);
    Task<bool> UpdateRoleModuleAccessAsync(int id, RoleModuleAccess roleModuleAccess);
    Task<bool> DeleteRoleModuleAccessAsync(int id);
    Task<List<string>> ValidateJsonStructureAsync(string jsonContent);
}
