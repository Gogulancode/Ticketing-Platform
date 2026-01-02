using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;
using TicketingTicket = ERPTraining.Core.Entities.Ticketing.Ticket;
using System.Collections.Generic;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReportsController> _logger;
        private static readonly IReadOnlyDictionary<int, string> DefaultStatusNames = new Dictionary<int, string>
        {
            { 1, "Open" },
            { 2, "In Progress" },
            { 3, "Waiting on User" },
            { 4, "Resolved" },
            { 5, "Closed" },
            { 6, "Waiting for Third Party" },
            { 1007, "Reopened" },
            { 1009, "Merged" }
        };

        public ReportsController(ApplicationDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Resolution & Response Time Report
        [HttpGet("resolution-response")]
        public async Task<IActionResult> GetResolutionResponseReport(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? category = null,
            [FromQuery] string? priority = null)
        {
            try
            {
                var query = ApplyCreatedDateRangeFilter(_context.Tickets.AsQueryable(), startDate, endDate);

                // Apply category filter (supports multiple comma-separated IDs for Category Admins)
                if (!string.IsNullOrEmpty(category))
                {
                    var categoryIds = category.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(c => int.TryParse(c.Trim(), out var id) ? id : (int?)null)
                        .Where(id => id.HasValue)
                        .Select(id => id!.Value)
                        .ToList();
                    
                    if (categoryIds.Any())
                        query = query.Where(t => t.CategoryId.HasValue && categoryIds.Contains(t.CategoryId.Value));
                }

                // Apply priority filter (by ID or name)
                if (!string.IsNullOrEmpty(priority))
                {
                    if (int.TryParse(priority, out var priorityId))
                        query = query.Where(t => t.Priority == (TicketPriority)priorityId);
                }

                // Order by PublicId descending (newest first)
                var tickets = await query.OrderByDescending(t => t.PublicId).ToListAsync();
                var lookupCache = await LoadTicketLookupsAsync();

                var reportData = tickets.Select(ticket => new
                {
                    ticketId = ticket.Id.ToString(),
                    publicId = ticket.PublicId,
                    title = ticket.Title,
                    category = ResolveCategoryName(ticket, lookupCache),
                    priority = ResolvePriorityName(ticket, lookupCache),
                    status = ResolveStatusName(ticket, lookupCache),
                    createdAt = ticket.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    firstResponseAt = ticket.FirstResponseAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    resolvedAt = ticket.ResolvedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    responseTime = CalculateResponseTime(ticket.CreatedAt, ticket.FirstResponseAt),
                    resolutionTime = CalculateResolutionTime(ticket.CreatedAt, ticket.ResolvedAt),
                    assignedAgent = GetAssignedAgentName(ticket.AssignedToUserId),
                    department = ResolveDepartmentName(ticket.DepartmentId, lookupCache)
                }).ToList();

                return Ok(reportData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating resolution response report");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // Agent Performance Report
        [HttpGet("agent-performance")]
        public async Task<IActionResult> GetAgentPerformanceReport(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? department = null,
            [FromQuery] string? category = null)
        {
            try
            {
                var query = ApplyCreatedDateRangeFilter(_context.Tickets.AsQueryable(), startDate, endDate);

                // Apply category filter (supports comma-separated IDs for Category Admins)
                if (!string.IsNullOrEmpty(category))
                {
                    var categoryIds = category.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(c => int.TryParse(c.Trim(), out var id) ? id : (int?)null)
                        .Where(id => id.HasValue)
                        .Select(id => id!.Value)
                        .ToList();
                    
                    if (categoryIds.Any())
                        query = query.Where(t => t.CategoryId.HasValue && categoryIds.Contains(t.CategoryId.Value));
                }

                var tickets = await query.ToListAsync();

                // Group by assigned agent
                var agentGroups = tickets
                    .Where(t => !string.IsNullOrEmpty(t.AssignedToUserId))
                    .GroupBy(t => t.AssignedToUserId)
                    .Select(g => new
                    {
                        agentId = g.Key,
                        agentName = GetAssignedAgentName(g.Key),
                        email = GetAgentEmail(g.Key),
                        department = GetAgentDepartment(g.Key),
                        totalTickets = g.Count(),
                        resolvedTickets = g.Count(t => t.Status == 4), // Resolved status ID
                        avgResponseTime = CalculateAverageResponseTime(g.ToList()),
                        avgResolutionTime = CalculateAverageResolutionTime(g.ToList()),
                        resolutionRate = g.Count() > 0 ? (double)g.Count(t => t.Status == 4) / g.Count() * 100 : 0,
                        satisfactionRating = GetAgentSatisfactionRating(g.Key!)
                    }).ToList();

                return Ok(agentGroups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating agent performance report");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // Unresolved Tickets Report
        [HttpGet("unresolved")]
        public async Task<IActionResult> GetUnresolvedTicketsReport(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? category = null,
            [FromQuery] string? priority = null,
            [FromQuery] string? agent = null,
            [FromQuery] string? department = null,
            [FromQuery] string? search = null)
        {
            try
            {
                var query = ApplyCreatedDateRangeFilter(
                    _context.Tickets.Where(t => t.Status != 4 && t.Status != 5).AsQueryable(),
                    startDate,
                    endDate);

                // Apply filters (category supports multiple comma-separated IDs for Category Admins)
                if (!string.IsNullOrEmpty(category))
                {
                    var categoryIds = category.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(c => int.TryParse(c.Trim(), out var id) ? id : (int?)null)
                        .Where(id => id.HasValue)
                        .Select(id => id!.Value)
                        .ToList();
                    
                    if (categoryIds.Any())
                        query = query.Where(t => t.CategoryId.HasValue && categoryIds.Contains(t.CategoryId.Value));
                }
                if (!string.IsNullOrEmpty(priority) && int.TryParse(priority, out var priorityId))
                    query = query.Where(t => t.Priority == (TicketPriority)priorityId);
                if (!string.IsNullOrEmpty(agent))
                    query = query.Where(t => t.AssignedToUserId == agent);
                if (!string.IsNullOrEmpty(department) && int.TryParse(department, out var departmentId))
                    query = query.Where(t => t.DepartmentId == departmentId);
                if (!string.IsNullOrEmpty(search))
                    query = query.Where(t => t.Title.Contains(search) || t.Description.Contains(search));

                // Order by PublicId descending (newest first)
                var tickets = await query.OrderByDescending(t => t.PublicId).ToListAsync();
                var lookupCache = await LoadTicketLookupsAsync();

                var reportData = tickets.Select(ticket => new
                {
                    ticketId = ticket.Id.ToString(),
                    publicId = ticket.PublicId,
                    title = ticket.Title,
                    category = ResolveCategoryName(ticket, lookupCache),
                    priority = ResolvePriorityName(ticket, lookupCache),
                    status = ResolveStatusName(ticket, lookupCache),
                    createdAt = ticket.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    assignedAgent = GetAssignedAgentName(ticket.AssignedToUserId),
                    department = ResolveDepartmentName(ticket.DepartmentId, lookupCache),
                    daysSinceCreation = (int)(DateTime.UtcNow - ticket.CreatedAt).TotalDays,
                    lastUpdated = ticket.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }).ToList();

                return Ok(reportData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating unresolved tickets report");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // All Tickets Report
        [HttpGet("all-tickets")]
        public async Task<IActionResult> GetAllTicketsReport(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? category = null,
            [FromQuery] string? priority = null,
            [FromQuery] string? status = null,
            [FromQuery] string? agent = null,
            [FromQuery] string? department = null,
            [FromQuery] string? search = null)
        {
            try
            {
                var query = ApplyCreatedDateRangeFilter(_context.Tickets.AsQueryable(), startDate, endDate);
                
                // Apply category filter (supports multiple comma-separated IDs for Category Admins)
                if (!string.IsNullOrEmpty(category))
                {
                    var categoryIds = category.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(c => int.TryParse(c.Trim(), out var id) ? id : (int?)null)
                        .Where(id => id.HasValue)
                        .Select(id => id!.Value)
                        .ToList();
                    
                    if (categoryIds.Any())
                        query = query.Where(t => t.CategoryId.HasValue && categoryIds.Contains(t.CategoryId.Value));
                }
                if (!string.IsNullOrEmpty(priority) && Enum.TryParse<TicketPriority>(priority, out var priorityEnum))
                    query = query.Where(t => t.Priority == priorityEnum);
                if (!string.IsNullOrEmpty(status) && int.TryParse(status, out var statusId))
                    query = query.Where(t => t.Status == statusId);
                if (!string.IsNullOrEmpty(agent))
                    query = query.Where(t => t.AssignedToUserId == agent);
                if (!string.IsNullOrEmpty(search))
                    query = query.Where(t => t.Title.Contains(search) || t.Description.Contains(search));

                // Order by PublicId descending (newest first)
                var tickets = await query.OrderByDescending(t => t.PublicId).ToListAsync();
                var lookupCache = await LoadTicketLookupsAsync();

                var reportData = tickets.Select(ticket => new
                {
                    ticketId = ticket.Id.ToString(),
                    publicId = ticket.PublicId,
                    title = ticket.Title,
                    category = ResolveCategoryName(ticket, lookupCache),
                    subcategory = ResolveSubcategoryName(ticket, lookupCache),
                    priority = ResolvePriorityName(ticket, lookupCache),
                    status = ResolveStatusName(ticket, lookupCache),
                    createdAt = ticket.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    assignedAgent = GetAssignedAgentName(ticket.AssignedToUserId),
                    department = ResolveDepartmentName(ticket.DepartmentId, lookupCache),
                    source = ticket.Source.ToString(),
                    isOverdue = ticket.IsOverdue
                }).ToList();

                return Ok(reportData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating all tickets report");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // Helper methods
        private static IQueryable<TicketingTicket> ApplyCreatedDateRangeFilter(
            IQueryable<TicketingTicket> query,
            DateTime? startDate,
            DateTime? endDate)
        {
            if (startDate.HasValue)
            {
                var startBoundary = startDate.Value.Date;
                query = query.Where(t => t.CreatedAt >= startBoundary);
            }

            if (endDate.HasValue)
            {
                var exclusiveEnd = endDate.Value.Date.AddDays(1);
                query = query.Where(t => t.CreatedAt < exclusiveEnd);
            }

            return query;
        }

        private async Task<TicketLookupCache> LoadTicketLookupsAsync()
        {
            var categories = await _context.TicketCategories
                .AsNoTracking()
                .ToDictionaryAsync(c => c.Id, c => c.Name);

            var subCategories = await _context.TicketSubCategories
                .AsNoTracking()
                .ToDictionaryAsync(sc => sc.Id, sc => sc.Name);

            var priorities = await _context.TicketPriorities
                .AsNoTracking()
                .ToDictionaryAsync(p => p.Id, p => p.Name);

            var statuses = await _context.TicketStatuses
                .AsNoTracking()
                .ToDictionaryAsync(s => s.Id, s => s.Name);

            var departments = await _context.TicketDepartments
                .AsNoTracking()
                .ToDictionaryAsync(d => d.Id, d => d.Name);

            return new TicketLookupCache(
                categories,
                subCategories,
                priorities,
                statuses,
                departments
            );
        }

        private string? GetAssignedAgentName(string? userId)
        {
            if (string.IsNullOrEmpty(userId))
                return null;

            // Try to get user from Users table
            var user = _context.Users.AsNoTracking().FirstOrDefault(u => u.Id == userId);
            return user?.FullName ?? "Unknown Agent";
        }

        private string GetAgentEmail(string? userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return string.Empty;
            }

            var user = _context.Users.AsNoTracking().FirstOrDefault(u => u.Id == userId);
            return user?.Email ?? string.Empty;
        }

        private string GetAgentDepartment(string? userId)
        {
            if (string.IsNullOrEmpty(userId))
                return "Unassigned";

            var user = _context.Users.AsNoTracking().FirstOrDefault(u => u.Id == userId);
            return user?.Department ?? "Unknown";
        }

        private static string ResolveCategoryName(TicketingTicket ticket, TicketLookupCache lookups)
        {
            if (ticket.CategoryId.HasValue && lookups.Categories.TryGetValue(ticket.CategoryId.Value, out var configuredName))
            {
                return configuredName;
            }

            var categoryValue = Convert.ToInt32(ticket.Category);
            if (lookups.Categories.TryGetValue(categoryValue, out var legacyName))
            {
                return legacyName;
            }

            return Enum.IsDefined(typeof(TicketCategory), ticket.Category)
                ? ticket.Category.ToString()
                : categoryValue.ToString();
        }

        private static string ResolvePriorityName(TicketingTicket ticket, TicketLookupCache lookups)
        {
            var priorityValue = Convert.ToInt32(ticket.Priority);
            if (lookups.Priorities.TryGetValue(priorityValue, out var configuredName))
            {
                return configuredName;
            }

            return Enum.IsDefined(typeof(TicketPriority), ticket.Priority)
                ? ticket.Priority.ToString()
                : priorityValue.ToString();
        }

        private static string ResolveStatusName(TicketingTicket ticket, TicketLookupCache lookups)
        {
            if (lookups.Statuses.TryGetValue(ticket.Status, out var configuredName) && !string.IsNullOrWhiteSpace(configuredName))
            {
                return configuredName;
            }

            if (DefaultStatusNames.TryGetValue(ticket.Status, out var defaultName))
            {
                return defaultName;
            }

            if (Enum.IsDefined(typeof(TicketStatus), ticket.Status))
            {
                return Enum.GetName(typeof(TicketStatus), ticket.Status) ?? ticket.Status.ToString();
            }

            return ticket.Status.ToString();
        }

        private static string? ResolveSubcategoryName(TicketingTicket ticket, TicketLookupCache lookups)
        {
            int? subcategoryId = ticket.SubcategoryId ?? ticket.SubCategory;
            if (subcategoryId.HasValue && lookups.Subcategories.TryGetValue(subcategoryId.Value, out var configuredName))
            {
                return configuredName;
            }

            return subcategoryId?.ToString();
        }

        private static string? ResolveDepartmentName(int? departmentId, TicketLookupCache lookups)
        {
            if (!departmentId.HasValue)
            {
                return null;
            }

            if (lookups.Departments.TryGetValue(departmentId.Value, out var configuredName))
            {
                return configuredName;
            }

            return "General";
        }

        private sealed record TicketLookupCache(
            IReadOnlyDictionary<int, string> Categories,
            IReadOnlyDictionary<int, string> Subcategories,
            IReadOnlyDictionary<int, string> Priorities,
            IReadOnlyDictionary<int, string> Statuses,
            IReadOnlyDictionary<int, string> Departments
        );

        private double? CalculateResponseTime(DateTime createdAt, DateTime? firstResponseAt)
        {
            if (!firstResponseAt.HasValue)
                return null;

            return (firstResponseAt.Value - createdAt).TotalHours;
        }

        private double? CalculateResolutionTime(DateTime createdAt, DateTime? resolvedAt)
        {
            if (!resolvedAt.HasValue)
                return null;

            return (resolvedAt.Value - createdAt).TotalHours;
        }

        private double CalculateAverageResponseTime(List<Ticket> tickets)
        {
            var responseTimes = tickets
                .Where(t => t.FirstResponseAt.HasValue)
                .Select(t => (t.FirstResponseAt!.Value - t.CreatedAt).TotalHours)
                .ToList();

            return responseTimes.Any() ? responseTimes.Average() : 0;
        }

        private double CalculateAverageResolutionTime(List<Ticket> tickets)
        {
            var resolutionTimes = tickets
                .Where(t => t.ResolvedAt.HasValue)
                .Select(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours)
                .ToList();

            return resolutionTimes.Any() ? resolutionTimes.Average() : 0;
        }

        private double GetAgentSatisfactionRating(string agentId)
        {
            // For now, return a random satisfaction rating between 3-5
            var random = new Random(agentId.GetHashCode());
            return Math.Round(3.0 + (random.NextDouble() * 2.0), 1);
        }
    }
}