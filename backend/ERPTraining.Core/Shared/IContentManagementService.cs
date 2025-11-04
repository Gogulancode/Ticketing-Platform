using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Interfaces
{
    public interface IContentManagementService
    {
        // Core Content Operations
        Task<ContentSearchResultDto> SearchContentAsync(ContentSearchParams searchParams);
        Task<ContentDetailDto> GetContentDetailAsync(int contentId, string userId);
        Task<ContentDetailDto> CreateContentAsync(CreateContentDto createDto, string userId);
        Task<ContentDetailDto> UpdateContentAsync(int contentId, UpdateContentDto updateDto, string userId);
        Task<bool> DeleteContentAsync(int contentId, string userId);
        Task<bool> BulkDeleteContentAsync(List<int> contentIds, string userId);

        // Content Lifecycle Management
        Task<ContentDetailDto> PublishContentAsync(int contentId, string userId);
        Task<ContentDetailDto> UnpublishContentAsync(int contentId, string userId);
        Task<ContentDetailDto> ArchiveContentAsync(int contentId, string userId);
        Task<ContentDetailDto> DuplicateContentAsync(int contentId, string userId);

        // Content Versioning
        Task<List<ContentVersionDto>> GetContentVersionsAsync(int contentId);
        Task<ContentVersionDto> CreateContentVersionAsync(int contentId, string versionNotes, string userId);
        Task<ContentDetailDto> RevertToVersionAsync(int contentId, int versionNumber, string userId);
        Task<bool> DeleteVersionAsync(int contentId, int versionNumber, string userId);

        // Content Analytics
        Task<ContentAnalyticsDto> GetContentAnalyticsAsync(int contentId);
        Task<ContentAnalyticsDto> GetContentAnalyticsAsync(int contentId, DateTime startDate, DateTime endDate);
        Task<List<ContentPopularityDto>> GetPopularContentAsync(int count = 10);
        Task<List<ContentEngagementDto>> GetContentEngagementMetricsAsync(List<int> contentIds);

        // Content Access Control
        Task<bool> UpdateContentAccessAsync(int contentId, List<string> roles, List<string> users, string userId);
        Task<bool> CheckContentAccessAsync(int contentId, string userId, string userRole);
        Task<List<ContentDetailDto>> GetContentByAccessLevelAsync(string userId, string userRole);

        // Content Import/Export
        Task<BulkOperationResultDto> BulkImportContentAsync(BulkUploadDto bulkUpload, string userId);
        Task<byte[]> ExportContentAsync(List<int> contentIds, string format = "json");
        Task<byte[]> ExportContentAsync(int contentId, string format, Dictionary<string, object> options);
        Task<byte[]> ExportContentAsScormAsync(int contentId);

        // Content Recommendations
        Task<List<ContentDetailDto>> GetRecommendedContentAsync(string userId, int moduleId, int count = 5);
        Task<List<ContentDetailDto>> GetRelatedContentAsync(int contentId, int count = 5);

        // Content Search & Filtering
        Task<List<string>> GetAvailableTagsAsync();
        Task<List<string>> GetContentTypesAsync();
        Task<ContentSearchResultDto> SearchByTagsAsync(List<string> tags, int pageSize = 20, int page = 1);
        Task<List<ContentDetailDto>> GetRecentContentAsync(int count = 10, string? userId = null);

        // Content Metadata Management
        Task<bool> UpdateContentMetadataAsync(int contentId, Dictionary<string, object> metadata, string userId);
        Task<Dictionary<string, object>?> GetContentMetadataAsync(int contentId);

        // Content Quality & Review
        Task<ContentDetailDto> SubmitForReviewAsync(int contentId, string userId);
        Task<ContentDetailDto> ApproveContentAsync(int contentId, string reviewerId, string notes = "");
        Task<ContentDetailDto> RejectContentAsync(int contentId, string reviewerId, string rejectionReason);
        Task<List<ContentDetailDto>> GetContentPendingReviewAsync();

        // Content Statistics
        Task<ContentStatsDto> GetContentStatisticsAsync();
        Task<ContentStatsDto> GetModuleContentStatisticsAsync(int moduleId);
        Task<List<ContentUsageDto>> GetContentUsageReportAsync(DateTime startDate, DateTime endDate);

        // Additional methods used by ContentManagementController
        Task<ContentDetailDto> GetContentByIdAsync(int contentId);
        Task<bool> UpdateContentStatusAsync(int contentId, string status, string userId);
        Task<Dictionary<string, object>> BulkUploadContentAsync(List<CreateContentDto> contents, string userId);
        Task<List<Dictionary<string, object>>> GetContentRecommendationsAsync(string userId);
        Task<Dictionary<string, object>> AdvancedSearchAsync(Dictionary<string, object> criteria);
    }
}
