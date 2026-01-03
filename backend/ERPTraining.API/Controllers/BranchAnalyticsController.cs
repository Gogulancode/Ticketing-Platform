using ERPTraining.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERPTraining.API.Controllers;

/// <summary>
/// Controller for branch analytics and reporting
/// </summary>
[ApiController]
[Route("analytics/branches")]
[Authorize]
public class BranchAnalyticsController : ControllerBase
{
    private readonly IBranchAnalyticsService _analyticsService;
    private readonly ILogger<BranchAnalyticsController> _logger;

    public BranchAnalyticsController(
        IBranchAnalyticsService analyticsService,
        ILogger<BranchAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Get overall analytics across all branches
    /// </summary>
    [HttpGet("overall")]
    public async Task<IActionResult> GetOverallAnalytics(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        try
        {
            var analytics = await _analyticsService.GetOverallAnalyticsAsync(startDate, endDate);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting overall analytics");
            return StatusCode(500, new { error = "Failed to retrieve overall analytics" });
        }
    }

    /// <summary>
    /// Get analytics for a specific branch
    /// </summary>
    [HttpGet("{branchId}")]
    public async Task<IActionResult> GetBranchAnalytics(
        int branchId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        try
        {
            var analytics = await _analyticsService.GetBranchAnalyticsAsync(branchId, startDate, endDate);
            if (analytics == null)
            {
                return NotFound(new { error = "Branch not found" });
            }
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting branch analytics for branch {BranchId}", branchId);
            return StatusCode(500, new { error = "Failed to retrieve branch analytics" });
        }
    }

    /// <summary>
    /// Get ticket trends over time
    /// </summary>
    [HttpGet("trends")]
    public async Task<IActionResult> GetTicketTrends(
        [FromQuery] int? branchId,
        [FromQuery] int days = 30)
    {
        try
        {
            var trends = await _analyticsService.GetTicketTrendsAsync(branchId, days);
            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ticket trends");
            return StatusCode(500, new { error = "Failed to retrieve ticket trends" });
        }
    }

    /// <summary>
    /// Get category distribution
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategoryDistribution(
        [FromQuery] int? branchId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        try
        {
            var distribution = await _analyticsService.GetCategoryDistributionAsync(branchId, startDate, endDate);
            return Ok(distribution);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category distribution");
            return StatusCode(500, new { error = "Failed to retrieve category distribution" });
        }
    }

    /// <summary>
    /// Get priority distribution
    /// </summary>
    [HttpGet("priorities")]
    public async Task<IActionResult> GetPriorityDistribution(
        [FromQuery] int? branchId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        try
        {
            var distribution = await _analyticsService.GetPriorityDistributionAsync(branchId, startDate, endDate);
            return Ok(distribution);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting priority distribution");
            return StatusCode(500, new { error = "Failed to retrieve priority distribution" });
        }
    }

    /// <summary>
    /// Get agent performance metrics
    /// </summary>
    [HttpGet("agents")]
    public async Task<IActionResult> GetAgentPerformance(
        [FromQuery] int? branchId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        try
        {
            var performance = await _analyticsService.GetAgentPerformanceAsync(branchId, startDate, endDate);
            return Ok(performance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agent performance");
            return StatusCode(500, new { error = "Failed to retrieve agent performance" });
        }
    }

    /// <summary>
    /// Get SLA performance by branch
    /// </summary>
    [HttpGet("sla")]
    public async Task<IActionResult> GetSlaPerformance(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        try
        {
            var performance = await _analyticsService.GetSlaPerformanceAsync(startDate, endDate);
            return Ok(performance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting SLA performance");
            return StatusCode(500, new { error = "Failed to retrieve SLA performance" });
        }
    }

    /// <summary>
    /// Get branch comparison metrics
    /// </summary>
    [HttpGet("comparison")]
    public async Task<IActionResult> GetBranchComparison(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        try
        {
            var comparison = await _analyticsService.GetBranchComparisonAsync(startDate, endDate);
            return Ok(comparison);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting branch comparison");
            return StatusCode(500, new { error = "Failed to retrieve branch comparison" });
        }
    }
}
