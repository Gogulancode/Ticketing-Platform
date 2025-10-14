using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Entities; // Add for User
using ERPTraining.Core.Services;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using System.Security.Claims;
using Microsoft.Data.SqlClient;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/tickets")]
[Authorize] // Authentication required for all endpoints
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly IA_TicketSettingsService _settingsService;
    private readonly ILogger<TicketsController> _logger;
    private readonly string _connectionString;

    public TicketsController(ITicketService ticketService, IA_TicketSettingsService settingsService, ILogger<TicketsController> logger, IConfiguration configuration)
    {
        _ticketService = ticketService;
        _settingsService = settingsService;
        _logger = logger;
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
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
                // Get basic user info for created by user
                User? createdByUser = null;
                if (!string.IsNullOrEmpty(ticket.CreatedByUserId))
                {
                    createdByUser = await _ticketService.GetUserAsync(ticket.CreatedByUserId);
                }
                
                response.Add(new
                {
                    id = ticket.Id,
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

    // GET: api/tickets/my
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<object>>> GetMyTickets()
    {
        try
        {
            var userId = GetCurrentUserId();
            var tickets = await _ticketService.GetTicketsByUserAsync(userId);
            
            // Create response with basic user information
            var response = new List<object>();
            
            foreach (var ticket in tickets)
            {
                // Get basic user info for created by user
                User? createdByUser = null;
                if (!string.IsNullOrEmpty(ticket.CreatedByUserId))
                {
                    createdByUser = await _ticketService.GetUserAsync(ticket.CreatedByUserId);
                }
                
                response.Add(new
                {
                    id = ticket.Id,
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
                Description = request.Description,
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
                            INSERT INTO TicketCustomFieldValues (TicketId, CustomFieldId, Value, CreatedAt, UpdatedAt)
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
                attachmentCount = request.Attachments?.Count ?? 0
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

            // Create the comment using the service
            var comment = await _ticketService.AddCommentAsync(id, request.Content, authorUserId, request.IsInternal);
            
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