using System;
using System.Collections.Generic;

namespace ERPTraining.Core.DTOs.CustomerPortal
{
    // ==================== Customer Profile DTOs ====================

    public class CustomerProfileDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }
        public string? CompanyName { get; set; }
        public string? JobTitle { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }
        public string? PreferredLanguage { get; set; }
        public string? Timezone { get; set; }
        public bool EmailNotifications { get; set; }
        public bool TicketUpdateNotifications { get; set; }
        public bool MarketingEmails { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateCustomerProfileDto
    {
        public string? CompanyName { get; set; }
        public string? JobTitle { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? PreferredLanguage { get; set; }
        public string? Timezone { get; set; }
        public bool? EmailNotifications { get; set; }
        public bool? TicketUpdateNotifications { get; set; }
        public bool? MarketingEmails { get; set; }
    }

    // ==================== Knowledge Base DTOs ====================

    public class KnowledgeBaseCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconName { get; set; }
        public int? ParentCategoryId { get; set; }
        public string? ParentCategoryName { get; set; }
        public int SortOrder { get; set; }
        public int ArticleCount { get; set; }
        public List<KnowledgeBaseCategoryDto> SubCategories { get; set; } = new();
    }

    public class CreateKnowledgeBaseCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconName { get; set; }
        public int? ParentCategoryId { get; set; }
        public int SortOrder { get; set; }
    }

    public class KnowledgeBaseArticleDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string Content { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string AuthorId { get; set; } = string.Empty;
        public string? AuthorName { get; set; }
        public string? Tags { get; set; }
        public int ViewCount { get; set; }
        public int HelpfulCount { get; set; }
        public int NotHelpfulCount { get; set; }
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class KnowledgeBaseArticleListDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? CategoryName { get; set; }
        public int ViewCount { get; set; }
        public bool IsFeatured { get; set; }
        public DateTime? PublishedAt { get; set; }
    }

    public class CreateKnowledgeBaseArticleDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string Content { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string? Tags { get; set; }
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public string? MetaDescription { get; set; }
        public string? MetaKeywords { get; set; }
    }

    public class UpdateKnowledgeBaseArticleDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string Content { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string? Tags { get; set; }
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public string? MetaDescription { get; set; }
        public string? MetaKeywords { get; set; }
    }

    public class ArticleFeedbackDto
    {
        public int ArticleId { get; set; }
        public bool IsHelpful { get; set; }
        public string? Comment { get; set; }
    }

    // ==================== FAQ DTOs ====================

    public class FAQDto
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public int SortOrder { get; set; }
        public bool IsFeatured { get; set; }
        public int ViewCount { get; set; }
    }

    public class CreateFAQDto
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public int SortOrder { get; set; }
        public bool IsFeatured { get; set; }
    }

    // ==================== Announcement DTOs ====================

    public class PortalAnnouncementDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int Type { get; set; }
        public string TypeDisplay { get; set; } = string.Empty;
        public bool IsPinned { get; set; }
        public DateTime? StartsAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePortalAnnouncementDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int Type { get; set; }
        public bool IsPinned { get; set; }
        public DateTime? StartsAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    // ==================== Service Status DTOs ====================

    public class ServiceStatusDto
    {
        public int Id { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Status { get; set; }
        public string StatusDisplay { get; set; } = string.Empty;
        public string? StatusMessage { get; set; }
        public DateTime LastCheckedAt { get; set; }
    }

    public class ServiceIncidentDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Severity { get; set; }
        public string SeverityDisplay { get; set; } = string.Empty;
        public int Status { get; set; }
        public string StatusDisplay { get; set; } = string.Empty;
        public int? AffectedServiceId { get; set; }
        public string? AffectedServiceName { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? CreatedByName { get; set; }
        public List<ServiceIncidentUpdateDto> Updates { get; set; } = new();
    }

    public class ServiceIncidentUpdateDto
    {
        public int Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public int Status { get; set; }
        public string StatusDisplay { get; set; } = string.Empty;
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateServiceIncidentDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Severity { get; set; }
        public int? AffectedServiceId { get; set; }
    }

    public class AddIncidentUpdateDto
    {
        public string Message { get; set; } = string.Empty;
        public int Status { get; set; }
    }

    public class SystemStatusSummaryDto
    {
        public string OverallStatus { get; set; } = "Operational";
        public int OperationalCount { get; set; }
        public int DegradedCount { get; set; }
        public int OutageCount { get; set; }
        public List<ServiceStatusDto> Services { get; set; } = new();
        public List<ServiceIncidentDto> ActiveIncidents { get; set; } = new();
        public List<ServiceIncidentDto> RecentIncidents { get; set; } = new();
    }

    // ==================== Contact Submission DTOs ====================

    public class ContactSubmissionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int Type { get; set; }
        public string TypeDisplay { get; set; } = string.Empty;
        public bool IsProcessed { get; set; }
        public int? ConvertedToTicketId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateContactSubmissionDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int Type { get; set; }
    }

    // ==================== Portal Dashboard DTOs ====================

    public class CustomerDashboardDto
    {
        public CustomerProfileDto? Profile { get; set; }
        public CustomerTicketSummaryDto TicketSummary { get; set; } = new();
        public List<PortalAnnouncementDto> Announcements { get; set; } = new();
        public List<KnowledgeBaseArticleListDto> FeaturedArticles { get; set; } = new();
        public List<FAQDto> FeaturedFAQs { get; set; } = new();
        public SystemStatusSummaryDto? SystemStatus { get; set; }
    }

    public class CustomerTicketSummaryDto
    {
        public int TotalTickets { get; set; }
        public int OpenTickets { get; set; }
        public int PendingTickets { get; set; }
        public int ResolvedTickets { get; set; }
        public List<CustomerTicketDto> RecentTickets { get; set; } = new();
    }

    public class CustomerTicketDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string? Category { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int CommentCount { get; set; }
        public bool HasUnreadUpdates { get; set; }
    }

    // ==================== Search DTOs ====================

    public class PortalSearchResultDto
    {
        public List<KnowledgeBaseArticleListDto> Articles { get; set; } = new();
        public List<FAQDto> FAQs { get; set; } = new();
        public int TotalArticles { get; set; }
        public int TotalFAQs { get; set; }
    }
}
