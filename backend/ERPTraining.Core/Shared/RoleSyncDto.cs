namespace ERPTraining.Core.DTOs;

public class RoleSyncResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int SyncedCount { get; set; }
    public int NewCount { get; set; }
    public int UpdatedCount { get; set; }
    public DateTime SyncTime { get; set; }
    public double ResponseTimeMs { get; set; }
}

public class RoleSyncStatus
{
    public int TotalRoles { get; set; }
    public int RecentlyUpdated { get; set; }
    public DateTime? LastSyncTime { get; set; }
    public bool IsConfigured { get; set; }
    public string? LastSyncStatus { get; set; }
}
