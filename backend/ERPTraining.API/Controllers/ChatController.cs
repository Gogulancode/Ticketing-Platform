using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ERPTraining.Core.Interfaces.Chat;
using ERPTraining.Core.Entities.Chat;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IPresenceService _presenceService;
    private readonly ICannedResponseService _cannedResponseService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        IChatService chatService,
        IPresenceService presenceService,
        ICannedResponseService cannedResponseService,
        ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _presenceService = presenceService;
        _cannedResponseService = cannedResponseService;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
        ?? throw new UnauthorizedAccessException("User not authenticated");

    #region Conversations

    /// <summary>
    /// Get all conversations for the current user
    /// </summary>
    [HttpGet("conversations")]
    public async Task<ActionResult<List<ConversationDto>>> GetConversations([FromQuery] bool includeArchived = false)
    {
        var userId = GetUserId();
        var conversations = await _chatService.GetUserConversationsAsync(userId, includeArchived);
        return Ok(conversations);
    }

    /// <summary>
    /// Get a specific conversation
    /// </summary>
    [HttpGet("conversations/{id}")]
    public async Task<ActionResult<ConversationDto>> GetConversation(int id)
    {
        var userId = GetUserId();
        var conversation = await _chatService.GetConversationAsync(id, userId);
        if (conversation == null)
            return NotFound();
        return Ok(conversation);
    }

    /// <summary>
    /// Start or get an existing direct conversation with another user
    /// </summary>
    [HttpPost("conversations/direct")]
    public async Task<ActionResult<ConversationDto>> CreateDirectConversation([FromBody] CreateDirectConversationRequest request)
    {
        var userId = GetUserId();
        
        // Check if conversation already exists
        var existing = await _chatService.GetDirectConversationAsync(userId, request.OtherUserId);
        if (existing != null)
            return Ok(existing);

        var conversation = await _chatService.CreateDirectConversationAsync(userId, request.OtherUserId);
        return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id }, conversation);
    }

    /// <summary>
    /// Create a group conversation
    /// </summary>
    [HttpPost("conversations/group")]
    public async Task<ActionResult<ConversationDto>> CreateGroupConversation([FromBody] CreateGroupConversationRequest request)
    {
        var userId = GetUserId();
        var conversation = await _chatService.CreateGroupConversationAsync(userId, request.Name, request.ParticipantIds);
        return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id }, conversation);
    }

    /// <summary>
    /// Update a conversation (name, avatar)
    /// </summary>
    [HttpPut("conversations/{id}")]
    public async Task<ActionResult<ConversationDto>> UpdateConversation(int id, [FromBody] UpdateConversationDto dto)
    {
        var userId = GetUserId();
        var conversation = await _chatService.UpdateConversationAsync(id, userId, dto);
        return Ok(conversation);
    }

    /// <summary>
    /// Archive a conversation
    /// </summary>
    [HttpPost("conversations/{id}/archive")]
    public async Task<IActionResult> ArchiveConversation(int id)
    {
        var userId = GetUserId();
        await _chatService.ArchiveConversationAsync(id, userId);
        return NoContent();
    }

    #endregion

    #region Participants

    /// <summary>
    /// Add participants to a group conversation
    /// </summary>
    [HttpPost("conversations/{id}/participants")]
    public async Task<IActionResult> AddParticipants(int id, [FromBody] AddParticipantsRequest request)
    {
        var userId = GetUserId();
        await _chatService.AddParticipantsAsync(id, userId, request.UserIds);
        return NoContent();
    }

    /// <summary>
    /// Remove a participant from a group conversation
    /// </summary>
    [HttpDelete("conversations/{id}/participants/{participantId}")]
    public async Task<IActionResult> RemoveParticipant(int id, string participantId)
    {
        var userId = GetUserId();
        await _chatService.RemoveParticipantAsync(id, userId, participantId);
        return NoContent();
    }

    /// <summary>
    /// Leave a group conversation
    /// </summary>
    [HttpPost("conversations/{id}/leave")]
    public async Task<IActionResult> LeaveConversation(int id)
    {
        var userId = GetUserId();
        await _chatService.LeaveConversationAsync(id, userId);
        return NoContent();
    }

    /// <summary>
    /// Update participant settings (mute, pin, notifications)
    /// </summary>
    [HttpPut("conversations/{id}/settings")]
    public async Task<IActionResult> UpdateParticipantSettings(int id, [FromBody] UpdateParticipantDto dto)
    {
        var userId = GetUserId();
        await _chatService.UpdateParticipantSettingsAsync(id, userId, dto);
        return NoContent();
    }

    #endregion

    #region Messages

    /// <summary>
    /// Get messages for a conversation
    /// </summary>
    [HttpGet("conversations/{id}/messages")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetMessages(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var userId = GetUserId();
        var messages = await _chatService.GetMessagesAsync(id, userId, page, pageSize);
        return Ok(messages);
    }

    /// <summary>
    /// Get messages since a timestamp (for syncing)
    /// </summary>
    [HttpGet("conversations/{id}/messages/since")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetMessagesSince(int id, [FromQuery] DateTime since)
    {
        var userId = GetUserId();
        var messages = await _chatService.GetMessagesSinceAsync(id, userId, since);
        return Ok(messages);
    }

    /// <summary>
    /// Search messages
    /// </summary>
    [HttpGet("messages/search")]
    public async Task<ActionResult<List<ChatMessageDto>>> SearchMessages([FromQuery] string query, [FromQuery] int? conversationId = null)
    {
        var userId = GetUserId();
        var messages = await _chatService.SearchMessagesAsync(userId, query, conversationId);
        return Ok(messages);
    }

    /// <summary>
    /// Send a message (alternative to SignalR for fallback)
    /// </summary>
    [HttpPost("conversations/{id}/messages")]
    public async Task<ActionResult<ChatMessageDto>> SendMessage(int id, [FromBody] SendMessageDto dto)
    {
        var userId = GetUserId();
        var message = await _chatService.SendMessageAsync(id, userId, dto);
        return CreatedAtAction(nameof(GetMessages), new { id = id }, message);
    }

    /// <summary>
    /// Edit a message
    /// </summary>
    [HttpPut("messages/{id}")]
    public async Task<ActionResult<ChatMessageDto>> EditMessage(int id, [FromBody] EditMessageRequest request)
    {
        var userId = GetUserId();
        var message = await _chatService.EditMessageAsync(id, userId, request.Content);
        return Ok(message);
    }

    /// <summary>
    /// Delete a message
    /// </summary>
    [HttpDelete("messages/{id}")]
    public async Task<IActionResult> DeleteMessage(int id)
    {
        var userId = GetUserId();
        await _chatService.DeleteMessageAsync(id, userId);
        return NoContent();
    }

    /// <summary>
    /// Mark conversation as read
    /// </summary>
    [HttpPost("conversations/{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id, [FromBody] MarkAsReadRequest? request = null)
    {
        var userId = GetUserId();
        await _chatService.MarkAsReadAsync(id, userId, request?.UpToMessageId);
        return NoContent();
    }

    #endregion

    #region Reactions

    /// <summary>
    /// Add a reaction to a message
    /// </summary>
    [HttpPost("messages/{id}/reactions")]
    public async Task<ActionResult<MessageReactionDto>> AddReaction(int id, [FromBody] AddReactionRequest request)
    {
        var userId = GetUserId();
        var reaction = await _chatService.AddReactionAsync(id, userId, request.Emoji);
        return Ok(reaction);
    }

    /// <summary>
    /// Remove a reaction from a message
    /// </summary>
    [HttpDelete("messages/{id}/reactions/{emoji}")]
    public async Task<IActionResult> RemoveReaction(int id, string emoji)
    {
        var userId = GetUserId();
        await _chatService.RemoveReactionAsync(id, userId, emoji);
        return NoContent();
    }

    #endregion

    #region File Upload

    /// <summary>
    /// Upload a file attachment
    /// </summary>
    [HttpPost("conversations/{id}/attachments")]
    public async Task<ActionResult<MessageAttachmentDto>> UploadAttachment(int id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        var userId = GetUserId();
        using var stream = file.OpenReadStream();
        var attachment = await _chatService.UploadAttachmentAsync(id, userId, stream, file.FileName, file.ContentType);
        return Ok(attachment);
    }

    #endregion

    #region Chat to Ticket

    /// <summary>
    /// Convert a conversation to a ticket
    /// </summary>
    [HttpPost("conversations/{id}/convert-to-ticket")]
    public async Task<ActionResult<ConvertToTicketResult>> ConvertToTicket(int id, [FromBody] ConvertToTicketDto dto)
    {
        var userId = GetUserId();
        var ticketId = await _chatService.ConvertToTicketAsync(id, userId, dto);
        return Ok(new ConvertToTicketResult { TicketId = ticketId });
    }

    #endregion

    #region Presence

    /// <summary>
    /// Get online users
    /// </summary>
    [HttpGet("presence")]
    public async Task<ActionResult<List<UserPresenceDto>>> GetOnlineUsers()
    {
        var users = await _presenceService.GetOnlineUsersAsync();
        return Ok(users);
    }

    /// <summary>
    /// Get presence for specific users
    /// </summary>
    [HttpPost("presence/bulk")]
    public async Task<ActionResult<List<UserPresenceDto>>> GetPresences([FromBody] List<string> userIds)
    {
        var presences = await _presenceService.GetPresencesAsync(userIds);
        return Ok(presences);
    }

    #endregion

    #region Canned Responses

    /// <summary>
    /// Get user's canned responses
    /// </summary>
    [HttpGet("canned-responses")]
    public async Task<ActionResult<List<CannedResponseDto>>> GetCannedResponses([FromQuery] string? category = null)
    {
        var userId = GetUserId();
        var personal = await _cannedResponseService.GetUserResponsesAsync(userId, category);
        var shared = await _cannedResponseService.GetSharedResponsesAsync(category);
        return Ok(personal.Concat(shared).ToList());
    }

    /// <summary>
    /// Create a canned response
    /// </summary>
    [HttpPost("canned-responses")]
    public async Task<ActionResult<CannedResponseDto>> CreateCannedResponse([FromBody] CreateCannedResponseDto dto)
    {
        var userId = GetUserId();
        var response = await _cannedResponseService.CreateAsync(userId, dto);
        return CreatedAtAction(nameof(GetCannedResponses), response);
    }

    /// <summary>
    /// Update a canned response
    /// </summary>
    [HttpPut("canned-responses/{id}")]
    public async Task<ActionResult<CannedResponseDto>> UpdateCannedResponse(int id, [FromBody] CreateCannedResponseDto dto)
    {
        var userId = GetUserId();
        var response = await _cannedResponseService.UpdateAsync(id, userId, dto);
        return Ok(response);
    }

    /// <summary>
    /// Delete a canned response
    /// </summary>
    [HttpDelete("canned-responses/{id}")]
    public async Task<IActionResult> DeleteCannedResponse(int id)
    {
        var userId = GetUserId();
        await _cannedResponseService.DeleteAsync(id, userId);
        return NoContent();
    }

    /// <summary>
    /// Search canned responses
    /// </summary>
    [HttpGet("canned-responses/search")]
    public async Task<ActionResult<List<CannedResponseDto>>> SearchCannedResponses([FromQuery] string query)
    {
        var userId = GetUserId();
        var responses = await _cannedResponseService.SearchResponsesAsync(userId, query);
        return Ok(responses);
    }

    #endregion

    #region Users

    /// <summary>
    /// Get users available to chat with
    /// </summary>
    [HttpGet("users")]
    public async Task<ActionResult<List<ChatUserDto>>> GetChatUsers([FromQuery] string? search = null)
    {
        // This would typically come from a user service
        // For now, return from presence service
        var onlineUsers = await _presenceService.GetOnlineUsersAsync();
        
        var users = onlineUsers.Select(u => new ChatUserDto
        {
            Id = u.UserId,
            Name = u.UserName,
            AvatarUrl = u.AvatarUrl,
            IsOnline = u.IsOnline,
            Status = u.Status,
            StatusMessage = u.StatusMessage
        }).ToList();

        if (!string.IsNullOrEmpty(search))
        {
            users = users.Where(u => u.Name.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        return Ok(users);
    }

    #endregion
}

// Request DTOs
public record CreateDirectConversationRequest
{
    public string OtherUserId { get; init; } = null!;
}

public record CreateGroupConversationRequest
{
    public string Name { get; init; } = null!;
    public List<string> ParticipantIds { get; init; } = new();
}

public record AddParticipantsRequest
{
    public List<string> UserIds { get; init; } = new();
}

public record EditMessageRequest
{
    public string Content { get; init; } = null!;
}

public record MarkAsReadRequest
{
    public int? UpToMessageId { get; init; }
}

public record AddReactionRequest
{
    public string Emoji { get; init; } = null!;
}

public record ConvertToTicketResult
{
    public int TicketId { get; init; }
}

public record ChatUserDto
{
    public string Id { get; init; } = null!;
    public string Name { get; init; } = null!;
    public string? AvatarUrl { get; init; }
    public bool IsOnline { get; init; }
    public PresenceStatus Status { get; init; }
    public string? StatusMessage { get; init; }
}
