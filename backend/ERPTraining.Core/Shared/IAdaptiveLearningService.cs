using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;

namespace ERPTraining.Core.Interfaces
{
    public interface IAdaptiveLearningService
    {
        // Basic Learning Analytics
        Task<LearningProgressDto> GetUserLearningProgressAsync(string userId, int moduleId);
        Task<List<ContentDetailDto>> GetRecommendedContentAsync(string userId, int moduleId, int count = 5);
        Task<bool> RecordLearningInteractionAsync(string userId, int contentId, TimeSpan timeSpent);
        
        // Difficulty Assessment
        Task<DifficultyLevel> GetRecommendedDifficultyAsync(string userId, int moduleId);
        Task<List<ContentDetailDto>> GetContentByDifficultyAsync(DifficultyLevel difficulty, int moduleId);
        
        // Progress Tracking
        Task<bool> UpdateLearningProgressAsync(string userId, int contentId, double completionPercentage);
        Task<List<ContentDetailDto>> GetNextRecommendedContentAsync(string userId, int currentContentId);
        
        // Basic Analytics
        Task<Dictionary<string, object>> GetBasicLearningAnalyticsAsync(string userId);
        Task<List<ContentDetailDto>> GetPopularContentAsync(int moduleId, int count = 10);
        
        // Additional methods for LearningModulesController (simplified return types)
        Task<Dictionary<string, object>> GetPersonalizedLearningPathAsync(string userId);
        Task<bool> CheckPrerequisitesAsync(int moduleId, string userId);
        Task<List<Dictionary<string, object>>> CheckAchievementsAsync(string userId);
        Task<Dictionary<string, object>> GetAdaptiveSectionOrderingAsync(int moduleId, string userId);
        Task<Dictionary<string, object>> GetPersonalizedSectionContentAsync(int sectionId, string userId);
        Task<Dictionary<string, object>> GenerateAdaptiveFeedbackAsync(string userId, Dictionary<string, object> assessmentResults);
        Task<Dictionary<string, object>> GetLearningDashboardAsync(string userId);
        Task<List<Dictionary<string, object>>> GetLearningRecommendationsAsync(string userId);
        Task<Dictionary<string, object>> GenerateAdaptiveLearningPathAsync(string userId, int moduleId);
        Task<Dictionary<string, object>> GetMicrolearningContentAsync(string userId, int moduleId);
    }
}
