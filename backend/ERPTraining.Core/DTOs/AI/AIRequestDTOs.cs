namespace ERPTraining.Core.DTOs.AI;

/// <summary>
/// Request to categorize a ticket based on its content
/// </summary>
public class CategorizationRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> AvailableCategories { get; set; } = new();
    public List<string> AvailablePriorities { get; set; } = new() { "Low", "Medium", "High", "Critical" };
}

/// <summary>
/// Response from ticket categorization
/// </summary>
public class CategorizationResponse
{
    public bool Success { get; set; }
    public string? SuggestedCategory { get; set; }
    public string? SuggestedPriority { get; set; }
    public double Confidence { get; set; }
    public string? Reasoning { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request to generate response suggestions for a ticket
/// </summary>
public class ResponseSuggestionRequest
{
    public string TicketSubject { get; set; } = string.Empty;
    public string TicketDescription { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Priority { get; set; }
    public List<TicketCommentSummary> RecentComments { get; set; } = new();
    public string? CustomerName { get; set; }
    public int SuggestionCount { get; set; } = 3;
    public string? Tone { get; set; } = "professional"; // professional, friendly, formal
}

/// <summary>
/// Summary of a ticket comment for AI context
/// </summary>
public class TicketCommentSummary
{
    public string Author { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Response with suggested replies
/// </summary>
public class ResponseSuggestionResponse
{
    public bool Success { get; set; }
    public List<SuggestedResponse> Suggestions { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// A single suggested response
/// </summary>
public class SuggestedResponse
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Tone { get; set; } = string.Empty;
}

/// <summary>
/// Request to summarize a ticket thread
/// </summary>
public class SummarizationRequest
{
    public string TicketSubject { get; set; } = string.Empty;
    public string TicketDescription { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Status { get; set; }
    public List<TicketCommentSummary> Comments { get; set; } = new();
    public string? SummaryType { get; set; } = "brief"; // brief, detailed, action-items
}

/// <summary>
/// Response with ticket summary
/// </summary>
public class SummarizationResponse
{
    public bool Success { get; set; }
    public string? Summary { get; set; }
    public List<string> KeyPoints { get; set; } = new();
    public List<string> ActionItems { get; set; } = new();
    public string? CustomerSentiment { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request for knowledge base search
/// </summary>
public class KnowledgeSearchRequest
{
    public string Query { get; set; } = string.Empty;
    public string? TicketContext { get; set; }
    public int MaxResults { get; set; } = 5;
}

/// <summary>
/// Knowledge base search response
/// </summary>
public class KnowledgeSearchResponse
{
    public bool Success { get; set; }
    public List<KnowledgeResult> Results { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// A knowledge base search result
/// </summary>
public class KnowledgeResult
{
    public string Title { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public string? ArticleId { get; set; }
    public double Relevance { get; set; }
}

/// <summary>
/// Check AI service status
/// </summary>
public class AIStatusResponse
{
    public bool Enabled { get; set; }
    public bool Connected { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request for dashboard AI insights analysis
/// </summary>
public class DashboardInsightsRequest
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int OverdueTickets { get; set; }
    public double AvgResolutionHours { get; set; }
    public List<CategoryBreakdown> CategoryBreakdown { get; set; } = new();
    public List<DepartmentBreakdown> DepartmentBreakdown { get; set; } = new();
    public List<AgentPerformance> TopAgents { get; set; } = new();
    public string? Period { get; set; } = "week"; // week, month, quarter
}

/// <summary>
/// Category breakdown for insights
/// </summary>
public class CategoryBreakdown
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

/// <summary>
/// Department breakdown for insights
/// </summary>
public class DepartmentBreakdown
{
    public string Department { get; set; } = string.Empty;
    public int Count { get; set; }
    public double AvgResolutionHours { get; set; }
}

/// <summary>
/// Agent performance for insights
/// </summary>
public class AgentPerformance
{
    public string AgentName { get; set; } = string.Empty;
    public int TicketsResolved { get; set; }
    public double AvgResolutionHours { get; set; }
    public double SatisfactionScore { get; set; }
}

/// <summary>
/// Response with dashboard AI insights
/// </summary>
public class DashboardInsightsResponse
{
    public bool Success { get; set; }
    public string? Summary { get; set; }
    public List<string> KeyInsights { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public List<string> Trends { get; set; } = new();
    public List<string> Alerts { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request for AI-generated report
/// </summary>
public class AIReportRequest
{
    public string ReportType { get; set; } = "weekly"; // weekly, monthly, quarterly, branch, agent-performance, sla, category, executive
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Department { get; set; }
    public int? BranchId { get; set; }
    public bool IncludeAgentAnalysis { get; set; } = true;
    public bool IncludeTrends { get; set; } = true;
    public bool IncludeRecommendations { get; set; } = true;
    public bool IncludeBranchComparison { get; set; } = false;
    public bool IncludeSlaAnalysis { get; set; } = true;
    
    // Analytics data to pass to AI
    public ReportAnalyticsData? AnalyticsData { get; set; }
}

/// <summary>
/// Analytics data for AI report generation
/// </summary>
public class ReportAnalyticsData
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int ClosedTickets { get; set; }
    public int OverdueTickets { get; set; }
    public double AvgResolutionHours { get; set; }
    public double SlaComplianceRate { get; set; }
    public int TotalAgents { get; set; }
    public List<BranchReportData> BranchBreakdown { get; set; } = new();
    public List<CategoryBreakdown> CategoryBreakdown { get; set; } = new();
    public List<AgentPerformance> AgentPerformance { get; set; } = new();
}

/// <summary>
/// Branch performance data for reports
/// </summary>
public class BranchReportData
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string BranchCode { get; set; } = string.Empty;
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int ClosedTickets { get; set; }
    public int OverdueTickets { get; set; }
    public double AvgResolutionHours { get; set; }
    public double SlaComplianceRate { get; set; }
    public int AgentCount { get; set; }
    public double TicketsPerAgent { get; set; }
}

/// <summary>
/// Response with AI-generated report
/// </summary>
public class AIReportResponse
{
    public bool Success { get; set; }
    public string? ReportTitle { get; set; }
    public string? ExecutiveSummary { get; set; }
    public List<ReportSection> Sections { get; set; } = new();
    public List<string> KeyMetrics { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public string? Conclusion { get; set; }
    public DateTime GeneratedAt { get; set; }
    public string? ErrorMessage { get; set; }
    // Extended data for branch reports
    public List<BranchReportData>? BranchData { get; set; }
}

/// <summary>
/// A section within the report
/// </summary>
public class ReportSection
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Highlights { get; set; } = new();
}

/// <summary>
/// Request to enhance/improve text using AI
/// </summary>
public class EnhanceTextRequest
{
    public string Text { get; set; } = string.Empty;
    public string? Context { get; set; } // e.g., "ticket description", "reply", "title"
    public string? Tone { get; set; } = "professional"; // professional, formal, friendly, concise
    public bool FixGrammar { get; set; } = true;
    public bool ImproveClarity { get; set; } = true;
    public bool MakeMoreConcise { get; set; } = false;
}

/// <summary>
/// Response with enhanced text
/// </summary>
public class EnhanceTextResponse
{
    public bool Success { get; set; }
    public string? EnhancedText { get; set; }
    public List<string> Improvements { get; set; } = new(); // List of changes made
    public string? ErrorMessage { get; set; }
}
