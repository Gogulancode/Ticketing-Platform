namespace ERPTraining.Core.DTOs.Analytics;

/// <summary>
/// Branch analytics summary
/// </summary>
public class BranchAnalyticsDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string BranchCode { get; set; } = string.Empty;
    public bool IsHeadquarters { get; set; }
    
    // Ticket counts
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int ClosedTickets { get; set; }
    public int PendingTickets { get; set; }
    public int OverdueTickets { get; set; }
    
    // Agent info
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public double AvgTicketsPerAgent { get; set; }
    
    // Performance metrics
    public double AvgResolutionTimeHours { get; set; }
    public double AvgFirstResponseTimeHours { get; set; }
    public double SlaComplianceRate { get; set; }
    public double CustomerSatisfactionScore { get; set; }
    
    // Trends (last 30 days)
    public int TicketsCreatedLast30Days { get; set; }
    public int TicketsResolvedLast30Days { get; set; }
    public double ResolutionRate { get; set; }
}

/// <summary>
/// Overall analytics summary across all branches
/// </summary>
public class OverallAnalyticsDto
{
    public int TotalBranches { get; set; }
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int ClosedTickets { get; set; }
    public int OverdueTickets { get; set; }
    public int TotalAgents { get; set; }
    public double AvgResolutionTimeHours { get; set; }
    public double OverallSlaComplianceRate { get; set; }
    
    public List<BranchAnalyticsDto> BranchBreakdown { get; set; } = new();
}

/// <summary>
/// Time series data for charts
/// </summary>
public class TimeSeriesDataPoint
{
    public DateTime Date { get; set; }
    public int Value { get; set; }
    public string? Label { get; set; }
}

/// <summary>
/// Branch ticket trend data
/// </summary>
public class BranchTicketTrendDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public List<TimeSeriesDataPoint> Created { get; set; } = new();
    public List<TimeSeriesDataPoint> Resolved { get; set; } = new();
    public List<TimeSeriesDataPoint> Open { get; set; } = new();
}

/// <summary>
/// Category distribution for a branch
/// </summary>
public class CategoryDistributionDto
{
    public string CategoryName { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

/// <summary>
/// Priority distribution for a branch
/// </summary>
public class PriorityDistributionDto
{
    public string Priority { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

/// <summary>
/// Agent performance in a branch
/// </summary>
public class AgentPerformanceDto
{
    public string AgentId { get; set; } = string.Empty;
    public string AgentName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    
    public int AssignedTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int OpenTickets { get; set; }
    public double AvgResolutionTimeHours { get; set; }
    public double SlaComplianceRate { get; set; }
    public double CustomerSatisfactionScore { get; set; }
}

/// <summary>
/// SLA performance by branch
/// </summary>
public class BranchSlaPerformanceDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public int TotalTicketsWithSla { get; set; }
    public int TicketsMeetingSla { get; set; }
    public int TicketsBreachingSla { get; set; }
    public double ComplianceRate { get; set; }
    public double AvgResponseTimeHours { get; set; }
    public double AvgResolutionTimeHours { get; set; }
}

/// <summary>
/// Request for analytics with date range
/// </summary>
public class AnalyticsRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? BranchId { get; set; }
    public string? GroupBy { get; set; } = "day"; // day, week, month
}

/// <summary>
/// Comparative analytics between branches
/// </summary>
public class BranchComparisonDto
{
    public List<BranchMetricComparison> Metrics { get; set; } = new();
}

/// <summary>
/// Single metric comparison across branches
/// </summary>
public class BranchMetricComparison
{
    public string MetricName { get; set; } = string.Empty;
    public List<BranchMetricValue> Values { get; set; } = new();
}

/// <summary>
/// Metric value for a specific branch
/// </summary>
public class BranchMetricValue
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public double Value { get; set; }
}
