using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ERPTraining.Core.Interfaces.Chat;
using ERPTraining.Core.Entities.Chat;

namespace ERPTraining.API.Hubs;

/// <summary>
/// SignalR Hub for real-time chat functionality
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private readonly IPresenceService _presenceService;
    private readonly ILogger<ChatHub> _logger;

    // In-memory typing indicators (userId -> conversationId -> timestamp)
    private static readonly Dictionary<string, Dictionary<int, DateTime>> TypingUsers = new();
    private static readonly object TypingLock = new();

    public ChatHub(
        IChatService chatService,
        IPresenceService presenceService,
        ILogger<ChatHub> logger)
    {
        _chatService = chatService;
        _presenceService = presenceService;
        _logger = logger;
    }

    private string GetUserId() => Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
        ?? throw new HubException("User not authenticated");

    private string GetUserName() => Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";

    #region Connection Lifecycle

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var connectionId = Context.ConnectionId;

        _logger.LogInformation("User {UserId} connected with connection {ConnectionId}", userId, connectionId);

        // Set user online
        await _presenceService.SetOnlineAsync(userId, connectionId, GetDeviceType());

        // Join user's personal group for direct notifications
        await Groups.AddToGroupAsync(connectionId, $"user:{userId}");

        // Join all conversation groups
        var conversations = await _chatService.GetUserConversationsAsync(userId);
        foreach (var conversation in conversations)
        {
            await Groups.AddToGroupAsync(connectionId, $"conversation:{conversation.Id}");
        }

        // Notify others that user is online
        await Clients.Others.SendAsync("UserOnline", new
        {
            UserId = userId,
            UserName = GetUserName(),
            Timestamp = DateTime.UtcNow
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        var connectionId = Context.ConnectionId;

        _logger.LogInformation("User {UserId} disconnected from connection {ConnectionId}", userId, connectionId);

        // Set user offline
        await _presenceService.SetOfflineAsync(userId, connectionId);

        // Clear typing indicators for this user
        ClearTypingIndicator(userId);

        // Notify others that user is offline
        await Clients.Others.SendAsync("UserOffline", new
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow
        });

        await base.OnDisconnectedAsync(exception);
    }

    #endregion

    #region Messaging

    /// <summary>
    /// Send a message to a conversation
    /// </summary>
    public async Task SendMessage(int conversationId, string content, MessageType type = MessageType.Text, int? parentMessageId = null)
    {
        var userId = GetUserId();

        var message = await _chatService.SendMessageAsync(conversationId, userId, new SendMessageDto
        {
            Content = content,
            Type = type,
            ParentMessageId = parentMessageId
        });

        // Clear typing indicator
        ClearTypingIndicator(userId, conversationId);

        // Broadcast to conversation group
        await Clients.Group($"conversation:{conversationId}").SendAsync("NewMessage", message);

        _logger.LogDebug("Message sent to conversation {ConversationId} by user {UserId}", conversationId, userId);
    }

    /// <summary>
    /// Edit an existing message
    /// </summary>
    public async Task EditMessage(int messageId, string newContent)
    {
        var userId = GetUserId();
        var message = await _chatService.EditMessageAsync(messageId, userId, newContent);

        await Clients.Group($"conversation:{message.ConversationId}").SendAsync("MessageEdited", message);
    }

    /// <summary>
    /// Delete a message
    /// </summary>
    public async Task DeleteMessage(int messageId, int conversationId)
    {
        var userId = GetUserId();
        await _chatService.DeleteMessageAsync(messageId, userId);

        await Clients.Group($"conversation:{conversationId}").SendAsync("MessageDeleted", new
        {
            MessageId = messageId,
            ConversationId = conversationId,
            DeletedBy = userId
        });
    }

    #endregion

    #region Typing Indicators

    /// <summary>
    /// Notify others that user is typing
    /// </summary>
    public async Task StartTyping(int conversationId)
    {
        var userId = GetUserId();
        var userName = GetUserName();

        lock (TypingLock)
        {
            if (!TypingUsers.ContainsKey(userId))
                TypingUsers[userId] = new Dictionary<int, DateTime>();
            TypingUsers[userId][conversationId] = DateTime.UtcNow;
        }

        await Clients.OthersInGroup($"conversation:{conversationId}").SendAsync("UserTyping", new
        {
            UserId = userId,
            UserName = userName,
            ConversationId = conversationId
        });
    }

    /// <summary>
    /// Notify others that user stopped typing
    /// </summary>
    public async Task StopTyping(int conversationId)
    {
        var userId = GetUserId();
        ClearTypingIndicator(userId, conversationId);

        await Clients.OthersInGroup($"conversation:{conversationId}").SendAsync("UserStoppedTyping", new
        {
            UserId = userId,
            ConversationId = conversationId
        });
    }

    #endregion

    #region Read Receipts

    /// <summary>
    /// Mark messages as read
    /// </summary>
    public async Task MarkAsRead(int conversationId, int? upToMessageId = null)
    {
        var userId = GetUserId();
        await _chatService.MarkAsReadAsync(conversationId, userId, upToMessageId);

        await Clients.OthersInGroup($"conversation:{conversationId}").SendAsync("MessagesRead", new
        {
            UserId = userId,
            UserName = GetUserName(),
            ConversationId = conversationId,
            UpToMessageId = upToMessageId,
            ReadAt = DateTime.UtcNow
        });
    }

    #endregion

    #region Reactions

    /// <summary>
    /// Add a reaction to a message
    /// </summary>
    public async Task AddReaction(int messageId, int conversationId, string emoji)
    {
        var userId = GetUserId();
        var reaction = await _chatService.AddReactionAsync(messageId, userId, emoji);

        await Clients.Group($"conversation:{conversationId}").SendAsync("ReactionAdded", reaction);
    }

    /// <summary>
    /// Remove a reaction from a message
    /// </summary>
    public async Task RemoveReaction(int messageId, int conversationId, string emoji)
    {
        var userId = GetUserId();
        await _chatService.RemoveReactionAsync(messageId, userId, emoji);

        await Clients.Group($"conversation:{conversationId}").SendAsync("ReactionRemoved", new
        {
            MessageId = messageId,
            UserId = userId,
            Emoji = emoji
        });
    }

    #endregion

    #region Presence

    /// <summary>
    /// Update user's presence status
    /// </summary>
    public async Task UpdateStatus(PresenceStatus status, string? statusMessage = null, string? statusEmoji = null)
    {
        var userId = GetUserId();
        await _presenceService.SetStatusAsync(userId, status, statusMessage, statusEmoji);

        await Clients.Others.SendAsync("UserStatusChanged", new
        {
            UserId = userId,
            UserName = GetUserName(),
            Status = status,
            StatusMessage = statusMessage,
            StatusEmoji = statusEmoji
        });
    }

    /// <summary>
    /// Get online status of users
    /// </summary>
    public async Task<List<UserPresenceDto>> GetOnlineUsers()
    {
        return await _presenceService.GetOnlineUsersAsync();
    }

    #endregion

    #region Conversations

    /// <summary>
    /// Join a conversation group (called when creating/joining a conversation)
    /// </summary>
    public async Task JoinConversation(int conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation:{conversationId}");
    }

    /// <summary>
    /// Leave a conversation group
    /// </summary>
    public async Task LeaveConversation(int conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation:{conversationId}");
    }

    /// <summary>
    /// Notify users when a new participant joins
    /// </summary>
    public async Task NotifyParticipantJoined(int conversationId, string userId, string userName)
    {
        await Clients.Group($"conversation:{conversationId}").SendAsync("ParticipantJoined", new
        {
            ConversationId = conversationId,
            UserId = userId,
            UserName = userName,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Notify users when a participant leaves
    /// </summary>
    public async Task NotifyParticipantLeft(int conversationId, string userId, string userName)
    {
        await Clients.Group($"conversation:{conversationId}").SendAsync("ParticipantLeft", new
        {
            ConversationId = conversationId,
            UserId = userId,
            UserName = userName,
            Timestamp = DateTime.UtcNow
        });
    }

    #endregion

    #region Helpers

    private void ClearTypingIndicator(string userId, int? conversationId = null)
    {
        lock (TypingLock)
        {
            if (TypingUsers.ContainsKey(userId))
            {
                if (conversationId.HasValue)
                    TypingUsers[userId].Remove(conversationId.Value);
                else
                    TypingUsers.Remove(userId);
            }
        }
    }

    private string? GetDeviceType()
    {
        var userAgent = Context.GetHttpContext()?.Request.Headers["User-Agent"].ToString();
        if (string.IsNullOrEmpty(userAgent)) return null;

        if (userAgent.Contains("Electron")) return "Desktop";
        if (userAgent.Contains("Mobile") || userAgent.Contains("Android") || userAgent.Contains("iPhone")) return "Mobile";
        return "Web";
    }

    #endregion
}
