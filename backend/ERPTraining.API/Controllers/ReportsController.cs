using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReportsController> _logger;

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
                var query = _context.Tickets.AsQueryable();

                // Apply date filters
                if (startDate.HasValue)
                    query = query.Where(t => t.CreatedAt >= startDate.Value);
                if (endDate.HasValue)
                    query = query.Where(t => t.CreatedAt <= endDate.Value);

                // Apply category filter
                if (!string.IsNullOrEmpty(category) && Enum.TryParse<TicketCategory>(category, out var categoryEnum))
                    query = query.Where(t => t.Category == categoryEnum);

                // Apply priority filter
                if (!string.IsNullOrEmpty(priority) && Enum.TryParse<TicketPriority>(priority, out var priorityEnum))
                    query = query.Where(t => t.Priority == priorityEnum);

                var tickets = await query.ToListAsync();

                var reportData = tickets.Select(ticket => new
                {
                    ticketId = ticket.Id.ToString(),
                    publicId = ticket.PublicId ?? 0,
                    title = ticket.Title,
                    category = ticket.Category.ToString(),
                    priority = ticket.Priority.ToString(),
                    status = ticket.Status.ToString(),
                    createdAt = ticket.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    firstResponseAt = ticket.FirstResponseAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    resolvedAt = ticket.ResolvedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    responseTime = CalculateResponseTime(ticket.CreatedAt, ticket.FirstResponseAt),
                    resolutionTime = CalculateResolutionTime(ticket.CreatedAt, ticket.ResolvedAt),
                    assignedAgent = GetAssignedAgentName(ticket.AssignedToUserId),
                    department = GetDepartmentName(ticket.DepartmentId)
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
            [FromQuery] string? department = null)
        {
            try
            {
                var query = _context.Tickets.AsQueryable();

                // Apply filters
                if (startDate.HasValue)
                    query = query.Where(t => t.CreatedAt >= startDate.Value);
                if (endDate.HasValue)
                    query = query.Where(t => t.CreatedAt <= endDate.Value);

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
                        resolvedTickets = g.Count(t => t.Status == TicketStatus.Resolved), // Resolved status
                        avgResponseTime = CalculateAverageResponseTime(g.ToList()),
                        avgResolutionTime = CalculateAverageResolutionTime(g.ToList()),
                        resolutionRate = g.Count() > 0 ? (double)g.Count(t => t.Status == TicketStatus.Resolved) / g.Count() * 100 : 0,
                        satisfactionRating = GetAgentSatisfactionRating(g.Key)
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
            [FromQuery] string? category = null,
            [FromQuery] string? priority = null,
            [FromQuery] string? agent = null,
            [FromQuery] string? department = null,
            [FromQuery] string? search = null)
        {
            try
            {
                var query = _context.Tickets
                    .Where(t => t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed) // Not resolved or closed
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(category) && Enum.TryParse<TicketCategory>(category, out var categoryEnum))
                    query = query.Where(t => t.Category == categoryEnum);
                if (!string.IsNullOrEmpty(priority) && Enum.TryParse<TicketPriority>(priority, out var priorityEnum))
                    query = query.Where(t => t.Priority == priorityEnum);
                if (!string.IsNullOrEmpty(agent))
                    query = query.Where(t => t.AssignedToUserId == agent);
                if (!string.IsNullOrEmpty(search))
                    query = query.Where(t => t.Title.Contains(search) || t.Description.Contains(search));

                var tickets = await query.OrderBy(t => t.CreatedAt).ToListAsync();

                var reportData = tickets.Select(ticket => new
                {
                    ticketId = ticket.Id.ToString(),
                    publicId = ticket.PublicId ?? 0,
                    title = ticket.Title,
                    category = ticket.Category.ToString(),
                    priority = ticket.Priority.ToString(),
                    status = ticket.Status.ToString(),
                    createdAt = ticket.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    assignedAgent = GetAssignedAgentName(ticket.AssignedToUserId),
                    department = GetDepartmentName(ticket.DepartmentId),
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
                var query = _context.Tickets.AsQueryable();

                // Apply filters
                if (startDate.HasValue)
                    query = query.Where(t => t.CreatedAt >= startDate.Value);
                if (endDate.HasValue)
                    query = query.Where(t => t.CreatedAt <= endDate.Value);
                if (!string.IsNullOrEmpty(category) && Enum.TryParse<TicketCategory>(category, out var categoryEnum))
                    query = query.Where(t => t.Category == categoryEnum);
                if (!string.IsNullOrEmpty(priority) && Enum.TryParse<TicketPriority>(priority, out var priorityEnum))
                    query = query.Where(t => t.Priority == priorityEnum);
                if (!string.IsNullOrEmpty(status) && Enum.TryParse<TicketStatus>(status, out var statusEnum))
                    query = query.Where(t => t.Status == statusEnum);
                if (!string.IsNullOrEmpty(agent))
                    query = query.Where(t => t.AssignedToUserId == agent);
                if (!string.IsNullOrEmpty(search))
                    query = query.Where(t => t.Title.Contains(search) || t.Description.Contains(search));

                var tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

                var reportData = tickets.Select(ticket => new
                {
                    ticketId = ticket.Id.ToString(),
                    publicId = ticket.PublicId ?? 0,
                    title = ticket.Title,
                    category = ticket.Category.ToString(),
                    subcategory = ticket.SubCategory?.ToString(),
                    priority = ticket.Priority.ToString(),
                    status = ticket.Status.ToString(),
                    createdAt = ticket.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    assignedAgent = GetAssignedAgentName(ticket.AssignedToUserId),
                    department = GetDepartmentName(ticket.DepartmentId),
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
        private string GetAssignedAgentName(string? userId)
        {
            if (string.IsNullOrEmpty(userId))
                return null;

            // Try to get user from Users table
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            return user?.FullName ?? "Unknown Agent";
        }

        private string GetAgentEmail(string? userId)
        {
            if (string.IsNullOrEmpty(userId))
                return null;

            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            return user?.Email ?? "";
        }

        private string GetAgentDepartment(string? userId)
        {
            if (string.IsNullOrEmpty(userId))
                return "Unassigned";

            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            return user?.Department ?? "Unknown";
        }

        private string GetDepartmentName(int? departmentId)
        {
            return departmentId switch
            {
                1 => "IT Support",
                2 => "Development",
                3 => "Operations",
                4 => "Management",
                _ => "General"
            };
        }

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