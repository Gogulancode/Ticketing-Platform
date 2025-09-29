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
// [Authorize] // TODO: Re-enable in production; disabled for dev testing
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

    private string GetCurrentUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                    User.FindFirst("sub")?.Value ?? 
                    User.FindFirst("userid")?.Value;
        
        // For development: return a valid user ID if no authenticated user
        // TODO: Replace with proper authentication in production
        return userId ?? "0016f2fc-c4da-42d7-a635-236b4b95c6f1";
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
    [AllowAnonymous] // TODO: Remove in production; for dev dashboard
    public async Task<ActionResult<IEnumerable<object>>> GetTickets(
        [FromQuery] TicketStatus? status = null,
        [FromQuery] TicketPriority? priority = null,
        [FromQuery] TicketCategory? category = null)
    {
        try
        {
            var tickets = await _ticketService.GetFilteredTicketsAsync(status, priority, category);
            
            // Return clean DTOs to avoid circular references
            var response = tickets.Select(ticket => new
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
                createdAt = ticket.CreatedAt,
                updatedAt = ticket.UpdatedAt,
                firstResponseAt = ticket.FirstResponseAt,
                resolvedAt = ticket.ResolvedAt,
                isOverdue = false, // Calculate if needed
                // For list view, we'll skip user details and counts for performance
                // Use the single ticket endpoint to get full details
                commentCount = 0, // Placeholder
                attachmentCount = 0 // Placeholder
            });
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving tickets: {ex.Message}");
        }
    }

    // GET: api/tickets/my
    [HttpGet("my")]
    [AllowAnonymous] // TODO: Remove in production; for dev testing
    public async Task<ActionResult<IEnumerable<object>>> GetMyTickets()
    {
        try
        {
            var userId = GetCurrentUserId();
            var tickets = await _ticketService.GetTicketsByUserAsync(userId);
            
            // Return clean DTOs to avoid circular references
            var response = tickets.Select(ticket => new
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
                createdAt = ticket.CreatedAt,
                updatedAt = ticket.UpdatedAt,
                firstResponseAt = ticket.FirstResponseAt,
                resolvedAt = ticket.ResolvedAt,
                isOverdue = false, // Calculate if needed
                // For list view, we'll skip user details and counts for performance
                commentCount = 0, // Placeholder
                attachmentCount = 0 // Placeholder
            });
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving user tickets: {ex.Message}");
        }
    }

    // GET: api/tickets/{id}
    [HttpGet("{id:guid}")]
    [AllowAnonymous] // TODO: Remove in production; for dev testing
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
                createdAt = ticket.CreatedAt,
                updatedAt = ticket.UpdatedAt,
                firstResponseAt = ticket.FirstResponseAt,
                resolvedAt = ticket.ResolvedAt,
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
                    createdAt = a.CreatedAt
                }),
                // Include comments safely
                comments = comments.Select(c => new {
                    id = c.Id,
                    body = c.Body ?? "",
                    authorUserId = c.AuthorUserId ?? "",
                    isInternal = c.IsInternal,
                    createdAt = c.CreatedAt
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
    [AllowAnonymous] // TODO: Remove in production; for dev testing
    public async Task<ActionResult<Ticket>> CreateTicket([FromBody] CreateTicketRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = GetCurrentUserId();
            Console.WriteLine($"DEBUG: Current User ID = '{currentUserId}'");

            // Determine subcategory automatically based on keywords if not provided
            var subcategoryId = request.SubcategoryId;
            if (!subcategoryId.HasValue)
            {
                subcategoryId = await DetermineSubcategoryAsync(request.Title, request.Description ?? "");
                _logger.LogInformation("Auto-determined subcategory: {SubcategoryId} for title: {Title}", subcategoryId, request.Title);
            }

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
                Status = (TicketStatus)(request.StatusId ?? 0) // Default to 0 (New) if not provided
            };

            var createdTicket = await _ticketService.CreateTicketAsync(ticket);

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
                            CreatedAt = DateTime.UtcNow
                        };
                        
                        // Add attachment to database
                        await _ticketService.AddAttachmentAsync(attachment);
                    }
                    catch (Exception ex)
                    {
                        // Log attachment error but don't fail ticket creation
                        Console.WriteLine($"Failed to process attachment {attachmentReq.FileName}: {ex.Message}");
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
                createdAt = createdTicket.CreatedAt,
                updatedAt = createdTicket.UpdatedAt,
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
    [AllowAnonymous] // TODO: Remove in production; for dev testing
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
                createdAt = comment.CreatedAt,
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
    [AllowAnonymous] // TODO: Remove in production; for dev testing
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
                createdAt = c.CreatedAt
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
    [AllowAnonymous] // TODO: Remove in production; for dev dashboard
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