using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Entities; // Add for User
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Core.Services;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using System.Security.Claims;
using Microsoft.Data.SqlClient;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/tickets")]
[Authorize] // Authentication required for all endpoints
[EnableRateLimiting("api")]  // Enterprise: API rate limiting
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly IA_TicketSettingsService _settingsService;
    private readonly ILogger<TicketsController> _logger;
    private readonly string _connectionString;
    private readonly ApplicationDbContext _context;
    private readonly IAutoAssignmentService _autoAssignmentService;
    private readonly IEmailService _emailService;
    private readonly ICategoryAdminService _categoryAdminService;

    public TicketsController(
        ITicketService ticketService, 
        IA_TicketSettingsService settingsService, 
        IAutoAssignmentService autoAssignmentService,
        IEmailService emailService,
        ICategoryAdminService categoryAdminService,
        ILogger<TicketsController> logger, 
        IConfiguration configuration,
        ApplicationDbContext context)
    {
        _ticketService = ticketService;
        _settingsService = settingsService;
        _logger = logger;
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
        _context = context;
        _autoAssignmentService = autoAssignmentService;
        _emailService = emailService;
        _categoryAdminService = categoryAdminService;
    }

    // Helper method to ensure DateTime is properly stored as UTC
    private DateTime GetUtcNow()
    {
        return DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
    }

    // Helper method to ensure DateTime is properly marked as UTC for JSON serialization
    private DateTime EnsureUtc(DateTime dateTime)
    {
        if (dateTime.Kind == DateTimeKind.Utc)
            return dateTime;
        
        // If it's Local or Unspecified, assume it's already UTC and just mark it as such
        return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
    }

    private DateTime? EnsureUtc(DateTime? dateTime)
    {
        return dateTime.HasValue ? EnsureUtc(dateTime.Value) : (DateTime?)null;
    }

    private string GetCurrentUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                    User.FindFirst("sub")?.Value ?? 
                    User.FindFirst("userid")?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }
        
        return userId;
    }

    private async Task<bool> IsCurrentUserAgentOrAdmin()
    {
        try
        {
            var userId = GetCurrentUserId();
            return await _ticketService.IsUserAgentOrAdminAsync(userId);
        }
        catch
        {
            // If there's any error, default to not showing internal notes
            return false;
        }
    }

    // Helper method to send notifications
    private async Task SendNotificationAsync(string userId, string title, string message, string type = "Info", string? actionUrl = null)
    {
        try
        {
            // Use direct SQL to avoid DbContext connection issues after TicketService raw SQL
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"INSERT INTO UserNotifications (UserId, Title, Message, Type, IsRead, CreatedAt, ActionUrl)
                        VALUES (@UserId, @Title, @Message, @Type, 0, @CreatedAt, @ActionUrl)";
            
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@UserId", userId);
            command.Parameters.AddWithValue("@Title", title);
            command.Parameters.AddWithValue("@Message", message);
            command.Parameters.AddWithValue("@Type", type);
            command.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
            command.Parameters.AddWithValue("@ActionUrl", (object?)actionUrl ?? DBNull.Value);
            
            await command.ExecuteNonQueryAsync();
            
            _logger.LogInformation($"📬 Notification sent to user {userId}: {title}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send notification to user {userId}");
            // Don't throw - notification failure shouldn't break ticket operations
        }
    }

    // Helper to get ticket creator's user ID
    private async Task<string?> GetTicketCreatorIdAsync(Guid ticketId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = "SELECT CreatedByUserId FROM Tickets WHERE Id = @TicketId";
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@TicketId", ticketId);
            
            var result = await command.ExecuteScalarAsync();
            return result?.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to get creator ID for ticket {ticketId}");
            return null;
        }
    }

    private async Task<int?> DetermineSubcategoryAsync(string title, string description)
    {
        try
        {
            var content = $"{title} {description}".ToLowerInvariant();
            
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT tt.SubCategoryId, tt.Name 
                FROM TicketTags tt 
                WHERE tt.IsActive = 1 
                ORDER BY tt.SubCategoryId";
            
            using var command = new SqlCommand(sql, connection);
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                var subCategoryId = reader.GetInt32(0); // SubCategoryId
                var tagName = reader.GetString(1);      // Name
                
                // Split tag name by commas and check each keyword
                var keywords = tagName.Split(',', StringSplitOptions.RemoveEmptyEntries);
                
                bool anyKeywordFound = false;
                foreach (var keyword in keywords)
                {
                    var cleanKeyword = keyword.Trim().ToLowerInvariant();
                    if (content.Contains(cleanKeyword))
                    {
                        anyKeywordFound = true;
                        break;
                    }
                }
                
                if (anyKeywordFound)
                {
                    _logger.LogInformation("Matched subcategory {SubCategoryId} for keywords: {Keywords}", subCategoryId, tagName);
                    return subCategoryId;
                }
            }
            
            _logger.LogInformation("No subcategory matched for content: {Content}", content);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error determining subcategory");
            return null;
        }
    }

    // GET: api/tickets
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetTickets(
        [FromQuery] TicketStatus? status = null,
        [FromQuery] TicketPriority? priority = null,
        [FromQuery] TicketCategory? category = null)
    {
        try
        {
            var tickets = await _ticketService.GetFilteredTicketsAsync(status, priority, category);
            
            // Create response with basic user information
            var response = new List<object>();
            
            foreach (var ticket in tickets)
            {
                // Use eager-loaded user data when available to avoid per-ticket fetches
                var createdByUser = ticket.CreatedByUser;
                if (createdByUser == null && !string.IsNullOrEmpty(ticket.CreatedByUserId))
                {
                    createdByUser = await _ticketService.GetUserAsync(ticket.CreatedByUserId);
                }

                response.Add(new
                {
                    id = ticket.Id,
                    publicId = ticket.PublicId,
                    title = ticket.Title,
                    description = ticket.Description,
                    category = (int)ticket.Category,
                    priority = (int)ticket.Priority,
                    status = (int)ticket.Status,
                    source = (int)ticket.Source,
                    createdByUserId = ticket.CreatedByUserId,
                    assignedToUserId = ticket.AssignedToUserId,
                    createdAt = EnsureUtc(ticket.CreatedAt),
                    updatedAt = EnsureUtc(ticket.UpdatedAt),
                    firstResponseAt = EnsureUtc(ticket.FirstResponseAt),
                    resolvedAt = EnsureUtc(ticket.ResolvedAt),
                    isOverdue = false, // Calculate if needed
                    // Include basic creator info for display
                    createdByUser = createdByUser != null ? new {
                        id = createdByUser.Id,
                        firstName = createdByUser.FirstName ?? "",
                        lastName = createdByUser.LastName ?? "",
                        email = createdByUser.Email ?? ""
                    } : null,
                    commentCount = 0, // Placeholder
                    attachmentCount = 0 // Placeholder
                });
            }
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving tickets: {ex.Message}");
        }
    }

    // GET: api/tickets/by-categories - Get tickets filtered by category IDs (for Category Heads)
    [HttpGet("by-categories")]
    public async Task<ActionResult<object>> GetTicketsByCategories(
        [FromQuery] string categoryIds,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(categoryIds))
            {
                return BadRequest(new { error = "categoryIds parameter is required" });
            }

            // Parse category IDs
            var categoryIdList = categoryIds.Split(',')
                .Select(s => int.TryParse(s.Trim(), out var id) ? id : -1)
                .Where(id => id > 0)
                .ToList();

            if (!categoryIdList.Any())
            {
                return Ok(new List<object>());
            }

            // Validate pagination
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 100;
            if (pageSize > 500) pageSize = 500;

            // Get merge information using raw SQL (MergedTickets is not mapped to EF entity)
            var mergedTicketLookup = new Dictionary<Guid, string>();
            var allMergedIds = new HashSet<Guid>();
            
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using var cmd = new SqlCommand("SELECT PrimaryTicketId, MergedTicketIds FROM MergedTickets", connection);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var primaryId = (Guid)reader["PrimaryTicketId"];
                    var mergedIds = reader["MergedTicketIds"]?.ToString() ?? "";
                    mergedTicketLookup[primaryId] = mergedIds;
                    
                    // Add all merged IDs to lookup set
                    foreach (var idStr in mergedIds.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        if (Guid.TryParse(idStr.Trim(), out var mergedGuid))
                            allMergedIds.Add(mergedGuid);
                    }
                }
            }

            // Query tickets with CategoryId in the provided list
            var query = _context.Tickets.AsNoTracking()
                .Where(t => t.CategoryId.HasValue && categoryIdList.Contains(t.CategoryId.Value) && t.Status != 99)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .OrderByDescending(t => t.CreatedAt);

            var totalCount = await query.CountAsync();
            
            var tickets = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    id = t.Id,
                    publicId = t.PublicId,
                    title = t.Title,
                    description = t.Description,
                    category = (int)t.Category,
                    categoryId = t.CategoryId,
                    priority = (int)t.Priority,
                    status = t.Status,
                    source = (int)t.Source,
                    createdByUserId = t.CreatedByUserId,
                    assignedToUserId = t.AssignedToUserId,
                    createdAt = t.CreatedAt,
                    updatedAt = t.UpdatedAt,
                    resolvedAt = t.ResolvedAt,
                    createdByName = t.CreatedByUser != null ? t.CreatedByUser.FirstName + " " + t.CreatedByUser.LastName : null,
                    assignedToName = t.AssignedToUser != null ? t.AssignedToUser.FirstName + " " + t.AssignedToUser.LastName : null,
                    departmentId = t.DepartmentId,
                    subcategoryId = t.SubcategoryId
                })
                .ToListAsync();

            // Add merge information to response (same as GetMyTickets)
            var ticketsWithMergeInfo = tickets.Select(t => new
            {
                t.id,
                t.publicId,
                t.title,
                t.description,
                t.category,
                t.categoryId,
                t.priority,
                t.status,
                t.source,
                t.createdByUserId,
                t.assignedToUserId,
                t.createdAt,
                t.updatedAt,
                t.resolvedAt,
                t.createdByName,
                t.assignedToName,
                t.departmentId,
                t.subcategoryId,
                // Merge info - same as regular ticket list
                hasMergedTickets = mergedTicketLookup.ContainsKey(t.id),
                wasMergedIntoAnother = allMergedIds.Contains(t.id),
                mergedTicketsCount = mergedTicketLookup.TryGetValue(t.id, out var mergedIds) 
                    ? (mergedIds?.Split(',', StringSplitOptions.RemoveEmptyEntries).Length ?? 0) 
                    : 0
            }).ToList();

            _logger.LogInformation("Category Head fetched {Count} tickets for categories: {Categories}", 
                ticketsWithMergeInfo.Count, string.Join(", ", categoryIdList));

            return Ok(ticketsWithMergeInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tickets by categories");
            return StatusCode(500, new { error = "Error retrieving tickets" });
        }
    }

    // GET: api/tickets/my
    [HttpGet("my")]
    public async Task<ActionResult<object>> GetMyTickets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        [FromQuery] int? status = null,
        [FromQuery] int? priority = null,
        [FromQuery] int? category = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // Validate pagination parameters
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 100;
            if (pageSize > 500) pageSize = 500; // Increased max to 500 items per page
            
            // Check if user is Admin - if so, return ALL tickets
            var isAdmin = User.IsInRole("Admin");
            
            // Check if user is a Category Admin
            var isCategoryAdmin = await _categoryAdminService.IsCategoryAdminAsync(userId);
            var categoryAdminCategoryIds = isCategoryAdmin 
                ? (await _categoryAdminService.GetAdminCategoryIdsAsync(userId)).ToList()
                : new List<int>();
            
            // Base query with filters
            IQueryable<Ticket> query;
            if (isAdmin)
            {
                // Admin sees all tickets
                query = _context.Tickets.AsNoTracking();
            }
            else if (isCategoryAdmin && categoryAdminCategoryIds.Any())
            {
                // Category Admin sees: tickets they created, assigned to them, OR in their managed categories
                query = _context.Tickets.AsNoTracking()
                    .Where(t => t.CreatedByUserId == userId 
                             || t.AssignedToUserId == userId 
                             || (t.CategoryId.HasValue && categoryAdminCategoryIds.Contains(t.CategoryId.Value)));
            }
            else
            {
                // Regular user sees only tickets they created or are assigned to
                query = _context.Tickets.AsNoTracking()
                    .Where(t => t.CreatedByUserId == userId || t.AssignedToUserId == userId);
            }
            
            // Apply filters
            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);
            
            if (priority.HasValue)
                query = query.Where(t => (int)t.Priority == priority.Value);
            
            if (category.HasValue)
                query = query.Where(t => (int)t.Category == category.Value);
            
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(t => 
                    t.Title.ToLower().Contains(searchLower) || 
                    t.Description.ToLower().Contains(searchLower));
            }
            
            // Get total count for pagination
            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            
            // Get merge information using raw SQL (MergedTickets is not mapped to EF entity)
            var mergedTicketLookup = new Dictionary<Guid, string>();
            var allMergedIds = new HashSet<Guid>();
            
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using var cmd = new SqlCommand("SELECT PrimaryTicketId, MergedTicketIds FROM MergedTickets", connection);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var primaryId = (Guid)reader["PrimaryTicketId"];
                    var mergedIds = reader["MergedTicketIds"]?.ToString() ?? "";
                    mergedTicketLookup[primaryId] = mergedIds;
                    
                    // Add all merged IDs to lookup set
                    foreach (var idStr in mergedIds.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        if (Guid.TryParse(idStr.Trim(), out var mergedGuid))
                            allMergedIds.Add(mergedGuid);
                    }
                }
            }
            
            // Project directly to response DTO with pagination
            var tickets = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    id = t.Id,
                    publicId = t.PublicId,
                    title = t.Title,
                    description = t.Description,
                    category = (int)t.Category,
                    priority = (int)t.Priority,
                    status = t.Status,
                    source = (int)t.Source,
                    createdByUserId = t.CreatedByUserId,
                    assignedToUserId = t.AssignedToUserId,
                    createdAt = t.CreatedAt,
                    updatedAt = t.UpdatedAt,
                    firstResponseAt = t.FirstResponseAt,
                    resolvedAt = t.ResolvedAt,
                    isOverdue = false,
                    // Include categoryId and subcategoryId for settings lookup
                    categoryId = t.CategoryId,
                    subcategoryId = t.SubcategoryId,
                    // Project user data directly from navigation property
                    createdByUser = t.CreatedByUser != null ? new {
                        id = t.CreatedByUser.Id,
                        firstName = t.CreatedByUser.FirstName ?? "",
                        lastName = t.CreatedByUser.LastName ?? "",
                        email = t.CreatedByUser.Email ?? ""
                    } : null,
                    commentCount = 0, // Placeholder
                    attachmentCount = 0 // Placeholder
                })
                .ToListAsync();
            
            // Add merge information to response
            var ticketsWithMergeInfo = tickets.Select(t => new
            {
                t.id,
                t.publicId,
                t.title,
                t.description,
                t.category,
                t.priority,
                t.status,
                t.source,
                t.createdByUserId,
                t.assignedToUserId,
                t.createdAt,
                t.updatedAt,
                t.firstResponseAt,
                t.resolvedAt,
                t.isOverdue,
                t.categoryId,
                t.subcategoryId,
                t.createdByUser,
                t.commentCount,
                t.attachmentCount,
                // Merge info
                hasMergedTickets = mergedTicketLookup.ContainsKey(t.id),
                wasMergedIntoAnother = allMergedIds.Contains(t.id),
                mergedTicketsCount = mergedTicketLookup.TryGetValue(t.id, out var mergedIds) 
                    ? (mergedIds?.Split(',', StringSplitOptions.RemoveEmptyEntries).Length ?? 0) 
                    : 0
            }).ToList();
            
            return Ok(new
            {
                data = ticketsWithMergeInfo,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages,
                    hasNextPage = page < totalPages,
                    hasPreviousPage = page > 1
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user tickets for userId: {UserId}", GetCurrentUserId());
            return StatusCode(500, $"Error retrieving user tickets: {ex.Message}");
        }
    }

    // GET: api/tickets/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<object>> GetTicket(Guid id)
    {
        try
        {
            var ticket = await _ticketService.GetTicketByIdAsync(id);
            if (ticket == null)
                return NotFound($"Ticket with ID {id} not found");

            // Get related data separately to avoid circular references
            var comments = await _ticketService.GetTicketCommentsAsync(id);
            var attachments = await _ticketService.GetTicketAttachmentsAsync(id);
            
            // Get user data separately if available
            User? createdByUser = null;
            User? assignedToUser = null;
            
            if (!string.IsNullOrEmpty(ticket.CreatedByUserId))
            {
                createdByUser = await _ticketService.GetUserAsync(ticket.CreatedByUserId);
            }
            
            if (!string.IsNullOrEmpty(ticket.AssignedToUserId))
            {
                assignedToUser = await _ticketService.GetUserAsync(ticket.AssignedToUserId);
            }

            // Return clean DTO to avoid circular references
            var response = new
            {
                id = ticket.Id,
                publicId = ticket.PublicId,
                title = ticket.Title,
                description = ticket.Description,
                category = (int)ticket.Category,
                priority = (int)ticket.Priority,
                status = (int)ticket.Status,
                source = (int)ticket.Source,
                createdByUserId = ticket.CreatedByUserId,
                assignedToUserId = ticket.AssignedToUserId,
                createdAt = EnsureUtc(ticket.CreatedAt),
                updatedAt = EnsureUtc(ticket.UpdatedAt),
                firstResponseAt = EnsureUtc(ticket.FirstResponseAt),
                resolvedAt = EnsureUtc(ticket.ResolvedAt),
                isOverdue = false, // Calculate if needed
                
                // Include extended fields for relational database support
                subCategory = ticket.SubCategory,
                categoryId = ticket.CategoryId,
                subcategoryId = ticket.SubcategoryId,
                departmentId = ticket.DepartmentId,
                
                // Include basic user info if available
                createdByUser = createdByUser != null ? new {
                    id = createdByUser.Id,
                    firstName = createdByUser.FirstName ?? "",
                    lastName = createdByUser.LastName ?? "",
                    email = createdByUser.Email ?? ""
                } : null,
                assignedToUser = assignedToUser != null ? new {
                    id = assignedToUser.Id,
                    firstName = assignedToUser.FirstName ?? "",
                    lastName = assignedToUser.LastName ?? "",
                    email = assignedToUser.Email ?? ""
                } : null,
                // Include attachments safely 
                attachments = attachments.Select(a => new {
                    id = a.Id,
                    fileName = a.FileName ?? "",
                    contentType = a.ContentType ?? "",
                    sizeBytes = a.SizeBytes,
                    createdAt = EnsureUtc(a.CreatedAt)
                }),
                // Include comments safely
                comments = comments.Select(c => new {
                    id = c.Id,
                    body = c.Body ?? "",
                    authorUserId = c.AuthorUserId ?? "",
                    isInternal = c.IsInternal,
                    createdAt = EnsureUtc(c.CreatedAt)
                })
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving ticket: {ex.Message}");
        }
    }

    // POST: api/tickets
    [HttpPost]
    public async Task<ActionResult<Ticket>> CreateTicket([FromBody] CreateTicketRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = GetCurrentUserId();
            _logger.LogDebug("Creating ticket for user: {UserId}", currentUserId);

            // Determine subcategory automatically based on keywords if not provided
            var subcategoryId = request.SubcategoryId;
            if (!subcategoryId.HasValue)
            {
                subcategoryId = await DetermineSubcategoryAsync(request.Title, request.Description ?? "");
                _logger.LogInformation("Auto-determined subcategory: {SubcategoryId} for title: {Title}", subcategoryId, request.Title);
            }

            _logger.LogInformation("📝 Creating ticket with: StatusId={StatusId}, CustomFieldsCount={Count}", 
                request.StatusId, request.CustomFieldValues?.Count ?? 0);
            
            var ticket = new Ticket
            {
                Title = request.Title,
                Description = request.Description ?? string.Empty,
                Category = request.Category,
                Priority = request.Priority,
                CreatedByUserId = currentUserId,
                Source = TicketSource.TrainingPortal,
                // Map the ID fields from the request
                CategoryId = request.CategoryId,
                SubcategoryId = subcategoryId, // Use the determined subcategory
                DepartmentId = request.DepartmentId,
                Status = request.StatusId ?? 1 // Default to 1 (New status ID in database)
            };
            
            _logger.LogInformation("✅ Ticket object created with Status={Status} (from StatusId={StatusId})", 
                ticket.Status, request.StatusId);

            var createdTicket = await _ticketService.CreateTicketAsync(ticket);
            
            _logger.LogInformation("💾 Ticket saved to database with ID={TicketId}, Status={Status}", 
                createdTicket.Id, createdTicket.Status);

            // Handle custom field values if provided
            _logger.LogInformation("💾 Checking custom field values: HasValues={HasValues}, Count={Count}", 
                request.CustomFieldValues?.Any() == true, request.CustomFieldValues?.Count ?? 0);
            
            if (request.CustomFieldValues?.Any() == true)
            {
                try
                {
                    _logger.LogInformation("💾 Saving {Count} custom field values for ticket {TicketId}", 
                        request.CustomFieldValues.Count, createdTicket.Id);
                    
                    using var connection = new SqlConnection(_connectionString);
                    await connection.OpenAsync();
                    
                    foreach (var fieldValue in request.CustomFieldValues)
                    {
                        _logger.LogInformation("🔍 Processing custom field: Key={Key}, Value={Value}, ValueType={ValueType}", 
                            fieldValue.Key, fieldValue.Value, fieldValue.Value?.GetType().Name);
                        
                        // Skip empty values
                        if (fieldValue.Value == null || string.IsNullOrWhiteSpace(fieldValue.Value.ToString()))
                        {
                            _logger.LogInformation("⏭️ Skipping empty custom field: {Key}", fieldValue.Key);
                            continue;
                        }
                        
                        // Parse the field ID from the key - try direct parse first, then remove prefix if exists
                        int customFieldId;
                        if (int.TryParse(fieldValue.Key, out customFieldId))
                        {
                            // Key is already a number (like "2", "3", etc.)
                        }
                        else if (fieldValue.Key.StartsWith("customField_") && 
                                 int.TryParse(fieldValue.Key.Replace("customField_", ""), out customFieldId))
                        {
                            // Key has prefix like "customField_2"
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ Failed to parse custom field ID from key: {Key}", fieldValue.Key);
                            continue;
                        }
                        
                        var sql = @"
                            INSERT INTO TicketFieldValues (TicketId, CustomFieldId, Value, CreatedAt, UpdatedAt)
                            VALUES (@TicketId, @CustomFieldId, @Value, @CreatedAt, @UpdatedAt)";
                        
                        using var command = new SqlCommand(sql, connection);
                        command.Parameters.AddWithValue("@TicketId", createdTicket.Id);
                        command.Parameters.AddWithValue("@CustomFieldId", customFieldId);
                        command.Parameters.AddWithValue("@Value", fieldValue.Value.ToString());
                        command.Parameters.AddWithValue("@CreatedAt", GetUtcNow());
                        command.Parameters.AddWithValue("@UpdatedAt", GetUtcNow());
                        
                        await command.ExecuteNonQueryAsync();
                        _logger.LogInformation("✅ Saved custom field value: TicketId={TicketId}, FieldId={FieldId}, Value={Value}", 
                            createdTicket.Id, customFieldId, fieldValue.Value);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Failed to save custom field values for ticket {TicketId}", createdTicket.Id);
                    // Don't fail the ticket creation if custom field values fail to save
                }
            }
            else
            {
                _logger.LogInformation("ℹ️ No custom field values provided for ticket {TicketId}", createdTicket.Id);
            }

            // Handle file attachments if provided
            if (request.Attachments?.Any() == true)
            {
                foreach (var attachmentReq in request.Attachments)
                {
                    try
                    {
                        // Decode and save the file to disk
                        var fileBytes = Convert.FromBase64String(attachmentReq.Base64Content);
                        var tempDirectory = Path.Combine(Directory.GetCurrentDirectory(), "temp");
                        
                        // Ensure temp directory exists
                        if (!Directory.Exists(tempDirectory))
                        {
                            Directory.CreateDirectory(tempDirectory);
                        }
                        
                        var filePath = Path.Combine(tempDirectory, attachmentReq.FileName);
                        await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);
                        
                        // Create attachment record
                        var attachment = new Attachment
                        {
                            Id = Guid.NewGuid(),
                            TicketId = createdTicket.Id,
                            FileName = attachmentReq.FileName,
                            ContentType = attachmentReq.ContentType,
                            SizeBytes = fileBytes.Length,
                            StoragePath = $"temp/{attachmentReq.FileName}",
                            UploadedByUserId = GetCurrentUserId(),
                            CreatedAt = GetUtcNow()
                        };
                        
                        // Add attachment to database
                        await _ticketService.AddAttachmentAsync(attachment);
                    }
                    catch (Exception ex)
                    {
                        // Log attachment error but don't fail ticket creation
                        _logger.LogError(ex, "Failed to process attachment {FileName}", attachmentReq.FileName);
                    }
                }
            }

            AssignmentResult? autoAssignment = null;
            try
            {
                autoAssignment = await _autoAssignmentService.AutoAssignTicketAsync(createdTicket.Id);
                if (autoAssignment.Success && !string.IsNullOrEmpty(autoAssignment.AssignedToUserId))
                {
                    createdTicket.AssignedToUserId = autoAssignment.AssignedToUserId;
                }
                else if (!autoAssignment.Success)
                {
                    _logger.LogWarning("Auto-assignment skipped for ticket {TicketId}: {Message}", createdTicket.Id, autoAssignment.ErrorMessage ?? "No suitable assignment");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auto-assignment failed for ticket {TicketId}", createdTicket.Id);
            }

            // Send email notification to the customer who created the ticket
            try
            {
                var creator = await _context.Users.FirstOrDefaultAsync(u => u.Id == createdTicket.CreatedByUserId);
                if (creator != null && !string.IsNullOrEmpty(creator.Email))
                {
                    _logger.LogInformation("📧 Sending ticket creation notification to {Email} for ticket {TicketId}", creator.Email, createdTicket.Id);
                    await _emailService.SendTicketCreatedNotificationAsync(createdTicket, creator);
                }
                else
                {
                    _logger.LogWarning("⚠️ Could not send ticket creation notification - creator not found or no email for ticket {TicketId}", createdTicket.Id);
                }
            }
            catch (Exception ex)
            {
                // Don't fail ticket creation if email fails
                _logger.LogError(ex, "❌ Failed to send ticket creation notification for ticket {TicketId}", createdTicket.Id);
            }

            // Return a clean response without circular references
            var response = new
            {
                id = createdTicket.Id,
                title = createdTicket.Title,
                description = createdTicket.Description,
                category = createdTicket.Category,
                priority = createdTicket.Priority,
                status = createdTicket.Status,
                source = createdTicket.Source,
                createdByUserId = createdTicket.CreatedByUserId,
                createdAt = EnsureUtc(createdTicket.CreatedAt),
                updatedAt = EnsureUtc(createdTicket.UpdatedAt),
                attachmentCount = request.Attachments?.Count ?? 0,
                assignedToUserId = createdTicket.AssignedToUserId,
                autoAssignment = autoAssignment != null ? new
                {
                    succeeded = autoAssignment.Success,
                    reason = autoAssignment.Reason.ToString(),
                    message = autoAssignment.Message,
                    assignedAgentId = autoAssignment.AssignedToAgentId,
                    assignedGroupId = autoAssignment.AssignedToGroupId
                } : null
            };

            return CreatedAtAction(nameof(GetTicket), new { id = createdTicket.Id }, response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error creating ticket: {ex.Message}");
        }
    }

    // PUT: api/tickets/{id}
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> UpdateTicket(Guid id, [FromBody] UpdateTicketRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingTicket = await _ticketService.GetTicketByIdAsync(id);
            if (existingTicket == null)
                return NotFound($"Ticket with ID {id} not found");

            // Update fields if provided
            if (!string.IsNullOrEmpty(request.Title))
                existingTicket.Title = request.Title;
            
            if (!string.IsNullOrEmpty(request.Description))
                existingTicket.Description = request.Description;
            
            if (request.Category.HasValue)
                existingTicket.Category = request.Category.Value;
            
            if (request.Priority.HasValue)
                existingTicket.Priority = request.Priority.Value;
            
            // Handle extended relational fields
            if (request.SubCategory.HasValue)
                existingTicket.SubCategory = request.SubCategory.Value;
            
            if (request.CategoryId.HasValue)
                existingTicket.CategoryId = request.CategoryId.Value;
                
            if (request.SubcategoryId.HasValue)
                existingTicket.SubcategoryId = request.SubcategoryId.Value;
            
            if (request.DepartmentId.HasValue)
                existingTicket.DepartmentId = request.DepartmentId.Value;
            
            // Handle status updates with special workflow
            if (request.Status.HasValue)
            {
                var updatedTicket = await _ticketService.UpdateTicketStatusAsync(id, request.Status.Value, GetCurrentUserId());
                
                // Send notification to ticket creator about status change
                var creatorId = await GetTicketCreatorIdAsync(id);
                if (!string.IsNullOrEmpty(creatorId) && creatorId != GetCurrentUserId())
                {
                    var statusName = request.Status.Value switch
                    {
                        TicketStatus.New => "New",
                        TicketStatus.InReview => "In Review",
                        TicketStatus.WaitingUser => "Waiting for User",
                        TicketStatus.Resolved => "Resolved",
                        TicketStatus.Closed => "Closed",
                        _ => "Unknown"
                    };
                    
                    var ticketNumber = updatedTicket.PublicId?.ToString() ?? id.ToString().Substring(0, 8);
                    await SendNotificationAsync(
                        creatorId,
                        "Ticket Status Updated",
                        $"Your ticket #{ticketNumber} status has been changed to {statusName}",
                        "Info",
                        $"/tickets/{id}"
                    );
                }
                
                // Also notify assigned agent if different from updater
                if (!string.IsNullOrEmpty(updatedTicket.AssignedToUserId) && 
                    updatedTicket.AssignedToUserId != GetCurrentUserId() &&
                    updatedTicket.AssignedToUserId != creatorId)
                {
                    var statusName = request.Status.Value switch
                    {
                        TicketStatus.New => "New",
                        TicketStatus.InReview => "In Review",
                        TicketStatus.WaitingUser => "Waiting for User",
                        TicketStatus.Resolved => "Resolved",
                        TicketStatus.Closed => "Closed",
                        _ => "Unknown"
                    };
                    
                    var ticketNumber = updatedTicket.PublicId?.ToString() ?? id.ToString().Substring(0, 8);
                    await SendNotificationAsync(
                        updatedTicket.AssignedToUserId,
                        "Assigned Ticket Status Changed",
                        $"Ticket #{ticketNumber} assigned to you has been changed to {statusName}",
                        "Info",
                        $"/tickets/{id}"
                    );
                }
                
                return Ok(new {
                    id = updatedTicket.Id,
                    title = updatedTicket.Title,
                    description = updatedTicket.Description,
                    category = (int)updatedTicket.Category,
                    priority = (int)updatedTicket.Priority,
                    status = (int)updatedTicket.Status,
                    assignedToUserId = updatedTicket.AssignedToUserId,
                    updatedAt = updatedTicket.UpdatedAt,
                    subCategory = updatedTicket.SubCategory,
                    categoryId = updatedTicket.CategoryId,
                    subcategoryId = updatedTicket.SubcategoryId,
                    departmentId = updatedTicket.DepartmentId,
                    message = "Ticket status updated successfully"
                });
            }
            
            // Handle assignment updates
            if (!string.IsNullOrEmpty(request.AssignedToUserId))
            {
                var assignedTicket = await _ticketService.AssignTicketAsync(id, request.AssignedToUserId, GetCurrentUserId());
                
                // Send notification to the assigned agent
                var ticketNumber = assignedTicket.PublicId?.ToString() ?? id.ToString().Substring(0, 8);
                await SendNotificationAsync(
                    request.AssignedToUserId,
                    "New Ticket Assigned",
                    $"Ticket #{ticketNumber} - {assignedTicket.Title} has been assigned to you",
                    "Info",
                    $"/tickets/{id}"
                );
                
                // Also notify ticket creator that their ticket was assigned
                var creatorId = await GetTicketCreatorIdAsync(id);
                if (!string.IsNullOrEmpty(creatorId) && creatorId != GetCurrentUserId())
                {
                    await SendNotificationAsync(
                        creatorId,
                        "Ticket Assigned to Agent",
                        $"Your ticket #{ticketNumber} has been assigned to an agent",
                        "Success",
                        $"/tickets/{id}"
                    );
                }
                
                return Ok(new {
                    id = assignedTicket.Id,
                    title = assignedTicket.Title,
                    description = assignedTicket.Description,
                    category = (int)assignedTicket.Category,
                    priority = (int)assignedTicket.Priority,
                    status = (int)assignedTicket.Status,
                    assignedToUserId = assignedTicket.AssignedToUserId,
                    updatedAt = assignedTicket.UpdatedAt,
                    subCategory = assignedTicket.SubCategory,
                    categoryId = assignedTicket.CategoryId,
                    subcategoryId = assignedTicket.SubcategoryId,
                    departmentId = assignedTicket.DepartmentId,
                    message = "Ticket assigned successfully"
                });
            }

            // Handle general field updates
            var ticket = await _ticketService.UpdateTicketAsync(existingTicket);
            return Ok(new {
                id = ticket.Id,
                title = ticket.Title,
                description = ticket.Description,
                category = (int)ticket.Category,
                priority = (int)ticket.Priority,
                status = (int)ticket.Status,
                assignedToUserId = ticket.AssignedToUserId,
                updatedAt = ticket.UpdatedAt,
                subCategory = ticket.SubCategory,
                categoryId = ticket.CategoryId,
                subcategoryId = ticket.SubcategoryId,
                departmentId = ticket.DepartmentId,
                message = "Ticket updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating ticket {TicketId}", id);
            return StatusCode(500, $"Error updating ticket: {ex.Message}");
        }
    }

    // DELETE: api/tickets/{id}
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteTicket(Guid id)
    {
        try
        {
            var result = await _ticketService.DeleteTicketAsync(id);
            if (!result)
                return NotFound($"Ticket with ID {id} not found");

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error deleting ticket: {ex.Message}");
        }
    }

    // POST: api/tickets/{id}/comments
    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<object>> AddComment(Guid id, [FromBody] AddCommentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // First check if ticket exists
            var ticket = await _ticketService.GetTicketByIdAsync(id);
            if (ticket == null)
                return NotFound($"Ticket with ID {id} not found");

            var authorUserId = GetCurrentUserId();
            var authorUser = await _context.Users.FindAsync(authorUserId);
            var authorName = authorUser != null ? $"{authorUser.FirstName} {authorUser.LastName}" : "Someone";

            // Create the comment using the service
            var comment = await _ticketService.AddCommentAsync(id, request.Content, authorUserId, request.IsInternal);
            
            // Send notifications for non-internal comments
            if (!request.IsInternal)
            {
                // Notify the ticket creator if they're not the comment author
                if (!string.IsNullOrEmpty(ticket.CreatedByUserId) && ticket.CreatedByUserId != authorUserId)
                {
                    await SendNotificationAsync(
                        ticket.CreatedByUserId,
                        $"New comment on your ticket: {ticket.Title}",
                        $"{authorName} commented: {request.Content.Substring(0, Math.Min(100, request.Content.Length))}...",
                        "Comment",
                        $"/tickets/{id}"
                    );
                }

                // Notify the assigned agent if they're not the comment author
                if (!string.IsNullOrEmpty(ticket.AssignedToUserId) && ticket.AssignedToUserId != authorUserId && ticket.AssignedToUserId != ticket.CreatedByUserId)
                {
                    await SendNotificationAsync(
                        ticket.AssignedToUserId,
                        $"New comment on ticket: {ticket.Title}",
                        $"{authorName} commented: {request.Content.Substring(0, Math.Min(100, request.Content.Length))}...",
                        "Comment",
                        $"/tickets/{id}"
                    );
                }
            }
            
            // Return clean DTO response to avoid circular references
            return Ok(new { 
                id = comment.Id,
                ticketId = comment.TicketId,
                body = comment.Body,
                authorUserId = comment.AuthorUserId,
                isInternal = comment.IsInternal,
                createdAt = EnsureUtc(comment.CreatedAt),
                message = "Comment added successfully"
            });
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding comment to ticket {TicketId}", id);
            return StatusCode(500, $"Error adding comment: {ex.Message}");
        }
    }

    // GET: api/tickets/{id}/comments
    [HttpGet("{id:guid}/comments")]
    public async Task<ActionResult<IEnumerable<object>>> GetComments(Guid id)
    {
        try
        {
            // Check if the current user is an agent/admin who can see internal notes
            var isAgentOrAdmin = await IsCurrentUserAgentOrAdmin();
            
            var comments = await _ticketService.GetTicketCommentsAsync(id);
            
            // Filter comments based on user role (since service method may include all)
            var filteredComments = comments.Where(c => isAgentOrAdmin || !c.IsInternal);
            
            // Return clean DTOs to avoid circular references
            var response = filteredComments.Select(c => new
            {
                id = c.Id,
                ticketId = c.TicketId,
                body = c.Body ?? "",
                authorUserId = c.AuthorUserId ?? "",
                isInternal = c.IsInternal,
                createdAt = EnsureUtc(c.CreatedAt)
                // Note: Temporarily removing authorName to avoid circular references
                // authorName = "User" // Will be fixed once circular references are resolved
            });
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving comments: {ex.Message}");
        }
    }

    // GET: api/tickets/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult> GetStatistics()
    {
        try
        {
            var stats = await _ticketService.GetTicketStatisticsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving statistics: {ex.Message}");
        }
    }

    // POST: api/tickets/calculate-overdue
    [HttpPost("calculate-overdue")]
    public async Task<ActionResult> CalculateOverdueTickets()
    {
        try
        {
            await _ticketService.CalculateOverdueTicketsAsync();
            return Ok(new { message = "Overdue tickets calculated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error calculating overdue tickets: {ex.Message}");
        }
    }

    // POST: api/tickets/{id}/assign
    [HttpPost("{id:guid}/assign")]
    public async Task<ActionResult> AssignTicket(Guid id, [FromBody] AssignTicketRequest request)
    {
        try
        {
            var ticket = await _ticketService.AssignTicketAsync(id, request.AgentId);
            
            // Return clean response
            var response = new
            {
                id = ticket.Id,
                title = ticket.Title,
                description = ticket.Description,
                category = ticket.Category,
                priority = ticket.Priority,
                status = ticket.Status,
                assignedToUserId = ticket.AssignedToUserId,
                assignedTo = ticket.AssignedToUser?.FirstName + " " + ticket.AssignedToUser?.LastName,
                createdByUserId = ticket.CreatedByUserId,
                createdBy = ticket.CreatedByUser?.FirstName + " " + ticket.CreatedByUser?.LastName,
                createdAt = ticket.CreatedAt,
                updatedAt = ticket.UpdatedAt
            };
            
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error assigning ticket: {ex.Message}");
        }
    }

    // POST: api/tickets/{id}/unassign
    [HttpPost("{id:guid}/unassign")]
    public async Task<ActionResult> UnassignTicket(Guid id)
    {
        try
        {
            var ticket = await _ticketService.UnassignTicketAsync(id);
            
            // Return clean response
            var response = new
            {
                id = ticket.Id,
                title = ticket.Title,
                description = ticket.Description,
                category = ticket.Category,
                priority = ticket.Priority,
                status = ticket.Status,
                assignedToUserId = ticket.AssignedToUserId,
                assignedTo = (string?)null,
                createdByUserId = ticket.CreatedByUserId,
                createdBy = ticket.CreatedByUser?.FirstName + " " + ticket.CreatedByUser?.LastName,
                createdAt = ticket.CreatedAt,
                updatedAt = ticket.UpdatedAt
            };
            
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error unassigning ticket: {ex.Message}");
        }
    }

    // GET: api/tickets/{id}/collaborators
    [HttpGet("{id:guid}/collaborators")]
    public async Task<ActionResult> GetCollaborators(Guid id)
    {
        try
        {
            var collaborators = await _ticketService.GetCollaboratorsAsync(id);
            
            var response = collaborators.Select(c => new
            {
                id = c.Id,
                ticketId = c.TicketId,
                userId = c.UserId,
                userName = c.User != null ? $"{c.User.FirstName} {c.User.LastName}" : "Unknown",
                userEmail = c.User?.Email,
                role = c.Role,
                addedByUserId = c.AddedByUserId,
                addedByUserName = c.AddedByUser != null ? $"{c.AddedByUser.FirstName} {c.AddedByUser.LastName}" : "Unknown",
                addedAt = c.AddedAt
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting collaborators for ticket {TicketId}", id);
            return StatusCode(500, $"Error getting collaborators: {ex.Message}");
        }
    }

    // POST: api/tickets/{id}/collaborators
    [HttpPost("{id:guid}/collaborators")]
    public async Task<ActionResult> AddCollaborator(Guid id, [FromBody] AddCollaboratorRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var collaborator = await _ticketService.AddCollaboratorAsync(id, request.UserId, currentUserId, request.Role ?? "Collaborator");
            
            var response = new
            {
                id = collaborator.Id,
                ticketId = collaborator.TicketId,
                userId = collaborator.UserId,
                role = collaborator.Role,
                addedByUserId = collaborator.AddedByUserId,
                addedAt = collaborator.AddedAt
            };

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding collaborator to ticket {TicketId}", id);
            return StatusCode(500, $"Error adding collaborator: {ex.Message}");
        }
    }

    // DELETE: api/tickets/{id}/collaborators/{userId}
    [HttpDelete("{id:guid}/collaborators/{userId}")]
    public async Task<ActionResult> RemoveCollaborator(Guid id, string userId)
    {
        try
        {
            var removed = await _ticketService.RemoveCollaboratorAsync(id, userId);
            
            if (!removed)
            {
                return NotFound("Collaborator not found on this ticket");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing collaborator from ticket {TicketId}", id);
            return StatusCode(500, $"Error removing collaborator: {ex.Message}");
        }
    }

    // POST: api/tickets/{id}/reopen
    /// <summary>
    /// Reopen a resolved ticket within the 48-hour window.
    /// Users can only reopen tickets within 48 hours of resolution.
    /// After 48 hours, the ticket will be automatically closed.
    /// </summary>
    [HttpPost("{id:guid}/reopen")]
    public async Task<ActionResult> ReopenTicket(Guid id, [FromBody] ReopenTicketRequest? request)
    {
        try
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            // Check if ticket is in Resolved status (4)
            if (ticket.Status != 4)
            {
                return BadRequest("Only resolved tickets can be reopened. Current status does not allow reopening.");
            }

            // Check if within 48-hour window - use UpdatedAt as fallback if ResolvedAt not set
            var resolvedTime = ticket.ResolvedAt ?? ticket.UpdatedAt;
            
            // If ResolvedAt was null, backfill it now for future reference
            if (ticket.ResolvedAt == null)
            {
                ticket.ResolvedAt = ticket.UpdatedAt;
                _logger.LogWarning("Backfilled ResolvedAt for ticket {TicketId} using UpdatedAt: {ResolvedAt}", id, ticket.ResolvedAt);
            }

            var hoursSinceResolved = (DateTime.UtcNow - resolvedTime).TotalHours;
            if (hoursSinceResolved > 48)
            {
                return BadRequest($"Reopen window has expired. Tickets can only be reopened within 48 hours of resolution. This ticket was resolved {Math.Round(hoursSinceResolved)} hours ago.");
            }

            // Check if the current user is the ticket creator or an agent/admin
            var currentUserId = GetCurrentUserId();
            var isAgentOrAdmin = await IsCurrentUserAgentOrAdmin();
            
            if (ticket.CreatedByUserId != currentUserId && !isAgentOrAdmin)
            {
                return Forbid("Only the ticket creator or agents can reopen this ticket.");
            }

            // Reopen the ticket - set status back to "In Progress" (2)
            var oldStatus = ticket.Status;
            ticket.Status = 2; // In Progress
            ticket.UpdatedAt = DateTime.UtcNow;
            // Don't clear ResolvedAt - keep it for tracking purposes

            // Add audit log
            var auditLog = new AuditLog
            {
                TicketId = id,
                Field = "Status",
                OldValue = "Resolved",
                NewValue = "In Progress (Reopened)",
                ChangedByUserId = currentUserId,
                ChangedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            // Add a system comment about the reopen
            var reopenComment = new TicketComment
            {
                Id = Guid.NewGuid(),
                TicketId = id,
                Body = $"Ticket reopened{(string.IsNullOrEmpty(request?.Reason) ? "" : $": {request.Reason}")}",
                IsInternal = false,
                AuthorUserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.TicketComments.Add(reopenComment);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Ticket {TicketId} reopened by user {UserId}. Reason: {Reason}", 
                id, currentUserId, request?.Reason ?? "No reason provided");

            // Notify assigned agent if any
            if (!string.IsNullOrEmpty(ticket.AssignedToUserId) && ticket.AssignedToUserId != currentUserId)
            {
                await SendNotificationAsync(
                    ticket.AssignedToUserId,
                    "Ticket Reopened",
                    $"Ticket #{ticket.PublicId} has been reopened and requires attention.",
                    "Warning",
                    $"/tickets/{id}"
                );
            }

            return Ok(new
            {
                id = ticket.Id,
                publicId = ticket.PublicId,
                status = ticket.Status,
                statusName = "In Progress",
                updatedAt = EnsureUtc(ticket.UpdatedAt),
                message = "Ticket reopened successfully",
                reopenedAt = EnsureUtc(DateTime.UtcNow),
                previousResolvedAt = EnsureUtc(ticket.ResolvedAt)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reopening ticket {TicketId}", id);
            return StatusCode(500, $"Error reopening ticket: {ex.Message}");
        }
    }

    // GET: api/tickets/{id}/reopen-info
    /// <summary>
    /// Get reopen eligibility information for a ticket.
    /// Returns whether the ticket can be reopened and time remaining.
    /// </summary>
    [HttpGet("{id:guid}/reopen-info")]
    public async Task<ActionResult> GetReopenInfo(Guid id)
    {
        try
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            // Only resolved tickets can be reopened
            if (ticket.Status != 4)
            {
                return Ok(new
                {
                    canReopen = false,
                    reason = "Ticket is not in resolved status",
                    status = ticket.Status,
                    hoursRemaining = 0,
                    minutesRemaining = 0,
                    secondsRemaining = 0
                });
            }

            // Use UpdatedAt as fallback if ResolvedAt is not set
            var resolvedTime = ticket.ResolvedAt ?? ticket.UpdatedAt;

            var timeSinceResolved = DateTime.UtcNow - resolvedTime;
            var timeRemaining = TimeSpan.FromHours(48) - timeSinceResolved;
            var canReopen = timeRemaining.TotalSeconds > 0;

            return Ok(new
            {
                canReopen = canReopen,
                reason = canReopen ? "Ticket can be reopened" : "48-hour reopen window has expired",
                status = ticket.Status,
                resolvedAt = EnsureUtc(resolvedTime),
                expiresAt = EnsureUtc(resolvedTime.AddHours(48)),
                hoursRemaining = canReopen ? (int)timeRemaining.TotalHours : 0,
                minutesRemaining = canReopen ? timeRemaining.Minutes : 0,
                secondsRemaining = canReopen ? timeRemaining.Seconds : 0,
                totalSecondsRemaining = canReopen ? (int)timeRemaining.TotalSeconds : 0
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reopen info for ticket {TicketId}", id);
            return StatusCode(500, $"Error getting reopen info: {ex.Message}");
        }
    }
}

public class ReopenTicketRequest
{
    public string? Reason { get; set; }
}

// DTOs for request/response
public class CreateTicketRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; }
    
    // Extended fields for new settings integration
    public int? CategoryId { get; set; }
    public int? SubcategoryId { get; set; }
    public int? DepartmentId { get; set; }
    public int? StatusId { get; set; }
    
    // Custom field values
    public Dictionary<string, object>? CustomFieldValues { get; set; }
    
    // File attachments
    public List<AttachmentRequest>? Attachments { get; set; }
}

public class AttachmentRequest
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Base64Content { get; set; } = string.Empty;
}

public class UpdateTicketRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public TicketCategory? Category { get; set; }
    public TicketPriority? Priority { get; set; }
    public TicketStatus? Status { get; set; }
    public string? AssignedToUserId { get; set; }
    
    // Extended fields for relational database support
    public int? SubCategory { get; set; } // Maps to database SubCategory column
    public int? CategoryId { get; set; } // Maps to relational category tables
    public int? SubcategoryId { get; set; } // Maps to relational subcategory tables  
    public int? DepartmentId { get; set; } // Maps to department assignment
}

public class AddCommentRequest
{
    public string Content { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = false;
}

public class AssignTicketRequest
{
    public string AgentId { get; set; } = string.Empty;
}

public class AddCollaboratorRequest
{
    public string UserId { get; set; } = string.Empty;
    public string? Role { get; set; }
}