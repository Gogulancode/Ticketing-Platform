using ERPTraining.Core.DTOs.AI;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERPTraining.API.Controllers;

/// <summary>
/// AI-powered ticket assistance features
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly IAIService _aiService;
    private readonly IBranchAnalyticsService _branchAnalyticsService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AIController> _logger;

    public AIController(
        IAIService aiService, 
        IBranchAnalyticsService branchAnalyticsService,
        ApplicationDbContext context,
        ILogger<AIController> logger)
    {
        _aiService = aiService;
        _branchAnalyticsService = branchAnalyticsService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get AI service status and configuration
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<AIStatusResponse>> GetStatus()
    {
        var status = await _aiService.GetStatusAsync();
        return Ok(status);
    }

    /// <summary>
    /// Auto-suggest category and priority for a ticket
    /// </summary>
    [HttpPost("categorize")]
    public async Task<ActionResult<CategorizationResponse>> CategorizeTicket([FromBody] CategorizationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Subject) && string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new CategorizationResponse 
            { 
                Success = false, 
                ErrorMessage = "Subject or description is required" 
            });
        }

        _logger.LogInformation("Categorizing ticket: {Subject}", request.Subject);
        var result = await _aiService.CategorizeTicketAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Generate response suggestions for agents
    /// </summary>
    [HttpPost("suggest-responses")]
    public async Task<ActionResult<ResponseSuggestionResponse>> SuggestResponses([FromBody] ResponseSuggestionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TicketSubject) && string.IsNullOrWhiteSpace(request.TicketDescription))
        {
            return BadRequest(new ResponseSuggestionResponse 
            { 
                Success = false, 
                ErrorMessage = "Ticket subject or description is required" 
            });
        }

        _logger.LogInformation("Generating response suggestions for ticket: {Subject}", request.TicketSubject);
        var result = await _aiService.SuggestResponsesAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Summarize a ticket thread
    /// </summary>
    [HttpPost("summarize")]
    public async Task<ActionResult<SummarizationResponse>> SummarizeTicket([FromBody] SummarizationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TicketSubject) && string.IsNullOrWhiteSpace(request.TicketDescription))
        {
            return BadRequest(new SummarizationResponse 
            { 
                Success = false, 
                ErrorMessage = "Ticket subject or description is required" 
            });
        }

        _logger.LogInformation("Summarizing ticket: {Subject}", request.TicketSubject);
        var result = await _aiService.SummarizeTicketAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Search knowledge base for relevant articles
    /// </summary>
    [HttpPost("knowledge-search")]
    public async Task<ActionResult<KnowledgeSearchResponse>> SearchKnowledgeBase([FromBody] KnowledgeSearchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
        {
            return BadRequest(new KnowledgeSearchResponse 
            { 
                Success = false, 
                ErrorMessage = "Search query is required" 
            });
        }

        _logger.LogInformation("Searching knowledge base: {Query}", request.Query);
        var result = await _aiService.SearchKnowledgeBaseAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Quick categorization from ticket form (simplified endpoint)
    /// </summary>
    [HttpPost("quick-categorize")]
    [AllowAnonymous] // Allow during ticket creation before auth
    public async Task<ActionResult<CategorizationResponse>> QuickCategorize([FromBody] QuickCategorizeRequest request)
    {
        var fullRequest = new CategorizationRequest
        {
            Subject = request.Subject ?? "",
            Description = request.Description ?? "",
            AvailableCategories = request.Categories ?? new List<string>(),
            AvailablePriorities = new List<string> { "Low", "Medium", "High", "Critical" }
        };

        var result = await _aiService.CategorizeTicketAsync(fullRequest);
        return Ok(result);
    }

    /// <summary>
    /// Generate AI insights for dashboard analytics
    /// </summary>
    [HttpPost("dashboard-insights")]
    public async Task<ActionResult<DashboardInsightsResponse>> GenerateDashboardInsights([FromBody] DashboardInsightsRequest request)
    {
        _logger.LogInformation("Generating AI dashboard insights for period: {Period}", request.Period);
        var result = await _aiService.GenerateDashboardInsightsAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Generate AI-powered weekly/monthly report
    /// </summary>
    [HttpPost("generate-report")]
    public async Task<ActionResult<AIReportResponse>> GenerateReport([FromBody] AIReportRequest request)
    {
        _logger.LogInformation("Generating {ReportType} AI report from {Start} to {End}", 
            request.ReportType, request.StartDate, request.EndDate);
        var result = await _aiService.GenerateReportAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Get available branches for report filtering
    /// </summary>
    [HttpGet("branches")]
    public async Task<ActionResult<List<BranchOption>>> GetBranches()
    {
        var branches = await _context.Branches
            .Where(b => b.IsActive)
            .Select(b => new BranchOption
            {
                Id = b.Id,
                Name = b.Name,
                Code = b.Code
            })
            .OrderBy(b => b.Name)
            .ToListAsync();
        return Ok(branches);
    }

    /// <summary>
    /// Get branch-wise analytics summary for AI reports
    /// </summary>
    [HttpGet("branch-analytics")]
    public async Task<ActionResult<object>> GetBranchAnalyticsSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var analytics = await _branchAnalyticsService.GetOverallAnalyticsAsync(startDate, endDate);
        return Ok(analytics);
    }

    /// <summary>
    /// Get available report types
    /// </summary>
    [HttpGet("report-types")]
    public ActionResult<List<ReportTypeOption>> GetReportTypes()
    {
        var reportTypes = new List<ReportTypeOption>
        {
            new() { Id = "weekly", Name = "Weekly Performance Report", Description = "7-day ticket and agent performance analysis", Icon = "calendar-week" },
            new() { Id = "monthly", Name = "Monthly Performance Report", Description = "30-day comprehensive metrics and trends", Icon = "calendar-month" },
            new() { Id = "quarterly", Name = "Quarterly Executive Report", Description = "90-day strategic overview for management", Icon = "calendar-quarter" },
            new() { Id = "branch", Name = "Branch Performance Analysis", Description = "Compare performance across all branches", Icon = "building" },
            new() { Id = "agent-performance", Name = "Agent Performance Report", Description = "Individual agent metrics and rankings", Icon = "users" },
            new() { Id = "sla", Name = "SLA Compliance Report", Description = "SLA breach analysis and compliance trends", Icon = "clock" },
            new() { Id = "category", Name = "Category Analysis Report", Description = "Ticket distribution by category and trends", Icon = "folder" },
            new() { Id = "executive", Name = "Executive Summary", Description = "High-level KPIs for leadership review", Icon = "chart-bar" }
        };
        return Ok(reportTypes);
    }

    /// <summary>
    /// Enhance/improve text using AI (grammar, clarity, professionalism)
    /// </summary>
    [HttpPost("enhance-text")]
    [AllowAnonymous] // Allow during ticket creation
    public async Task<ActionResult<EnhanceTextResponse>> EnhanceText([FromBody] EnhanceTextRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new EnhanceTextResponse 
            { 
                Success = false, 
                ErrorMessage = "Text is required" 
            });
        }

        _logger.LogInformation("Enhancing text, length: {Length}", request.Text.Length);
        var result = await _aiService.EnhanceTextAsync(request);
        return Ok(result);
    }
}

/// <summary>
/// Simplified request for quick categorization
/// </summary>
public class QuickCategorizeRequest
{
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public List<string>? Categories { get; set; }
}

/// <summary>
/// Branch option for dropdown
/// </summary>
public class BranchOption
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

/// <summary>
/// Report type option
/// </summary>
public class ReportTypeOption
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}
