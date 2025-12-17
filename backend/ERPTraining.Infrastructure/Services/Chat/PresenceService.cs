using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ERPTraining.Core.Entities.Chat;
using ERPTraining.Core.Interfaces.Chat;
using ERPTraining.Infrastructure.Data;
using System.Collections.Concurrent;

namespace ERPTraining.Infrastructure.Services.Chat;

/// <summary>
/// Service for managing user presence (online/offline status)
/// Uses a combination of in-memory tracking and database persistence
/// </summary>
public class PresenceService : IPresenceService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PresenceService> _logger;

    // In-memory tracking for real-time presence
    private static readonly ConcurrentDictionary<string, HashSet<string>> UserConnections = new();
    private static readonly ConcurrentDictionary<string, UserPresenceDto> OnlineUsers = new();

    public PresenceService(ApplicationDbContext context, ILogger<PresenceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SetOnlineAsync(string userId, string connectionId, string? deviceType = null)
    {
        // Track connection
        UserConnections.AddOrUpdate(
            userId,
            new HashSet<string> { connectionId },
            (_, connections) =>
            {
                connections.Add(connectionId);
                return connections;
            });

        // Get or create presence record
        var presence = await _context.Set<UserPresence>().FindAsync(userId);
        var user = await _context.Users.FindAsync(userId);

        if (presence == null)
        {
            presence = new UserPresence
            {
                UserId = userId,
                Status = PresenceStatus.Online,
                ConnectionId = connectionId,
                DeviceType = deviceType,
                OnlineSince = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            };
            _context.Set<UserPresence>().Add(presence);
        }
        else
        {
            presence.Status = PresenceStatus.Online;
            presence.ConnectionId = connectionId;
            presence.DeviceType = deviceType;
            if (presence.OnlineSince == null)
                presence.OnlineSince = DateTime.UtcNow;
            presence.LastActiveAt = DateTime.UtcNow;
            presence.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Update in-memory cache
        OnlineUsers[userId] = new UserPresenceDto
        {
            UserId = userId,
            UserName = user?.FullName ?? "Unknown",
            AvatarUrl = user?.Avatar,
            Status = presence.Status,
            StatusMessage = presence.StatusMessage,
            StatusEmoji = presence.StatusEmoji,
            LastActiveAt = presence.LastActiveAt
        };

        _logger.LogDebug("User {UserId} is now online with connection {ConnectionId}", userId, connectionId);
    }

    public async Task SetOfflineAsync(string userId, string connectionId)
    {
        // Remove this connection
        if (UserConnections.TryGetValue(userId, out var connections))
        {
            connections.Remove(connectionId);

            // If user has no more connections, set offline
            if (connections.Count == 0)
            {
                UserConnections.TryRemove(userId, out _);
                OnlineUsers.TryRemove(userId, out _);

                var presence = await _context.Set<UserPresence>().FindAsync(userId);
                if (presence != null)
                {
                    presence.Status = PresenceStatus.Offline;
                    presence.ConnectionId = null;
                    presence.OnlineSince = null;
                    presence.LastActiveAt = DateTime.UtcNow;
                    presence.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                _logger.LogDebug("User {UserId} is now offline", userId);
            }
        }
    }

    public async Task SetStatusAsync(string userId, PresenceStatus status, string? statusMessage = null, string? statusEmoji = null, DateTime? expiresAt = null)
    {
        var presence = await _context.Set<UserPresence>().FindAsync(userId);
        if (presence == null)
        {
            presence = new UserPresence
            {
                UserId = userId,
                Status = status,
                StatusMessage = statusMessage,
                StatusEmoji = statusEmoji,
                StatusExpiresAt = expiresAt
            };
            _context.Set<UserPresence>().Add(presence);
        }
        else
        {
            presence.Status = status;
            presence.StatusMessage = statusMessage;
            presence.StatusEmoji = statusEmoji;
            presence.StatusExpiresAt = expiresAt;
            presence.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Update in-memory cache if user is online
        if (OnlineUsers.TryGetValue(userId, out var cached))
        {
            OnlineUsers[userId] = cached with
            {
                Status = status,
                StatusMessage = statusMessage,
                StatusEmoji = statusEmoji
            };
        }
    }

    public async Task UpdateLastActiveAsync(string userId)
    {
        var presence = await _context.Set<UserPresence>().FindAsync(userId);
        if (presence != null)
        {
            presence.LastActiveAt = DateTime.UtcNow;
            presence.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        if (OnlineUsers.TryGetValue(userId, out var cached))
        {
            OnlineUsers[userId] = cached with { LastActiveAt = DateTime.UtcNow };
        }
    }

    public async Task<UserPresenceDto?> GetPresenceAsync(string userId)
    {
        // Check in-memory cache first
        if (OnlineUsers.TryGetValue(userId, out var cached))
            return cached;

        // Fall back to database
        var presence = await _context.Set<UserPresence>()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (presence == null)
            return null;

        return new UserPresenceDto
        {
            UserId = presence.UserId,
            UserName = presence.User?.FullName ?? "Unknown",
            AvatarUrl = presence.User?.Avatar,
            Status = presence.Status,
            StatusMessage = presence.StatusMessage,
            StatusEmoji = presence.StatusEmoji,
            LastActiveAt = presence.LastActiveAt
        };
    }

    public async Task<List<UserPresenceDto>> GetPresencesAsync(List<string> userIds)
    {
        var result = new List<UserPresenceDto>();

        // Get from in-memory cache
        var cachedIds = new HashSet<string>();
        foreach (var userId in userIds)
        {
            if (OnlineUsers.TryGetValue(userId, out var cached))
            {
                result.Add(cached);
                cachedIds.Add(userId);
            }
        }

        // Get remaining from database
        var uncachedIds = userIds.Except(cachedIds).ToList();
        if (uncachedIds.Any())
        {
            var dbPresences = await _context.Set<UserPresence>()
                .Include(p => p.User)
                .Where(p => uncachedIds.Contains(p.UserId))
                .ToListAsync();

            result.AddRange(dbPresences.Select(p => new UserPresenceDto
            {
                UserId = p.UserId,
                UserName = p.User?.FullName ?? "Unknown",
                AvatarUrl = p.User?.Avatar,
                Status = p.Status,
                StatusMessage = p.StatusMessage,
                StatusEmoji = p.StatusEmoji,
                LastActiveAt = p.LastActiveAt
            }));
        }

        return result;
    }

    public Task<List<UserPresenceDto>> GetOnlineUsersAsync()
    {
        return Task.FromResult(OnlineUsers.Values.ToList());
    }

    public Task<List<string>> GetConnectionsForUserAsync(string userId)
    {
        if (UserConnections.TryGetValue(userId, out var connections))
            return Task.FromResult(connections.ToList());
        
        return Task.FromResult(new List<string>());
    }
}
