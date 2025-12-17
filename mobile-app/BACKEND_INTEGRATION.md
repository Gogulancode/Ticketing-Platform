# Backend API - Push Notification Integration

## New Endpoint Required

Add this controller endpoint to handle mobile push token registration:

### NotificationsController.cs

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpPost("register-token")]
    public async Task<IActionResult> RegisterPushToken([FromBody] PushTokenRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        await _notificationService.RegisterPushTokenAsync(userId, request.PushToken, request.DeviceType);
        return Ok(new { message = "Token registered successfully" });
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var notifications = await _notificationService.GetUserNotificationsAsync(userId, unreadOnly, page, pageSize);
        return Ok(notifications);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        await _notificationService.MarkAsReadAsync(id, userId);
        return Ok();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok();
    }
}
```

### Models

```csharp
public class PushTokenRequest
{
    public string PushToken { get; set; }
    public string DeviceType { get; set; } // "android" or "ios"
}

public class PushToken
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string Token { get; set; }
    public string DeviceType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class Notification
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public string Type { get; set; } // "ticket_created", "comment_added", etc.
    public int? TicketId { get; set; }
    public string TicketNumber { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### Database Migration

Add to your DbContext:

```csharp
public DbSet<PushToken> PushTokens { get; set; }
public DbSet<Notification> Notifications { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<PushToken>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.UserId);
        entity.HasIndex(e => e.Token);
    });

    modelBuilder.Entity<Notification>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.UserId);
        entity.HasIndex(e => e.IsRead);
        entity.HasIndex(e => e.CreatedAt);
    });
}
```

### Notification Service

```csharp
public interface INotificationService
{
    Task RegisterPushTokenAsync(string userId, string token, string deviceType);
    Task SendPushNotificationAsync(string userId, string title, string body, Dictionary<string, object> data);
    Task<List<Notification>> GetUserNotificationsAsync(string userId, bool unreadOnly, int page, int pageSize);
    Task MarkAsReadAsync(int notificationId, string userId);
    Task MarkAllAsReadAsync(string userId);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;

    public NotificationService(ApplicationDbContext context, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
    }

    public async Task RegisterPushTokenAsync(string userId, string token, string deviceType)
    {
        var existingToken = await _context.PushTokens
            .FirstOrDefaultAsync(pt => pt.UserId == userId && pt.Token == token);

        if (existingToken == null)
        {
            _context.PushTokens.Add(new PushToken
            {
                UserId = userId,
                Token = token,
                DeviceType = deviceType,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existingToken.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task SendPushNotificationAsync(string userId, string title, string body, Dictionary<string, object> data)
    {
        var tokens = await _context.PushTokens
            .Where(pt => pt.UserId == userId)
            .Select(pt => pt.Token)
            .ToListAsync();

        if (!tokens.Any()) return;

        var client = _httpClientFactory.CreateClient();
        
        foreach (var token in tokens)
        {
            var message = new
            {
                to = token,
                sound = "default",
                title = title,
                body = body,
                data = data
            };

            try
            {
                await client.PostAsJsonAsync("https://exp.host/--/api/v2/push/send", message);
            }
            catch (Exception ex)
            {
                // Log error
                Console.WriteLine($"Failed to send push notification: {ex.Message}");
            }
        }

        // Save notification to database
        _context.Notifications.Add(new Notification
        {
            UserId = userId,
            Title = title,
            Message = body,
            Type = data.ContainsKey("type") ? data["type"].ToString() : "general",
            TicketId = data.ContainsKey("ticketId") ? Convert.ToInt32(data["ticketId"]) : null,
            TicketNumber = data.ContainsKey("ticketNumber") ? data["ticketNumber"].ToString() : null,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(string userId, bool unreadOnly, int page, int pageSize)
    {
        var query = _context.Notifications.Where(n => n.UserId == userId);
        
        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task MarkAsReadAsync(int notificationId, string userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification != null)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }
}
```

### Usage in Ticket Service

When a comment is added or ticket status changes:

```csharp
// After adding comment
await _notificationService.SendPushNotificationAsync(
    ticket.CreatedBy,
    "New Comment",
    $"{commenterName} added a comment to ticket #{ticket.TicketNumber}",
    new Dictionary<string, object>
    {
        { "type", "comment_added" },
        { "ticketId", ticket.Id },
        { "ticketNumber", ticket.TicketNumber }
    }
);
```

## Registration in Startup.cs

```csharp
services.AddScoped<INotificationService, NotificationService>();
services.AddHttpClient();
```
