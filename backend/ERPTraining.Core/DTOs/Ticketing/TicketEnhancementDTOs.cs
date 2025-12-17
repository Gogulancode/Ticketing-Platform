namespace ERPTraining.Core.DTOs.Ticketing;

// ==================== Ticket Watcher DTOs ====================

public class TicketWatcherDto
{
    public int Id { get; set; }
    public Guid TicketId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public bool NotifyOnComment { get; set; }
    public bool NotifyOnStatusChange { get; set; }
    public bool NotifyOnAssignment { get; set; }
    public bool NotifyOnResolution { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AddWatcherDto
{
    public string UserId { get; set; } = string.Empty;
    public bool NotifyOnComment { get; set; } = true;
    public bool NotifyOnStatusChange { get; set; } = true;
    public bool NotifyOnAssignment { get; set; } = true;
    public bool NotifyOnResolution { get; set; } = true;
}

public class UpdateWatcherPreferencesDto
{
    public bool NotifyOnComment { get; set; }
    public bool NotifyOnStatusChange { get; set; }
    public bool NotifyOnAssignment { get; set; }
    public bool NotifyOnResolution { get; set; }
}

// ==================== Ticket Template DTOs ====================

public class TicketTemplateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TitleTemplate { get; set; } = string.Empty;
    public string BodyTemplate { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? SubcategoryId { get; set; }
    public string? SubcategoryName { get; set; }
    public string DefaultPriority { get; set; } = "Medium";
    public string? DefaultAssigneeId { get; set; }
    public string? DefaultAssigneeName { get; set; }
    public int? DefaultGroupId { get; set; }
    public string? DefaultGroupName { get; set; }
    public bool IsActive { get; set; }
    public bool IsPublic { get; set; }
    public int SortOrder { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTicketTemplateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TitleTemplate { get; set; } = string.Empty;
    public string BodyTemplate { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public int? SubcategoryId { get; set; }
    public string DefaultPriority { get; set; } = "Medium";
    public string? DefaultAssigneeId { get; set; }
    public int? DefaultGroupId { get; set; }
    public bool IsPublic { get; set; } = true;
    public int SortOrder { get; set; } = 0;
}

public class UpdateTicketTemplateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TitleTemplate { get; set; } = string.Empty;
    public string BodyTemplate { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public int? SubcategoryId { get; set; }
    public string DefaultPriority { get; set; } = "Medium";
    public string? DefaultAssigneeId { get; set; }
    public int? DefaultGroupId { get; set; }
    public bool IsActive { get; set; }
    public bool IsPublic { get; set; }
    public int SortOrder { get; set; }
}

// ==================== Time Tracking DTOs ====================

public class TicketTimeEntryDto
{
    public int Id { get; set; }
    public Guid TicketId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int MinutesSpent { get; set; }
    public string FormattedTime { get; set; } = string.Empty; // e.g., "2h 30m"
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool IsBillable { get; set; }
    public string TimeEntryType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateTimeEntryDto
{
    public int MinutesSpent { get; set; }
    public string? Description { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool IsBillable { get; set; } = false;
}

public class UpdateTimeEntryDto
{
    public int MinutesSpent { get; set; }
    public string? Description { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool IsBillable { get; set; }
}

public class TicketTimeSummaryDto
{
    public Guid TicketId { get; set; }
    public int TotalMinutes { get; set; }
    public string FormattedTotalTime { get; set; } = string.Empty;
    public int BillableMinutes { get; set; }
    public string FormattedBillableTime { get; set; } = string.Empty;
    public int EntryCount { get; set; }
    public List<UserTimeSummaryDto> ByUser { get; set; } = new();
}

public class UserTimeSummaryDto
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int TotalMinutes { get; set; }
    public string FormattedTime { get; set; } = string.Empty;
}

// ==================== Satisfaction Rating DTOs ====================

public class TicketSatisfactionDto
{
    public int Id { get; set; }
    public Guid TicketId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Feedback { get; set; }
    public string? SatisfactionLevel { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateSatisfactionRatingDto
{
    public int Rating { get; set; } // 1-5
    public string? Feedback { get; set; }
}

public class SatisfactionSummaryDto
{
    public double AverageRating { get; set; }
    public int TotalRatings { get; set; }
    public int FiveStarCount { get; set; }
    public int FourStarCount { get; set; }
    public int ThreeStarCount { get; set; }
    public int TwoStarCount { get; set; }
    public int OneStarCount { get; set; }
    public double SatisfactionPercentage { get; set; } // % of 4-5 star ratings
}

// ==================== Ticket Relation DTOs ====================

public class TicketRelationDto
{
    public int Id { get; set; }
    public Guid SourceTicketId { get; set; }
    public int? SourceTicketPublicId { get; set; }
    public string SourceTicketTitle { get; set; } = string.Empty;
    public Guid RelatedTicketId { get; set; }
    public int? RelatedTicketPublicId { get; set; }
    public string RelatedTicketTitle { get; set; } = string.Empty;
    public string RelatedTicketStatus { get; set; } = string.Empty;
    public string RelationType { get; set; } = string.Empty;
    public string CreatedByUserId { get; set; } = string.Empty;
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateTicketRelationDto
{
    public Guid RelatedTicketId { get; set; }
    public string RelationType { get; set; } = "Related"; // Related, Duplicate, Parent, Child, Blocks, BlockedBy
}

// ==================== Canned Response DTOs ====================

public class CannedResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ShortCode { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public bool IsPersonal { get; set; }
    public string? OwnerUserId { get; set; }
    public string? OwnerUserName { get; set; }
    public bool IsActive { get; set; }
    public int UseCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateCannedResponseDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ShortCode { get; set; }
    public int? CategoryId { get; set; }
    public bool IsPersonal { get; set; } = false;
}

public class UpdateCannedResponseDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ShortCode { get; set; }
    public int? CategoryId { get; set; }
    public bool IsPersonal { get; set; }
    public bool IsActive { get; set; }
}
