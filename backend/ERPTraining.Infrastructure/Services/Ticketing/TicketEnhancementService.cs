using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class TicketEnhancementService : ITicketEnhancementService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TicketEnhancementService> _logger;

    public TicketEnhancementService(ApplicationDbContext context, ILogger<TicketEnhancementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Helper method to format minutes as "Xh Ym"
    private static string FormatMinutes(int minutes)
    {
        if (minutes < 60) return $"{minutes}m";
        var hours = minutes / 60;
        var mins = minutes % 60;
        return mins > 0 ? $"{hours}h {mins}m" : $"{hours}h";
    }

    // Helper method to get satisfaction level from rating
    private static string GetSatisfactionLevel(int rating) => rating switch
    {
        5 => "Very Satisfied",
        4 => "Satisfied",
        3 => "Neutral",
        2 => "Dissatisfied",
        1 => "Very Dissatisfied",
        _ => "Unknown"
    };

    #region Watchers

    public async Task<List<TicketWatcherDto>> GetWatchersAsync(Guid ticketId)
    {
        return await _context.TicketWatchers
            .Where(w => w.TicketId == ticketId)
            .Include(w => w.User)
            .Select(w => new TicketWatcherDto
            {
                Id = w.Id,
                TicketId = w.TicketId,
                UserId = w.UserId,
                UserName = w.User != null ? $"{w.User.FirstName} {w.User.LastName}".Trim() : "",
                UserEmail = w.User != null ? w.User.Email ?? "" : "",
                NotifyOnComment = w.NotifyOnComment,
                NotifyOnStatusChange = w.NotifyOnStatusChange,
                NotifyOnAssignment = w.NotifyOnAssignment,
                NotifyOnResolution = w.NotifyOnResolution,
                CreatedAt = w.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<TicketWatcherDto?> AddWatcherAsync(Guid ticketId, AddWatcherDto dto, string addedByUserId)
    {
        // Check if already watching
        var existing = await _context.TicketWatchers
            .FirstOrDefaultAsync(w => w.TicketId == ticketId && w.UserId == dto.UserId);
        
        if (existing != null)
        {
            return await UpdateWatcherPreferencesAsync(ticketId, dto.UserId, new UpdateWatcherPreferencesDto
            {
                NotifyOnComment = dto.NotifyOnComment,
                NotifyOnStatusChange = dto.NotifyOnStatusChange,
                NotifyOnAssignment = dto.NotifyOnAssignment,
                NotifyOnResolution = dto.NotifyOnResolution
            });
        }

        var watcher = new TicketWatcher
        {
            TicketId = ticketId,
            UserId = dto.UserId,
            NotifyOnComment = dto.NotifyOnComment,
            NotifyOnStatusChange = dto.NotifyOnStatusChange,
            NotifyOnAssignment = dto.NotifyOnAssignment,
            NotifyOnResolution = dto.NotifyOnResolution,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketWatchers.Add(watcher);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(dto.UserId);
        return new TicketWatcherDto
        {
            Id = watcher.Id,
            TicketId = watcher.TicketId,
            UserId = watcher.UserId,
            UserName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "",
            UserEmail = user?.Email ?? "",
            NotifyOnComment = watcher.NotifyOnComment,
            NotifyOnStatusChange = watcher.NotifyOnStatusChange,
            NotifyOnAssignment = watcher.NotifyOnAssignment,
            NotifyOnResolution = watcher.NotifyOnResolution,
            CreatedAt = watcher.CreatedAt
        };
    }

    public async Task<bool> RemoveWatcherAsync(Guid ticketId, string userId)
    {
        var watcher = await _context.TicketWatchers
            .FirstOrDefaultAsync(w => w.TicketId == ticketId && w.UserId == userId);
        
        if (watcher == null) return false;

        _context.TicketWatchers.Remove(watcher);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<TicketWatcherDto?> UpdateWatcherPreferencesAsync(Guid ticketId, string userId, UpdateWatcherPreferencesDto dto)
    {
        var watcher = await _context.TicketWatchers
            .Include(w => w.User)
            .FirstOrDefaultAsync(w => w.TicketId == ticketId && w.UserId == userId);
        
        if (watcher == null) return null;

        watcher.NotifyOnComment = dto.NotifyOnComment;
        watcher.NotifyOnStatusChange = dto.NotifyOnStatusChange;
        watcher.NotifyOnAssignment = dto.NotifyOnAssignment;
        watcher.NotifyOnResolution = dto.NotifyOnResolution;

        await _context.SaveChangesAsync();

        return new TicketWatcherDto
        {
            Id = watcher.Id,
            TicketId = watcher.TicketId,
            UserId = watcher.UserId,
            UserName = watcher.User != null ? $"{watcher.User.FirstName} {watcher.User.LastName}".Trim() : "",
            UserEmail = watcher.User?.Email ?? "",
            NotifyOnComment = watcher.NotifyOnComment,
            NotifyOnStatusChange = watcher.NotifyOnStatusChange,
            NotifyOnAssignment = watcher.NotifyOnAssignment,
            NotifyOnResolution = watcher.NotifyOnResolution,
            CreatedAt = watcher.CreatedAt
        };
    }

    public async Task<bool> IsWatchingAsync(Guid ticketId, string userId)
    {
        return await _context.TicketWatchers
            .AnyAsync(w => w.TicketId == ticketId && w.UserId == userId);
    }

    public async Task<List<string>> GetWatcherUserIdsForNotificationAsync(Guid ticketId, string notificationType)
    {
        var query = _context.TicketWatchers.Where(w => w.TicketId == ticketId);

        query = notificationType.ToLower() switch
        {
            "comment" => query.Where(w => w.NotifyOnComment),
            "status" => query.Where(w => w.NotifyOnStatusChange),
            "assignment" => query.Where(w => w.NotifyOnAssignment),
            "resolution" => query.Where(w => w.NotifyOnResolution),
            _ => query
        };

        return await query.Select(w => w.UserId).ToListAsync();
    }

    #endregion

    #region Templates

    public async Task<List<TicketTemplateDto>> GetTemplatesAsync(bool includeInactive = false, bool publicOnly = false)
    {
        var query = _context.TicketTemplates.AsQueryable();

        if (!includeInactive)
            query = query.Where(t => t.IsActive);

        if (publicOnly)
            query = query.Where(t => t.IsPublic);

        return await query
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.Name)
            .Include(t => t.CreatedByUser)
            .Select(t => new TicketTemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                TitleTemplate = t.TitleTemplate,
                BodyTemplate = t.BodyTemplate,
                CategoryId = t.CategoryId,
                SubcategoryId = t.SubcategoryId,
                DefaultPriority = t.DefaultPriority.ToString(),
                DefaultAssigneeId = t.DefaultAssigneeId,
                DefaultGroupId = t.DefaultGroupId,
                IsActive = t.IsActive,
                IsPublic = t.IsPublic,
                SortOrder = t.SortOrder,
                CreatedByUserId = t.CreatedByUserId,
                CreatedByUserName = t.CreatedByUser != null ? $"{t.CreatedByUser.FirstName} {t.CreatedByUser.LastName}".Trim() : "",
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<TicketTemplateDto?> GetTemplateByIdAsync(int templateId)
    {
        return await _context.TicketTemplates
            .Where(t => t.Id == templateId)
            .Include(t => t.CreatedByUser)
            .Select(t => new TicketTemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                TitleTemplate = t.TitleTemplate,
                BodyTemplate = t.BodyTemplate,
                CategoryId = t.CategoryId,
                SubcategoryId = t.SubcategoryId,
                DefaultPriority = t.DefaultPriority.ToString(),
                DefaultAssigneeId = t.DefaultAssigneeId,
                DefaultGroupId = t.DefaultGroupId,
                IsActive = t.IsActive,
                IsPublic = t.IsPublic,
                SortOrder = t.SortOrder,
                CreatedByUserId = t.CreatedByUserId,
                CreatedByUserName = t.CreatedByUser != null ? $"{t.CreatedByUser.FirstName} {t.CreatedByUser.LastName}".Trim() : "",
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TicketTemplateDto> CreateTemplateAsync(CreateTicketTemplateDto dto, string userId)
    {
        var template = new TicketTemplate
        {
            Name = dto.Name,
            Description = dto.Description,
            TitleTemplate = dto.TitleTemplate,
            BodyTemplate = dto.BodyTemplate,
            CategoryId = dto.CategoryId,
            SubcategoryId = dto.SubcategoryId,
            DefaultPriority = Enum.TryParse<TicketPriority>(dto.DefaultPriority, true, out var priority) ? priority : TicketPriority.Medium,
            DefaultAssigneeId = dto.DefaultAssigneeId,
            DefaultGroupId = dto.DefaultGroupId,
            IsActive = true,
            IsPublic = dto.IsPublic,
            SortOrder = dto.SortOrder,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TicketTemplates.Add(template);
        await _context.SaveChangesAsync();

        return (await GetTemplateByIdAsync(template.Id))!;
    }

    public async Task<TicketTemplateDto?> UpdateTemplateAsync(int templateId, UpdateTicketTemplateDto dto)
    {
        var template = await _context.TicketTemplates.FindAsync(templateId);
        if (template == null) return null;

        template.Name = dto.Name;
        template.Description = dto.Description;
        template.TitleTemplate = dto.TitleTemplate;
        template.BodyTemplate = dto.BodyTemplate;
        template.CategoryId = dto.CategoryId;
        template.SubcategoryId = dto.SubcategoryId;
        template.DefaultPriority = Enum.TryParse<TicketPriority>(dto.DefaultPriority, true, out var priority) ? priority : TicketPriority.Medium;
        template.DefaultAssigneeId = dto.DefaultAssigneeId;
        template.DefaultGroupId = dto.DefaultGroupId;
        template.IsActive = dto.IsActive;
        template.IsPublic = dto.IsPublic;
        template.SortOrder = dto.SortOrder;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetTemplateByIdAsync(templateId);
    }

    public async Task<bool> DeleteTemplateAsync(int templateId)
    {
        var template = await _context.TicketTemplates.FindAsync(templateId);
        if (template == null) return false;

        _context.TicketTemplates.Remove(template);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Time Tracking

    public async Task<List<TicketTimeEntryDto>> GetTimeEntriesAsync(Guid ticketId)
    {
        return await _context.TicketTimeEntries
            .Where(e => e.TicketId == ticketId)
            .Include(e => e.User)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new TicketTimeEntryDto
            {
                Id = e.Id,
                TicketId = e.TicketId,
                UserId = e.UserId,
                UserName = e.User != null ? $"{e.User.FirstName} {e.User.LastName}".Trim() : "",
                MinutesSpent = e.MinutesSpent,
                FormattedTime = FormatMinutes(e.MinutesSpent),
                Description = e.Description,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                IsBillable = e.IsBillable,
                TimeEntryType = e.TimeEntryType,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<TicketTimeSummaryDto> GetTimeSummaryAsync(Guid ticketId)
    {
        var entries = await _context.TicketTimeEntries
            .Where(e => e.TicketId == ticketId)
            .Include(e => e.User)
            .ToListAsync();

        var totalMinutes = entries.Sum(e => e.MinutesSpent);
        var billableMinutes = entries.Where(e => e.IsBillable).Sum(e => e.MinutesSpent);

        var byUser = entries
            .GroupBy(e => new { e.UserId, UserName = e.User != null ? $"{e.User.FirstName} {e.User.LastName}".Trim() : "" })
            .Select(g => new UserTimeSummaryDto
            {
                UserId = g.Key.UserId,
                UserName = g.Key.UserName,
                TotalMinutes = g.Sum(e => e.MinutesSpent),
                FormattedTime = FormatMinutes(g.Sum(e => e.MinutesSpent))
            })
            .ToList();

        return new TicketTimeSummaryDto
        {
            TicketId = ticketId,
            TotalMinutes = totalMinutes,
            FormattedTotalTime = FormatMinutes(totalMinutes),
            BillableMinutes = billableMinutes,
            FormattedBillableTime = FormatMinutes(billableMinutes),
            EntryCount = entries.Count,
            ByUser = byUser
        };
    }

    public async Task<TicketTimeEntryDto> CreateTimeEntryAsync(Guid ticketId, CreateTimeEntryDto dto, string userId)
    {
        var entry = new TicketTimeEntry
        {
            TicketId = ticketId,
            UserId = userId,
            MinutesSpent = dto.MinutesSpent,
            Description = dto.Description,
            StartTime = dto.StartTime ?? DateTime.UtcNow.AddMinutes(-dto.MinutesSpent),
            EndTime = dto.EndTime ?? DateTime.UtcNow,
            IsBillable = dto.IsBillable,
            TimeEntryType = "Manual",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TicketTimeEntries.Add(entry);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);
        return new TicketTimeEntryDto
        {
            Id = entry.Id,
            TicketId = entry.TicketId,
            UserId = entry.UserId,
            UserName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "",
            MinutesSpent = entry.MinutesSpent,
            FormattedTime = FormatMinutes(entry.MinutesSpent),
            Description = entry.Description,
            StartTime = entry.StartTime,
            EndTime = entry.EndTime,
            IsBillable = entry.IsBillable,
            TimeEntryType = entry.TimeEntryType,
            CreatedAt = entry.CreatedAt
        };
    }

    public async Task<TicketTimeEntryDto?> UpdateTimeEntryAsync(int entryId, UpdateTimeEntryDto dto, string userId)
    {
        var entry = await _context.TicketTimeEntries
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == entryId);
        
        if (entry == null) return null;

        entry.MinutesSpent = dto.MinutesSpent;
        entry.Description = dto.Description;
        if (dto.StartTime.HasValue) entry.StartTime = dto.StartTime.Value;
        if (dto.EndTime.HasValue) entry.EndTime = dto.EndTime.Value;
        entry.IsBillable = dto.IsBillable;
        entry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new TicketTimeEntryDto
        {
            Id = entry.Id,
            TicketId = entry.TicketId,
            UserId = entry.UserId,
            UserName = entry.User != null ? $"{entry.User.FirstName} {entry.User.LastName}".Trim() : "",
            MinutesSpent = entry.MinutesSpent,
            FormattedTime = FormatMinutes(entry.MinutesSpent),
            Description = entry.Description,
            StartTime = entry.StartTime,
            EndTime = entry.EndTime,
            IsBillable = entry.IsBillable,
            TimeEntryType = entry.TimeEntryType,
            CreatedAt = entry.CreatedAt
        };
    }

    public async Task<bool> DeleteTimeEntryAsync(int entryId, string userId)
    {
        var entry = await _context.TicketTimeEntries.FindAsync(entryId);
        if (entry == null) return false;

        _context.TicketTimeEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Satisfaction Rating

    public async Task<TicketSatisfactionDto?> GetSatisfactionAsync(Guid ticketId)
    {
        return await _context.TicketSatisfactions
            .Where(s => s.TicketId == ticketId)
            .Include(s => s.User)
            .Select(s => new TicketSatisfactionDto
            {
                Id = s.Id,
                TicketId = s.TicketId,
                UserId = s.UserId,
                UserName = s.User != null ? $"{s.User.FirstName} {s.User.LastName}".Trim() : "",
                Rating = s.Rating,
                Feedback = s.Feedback,
                SatisfactionLevel = s.SatisfactionLevel,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TicketSatisfactionDto> CreateSatisfactionAsync(Guid ticketId, CreateSatisfactionRatingDto dto, string userId)
    {
        // Check if rating already exists
        var existing = await _context.TicketSatisfactions.FirstOrDefaultAsync(s => s.TicketId == ticketId);
        if (existing != null)
        {
            existing.Rating = dto.Rating;
            existing.Feedback = dto.Feedback;
            existing.SatisfactionLevel = GetSatisfactionLevel(dto.Rating);
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (await GetSatisfactionAsync(ticketId))!;
        }

        var satisfaction = new TicketSatisfaction
        {
            TicketId = ticketId,
            UserId = userId,
            Rating = dto.Rating,
            Feedback = dto.Feedback,
            SatisfactionLevel = GetSatisfactionLevel(dto.Rating),
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketSatisfactions.Add(satisfaction);
        await _context.SaveChangesAsync();

        return (await GetSatisfactionAsync(ticketId))!;
    }

    public async Task<SatisfactionSummaryDto> GetSatisfactionSummaryAsync(DateTime? startDate = null, DateTime? endDate = null, int? branchId = null)
    {
        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        var query = _context.TicketSatisfactions
            .Where(s => s.CreatedAt >= start && s.CreatedAt <= end);

        if (branchId.HasValue)
        {
            var branchUserIds = await _context.Users
                .Where(u => u.BranchId == branchId.Value)
                .Select(u => u.Id)
                .ToListAsync();
            query = query.Where(s => branchUserIds.Contains(s.UserId));
        }

        var ratings = await query.ToListAsync();
        var totalRatings = ratings.Count;

        if (totalRatings == 0)
        {
            return new SatisfactionSummaryDto
            {
                AverageRating = 0,
                TotalRatings = 0,
                SatisfactionPercentage = 0
            };
        }

        return new SatisfactionSummaryDto
        {
            AverageRating = Math.Round(ratings.Average(r => r.Rating), 1),
            TotalRatings = totalRatings,
            FiveStarCount = ratings.Count(r => r.Rating == 5),
            FourStarCount = ratings.Count(r => r.Rating == 4),
            ThreeStarCount = ratings.Count(r => r.Rating == 3),
            TwoStarCount = ratings.Count(r => r.Rating == 2),
            OneStarCount = ratings.Count(r => r.Rating == 1),
            SatisfactionPercentage = Math.Round(ratings.Count(r => r.Rating >= 4) / (double)totalRatings * 100, 1)
        };
    }

    #endregion

    #region Related Tickets

    public async Task<List<TicketRelationDto>> GetRelatedTicketsAsync(Guid ticketId)
    {
        var relations = await _context.TicketRelations
            .Where(r => r.SourceTicketId == ticketId || r.RelatedTicketId == ticketId)
            .Include(r => r.SourceTicket)
            .Include(r => r.RelatedTicket)
            .Include(r => r.CreatedByUser)
            .ToListAsync();

        var statuses = await _context.TicketStatuses.ToDictionaryAsync(s => s.Id, s => s.Name);

        return relations.Select(r => new TicketRelationDto
        {
            Id = r.Id,
            SourceTicketId = r.SourceTicketId,
            SourceTicketPublicId = r.SourceTicket?.PublicId,
            SourceTicketTitle = r.SourceTicket?.Title ?? "",
            RelatedTicketId = r.RelatedTicketId,
            RelatedTicketPublicId = r.RelatedTicket?.PublicId,
            RelatedTicketTitle = r.RelatedTicket?.Title ?? "",
            RelatedTicketStatus = r.RelatedTicket != null && statuses.ContainsKey(r.RelatedTicket.Status) 
                ? statuses[r.RelatedTicket.Status] : "",
            RelationType = r.RelationType,
            CreatedByUserId = r.CreatedByUserId,
            CreatedByUserName = r.CreatedByUser != null ? $"{r.CreatedByUser.FirstName} {r.CreatedByUser.LastName}".Trim() : "",
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task<TicketRelationDto> CreateRelationAsync(Guid ticketId, CreateTicketRelationDto dto, string userId)
    {
        // Check if relation already exists
        var existing = await _context.TicketRelations
            .FirstOrDefaultAsync(r => 
                (r.SourceTicketId == ticketId && r.RelatedTicketId == dto.RelatedTicketId) ||
                (r.SourceTicketId == dto.RelatedTicketId && r.RelatedTicketId == ticketId));

        if (existing != null)
        {
            throw new InvalidOperationException("Relation already exists between these tickets");
        }

        var relation = new TicketRelation
        {
            SourceTicketId = ticketId,
            RelatedTicketId = dto.RelatedTicketId,
            RelationType = dto.RelationType,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketRelations.Add(relation);
        await _context.SaveChangesAsync();

        var result = await _context.TicketRelations
            .Include(r => r.SourceTicket)
            .Include(r => r.RelatedTicket)
            .Include(r => r.CreatedByUser)
            .FirstAsync(r => r.Id == relation.Id);

        var statuses = await _context.TicketStatuses.ToDictionaryAsync(s => s.Id, s => s.Name);

        return new TicketRelationDto
        {
            Id = result.Id,
            SourceTicketId = result.SourceTicketId,
            SourceTicketPublicId = result.SourceTicket?.PublicId,
            SourceTicketTitle = result.SourceTicket?.Title ?? "",
            RelatedTicketId = result.RelatedTicketId,
            RelatedTicketPublicId = result.RelatedTicket?.PublicId,
            RelatedTicketTitle = result.RelatedTicket?.Title ?? "",
            RelatedTicketStatus = result.RelatedTicket != null && statuses.ContainsKey(result.RelatedTicket.Status)
                ? statuses[result.RelatedTicket.Status] : "",
            RelationType = result.RelationType,
            CreatedByUserId = result.CreatedByUserId,
            CreatedByUserName = result.CreatedByUser != null ? $"{result.CreatedByUser.FirstName} {result.CreatedByUser.LastName}".Trim() : "",
            CreatedAt = result.CreatedAt
        };
    }

    public async Task<bool> DeleteRelationAsync(int relationId)
    {
        var relation = await _context.TicketRelations.FindAsync(relationId);
        if (relation == null) return false;

        _context.TicketRelations.Remove(relation);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Canned Responses

    public async Task<List<CannedResponseDto>> GetCannedResponsesAsync(string? userId = null, int? categoryId = null)
    {
        var query = _context.CannedResponses.Where(r => r.IsActive);

        // Show shared responses OR personal responses owned by the user
        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(r => !r.IsPersonal || r.OwnerUserId == userId);
        }
        else
        {
            query = query.Where(r => !r.IsPersonal);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(r => !r.CategoryId.HasValue || r.CategoryId == categoryId);
        }

        return await query
            .OrderBy(r => r.Title)
            .Include(r => r.OwnerUser)
            .Select(r => new CannedResponseDto
            {
                Id = r.Id,
                Title = r.Title,
                Content = r.Content,
                ShortCode = r.ShortCode,
                CategoryId = r.CategoryId,
                IsPersonal = r.IsPersonal,
                OwnerUserId = r.OwnerUserId,
                OwnerUserName = r.OwnerUser != null ? $"{r.OwnerUser.FirstName} {r.OwnerUser.LastName}".Trim() : null,
                IsActive = r.IsActive,
                UseCount = r.UseCount,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<CannedResponseDto?> GetCannedResponseByIdAsync(int responseId)
    {
        return await _context.CannedResponses
            .Where(r => r.Id == responseId)
            .Include(r => r.OwnerUser)
            .Select(r => new CannedResponseDto
            {
                Id = r.Id,
                Title = r.Title,
                Content = r.Content,
                ShortCode = r.ShortCode,
                CategoryId = r.CategoryId,
                IsPersonal = r.IsPersonal,
                OwnerUserId = r.OwnerUserId,
                OwnerUserName = r.OwnerUser != null ? $"{r.OwnerUser.FirstName} {r.OwnerUser.LastName}".Trim() : null,
                IsActive = r.IsActive,
                UseCount = r.UseCount,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CannedResponseDto?> GetCannedResponseByShortCodeAsync(string shortCode, string? userId = null)
    {
        var query = _context.CannedResponses
            .Where(r => r.ShortCode == shortCode && r.IsActive);

        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(r => !r.IsPersonal || r.OwnerUserId == userId);
        }
        else
        {
            query = query.Where(r => !r.IsPersonal);
        }

        return await query
            .Include(r => r.OwnerUser)
            .Select(r => new CannedResponseDto
            {
                Id = r.Id,
                Title = r.Title,
                Content = r.Content,
                ShortCode = r.ShortCode,
                CategoryId = r.CategoryId,
                IsPersonal = r.IsPersonal,
                OwnerUserId = r.OwnerUserId,
                OwnerUserName = r.OwnerUser != null ? $"{r.OwnerUser.FirstName} {r.OwnerUser.LastName}".Trim() : null,
                IsActive = r.IsActive,
                UseCount = r.UseCount,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CannedResponseDto> CreateCannedResponseAsync(CreateCannedResponseDto dto, string userId)
    {
        var response = new CannedResponse
        {
            Title = dto.Title,
            Content = dto.Content,
            ShortCode = dto.ShortCode,
            CategoryId = dto.CategoryId,
            IsPersonal = dto.IsPersonal,
            OwnerUserId = dto.IsPersonal ? userId : null,
            IsActive = true,
            UseCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CannedResponses.Add(response);
        await _context.SaveChangesAsync();

        return (await GetCannedResponseByIdAsync(response.Id))!;
    }

    public async Task<CannedResponseDto?> UpdateCannedResponseAsync(int responseId, UpdateCannedResponseDto dto, string userId)
    {
        var response = await _context.CannedResponses.FindAsync(responseId);
        if (response == null) return null;

        // Only allow owner to update personal responses
        if (response.IsPersonal && response.OwnerUserId != userId)
        {
            return null;
        }

        response.Title = dto.Title;
        response.Content = dto.Content;
        response.ShortCode = dto.ShortCode;
        response.CategoryId = dto.CategoryId;
        response.IsPersonal = dto.IsPersonal;
        response.OwnerUserId = dto.IsPersonal ? userId : null;
        response.IsActive = dto.IsActive;
        response.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetCannedResponseByIdAsync(responseId);
    }

    public async Task<bool> DeleteCannedResponseAsync(int responseId, string userId)
    {
        var response = await _context.CannedResponses.FindAsync(responseId);
        if (response == null) return false;

        // Only allow owner to delete personal responses
        if (response.IsPersonal && response.OwnerUserId != userId)
        {
            return false;
        }

        _context.CannedResponses.Remove(response);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task IncrementCannedResponseUsageAsync(int responseId)
    {
        var response = await _context.CannedResponses.FindAsync(responseId);
        if (response != null)
        {
            response.UseCount++;
            await _context.SaveChangesAsync();
        }
    }

    #endregion
}
