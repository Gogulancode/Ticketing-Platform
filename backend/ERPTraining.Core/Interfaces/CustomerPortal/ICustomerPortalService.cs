using System.Collections.Generic;
using System.Threading.Tasks;
using ERPTraining.Core.DTOs.CustomerPortal;

namespace ERPTraining.Core.Interfaces.CustomerPortal
{
    public interface ICustomerPortalService
    {
        // Customer Profile
        Task<CustomerProfileDto?> GetCustomerProfileAsync(string userId);
        Task<CustomerProfileDto> CreateOrUpdateProfileAsync(string userId, UpdateCustomerProfileDto dto);
        
        // Customer Dashboard
        Task<CustomerDashboardDto> GetCustomerDashboardAsync(string userId);
        
        // Customer Tickets
        Task<CustomerTicketSummaryDto> GetCustomerTicketSummaryAsync(string userId);
        Task<List<CustomerTicketDto>> GetCustomerTicketsAsync(string userId, int page = 1, int pageSize = 10, string? status = null);
        
        // Knowledge Base Categories
        Task<List<KnowledgeBaseCategoryDto>> GetKnowledgeBaseCategoriesAsync();
        Task<KnowledgeBaseCategoryDto?> GetKnowledgeBaseCategoryAsync(int id);
        Task<KnowledgeBaseCategoryDto?> GetKnowledgeBaseCategoryBySlugAsync(string slug);
        Task<KnowledgeBaseCategoryDto> CreateKnowledgeBaseCategoryAsync(CreateKnowledgeBaseCategoryDto dto);
        Task<KnowledgeBaseCategoryDto?> UpdateKnowledgeBaseCategoryAsync(int id, CreateKnowledgeBaseCategoryDto dto);
        Task<bool> DeleteKnowledgeBaseCategoryAsync(int id);
        
        // Knowledge Base Articles
        Task<List<KnowledgeBaseArticleListDto>> GetPublishedArticlesAsync(int? categoryId = null, int page = 1, int pageSize = 20);
        Task<List<KnowledgeBaseArticleListDto>> GetFeaturedArticlesAsync(int limit = 5);
        Task<KnowledgeBaseArticleDto?> GetArticleBySlugAsync(string slug);
        Task<KnowledgeBaseArticleDto?> GetArticleByIdAsync(int id);
        Task<KnowledgeBaseArticleDto> CreateArticleAsync(string authorId, CreateKnowledgeBaseArticleDto dto);
        Task<KnowledgeBaseArticleDto?> UpdateArticleAsync(int id, UpdateKnowledgeBaseArticleDto dto);
        Task<bool> DeleteArticleAsync(int id);
        Task RecordArticleViewAsync(int articleId);
        Task<bool> SubmitArticleFeedbackAsync(string? userId, ArticleFeedbackDto dto);
        
        // FAQs
        Task<List<FAQDto>> GetActiveFAQsAsync(int? categoryId = null);
        Task<List<FAQDto>> GetFeaturedFAQsAsync(int limit = 5);
        Task<FAQDto?> GetFAQByIdAsync(int id);
        Task<FAQDto> CreateFAQAsync(CreateFAQDto dto);
        Task<FAQDto?> UpdateFAQAsync(int id, CreateFAQDto dto);
        Task<bool> DeleteFAQAsync(int id);
        Task RecordFAQViewAsync(int faqId);
        
        // Announcements
        Task<List<PortalAnnouncementDto>> GetActiveAnnouncementsAsync();
        Task<PortalAnnouncementDto?> GetAnnouncementByIdAsync(int id);
        Task<PortalAnnouncementDto> CreateAnnouncementAsync(string createdById, CreatePortalAnnouncementDto dto);
        Task<PortalAnnouncementDto?> UpdateAnnouncementAsync(int id, CreatePortalAnnouncementDto dto);
        Task<bool> DeleteAnnouncementAsync(int id);
        
        // Service Status
        Task<SystemStatusSummaryDto> GetSystemStatusAsync();
        Task<List<ServiceStatusDto>> GetAllServicesAsync();
        Task<ServiceStatusDto?> UpdateServiceStatusAsync(int id, int status, string? message);
        Task<ServiceStatusDto> CreateServiceAsync(string name, string? description);
        
        // Service Incidents
        Task<List<ServiceIncidentDto>> GetActiveIncidentsAsync();
        Task<List<ServiceIncidentDto>> GetRecentIncidentsAsync(int days = 7);
        Task<ServiceIncidentDto?> GetIncidentByIdAsync(int id);
        Task<ServiceIncidentDto> CreateIncidentAsync(string createdById, CreateServiceIncidentDto dto);
        Task<ServiceIncidentDto?> AddIncidentUpdateAsync(int incidentId, string userId, AddIncidentUpdateDto dto);
        Task<bool> ResolveIncidentAsync(int incidentId, string userId, string? message);
        
        // Contact Submissions
        Task<ContactSubmissionDto> CreateContactSubmissionAsync(CreateContactSubmissionDto dto);
        Task<List<ContactSubmissionDto>> GetContactSubmissionsAsync(bool? processed = null, int page = 1, int pageSize = 20);
        Task<int?> ConvertContactToTicketAsync(int submissionId, string createdById);
        
        // Search
        Task<PortalSearchResultDto> SearchAsync(string query, int maxResults = 10);
    }
}
