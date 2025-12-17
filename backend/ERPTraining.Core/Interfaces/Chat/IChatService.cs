using ERPTraining.Core.Entities.Chat;

namespace ERPTraining.Core.Interfaces.Chat;

/// <summary>
/// Service interface for chat operations
/// </summary>
public interface IChatService
{
    // Conversations
    Task<ConversationDto> CreateDirectConversationAsync(string userId1, string userId2);
    Task<ConversationDto> CreateGroupConversationAsync(string creatorId, string name, List<string> participantIds);
    Task<ConversationDto?> GetConversationAsync(int conversationId, string userId);
    Task<List<ConversationDto>> GetUserConversationsAsync(string userId, bool includeArchived = false);
    Task<ConversationDto?> GetDirectConversationAsync(string userId1, string userId2);
    Task ArchiveConversationAsync(int conversationId, string userId);
    Task<ConversationDto> UpdateConversationAsync(int conversationId, string userId, UpdateConversationDto dto);

    // Participants
    Task AddParticipantsAsync(int conversationId, string addedByUserId, List<string> userIds);
    Task RemoveParticipantAsync(int conversationId, string removedByUserId, string userId);
    Task LeaveConversationAsync(int conversationId, string userId);
    Task UpdateParticipantSettingsAsync(int conversationId, string userId, UpdateParticipantDto dto);

    // Messages
    Task<ChatMessageDto> SendMessageAsync(int conversationId, string senderId, SendMessageDto dto);
    Task<ChatMessageDto> EditMessageAsync(int messageId, string userId, string newContent);
    Task DeleteMessageAsync(int messageId, string userId);
    Task<List<ChatMessageDto>> GetMessagesAsync(int conversationId, string userId, int page = 1, int pageSize = 50);
    Task<List<ChatMessageDto>> GetMessagesSinceAsync(int conversationId, string userId, DateTime since);
    Task<List<ChatMessageDto>> SearchMessagesAsync(string userId, string query, int? conversationId = null);

    // Read receipts
    Task MarkAsReadAsync(int conversationId, string userId, int? upToMessageId = null);
    Task<Dictionary<int, List<ReadReceiptDto>>> GetReadReceiptsAsync(int conversationId, List<int> messageIds);

    // Reactions
    Task<MessageReactionDto> AddReactionAsync(int messageId, string userId, string emoji);
    Task RemoveReactionAsync(int messageId, string userId, string emoji);

    // Attachments
    Task<MessageAttachmentDto> UploadAttachmentAsync(int conversationId, string userId, Stream fileStream, string fileName, string contentType);

    // Typing indicator (in-memory, handled by Hub)
    // Presence (in-memory, handled by Hub)

    // Chat to Ticket
    Task<int> ConvertToTicketAsync(int conversationId, string userId, ConvertToTicketDto dto);
}

// DTOs
public record ConversationDto
{
    public int Id { get; init; }
    public string? Name { get; init; }
    public ConversationType Type { get; init; }
    public string? AvatarUrl { get; init; }
    public string? LastMessagePreview { get; init; }
    public DateTime? LastMessageAt { get; init; }
    public bool IsArchived { get; init; }
    public int? LinkedTicketId { get; init; }
    public int UnreadCount { get; init; }
    public bool IsPinned { get; init; }
    public bool IsMuted { get; init; }
    public List<ParticipantDto> Participants { get; init; } = new();
    public DateTime CreatedAt { get; init; }
}

public record ParticipantDto
{
    public string UserId { get; init; } = null!;
    public string UserName { get; init; } = null!;
    public string? AvatarUrl { get; init; }
    public ParticipantRole Role { get; init; }
    public bool IsOnline { get; init; }
    public DateTime? LastActiveAt { get; init; }
}

public record ChatMessageDto
{
    public int Id { get; init; }
    public int ConversationId { get; init; }
    public string SenderId { get; init; } = null!;
    public string SenderName { get; init; } = null!;
    public string? SenderAvatar { get; init; }
    public string Content { get; init; } = null!;
    public MessageType Type { get; init; }
    public int? ParentMessageId { get; init; }
    public string? ParentMessagePreview { get; init; }
    public bool IsEdited { get; init; }
    public DateTime? EditedAt { get; init; }
    public bool IsDeleted { get; init; }
    public List<AttachmentDto> Attachments { get; init; } = new();
    public List<ReactionSummaryDto> Reactions { get; init; } = new();
    public int ReplyCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record AttachmentDto
{
    public int Id { get; init; }
    public string FileName { get; init; } = null!;
    public string FilePath { get; init; } = null!;
    public string ContentType { get; init; } = null!;
    public long FileSize { get; init; }
    public string? ThumbnailPath { get; init; }
    public int? Width { get; init; }
    public int? Height { get; init; }
}

public record ReactionSummaryDto
{
    public string Emoji { get; init; } = null!;
    public int Count { get; init; }
    public List<string> UserIds { get; init; } = new();
    public bool HasReacted { get; init; } // Current user has reacted
}

public record MessageReactionDto
{
    public int MessageId { get; init; }
    public string UserId { get; init; } = null!;
    public string UserName { get; init; } = null!;
    public string Emoji { get; init; } = null!;
}

public record ReadReceiptDto
{
    public string UserId { get; init; } = null!;
    public string UserName { get; init; } = null!;
    public DateTime ReadAt { get; init; }
}

public record MessageAttachmentDto
{
    public int Id { get; init; }
    public string FileName { get; init; } = null!;
    public string FilePath { get; init; } = null!;
    public string ContentType { get; init; } = null!;
    public long FileSize { get; init; }
}

// Input DTOs
public record SendMessageDto
{
    public string Content { get; init; } = null!;
    public MessageType Type { get; init; } = MessageType.Text;
    public int? ParentMessageId { get; init; }
    public List<int>? AttachmentIds { get; init; }
}

public record UpdateConversationDto
{
    public string? Name { get; init; }
    public string? AvatarUrl { get; init; }
}

public record UpdateParticipantDto
{
    public bool? IsMuted { get; init; }
    public bool? IsPinned { get; init; }
    public NotificationPreference? NotificationPreference { get; init; }
}

public record ConvertToTicketDto
{
    public string Title { get; init; } = null!;
    public string? Description { get; init; }
    public int? CategoryId { get; init; }
    public int? PriorityId { get; init; }
    public List<int>? MessageIds { get; init; } // Specific messages to include
    public bool IncludeAllMessages { get; init; } = false;
}
