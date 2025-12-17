using ERPTraining.Core.DTOs.Analytics;

namespace ERPTraining.Core.Interfaces;

/// <summary>
/// Service for branch analytics and reporting
/// </summary>
public interface IBranchAnalyticsService
{
    /// <summary>
    /// Get overall analytics summary
    /// </summary>
    Task<OverallAnalyticsDto> GetOverallAnalyticsAsync(DateTime? startDate = null, DateTime? endDate = null);
    
    /// <summary>
    /// Get analytics for a specific branch
    /// </summary>
    Task<BranchAnalyticsDto?> GetBranchAnalyticsAsync(int branchId, DateTime? startDate = null, DateTime? endDate = null);
    
    /// <summary>
    /// Get ticket trends over time
    /// </summary>
    Task<List<BranchTicketTrendDto>> GetTicketTrendsAsync(int? branchId = null, int days = 30);
    
    /// <summary>
    /// Get category distribution
    /// </summary>
    Task<List<CategoryDistributionDto>> GetCategoryDistributionAsync(int? branchId = null, DateTime? startDate = null, DateTime? endDate = null);
    
    /// <summary>
    /// Get priority distribution
    /// </summary>
    Task<List<PriorityDistributionDto>> GetPriorityDistributionAsync(int? branchId = null, DateTime? startDate = null, DateTime? endDate = null);
    
    /// <summary>
    /// Get agent performance metrics
    /// </summary>
    Task<List<AgentPerformanceDto>> GetAgentPerformanceAsync(int? branchId = null, DateTime? startDate = null, DateTime? endDate = null);
    
    /// <summary>
    /// Get SLA performance by branch
    /// </summary>
    Task<List<BranchSlaPerformanceDto>> GetSlaPerformanceAsync(DateTime? startDate = null, DateTime? endDate = null);
    
    /// <summary>
    /// Get comparative analytics between branches
    /// </summary>
    Task<BranchComparisonDto> GetBranchComparisonAsync(DateTime? startDate = null, DateTime? endDate = null);
}
