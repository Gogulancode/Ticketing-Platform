using ERPTraining.Core.DTOs.Ticketing;

namespace ERPTraining.Core.Interfaces.Ticketing;

/// <summary>
/// Service interface for enhanced ticket features
/// </summary>
public interface ITicketEnhancementService
{
    // Watchers
    Task<List<TicketWatcherDto>> GetWatchersAsync(Guid ticketId);
    Task<TicketWatcherDto?> AddWatcherAsync(Guid ticketId, AddWatcherDto dto, string addedByUserId);
    Task<bool> RemoveWatcherAsync(Guid ticketId, string userId);
    Task<TicketWatcherDto?> UpdateWatcherPreferencesAsync(Guid ticketId, string userId, UpdateWatcherPreferencesDto dto);
    Task<bool> IsWatchingAsync(Guid ticketId, string userId);
    Task<List<string>> GetWatcherUserIdsForNotificationAsync(Guid ticketId, string notificationType);

    // Templates
    Task<List<TicketTemplateDto>> GetTemplatesAsync(bool includeInactive = false, bool publicOnly = false);
    Task<TicketTemplateDto?> GetTemplateByIdAsync(int templateId);
    Task<TicketTemplateDto> CreateTemplateAsync(CreateTicketTemplateDto dto, string userId);
    Task<TicketTemplateDto?> UpdateTemplateAsync(int templateId, UpdateTicketTemplateDto dto);
    Task<bool> DeleteTemplateAsync(int templateId);

    // Time Tracking
    Task<List<TicketTimeEntryDto>> GetTimeEntriesAsync(Guid ticketId);
    Task<TicketTimeSummaryDto> GetTimeSummaryAsync(Guid ticketId);
    Task<TicketTimeEntryDto> CreateTimeEntryAsync(Guid ticketId, CreateTimeEntryDto dto, string userId);
    Task<TicketTimeEntryDto?> UpdateTimeEntryAsync(int entryId, UpdateTimeEntryDto dto, string userId);
    Task<bool> DeleteTimeEntryAsync(int entryId, string userId);

    // Satisfaction Rating
    Task<TicketSatisfactionDto?> GetSatisfactionAsync(Guid ticketId);
    Task<TicketSatisfactionDto> CreateSatisfactionAsync(Guid ticketId, CreateSatisfactionRatingDto dto, string userId);
    Task<SatisfactionSummaryDto> GetSatisfactionSummaryAsync(DateTime? startDate = null, DateTime? endDate = null, int? branchId = null);

    // Related Tickets
    Task<List<TicketRelationDto>> GetRelatedTicketsAsync(Guid ticketId);
    Task<TicketRelationDto> CreateRelationAsync(Guid ticketId, CreateTicketRelationDto dto, string userId);
    Task<bool> DeleteRelationAsync(int relationId);

    // Canned Responses
    Task<List<CannedResponseDto>> GetCannedResponsesAsync(string? userId = null, int? categoryId = null);
    Task<CannedResponseDto?> GetCannedResponseByIdAsync(int responseId);
    Task<CannedResponseDto?> GetCannedResponseByShortCodeAsync(string shortCode, string? userId = null);
    Task<CannedResponseDto> CreateCannedResponseAsync(CreateCannedResponseDto dto, string userId);
    Task<CannedResponseDto?> UpdateCannedResponseAsync(int responseId, UpdateCannedResponseDto dto, string userId);
    Task<bool> DeleteCannedResponseAsync(int responseId, string userId);
    Task IncrementCannedResponseUsageAsync(int responseId);
}
