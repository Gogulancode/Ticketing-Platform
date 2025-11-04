using ERPTraining.Core.Entities.Ticketing;
using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.DTOs.Ticketing
{
    public record CreateTicketDto(
        [Required] string Title,
        [Required] string Description,
        TicketCategory Category,
        TicketPriority Priority,
        IEnumerable<TicketLinkDto> Links
    );

    public record TicketLinkDto(
        string ObjectType,
        string ObjectId
    );

    public record UpdateTicketDto(
        string? AssignedToUserId,
        TicketStatus? Status,
        TicketPriority? Priority
    );

    public record EditTicketDto(
        [Required] string Title,
        [Required] string Description,
        TicketCategory Category,
        TicketPriority Priority
    );

    public record TicketDto
    {
        public Guid Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public TicketCategory Category { get; init; }
        public TicketPriority Priority { get; init; }
        public TicketStatus Status { get; init; }
        public TicketSource Source { get; init; }
        public string CreatedByUserId { get; init; } = string.Empty;
        public string CreatedByUserName { get; init; } = string.Empty;
        public string? AssignedToUserId { get; init; }
        public string? AssignedToUserName { get; init; }
        public DateTime CreatedAt { get; init; }
        public DateTime UpdatedAt { get; init; }
        public DateTime? FirstResponseAt { get; init; }
        public DateTime? ResolvedAt { get; init; }
        public IEnumerable<TicketLinkDto> Links { get; init; } = new List<TicketLinkDto>();
        public int CommentsCount { get; init; }
        public int AttachmentsCount { get; init; }
        public bool IsOverdue { get; init; }
        public TimeSpan? TimeToFirstResponse { get; init; }
        public TimeSpan? TimeToResolution { get; init; }
    }

    public record CreateCommentDto(
        [Required] string Body,
        bool IsInternal = false
    );

    public record CommentDto
    {
        public Guid Id { get; init; }
        public string Body { get; init; } = string.Empty;
        public bool IsInternal { get; init; }
        public string AuthorUserId { get; init; } = string.Empty;
        public string AuthorUserName { get; init; } = string.Empty;
        public DateTime CreatedAt { get; init; }
    }

    public record AttachmentDto
    {
        public Guid Id { get; init; }
        public string FileName { get; init; } = string.Empty;
        public string ContentType { get; init; } = string.Empty;
        public long SizeBytes { get; init; }
        public string UploadedByUserId { get; init; } = string.Empty;
        public string UploadedByUserName { get; init; } = string.Empty;
        public DateTime CreatedAt { get; init; }
    }

    public record TicketMetricsDto
    {
        public Dictionary<TicketStatus, int> CountsByStatus { get; init; } = new();
        public Dictionary<TicketCategory, int> CountsByCategory { get; init; } = new();
        public Dictionary<TicketPriority, int> CountsByPriority { get; init; } = new();
        public double AvgFirstResponseHours { get; init; }
        public double AvgResolutionHours { get; init; }
        public int SlaBreachCount { get; init; }
        public double SlaBreachRate { get; init; }
        public int TotalTickets { get; init; }
        public int OpenTickets { get; init; }
    }

    public record TicketQueryDto
    {
        public bool? Mine { get; init; }
        public TicketStatus? Status { get; init; }
        public TicketPriority? Priority { get; init; }
        public TicketCategory? Category { get; init; }
        public string? ModuleId { get; init; }
        public string? LessonId { get; init; }
        public string? AssessmentId { get; init; }
        public string? Search { get; init; }
        public int Page { get; init; } = 1;
        public int PageSize { get; init; } = 20;
        public string Sort { get; init; } = "CreatedAt";
        public bool SortDesc { get; init; } = true;
    }

    public record PagedResult<T>
    {
        public IEnumerable<T> Items { get; init; } = new List<T>();
        public int TotalCount { get; init; }
        public int Page { get; init; }
        public int PageSize { get; init; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasNext => Page < TotalPages;
        public bool HasPrevious => Page > 1;
    }
}
