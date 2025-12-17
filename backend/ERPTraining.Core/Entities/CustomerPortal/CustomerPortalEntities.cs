using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.CustomerPortal
{
    /// <summary>
    /// Customer portal user profile with additional customer-specific information
    /// </summary>
    public class CustomerProfile
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(450)]
        public string UserId { get; set; } = string.Empty;
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        [StringLength(100)]
        public string? CompanyName { get; set; }
        
        [StringLength(50)]
        public string? JobTitle { get; set; }
        
        [StringLength(20)]
        public string? Phone { get; set; }
        
        [StringLength(500)]
        public string? Address { get; set; }
        
        public string? AvatarUrl { get; set; }
        
        [StringLength(10)]
        public string? PreferredLanguage { get; set; } = "en";
        
        [StringLength(50)]
        public string? Timezone { get; set; } = "UTC";
        
        // Notification preferences
        public bool EmailNotifications { get; set; } = true;
        public bool TicketUpdateNotifications { get; set; } = true;
        public bool MarketingEmails { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Knowledge base article for self-service support
    /// </summary>
    public class KnowledgeBaseArticle
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [StringLength(500)]
        public string Slug { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Summary { get; set; }
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public int CategoryId { get; set; }
        
        [ForeignKey("CategoryId")]
        public virtual KnowledgeBaseCategory? Category { get; set; }
        
        [Required]
        [StringLength(450)]
        public string AuthorId { get; set; } = string.Empty;
        
        [ForeignKey("AuthorId")]
        public virtual User? Author { get; set; }
        
        public string? Tags { get; set; } // Comma-separated
        
        public int ViewCount { get; set; } = 0;
        public int HelpfulCount { get; set; } = 0;
        public int NotHelpfulCount { get; set; } = 0;
        
        public bool IsPublished { get; set; } = false;
        public bool IsFeatured { get; set; } = false;
        
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // SEO
        [StringLength(160)]
        public string? MetaDescription { get; set; }
        
        [StringLength(200)]
        public string? MetaKeywords { get; set; }
        
        // Navigation
        public virtual ICollection<KnowledgeBaseArticleFeedback> Feedbacks { get; set; } = new List<KnowledgeBaseArticleFeedback>();
    }

    /// <summary>
    /// Category for organizing knowledge base articles
    /// </summary>
    public class KnowledgeBaseCategory
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string Slug { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        public string? IconName { get; set; } // Lucide icon name
        
        public int? ParentCategoryId { get; set; }
        
        [ForeignKey("ParentCategoryId")]
        public virtual KnowledgeBaseCategory? ParentCategory { get; set; }
        
        public int SortOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation
        public virtual ICollection<KnowledgeBaseArticle> Articles { get; set; } = new List<KnowledgeBaseArticle>();
        public virtual ICollection<KnowledgeBaseCategory> SubCategories { get; set; } = new List<KnowledgeBaseCategory>();
    }

    /// <summary>
    /// Feedback on knowledge base articles
    /// </summary>
    public class KnowledgeBaseArticleFeedback
    {
        [Key]
        public int Id { get; set; }
        
        public int ArticleId { get; set; }
        
        [ForeignKey("ArticleId")]
        public virtual KnowledgeBaseArticle? Article { get; set; }
        
        [StringLength(450)]
        public string? UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        public bool IsHelpful { get; set; }
        
        [StringLength(1000)]
        public string? Comment { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Announcement for the customer portal
    /// </summary>
    public class PortalAnnouncement
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public AnnouncementType Type { get; set; } = AnnouncementType.Info;
        
        public bool IsActive { get; set; } = true;
        public bool IsPinned { get; set; } = false;
        
        public DateTime? StartsAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        
        [Required]
        [StringLength(450)]
        public string CreatedById { get; set; } = string.Empty;
        
        [ForeignKey("CreatedById")]
        public virtual User? CreatedBy { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum AnnouncementType
    {
        Info = 0,
        Warning = 1,
        Success = 2,
        Maintenance = 3,
        NewFeature = 4
    }

    /// <summary>
    /// FAQ entry for quick answers
    /// </summary>
    public class FAQ
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(500)]
        public string Question { get; set; } = string.Empty;
        
        [Required]
        public string Answer { get; set; } = string.Empty;
        
        public int? CategoryId { get; set; }
        
        [ForeignKey("CategoryId")]
        public virtual KnowledgeBaseCategory? Category { get; set; }
        
        public int SortOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
        
        public int ViewCount { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Service status for system health page
    /// </summary>
    public class ServiceStatus
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string ServiceName { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        public ServiceHealthStatus Status { get; set; } = ServiceHealthStatus.Operational;
        
        [StringLength(500)]
        public string? StatusMessage { get; set; }
        
        public DateTime LastCheckedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsPublic { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }

    public enum ServiceHealthStatus
    {
        Operational = 0,
        Degraded = 1,
        PartialOutage = 2,
        MajorOutage = 3,
        Maintenance = 4
    }

    /// <summary>
    /// Incident report for the status page
    /// </summary>
    public class ServiceIncident
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public IncidentSeverity Severity { get; set; } = IncidentSeverity.Minor;
        public IncidentStatus Status { get; set; } = IncidentStatus.Investigating;
        
        public int? AffectedServiceId { get; set; }
        
        [ForeignKey("AffectedServiceId")]
        public virtual ServiceStatus? AffectedService { get; set; }
        
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
        
        [Required]
        [StringLength(450)]
        public string CreatedById { get; set; } = string.Empty;
        
        [ForeignKey("CreatedById")]
        public virtual User? CreatedBy { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation
        public virtual ICollection<ServiceIncidentUpdate> Updates { get; set; } = new List<ServiceIncidentUpdate>();
    }

    public enum IncidentSeverity
    {
        Minor = 0,
        Major = 1,
        Critical = 2
    }

    public enum IncidentStatus
    {
        Investigating = 0,
        Identified = 1,
        Monitoring = 2,
        Resolved = 3,
        Scheduled = 4 // For planned maintenance
    }

    /// <summary>
    /// Update to a service incident
    /// </summary>
    public class ServiceIncidentUpdate
    {
        [Key]
        public int Id { get; set; }
        
        public int IncidentId { get; set; }
        
        [ForeignKey("IncidentId")]
        public virtual ServiceIncident? Incident { get; set; }
        
        [Required]
        public string Message { get; set; } = string.Empty;
        
        public IncidentStatus Status { get; set; }
        
        [Required]
        [StringLength(450)]
        public string CreatedById { get; set; } = string.Empty;
        
        [ForeignKey("CreatedById")]
        public virtual User? CreatedBy { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Contact form submission
    /// </summary>
    public class ContactSubmission
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(200)]
        public string Email { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? Phone { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        public string Message { get; set; } = string.Empty;
        
        public ContactSubmissionType Type { get; set; } = ContactSubmissionType.General;
        
        public bool IsProcessed { get; set; } = false;
        public int? ConvertedToTicketId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
    }

    public enum ContactSubmissionType
    {
        General = 0,
        Sales = 1,
        Support = 2,
        Feedback = 3,
        Partnership = 4
    }
}
