using ERPTraining.Core.Entities.Chat;

namespace ERPTraining.Core.Interfaces.Chat;

/// <summary>
/// Service interface for user presence management
/// </summary>
public interface IPresenceService
{
    Task SetOnlineAsync(string userId, string connectionId, string? deviceType = null);
    Task SetOfflineAsync(string userId, string connectionId);
    Task SetStatusAsync(string userId, PresenceStatus status, string? statusMessage = null, string? statusEmoji = null, DateTime? expiresAt = null);
    Task UpdateLastActiveAsync(string userId);
    Task<UserPresenceDto?> GetPresenceAsync(string userId);
    Task<List<UserPresenceDto>> GetPresencesAsync(List<string> userIds);
    Task<List<UserPresenceDto>> GetOnlineUsersAsync();
    Task<List<string>> GetConnectionsForUserAsync(string userId);
}

public record UserPresenceDto
{
    public string UserId { get; init; } = null!;
    public string UserName { get; init; } = null!;
    public string? AvatarUrl { get; init; }
    public PresenceStatus Status { get; init; }
    public string? StatusMessage { get; init; }
    public string? StatusEmoji { get; init; }
    public DateTime LastActiveAt { get; init; }
    public bool IsOnline => Status != PresenceStatus.Offline && Status != PresenceStatus.Invisible;
}
