using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Interfaces
{
    // Placeholder interfaces for future implementation
    
    public interface ILearningModuleService
    {
        Task<List<ModuleDto>> GetModulesAsync();
        Task<ModuleDto> GetModuleByIdAsync(int id);
        
        // Additional methods for LearningModulesController
        Task<Dictionary<string, object>> GetModuleWithAccessValidationAsync(int moduleId, string userId);
    }

    public interface ILearningAnalyticsService
    {
        Task<Dictionary<string, object>> GetBasicAnalyticsAsync(string userId);
        
        // Additional methods for controllers
        Task TrackContentViewAsync(int contentId, string userId);
        Task<ContentAnalyticsDto> GetContentAnalyticsAsync(int contentId);
        Task TrackModuleAccessAsync(int moduleId, string userId);
        Task<Dictionary<string, object>> GetModuleAnalyticsAsync(int moduleId);
        Task<Dictionary<string, object>> GetSocialLearningInsightsAsync(string userId);
    }

    public interface IProgressTrackingService
    {
        Task<LearningProgressDto> GetProgressAsync(string userId, int moduleId);
        
        // Additional methods for LearningModulesController
        Task<Dictionary<string, object>> StartLearningSessionAsync(int moduleId, string userId);
        Task<Dictionary<string, object>> UpdateLearningProgressAsync(int moduleId, string userId, Dictionary<string, object> progressData);
        Task<bool> CompleteModuleAsync(int moduleId, string userId);
        Task<Dictionary<string, object>> ExportLearningProgressAsync(string userId, string format);
    }

    public interface IContentVersionService
    {
        Task<List<ContentVersionDto>> GetVersionsAsync(int contentId);
        
        // Additional methods for ContentManagementController
        Task<ContentVersionDto> CreateVersionAsync(int contentId, string versionNotes, string userId);
        Task<List<ContentVersionDto>> GetContentVersionsAsync(int contentId);
        Task<Dictionary<string, object>> RestoreVersionAsync(int contentId, int versionId, string userId);
    }
}
