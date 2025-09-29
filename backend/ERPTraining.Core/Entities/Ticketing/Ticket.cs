using ERPTraining.Core.Entities;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing;

public enum TicketCategory { General, Technical, Content, Assessment, Other }
public enum TicketPriority { Low, Medium, High, Critical }
public enum TicketStatus { New, InReview, WaitingUser, Resolved, Closed }
public enum TicketSource { TrainingPortal, Email, System }
public enum ObjectType { Module, Lesson, Assessment, Other }

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int? PublicId { get; set; } // Public facing ticket number like #105445
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.New;
    public TicketSource Source { get; set; } = TicketSource.TrainingPortal;
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? AssignedToUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FirstResponseAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    
    // SLA tracking
    public int? SlaPolicyId { get; set; }
    public SlaPolicy? SlaPolicy { get; set; }
    public DateTime? SlaResponseDueAt { get; set; }
    public DateTime? SlaResolutionDueAt { get; set; }
    public bool SlaResponseMet { get; set; } = false;
    public bool SlaResolutionMet { get; set; } = false;
    public bool SlaBreached { get; set; } = false;
    public int SlaEscalationLevel { get; set; } = 0; // 0 = no escalation, 1-3 = escalation levels
    public DateTime? LastSlaEscalationAt { get; set; }
    
    // Extended fields to support the relational database structure
    public int? SubCategory { get; set; } // Maps to SubCategory column in database
    public int? CategoryId { get; set; } // Maps to relational category tables if needed
    public int? SubcategoryId { get; set; } // Maps to relational subcategory tables if needed  
    public int? DepartmentId { get; set; } // Maps to department assignment if needed
    
    public ICollection<TicketLink> Links { get; set; } = new List<TicketLink>();
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>(); // Added for Infrastructure compatibility
    [NotMapped]
    public bool IsOverdue { get; set; }
    
    // Navigation properties for Infrastructure compatibility
    public virtual User? CreatedByUser { get; set; }
    public virtual User? AssignedToUser { get; set; }
}

public class TicketLink
{
    public int Id { get; set; }
    public Guid TicketId { get; set; }
    public ObjectType ObjectType { get; set; }
    public string ObjectId { get; set; } = string.Empty;
    
    // Navigation properties for Infrastructure compatibility
    public virtual Ticket? Ticket { get; set; }
}

public class TicketComment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public string AuthorUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties for Infrastructure compatibility
    public virtual Ticket? Ticket { get; set; }
    public virtual User? AuthorUser { get; set; }
}

public class Attachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty; // Added for database compatibility
    public string UploadedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties for Infrastructure compatibility
    public virtual Ticket? Ticket { get; set; }
    public virtual User? UploadedByUser { get; set; }
}

public class SLA
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; }
    public int FirstResponseMinutes { get; set; }
    public int ResolutionMinutes { get; set; }
    
    // Navigation properties for Infrastructure compatibility
    public TicketCategory Category { get; set; }
}

public class AuditLog
{
    public int Id { get; set; }
    public Guid TicketId { get; set; }
    public string Field { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string ChangedByUserId { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties for Infrastructure compatibility
    public virtual Ticket? Ticket { get; set; }
    public virtual User? ChangedByUser { get; set; }
}
