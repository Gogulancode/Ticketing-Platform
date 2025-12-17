using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Entities.Ticketing;

/// <summary>
/// Ticket watcher/follower - users who want to receive notifications about a ticket
/// </summary>
public class TicketWatcher
{
    public int Id { get; set; }
    public Guid TicketId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public bool NotifyOnComment { get; set; } = true;
    public bool NotifyOnStatusChange { get; set; } = true;
    public bool NotifyOnAssignment { get; set; } = true;
    public bool NotifyOnResolution { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Ticket? Ticket { get; set; }
    public virtual User? User { get; set; }
}

/// <summary>
/// Ticket template for quick ticket creation
/// </summary>
public class TicketTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TitleTemplate { get; set; } = string.Empty;
    public string BodyTemplate { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public int? SubcategoryId { get; set; }
    public TicketPriority DefaultPriority { get; set; } = TicketPriority.Medium;
    public string? DefaultAssigneeId { get; set; }
    public int? DefaultGroupId { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsPublic { get; set; } = true; // Available for all users or just agents
    public int SortOrder { get; set; } = 0;
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual User? CreatedByUser { get; set; }
    public virtual User? DefaultAssignee { get; set; }
}

/// <summary>
/// Time tracking entry for tickets
/// </summary>
public class TicketTimeEntry
{
    public int Id { get; set; }
    public Guid TicketId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int MinutesSpent { get; set; }
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool IsBillable { get; set; } = false;
    public string TimeEntryType { get; set; } = "Manual"; // Manual, Timer, System
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Ticket? Ticket { get; set; }
    public virtual User? User { get; set; }
}

/// <summary>
/// Customer satisfaction rating for resolved tickets
/// </summary>
public class TicketSatisfaction
{
    public int Id { get; set; }
    public Guid TicketId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int Rating { get; set; } // 1-5 stars
    public string? Feedback { get; set; }
    public string? SatisfactionLevel { get; set; } // "Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual Ticket? Ticket { get; set; }
    public virtual User? User { get; set; }
}

/// <summary>
/// Linked/Related tickets
/// </summary>
public class TicketRelation
{
    public int Id { get; set; }
    public Guid SourceTicketId { get; set; }
    public Guid RelatedTicketId { get; set; }
    public string RelationType { get; set; } = "Related"; // Related, Duplicate, Parent, Child, Blocks, BlockedBy
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Ticket? SourceTicket { get; set; }
    public virtual Ticket? RelatedTicket { get; set; }
    public virtual User? CreatedByUser { get; set; }
}

/// <summary>
/// Saved/Canned responses for quick replies
/// </summary>
public class CannedResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ShortCode { get; set; } // e.g., "/greeting", "/thanks"
    public int? CategoryId { get; set; } // Optional category filter
    public bool IsPersonal { get; set; } = false; // Personal or shared
    public string? OwnerUserId { get; set; } // Owner if personal
    public bool IsActive { get; set; } = true;
    public int UseCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual User? OwnerUser { get; set; }
}
