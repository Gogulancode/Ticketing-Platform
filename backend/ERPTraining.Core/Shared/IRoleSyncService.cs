using ERPTraining.Core.DTOs;

namespace ERPTraining.Core.Interfaces;

public interface IRoleSyncService
{
    Task<RoleSyncResult> SyncRolesAsync();
    Task<RoleSyncResult> TestConnectionAsync();
    Task<RoleSyncStatus> GetSyncStatusAsync();
}
