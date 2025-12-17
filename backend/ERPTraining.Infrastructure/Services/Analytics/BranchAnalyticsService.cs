using ERPTraining.Core.DTOs.Analytics;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Services.Analytics;

/// <summary>
/// Branch analytics service implementation
/// </summary>
public class BranchAnalyticsService : IBranchAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BranchAnalyticsService> _logger;

    public BranchAnalyticsService(ApplicationDbContext context, ILogger<BranchAnalyticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Get closed status IDs from the database
    private async Task<List<int>> GetClosedStatusIdsAsync()
    {
        return await _context.TicketStatuses
            .Where(s => s.IsClosedStatus || s.Name.ToLower().Contains("closed") || s.Name.ToLower().Contains("resolved"))
            .Select(s => s.Id)
            .ToListAsync();
    }

    // Get open status IDs from the database
    private async Task<List<int>> GetOpenStatusIdsAsync()
    {
        return await _context.TicketStatuses
            .Where(s => !s.IsClosedStatus && s.IsActive)
            .Select(s => s.Id)
            .ToListAsync();
    }

    public async Task<OverallAnalyticsDto> GetOverallAnalyticsAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        var branches = await _context.Branches.Where(b => b.IsActive).ToListAsync();
        var branchAnalytics = new List<BranchAnalyticsDto>();

        foreach (var branch in branches)
        {
            var analytics = await GetBranchAnalyticsAsync(branch.Id, start, end);
            if (analytics != null)
            {
                branchAnalytics.Add(analytics);
            }
        }

        // Get status IDs
        var closedStatusIds = await GetClosedStatusIdsAsync();

        // Calculate totals
        var allTickets = await _context.Tickets
            .Where(t => t.CreatedAt >= start && t.CreatedAt <= end)
            .ToListAsync();

        var totalAgents = await _context.Users
            .Where(u => u.IsAgent == true)
            .CountAsync();

        var closedTickets = allTickets.Where(t => closedStatusIds.Contains(t.Status)).ToList();

        double avgResolutionTime = 0;
        if (closedTickets.Any())
        {
            avgResolutionTime = closedTickets
                .Where(t => t.ResolvedAt.HasValue)
                .Select(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours)
                .DefaultIfEmpty(0)
                .Average();
        }

        // SLA compliance (simplified - tickets resolved within SLA)
        var ticketsWithSla = allTickets.Where(t => t.SlaPolicyId.HasValue).ToList();
        var slaCompliant = ticketsWithSla.Count > 0 
            ? ticketsWithSla.Count(t => !t.SlaBreached) / (double)ticketsWithSla.Count * 100 
            : 100;

        // Count open tickets
        var openStatusIds = await GetOpenStatusIdsAsync();
        var openTicketCount = allTickets.Count(t => openStatusIds.Contains(t.Status));

        return new OverallAnalyticsDto
        {
            TotalBranches = branches.Count,
            TotalTickets = allTickets.Count,
            OpenTickets = openTicketCount,
            ClosedTickets = closedTickets.Count,
            OverdueTickets = allTickets.Count(t => t.SlaBreached),
            TotalAgents = totalAgents,
            AvgResolutionTimeHours = Math.Round(avgResolutionTime, 1),
            OverallSlaComplianceRate = Math.Round(slaCompliant, 1),
            BranchBreakdown = branchAnalytics.OrderByDescending(b => b.TotalTickets).ToList()
        };
    }

    public async Task<BranchAnalyticsDto?> GetBranchAnalyticsAsync(int branchId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var branch = await _context.Branches.FindAsync(branchId);
        if (branch == null) return null;

        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        // Get users in this branch
        var branchUserIds = await _context.Users
            .Where(u => u.BranchId == branchId)
            .Select(u => u.Id)
            .ToListAsync();

        // Get tickets created by users in this branch OR assigned to agents in this branch
        var branchTickets = await _context.Tickets
            .Where(t => t.CreatedAt >= start && t.CreatedAt <= end &&
                (branchUserIds.Contains(t.CreatedByUserId ?? "") || 
                 branchUserIds.Contains(t.AssignedToUserId ?? "")))
            .ToListAsync();

        // Get status IDs
        var closedStatusIds = await GetClosedStatusIdsAsync();
        var openStatusIds = await GetOpenStatusIdsAsync();

        // Get pending status
        var pendingStatusId = await _context.TicketStatuses
            .Where(s => s.Name.ToLower().Contains("pending"))
            .Select(s => s.Id)
            .FirstOrDefaultAsync();

        var openTickets = branchTickets.Count(t => openStatusIds.Contains(t.Status));
        var closedTickets = branchTickets.Count(t => closedStatusIds.Contains(t.Status));
        var pendingTickets = pendingStatusId > 0 ? branchTickets.Count(t => t.Status == pendingStatusId) : 0;

        // Agent counts
        var branchAgents = await _context.Users
            .Where(u => u.BranchId == branchId && u.IsAgent == true)
            .ToListAsync();

        var activeAgents = branchAgents.Count(a => a.IsActive);

        // Resolution time
        var resolvedTickets = branchTickets
            .Where(t => t.ResolvedAt.HasValue)
            .ToList();

        double avgResolutionTime = resolvedTickets.Any()
            ? resolvedTickets.Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours)
            : 0;

        // First response time (using first comment if available)
        double avgFirstResponseTime = 0;
        // This would need ticket comments data - simplified for now

        // SLA compliance
        var ticketsWithSla = branchTickets.Where(t => t.SlaPolicyId.HasValue).ToList();
        var slaCompliance = ticketsWithSla.Count > 0
            ? ticketsWithSla.Count(t => !t.SlaBreached) / (double)ticketsWithSla.Count * 100
            : 100;

        // Last 30 days trends
        var last30Days = DateTime.UtcNow.AddDays(-30);
        var ticketsCreatedLast30 = branchTickets.Count(t => t.CreatedAt >= last30Days);
        var ticketsResolvedLast30 = branchTickets.Count(t => t.ResolvedAt >= last30Days);

        var resolutionRate = ticketsCreatedLast30 > 0
            ? (double)ticketsResolvedLast30 / ticketsCreatedLast30 * 100
            : 0;

        return new BranchAnalyticsDto
        {
            BranchId = branch.Id,
            BranchName = branch.Name,
            BranchCode = branch.Code,
            IsHeadquarters = branch.IsHeadquarters,
            TotalTickets = branchTickets.Count,
            OpenTickets = openTickets,
            ClosedTickets = closedTickets,
            PendingTickets = pendingTickets,
            OverdueTickets = branchTickets.Count(t => t.SlaBreached),
            TotalAgents = branchAgents.Count,
            ActiveAgents = activeAgents,
            AvgTicketsPerAgent = activeAgents > 0 ? Math.Round((double)branchTickets.Count / activeAgents, 1) : 0,
            AvgResolutionTimeHours = Math.Round(avgResolutionTime, 1),
            AvgFirstResponseTimeHours = Math.Round(avgFirstResponseTime, 1),
            SlaComplianceRate = Math.Round(slaCompliance, 1),
            CustomerSatisfactionScore = 0, // Would need CSAT data
            TicketsCreatedLast30Days = ticketsCreatedLast30,
            TicketsResolvedLast30Days = ticketsResolvedLast30,
            ResolutionRate = Math.Round(resolutionRate, 1)
        };
    }

    public async Task<List<BranchTicketTrendDto>> GetTicketTrendsAsync(int? branchId = null, int days = 30)
    {
        var startDate = DateTime.UtcNow.AddDays(-days);
        var trends = new List<BranchTicketTrendDto>();

        var branches = branchId.HasValue
            ? await _context.Branches.Where(b => b.Id == branchId.Value).ToListAsync()
            : await _context.Branches.Where(b => b.IsActive).ToListAsync();

        var openStatusIds = await GetOpenStatusIdsAsync();

        foreach (var branch in branches)
        {
            var branchUserIds = await _context.Users
                .Where(u => u.BranchId == branch.Id)
                .Select(u => u.Id)
                .ToListAsync();

            var branchTickets = await _context.Tickets
                .Where(t => t.CreatedAt >= startDate &&
                    (branchUserIds.Contains(t.CreatedByUserId ?? "") ||
                     branchUserIds.Contains(t.AssignedToUserId ?? "")))
                .ToListAsync();

            var trend = new BranchTicketTrendDto
            {
                BranchId = branch.Id,
                BranchName = branch.Name,
                Created = new List<TimeSeriesDataPoint>(),
                Resolved = new List<TimeSeriesDataPoint>(),
                Open = new List<TimeSeriesDataPoint>()
            };

            // Group by day
            for (var date = startDate.Date; date <= DateTime.UtcNow.Date; date = date.AddDays(1))
            {
                var createdCount = branchTickets.Count(t => t.CreatedAt.Date == date);
                var resolvedCount = branchTickets.Count(t => t.ResolvedAt?.Date == date);
                
                var openCount = branchTickets.Count(t => 
                    t.CreatedAt.Date <= date &&
                    (t.ResolvedAt == null || t.ResolvedAt.Value.Date > date) &&
                    openStatusIds.Contains(t.Status));

                trend.Created.Add(new TimeSeriesDataPoint { Date = date, Value = createdCount, Label = date.ToString("MMM dd") });
                trend.Resolved.Add(new TimeSeriesDataPoint { Date = date, Value = resolvedCount, Label = date.ToString("MMM dd") });
                trend.Open.Add(new TimeSeriesDataPoint { Date = date, Value = openCount, Label = date.ToString("MMM dd") });
            }

            trends.Add(trend);
        }

        return trends;
    }

    public async Task<List<CategoryDistributionDto>> GetCategoryDistributionAsync(int? branchId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        IQueryable<ERPTraining.Core.Entities.Ticketing.Ticket> query = _context.Tickets
            .Where(t => t.CreatedAt >= start && t.CreatedAt <= end);

        if (branchId.HasValue)
        {
            var branchUserIds = await _context.Users
                .Where(u => u.BranchId == branchId.Value)
                .Select(u => u.Id)
                .ToListAsync();

            query = query.Where(t => 
                branchUserIds.Contains(t.CreatedByUserId ?? "") ||
                branchUserIds.Contains(t.AssignedToUserId ?? ""));
        }

        var tickets = await query.ToListAsync();
        var total = tickets.Count;

        // Group by Category enum
        var distribution = tickets
            .GroupBy(t => t.Category.ToString())
            .Select(g => new CategoryDistributionDto
            {
                CategoryName = g.Key,
                Count = g.Count(),
                Percentage = total > 0 ? Math.Round((double)g.Count() / total * 100, 1) : 0
            })
            .OrderByDescending(d => d.Count)
            .ToList();

        return distribution;
    }

    public async Task<List<PriorityDistributionDto>> GetPriorityDistributionAsync(int? branchId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        IQueryable<ERPTraining.Core.Entities.Ticketing.Ticket> query = _context.Tickets
            .Where(t => t.CreatedAt >= start && t.CreatedAt <= end);

        if (branchId.HasValue)
        {
            var branchUserIds = await _context.Users
                .Where(u => u.BranchId == branchId.Value)
                .Select(u => u.Id)
                .ToListAsync();

            query = query.Where(t =>
                branchUserIds.Contains(t.CreatedByUserId ?? "") ||
                branchUserIds.Contains(t.AssignedToUserId ?? ""));
        }

        var tickets = await query.ToListAsync();
        var total = tickets.Count;

        // Group by Priority enum
        var distribution = tickets
            .GroupBy(t => t.Priority.ToString())
            .Select(g => new PriorityDistributionDto
            {
                Priority = g.Key,
                Count = g.Count(),
                Percentage = total > 0 ? Math.Round((double)g.Count() / total * 100, 1) : 0
            })
            .OrderByDescending(d => d.Count)
            .ToList();

        return distribution;
    }

    public async Task<List<AgentPerformanceDto>> GetAgentPerformanceAsync(int? branchId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        var agentsQuery = _context.Users.Where(u => u.IsAgent == true);
        
        if (branchId.HasValue)
        {
            agentsQuery = agentsQuery.Where(u => u.BranchId == branchId.Value);
        }

        var agents = await agentsQuery
            .Include(u => u.Branch)
            .ToListAsync();

        var openStatusIds = await GetOpenStatusIdsAsync();
        var performances = new List<AgentPerformanceDto>();

        foreach (var agent in agents)
        {
            var assignedTickets = await _context.Tickets
                .Where(t => t.AssignedToUserId == agent.Id &&
                           t.CreatedAt >= start && t.CreatedAt <= end)
                .ToListAsync();

            var resolvedTickets = assignedTickets
                .Where(t => t.ResolvedAt.HasValue)
                .ToList();

            var openTickets = assignedTickets
                .Count(t => openStatusIds.Contains(t.Status));

            var avgResolutionTime = resolvedTickets.Any()
                ? resolvedTickets.Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours)
                : 0;

            var ticketsWithSla = assignedTickets.Where(t => t.SlaPolicyId.HasValue).ToList();
            var slaCompliance = ticketsWithSla.Count > 0
                ? ticketsWithSla.Count(t => !t.SlaBreached) / (double)ticketsWithSla.Count * 100
                : 100;

            performances.Add(new AgentPerformanceDto
            {
                AgentId = agent.Id,
                AgentName = $"{agent.FirstName} {agent.LastName}".Trim(),
                Email = agent.Email ?? "",
                BranchId = agent.BranchId ?? 0,
                BranchName = agent.Branch?.Name ?? "Unassigned",
                AssignedTickets = assignedTickets.Count,
                ResolvedTickets = resolvedTickets.Count,
                OpenTickets = openTickets,
                AvgResolutionTimeHours = Math.Round(avgResolutionTime, 1),
                SlaComplianceRate = Math.Round(slaCompliance, 1),
                CustomerSatisfactionScore = 0 // Would need CSAT data
            });
        }

        return performances.OrderByDescending(p => p.ResolvedTickets).ToList();
    }

    public async Task<List<BranchSlaPerformanceDto>> GetSlaPerformanceAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        var branches = await _context.Branches.Where(b => b.IsActive).ToListAsync();
        var performances = new List<BranchSlaPerformanceDto>();

        foreach (var branch in branches)
        {
            var branchUserIds = await _context.Users
                .Where(u => u.BranchId == branch.Id)
                .Select(u => u.Id)
                .ToListAsync();

            var branchTickets = await _context.Tickets
                .Where(t => t.CreatedAt >= start && t.CreatedAt <= end &&
                    t.SlaPolicyId.HasValue &&
                    (branchUserIds.Contains(t.CreatedByUserId ?? "") ||
                     branchUserIds.Contains(t.AssignedToUserId ?? "")))
                .ToListAsync();

            var meetingSla = branchTickets.Count(t => !t.SlaBreached);
            var breachingSla = branchTickets.Count(t => t.SlaBreached);

            var resolvedTickets = branchTickets.Where(t => t.ResolvedAt.HasValue).ToList();
            var avgResolutionTime = resolvedTickets.Any()
                ? resolvedTickets.Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours)
                : 0;

            performances.Add(new BranchSlaPerformanceDto
            {
                BranchId = branch.Id,
                BranchName = branch.Name,
                TotalTicketsWithSla = branchTickets.Count,
                TicketsMeetingSla = meetingSla,
                TicketsBreachingSla = breachingSla,
                ComplianceRate = branchTickets.Count > 0
                    ? Math.Round((double)meetingSla / branchTickets.Count * 100, 1)
                    : 100,
                AvgResponseTimeHours = 0, // Would need first response tracking
                AvgResolutionTimeHours = Math.Round(avgResolutionTime, 1)
            });
        }

        return performances.OrderByDescending(p => p.ComplianceRate).ToList();
    }

    public async Task<BranchComparisonDto> GetBranchComparisonAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var overall = await GetOverallAnalyticsAsync(startDate, endDate);
        
        var comparison = new BranchComparisonDto
        {
            Metrics = new List<BranchMetricComparison>
            {
                new BranchMetricComparison
                {
                    MetricName = "Total Tickets",
                    Values = overall.BranchBreakdown.Select(b => new BranchMetricValue
                    {
                        BranchId = b.BranchId,
                        BranchName = b.BranchName,
                        Value = b.TotalTickets
                    }).ToList()
                },
                new BranchMetricComparison
                {
                    MetricName = "Open Tickets",
                    Values = overall.BranchBreakdown.Select(b => new BranchMetricValue
                    {
                        BranchId = b.BranchId,
                        BranchName = b.BranchName,
                        Value = b.OpenTickets
                    }).ToList()
                },
                new BranchMetricComparison
                {
                    MetricName = "SLA Compliance (%)",
                    Values = overall.BranchBreakdown.Select(b => new BranchMetricValue
                    {
                        BranchId = b.BranchId,
                        BranchName = b.BranchName,
                        Value = b.SlaComplianceRate
                    }).ToList()
                },
                new BranchMetricComparison
                {
                    MetricName = "Avg Resolution Time (hrs)",
                    Values = overall.BranchBreakdown.Select(b => new BranchMetricValue
                    {
                        BranchId = b.BranchId,
                        BranchName = b.BranchName,
                        Value = b.AvgResolutionTimeHours
                    }).ToList()
                },
                new BranchMetricComparison
                {
                    MetricName = "Resolution Rate (%)",
                    Values = overall.BranchBreakdown.Select(b => new BranchMetricValue
                    {
                        BranchId = b.BranchId,
                        BranchName = b.BranchName,
                        Value = b.ResolutionRate
                    }).ToList()
                }
            }
        };

        return comparison;
    }
}
