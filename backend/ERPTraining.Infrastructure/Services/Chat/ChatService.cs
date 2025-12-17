using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ERPTraining.Core.Entities.Chat;
using ERPTraining.Core.Interfaces.Chat;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.Services;

namespace ERPTraining.Infrastructure.Services.Chat;

/// <summary>
/// Implementation of chat service for conversations and messages
/// </summary>
public class ChatService : IChatService
{
    private readonly ApplicationDbContext _context;
    private readonly ITicketService _ticketService;
    private readonly ILogger<ChatService> _logger;

    public ChatService(
        ApplicationDbContext context,
        ITicketService ticketService,
        ILogger<ChatService> logger)
    {
        _context = context;
        _ticketService = ticketService;
        _logger = logger;
    }

    #region Conversations

    public async Task<ConversationDto> CreateDirectConversationAsync(string userId1, string userId2)
    {
        // Check if direct conversation already exists
        var existing = await GetDirectConversationAsync(userId1, userId2);
        if (existing != null)
            return existing;

        var conversation = new Conversation
        {
            Type = ConversationType.Direct,
            CreatedById = userId1,
            Participants = new List<ConversationParticipant>
            {
                new() { UserId = userId1, Role = ParticipantRole.Member },
                new() { UserId = userId2, Role = ParticipantRole.Member }
            }
        };

        _context.Set<Conversation>().Add(conversation);
        await _context.SaveChangesAsync();

        return await GetConversationAsync(conversation.Id, userId1) 
            ?? throw new InvalidOperationException("Failed to create conversation");
    }

    public async Task<ConversationDto> CreateGroupConversationAsync(string creatorId, string name, List<string> participantIds)
    {
        // Ensure creator is included
        if (!participantIds.Contains(creatorId))
            participantIds.Insert(0, creatorId);

        var conversation = new Conversation
        {
            Name = name,
            Type = ConversationType.Group,
            CreatedById = creatorId,
            Participants = participantIds.Select((id, index) => new ConversationParticipant
            {
                UserId = id,
                Role = id == creatorId ? ParticipantRole.Owner : ParticipantRole.Member
            }).ToList()
        };

        _context.Set<Conversation>().Add(conversation);
        await _context.SaveChangesAsync();

        // Add system message
        var systemMessage = new ChatMessage
        {
            ConversationId = conversation.Id,
            SenderId = creatorId,
            Type = MessageType.System,
            Content = $"Group '{name}' created"
        };
        _context.Set<ChatMessage>().Add(systemMessage);
        await _context.SaveChangesAsync();

        return await GetConversationAsync(conversation.Id, creatorId)
            ?? throw new InvalidOperationException("Failed to create group conversation");
    }

    public async Task<ConversationDto?> GetConversationAsync(int conversationId, string userId)
    {
        var conversation = await _context.Set<Conversation>()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == conversationId && 
                c.Participants.Any(p => p.UserId == userId && !p.HasLeft));

        if (conversation == null)
            return null;

        var userParticipant = conversation.Participants.First(p => p.UserId == userId);

        return MapToDto(conversation, userParticipant);
    }

    public async Task<List<ConversationDto>> GetUserConversationsAsync(string userId, bool includeArchived = false)
    {
        var query = _context.Set<Conversation>()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .Where(c => c.Participants.Any(p => p.UserId == userId && !p.HasLeft));

        if (!includeArchived)
            query = query.Where(c => !c.IsArchived);

        var conversations = await query
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .ToListAsync();

        return conversations.Select(c =>
        {
            var userParticipant = c.Participants.First(p => p.UserId == userId);
            return MapToDto(c, userParticipant);
        }).ToList();
    }

    public async Task<ConversationDto?> GetDirectConversationAsync(string userId1, string userId2)
    {
        var conversation = await _context.Set<Conversation>()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .Where(c => c.Type == ConversationType.Direct)
            .Where(c => c.Participants.Any(p => p.UserId == userId1) && 
                        c.Participants.Any(p => p.UserId == userId2))
            .FirstOrDefaultAsync();

        if (conversation == null)
            return null;

        var userParticipant = conversation.Participants.First(p => p.UserId == userId1);
        return MapToDto(conversation, userParticipant);
    }

    public async Task ArchiveConversationAsync(int conversationId, string userId)
    {
        var participant = await _context.Set<ConversationParticipant>()
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId);

        if (participant == null)
            throw new InvalidOperationException("Not a participant of this conversation");

        var conversation = await _context.Set<Conversation>().FindAsync(conversationId);
        if (conversation != null)
        {
            conversation.IsArchived = true;
            conversation.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<ConversationDto> UpdateConversationAsync(int conversationId, string userId, UpdateConversationDto dto)
    {
        var conversation = await _context.Set<Conversation>()
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
            throw new InvalidOperationException("Conversation not found");

        var participant = conversation.Participants.FirstOrDefault(p => p.UserId == userId);
        if (participant == null || (conversation.Type == ConversationType.Group && participant.Role == ParticipantRole.Member))
            throw new InvalidOperationException("Not authorized to update this conversation");

        if (dto.Name != null)
            conversation.Name = dto.Name;
        if (dto.AvatarUrl != null)
            conversation.AvatarUrl = dto.AvatarUrl;

        conversation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetConversationAsync(conversationId, userId)
            ?? throw new InvalidOperationException("Failed to update conversation");
    }

    #endregion

    #region Participants

    public async Task AddParticipantsAsync(int conversationId, string addedByUserId, List<string> userIds)
    {
        var conversation = await _context.Set<Conversation>()
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null || conversation.Type == ConversationType.Direct)
            throw new InvalidOperationException("Cannot add participants to this conversation");

        var adder = conversation.Participants.FirstOrDefault(p => p.UserId == addedByUserId);
        if (adder == null || adder.Role == ParticipantRole.Member)
            throw new InvalidOperationException("Not authorized to add participants");

        foreach (var userId in userIds)
        {
            if (conversation.Participants.Any(p => p.UserId == userId && !p.HasLeft))
                continue;

            var existingParticipant = conversation.Participants.FirstOrDefault(p => p.UserId == userId && p.HasLeft);
            if (existingParticipant != null)
            {
                existingParticipant.HasLeft = false;
                existingParticipant.LeftAt = null;
                existingParticipant.JoinedAt = DateTime.UtcNow;
            }
            else
            {
                conversation.Participants.Add(new ConversationParticipant
                {
                    UserId = userId,
                    Role = ParticipantRole.Member
                });
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task RemoveParticipantAsync(int conversationId, string removedByUserId, string userId)
    {
        var conversation = await _context.Set<Conversation>()
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null || conversation.Type == ConversationType.Direct)
            throw new InvalidOperationException("Cannot remove participants from this conversation");

        var remover = conversation.Participants.FirstOrDefault(p => p.UserId == removedByUserId);
        if (remover == null || (remover.Role == ParticipantRole.Member && removedByUserId != userId))
            throw new InvalidOperationException("Not authorized to remove participants");

        var participant = conversation.Participants.FirstOrDefault(p => p.UserId == userId && !p.HasLeft);
        if (participant != null)
        {
            participant.HasLeft = true;
            participant.LeftAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task LeaveConversationAsync(int conversationId, string userId)
    {
        await RemoveParticipantAsync(conversationId, userId, userId);
    }

    public async Task UpdateParticipantSettingsAsync(int conversationId, string userId, UpdateParticipantDto dto)
    {
        var participant = await _context.Set<ConversationParticipant>()
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId);

        if (participant == null)
            throw new InvalidOperationException("Not a participant of this conversation");

        if (dto.IsMuted.HasValue)
            participant.IsMuted = dto.IsMuted.Value;
        if (dto.IsPinned.HasValue)
            participant.IsPinned = dto.IsPinned.Value;
        if (dto.NotificationPreference.HasValue)
            participant.NotificationPreference = dto.NotificationPreference.Value;

        await _context.SaveChangesAsync();
    }

    #endregion

    #region Messages

    public async Task<ChatMessageDto> SendMessageAsync(int conversationId, string senderId, SendMessageDto dto)
    {
        // Verify sender is a participant
        var participant = await _context.Set<ConversationParticipant>()
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == senderId && !p.HasLeft);

        if (participant == null)
            throw new InvalidOperationException("Not a participant of this conversation");

        var message = new ChatMessage
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Content = dto.Content,
            Type = dto.Type,
            ParentMessageId = dto.ParentMessageId
        };

        _context.Set<ChatMessage>().Add(message);

        // Update conversation last message
        var conversation = await _context.Set<Conversation>().FindAsync(conversationId);
        if (conversation != null)
        {
            conversation.LastMessagePreview = dto.Content.Length > 100 ? dto.Content[..100] + "..." : dto.Content;
            conversation.LastMessageAt = DateTime.UtcNow;
            conversation.UpdatedAt = DateTime.UtcNow;
        }

        // Update unread counts for other participants
        var otherParticipants = await _context.Set<ConversationParticipant>()
            .Where(p => p.ConversationId == conversationId && p.UserId != senderId && !p.HasLeft)
            .ToListAsync();

        foreach (var p in otherParticipants)
        {
            p.UnreadCount++;
        }

        await _context.SaveChangesAsync();

        // Load sender info
        var sender = await _context.Users.FindAsync(senderId);

        return new ChatMessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = sender?.FullName ?? "Unknown",
            SenderAvatar = sender?.Avatar,
            Content = message.Content,
            Type = message.Type,
            ParentMessageId = message.ParentMessageId,
            IsEdited = message.IsEdited,
            EditedAt = message.EditedAt,
            IsDeleted = message.IsDeleted,
            Attachments = new List<AttachmentDto>(),
            Reactions = new List<ReactionSummaryDto>(),
            ReplyCount = 0,
            CreatedAt = message.CreatedAt
        };
    }

    public async Task<ChatMessageDto> EditMessageAsync(int messageId, string userId, string newContent)
    {
        var message = await _context.Set<ChatMessage>()
            .Include(m => m.Sender)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
            throw new InvalidOperationException("Message not found");

        if (message.SenderId != userId)
            throw new InvalidOperationException("Cannot edit another user's message");

        message.Content = newContent;
        message.IsEdited = true;
        message.EditedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapMessageToDto(message, userId);
    }

    public async Task DeleteMessageAsync(int messageId, string userId)
    {
        var message = await _context.Set<ChatMessage>().FindAsync(messageId);

        if (message == null)
            throw new InvalidOperationException("Message not found");

        if (message.SenderId != userId)
            throw new InvalidOperationException("Cannot delete another user's message");

        message.IsDeleted = true;
        message.DeletedAt = DateTime.UtcNow;
        message.Content = "This message has been deleted";

        await _context.SaveChangesAsync();
    }

    public async Task<List<ChatMessageDto>> GetMessagesAsync(int conversationId, string userId, int page = 1, int pageSize = 50)
    {
        // Verify user is a participant
        var isParticipant = await _context.Set<ConversationParticipant>()
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId);

        if (!isParticipant)
            throw new InvalidOperationException("Not a participant of this conversation");

        var messages = await _context.Set<ChatMessage>()
            .Include(m => m.Sender)
            .Include(m => m.Attachments)
            .Include(m => m.Reactions)
            .Include(m => m.Replies)
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return messages.Select(m => MapMessageToDto(m, userId)).Reverse().ToList();
    }

    public async Task<List<ChatMessageDto>> GetMessagesSinceAsync(int conversationId, string userId, DateTime since)
    {
        var messages = await _context.Set<ChatMessage>()
            .Include(m => m.Sender)
            .Include(m => m.Attachments)
            .Include(m => m.Reactions)
            .Where(m => m.ConversationId == conversationId && m.CreatedAt > since)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return messages.Select(m => MapMessageToDto(m, userId)).ToList();
    }

    public async Task<List<ChatMessageDto>> SearchMessagesAsync(string userId, string query, int? conversationId = null)
    {
        var userConversationIds = await _context.Set<ConversationParticipant>()
            .Where(p => p.UserId == userId && !p.HasLeft)
            .Select(p => p.ConversationId)
            .ToListAsync();

        var messagesQuery = _context.Set<ChatMessage>()
            .Include(m => m.Sender)
            .Where(m => userConversationIds.Contains(m.ConversationId))
            .Where(m => !m.IsDeleted)
            .Where(m => EF.Functions.Like(m.Content, $"%{query}%"));

        if (conversationId.HasValue)
            messagesQuery = messagesQuery.Where(m => m.ConversationId == conversationId.Value);

        var messages = await messagesQuery
            .OrderByDescending(m => m.CreatedAt)
            .Take(50)
            .ToListAsync();

        return messages.Select(m => MapMessageToDto(m, userId)).ToList();
    }

    #endregion

    #region Read Receipts

    public async Task MarkAsReadAsync(int conversationId, string userId, int? upToMessageId = null)
    {
        var participant = await _context.Set<ConversationParticipant>()
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId);

        if (participant == null)
            return;

        participant.LastReadAt = DateTime.UtcNow;
        participant.UnreadCount = 0;

        // Add read receipts for messages
        if (upToMessageId.HasValue)
        {
            var unreadMessageIds = await _context.Set<ChatMessage>()
                .Where(m => m.ConversationId == conversationId && m.Id <= upToMessageId.Value && m.SenderId != userId)
                .Where(m => !m.ReadReceipts.Any(r => r.UserId == userId))
                .Select(m => m.Id)
                .ToListAsync();

            foreach (var messageId in unreadMessageIds)
            {
                _context.Set<MessageReadReceipt>().Add(new MessageReadReceipt
                {
                    MessageId = messageId,
                    UserId = userId
                });
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task<Dictionary<int, List<ReadReceiptDto>>> GetReadReceiptsAsync(int conversationId, List<int> messageIds)
    {
        var receipts = await _context.Set<MessageReadReceipt>()
            .Include(r => r.User)
            .Where(r => messageIds.Contains(r.MessageId))
            .ToListAsync();

        return receipts
            .GroupBy(r => r.MessageId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(r => new ReadReceiptDto
                {
                    UserId = r.UserId,
                    UserName = r.User.FullName,
                    ReadAt = r.ReadAt
                }).ToList()
            );
    }

    #endregion

    #region Reactions

    public async Task<MessageReactionDto> AddReactionAsync(int messageId, string userId, string emoji)
    {
        // Check if reaction already exists
        var existing = await _context.Set<MessageReaction>()
            .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji);

        if (existing != null)
        {
            var user = await _context.Users.FindAsync(userId);
            return new MessageReactionDto
            {
                MessageId = messageId,
                UserId = userId,
                UserName = user?.FullName ?? "Unknown",
                Emoji = emoji
            };
        }

        var reaction = new MessageReaction
        {
            MessageId = messageId,
            UserId = userId,
            Emoji = emoji
        };

        _context.Set<MessageReaction>().Add(reaction);
        await _context.SaveChangesAsync();

        var reactionUser = await _context.Users.FindAsync(userId);
        return new MessageReactionDto
        {
            MessageId = messageId,
            UserId = userId,
            UserName = reactionUser?.FullName ?? "Unknown",
            Emoji = emoji
        };
    }

    public async Task RemoveReactionAsync(int messageId, string userId, string emoji)
    {
        var reaction = await _context.Set<MessageReaction>()
            .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji);

        if (reaction != null)
        {
            _context.Set<MessageReaction>().Remove(reaction);
            await _context.SaveChangesAsync();
        }
    }

    #endregion

    #region Attachments

    public async Task<MessageAttachmentDto> UploadAttachmentAsync(int conversationId, string userId, Stream fileStream, string fileName, string contentType)
    {
        // Verify user is a participant
        var isParticipant = await _context.Set<ConversationParticipant>()
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId);

        if (!isParticipant)
            throw new InvalidOperationException("Not a participant of this conversation");

        // Save file to disk
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "chat", conversationId.ToString());
        Directory.CreateDirectory(uploadsPath);

        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(uploadsPath, uniqueFileName);

        using (var stream = File.Create(filePath))
        {
            await fileStream.CopyToAsync(stream);
        }

        var fileInfo = new FileInfo(filePath);
        var relativePath = $"/uploads/chat/{conversationId}/{uniqueFileName}";

        // We'll create a temporary attachment that will be linked to a message later
        // For now, return the info needed
        return new MessageAttachmentDto
        {
            Id = 0, // Will be assigned when linked to message
            FileName = fileName,
            FilePath = relativePath,
            ContentType = contentType,
            FileSize = fileInfo.Length
        };
    }

    #endregion

    #region Chat to Ticket

    public async Task<int> ConvertToTicketAsync(int conversationId, string userId, ConvertToTicketDto dto)
    {
        var conversation = await _context.Set<Conversation>()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
            throw new InvalidOperationException("Conversation not found");

        if (!conversation.Participants.Any(p => p.UserId == userId && !p.HasLeft))
            throw new InvalidOperationException("Not a participant of this conversation");

        // Get messages to include
        IQueryable<ChatMessage> messagesQuery = _context.Set<ChatMessage>()
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted);

        if (dto.MessageIds != null && dto.MessageIds.Any())
        {
            messagesQuery = messagesQuery.Where(m => dto.MessageIds.Contains(m.Id));
        }

        var messages = await messagesQuery.OrderBy(m => m.CreatedAt).ToListAsync();

        // Build ticket description from messages
        var description = dto.Description ?? "";
        if (messages.Any())
        {
            description += "\n\n--- Chat History ---\n";
            foreach (var msg in messages)
            {
                description += $"\n[{msg.CreatedAt:yyyy-MM-dd HH:mm}] {msg.Sender.FullName}: {msg.Content}";
            }
        }

        // Create ticket entity
        var ticket = new ERPTraining.Core.Entities.Ticketing.Ticket
        {
            Title = dto.Title,
            Description = description,
            Status = 1, // New
            Priority = ERPTraining.Core.Entities.Ticketing.TicketPriority.Medium,
            Category = ERPTraining.Core.Entities.Ticketing.TicketCategory.General,
            CreatedByUserId = userId
        };

        // Create ticket using the ticket service
        var createdTicket = await _ticketService.CreateTicketAsync(ticket);

        // Link conversation to ticket (store as int, using PublicId if available)
        conversation.LinkedTicketId = createdTicket.PublicId ?? 0;
        conversation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Add system message
        var systemMessage = new ChatMessage
        {
            ConversationId = conversationId,
            SenderId = userId,
            Type = MessageType.TicketLink,
            Content = $"Ticket #{createdTicket.PublicId} created: {dto.Title}"
        };
        _context.Set<ChatMessage>().Add(systemMessage);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Conversation {ConversationId} converted to ticket {TicketId} by user {UserId}", 
            conversationId, createdTicket.PublicId, userId);

        return createdTicket.PublicId ?? 0;
    }

    #endregion

    #region Helpers

    private ConversationDto MapToDto(Conversation conversation, ConversationParticipant userParticipant)
    {
        return new ConversationDto
        {
            Id = conversation.Id,
            Name = conversation.Type == ConversationType.Direct 
                ? conversation.Participants.FirstOrDefault(p => p.UserId != userParticipant.UserId)?.User?.FullName
                : conversation.Name,
            Type = conversation.Type,
            AvatarUrl = conversation.Type == ConversationType.Direct
                ? conversation.Participants.FirstOrDefault(p => p.UserId != userParticipant.UserId)?.User?.Avatar
                : conversation.AvatarUrl,
            LastMessagePreview = conversation.LastMessagePreview,
            LastMessageAt = conversation.LastMessageAt,
            IsArchived = conversation.IsArchived,
            LinkedTicketId = conversation.LinkedTicketId,
            UnreadCount = userParticipant.UnreadCount,
            IsPinned = userParticipant.IsPinned,
            IsMuted = userParticipant.IsMuted,
            Participants = conversation.Participants
                .Where(p => !p.HasLeft)
                .Select(p => new ParticipantDto
                {
                    UserId = p.UserId,
                    UserName = p.User?.FullName ?? "Unknown",
                    AvatarUrl = p.User?.Avatar,
                    Role = p.Role,
                    IsOnline = false, // Will be updated by presence service
                    LastActiveAt = null
                }).ToList(),
            CreatedAt = conversation.CreatedAt
        };
    }

    private ChatMessageDto MapMessageToDto(ChatMessage message, string currentUserId)
    {
        return new ChatMessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = message.Sender?.FullName ?? "Unknown",
            SenderAvatar = message.Sender?.Avatar,
            Content = message.Content,
            Type = message.Type,
            ParentMessageId = message.ParentMessageId,
            IsEdited = message.IsEdited,
            EditedAt = message.EditedAt,
            IsDeleted = message.IsDeleted,
            Attachments = message.Attachments?.Select(a => new AttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FilePath = a.FilePath,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                ThumbnailPath = a.ThumbnailPath,
                Width = a.Width,
                Height = a.Height
            }).ToList() ?? new List<AttachmentDto>(),
            Reactions = message.Reactions?
                .GroupBy(r => r.Emoji)
                .Select(g => new ReactionSummaryDto
                {
                    Emoji = g.Key,
                    Count = g.Count(),
                    UserIds = g.Select(r => r.UserId).ToList(),
                    HasReacted = g.Any(r => r.UserId == currentUserId)
                }).ToList() ?? new List<ReactionSummaryDto>(),
            ReplyCount = message.Replies?.Count ?? 0,
            CreatedAt = message.CreatedAt
        };
    }

    #endregion
}
