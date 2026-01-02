using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Services.Ticketing;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/tickets-v2")]
[Authorize] // Enterprise security: Require authentication for all endpoints
[EnableRateLimiting("api")]  // Enterprise: API rate limiting
public class TicketsV2Controller : ControllerBase
{
    private readonly string _connectionString;
    private readonly ILogger<TicketsV2Controller> _logger;
    private readonly MicrosoftGraphEmailService _emailService;

    public TicketsV2Controller(
        IConfiguration configuration, 
        ILogger<TicketsV2Controller> logger,
        MicrosoftGraphEmailService emailService)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
        _logger = logger;
        _emailService = emailService;
    }

    // Helper method to ensure DateTime is properly stored as UTC
    private DateTime GetUtcNow()
    {
        return DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
    }

    // COMMENTS - Direct SQL approach that WORKS + Email Notifications
    [HttpPost("{ticketId:guid}/comments")]
    public async Task<ActionResult> AddComment(Guid ticketId, [FromBody] AddCommentV2Request request)
    {
        try
        {
            var commentId = Guid.NewGuid();
            
            // Get the actual logged-in user's ID from JWT claims
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value
                      ?? User.FindFirst("userId")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }
            
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            // Insert comment
            var sql = @"
                INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Id", commentId);
            command.Parameters.AddWithValue("@TicketId", ticketId);
            command.Parameters.AddWithValue("@Body", request.Content);
            command.Parameters.AddWithValue("@AuthorUserId", userId);
            command.Parameters.AddWithValue("@IsInternal", request.IsInternal);
            command.Parameters.AddWithValue("@CreatedAt", GetUtcNow());
            
            await command.ExecuteNonQueryAsync();
            
            // Send email notification (if not internal comment)
            if (!request.IsInternal)
            {
                await SendCommentNotificationEmail(ticketId, request.Content, connection);
            }
            
            return Ok(new { 
                id = commentId, 
                body = request.Content, 
                isInternal = request.IsInternal,
                message = "Comment added successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding comment");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ADD COMMENT WITH ATTACHMENTS
    [HttpPost("{ticketId:guid}/comments-with-attachments")]
    public async Task<ActionResult> AddCommentWithAttachments(
        Guid ticketId, 
        [FromForm] string content, 
        [FromForm] bool isInternal = false,
        [FromForm] List<IFormFile>? attachments = null)
    {
        try
        {
            var commentId = Guid.NewGuid();
            
            // Get the actual logged-in user's ID from JWT claims
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value
                      ?? User.FindFirst("userId")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }
            
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            // Insert comment
            var sql = @"
                INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Id", commentId);
            command.Parameters.AddWithValue("@TicketId", ticketId);
            command.Parameters.AddWithValue("@Body", content);
            command.Parameters.AddWithValue("@AuthorUserId", userId);
            command.Parameters.AddWithValue("@IsInternal", isInternal);
            command.Parameters.AddWithValue("@CreatedAt", GetUtcNow());
            
            await command.ExecuteNonQueryAsync();
            
            // Save attachments if provided - link them to the comment
            var savedAttachments = new List<object>();
            if (attachments != null && attachments.Any())
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "tickets");
                Directory.CreateDirectory(uploadsFolder);

                foreach (var file in attachments)
                {
                    var attachmentId = Guid.NewGuid();
                    var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    // Read file into memory and save
                    using var memoryStream = new MemoryStream();
                    await file.CopyToAsync(memoryStream);
                    await System.IO.File.WriteAllBytesAsync(filePath, memoryStream.ToArray());

                    // Save attachment record to database with CommentId
                    var attachmentSql = @"
                        INSERT INTO Attachments (Id, TicketId, CommentId, FileName, StoragePath, SizeBytes, ContentType, CreatedAt, UploadedByUserId)
                        VALUES (@Id, @TicketId, @CommentId, @FileName, @StoragePath, @SizeBytes, @ContentType, @CreatedAt, @UploadedByUserId)";
                    
                    using var attachmentCommand = new SqlCommand(attachmentSql, connection);
                    attachmentCommand.Parameters.AddWithValue("@Id", attachmentId);
                    attachmentCommand.Parameters.AddWithValue("@TicketId", ticketId);
                    attachmentCommand.Parameters.AddWithValue("@CommentId", commentId);
                    attachmentCommand.Parameters.AddWithValue("@FileName", file.FileName);
                    attachmentCommand.Parameters.AddWithValue("@StoragePath", filePath);
                    attachmentCommand.Parameters.AddWithValue("@SizeBytes", file.Length);
                    attachmentCommand.Parameters.AddWithValue("@ContentType", file.ContentType ?? "application/octet-stream");
                    attachmentCommand.Parameters.AddWithValue("@CreatedAt", GetUtcNow());
                    attachmentCommand.Parameters.AddWithValue("@UploadedByUserId", userId);
                    
                    await attachmentCommand.ExecuteNonQueryAsync();
                    
                    savedAttachments.Add(new {
                        id = attachmentId,
                        fileName = file.FileName,
                        contentType = file.ContentType ?? "application/octet-stream",
                        sizeBytes = file.Length
                    });
                }
            }
            
            // Send email notification (if not internal comment)
            if (!isInternal)
            {
                await SendCommentNotificationEmail(ticketId, content, connection);
            }
            
            return Ok(new { 
                id = commentId, 
                body = content, 
                isInternal = isInternal,
                attachments = savedAttachments,
                message = "Comment added successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding comment with attachments");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // GET SINGLE TICKET
    [HttpGet]
    public async Task<ActionResult> GetTickets([FromQuery] int limit = 50, [FromQuery] string? excludeTicketId = null)
    {
        try
        {
            var cappedLimit = Math.Clamp(limit, 1, 100);

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                SELECT TOP (@Limit)
                       t.Id, t.PublicId, t.Title, t.Description, t.Category, t.Priority, t.Status,
                       t.CreatedAt, t.CategoryId, t.SubcategoryId,
                       cu.FirstName + ' ' + cu.LastName as CreatedByName,
                       CASE WHEN mp.Id IS NOT NULL THEN 1 ELSE 0 END as IsPrimaryMerged,
                       CASE WHEN EXISTS(SELECT 1 FROM MergedTickets mt WHERE ',' + mt.MergedTicketIds + ',' LIKE '%,' + CAST(t.Id AS NVARCHAR(36)) + ',%') THEN 1 ELSE 0 END as WasMergedInto,
                       mp.PrimaryTicketId as MergedIntoPrimaryId,
                       (SELECT COUNT(*) FROM STRING_SPLIT(COALESCE(mp.MergedTicketIds, ''), ',') WHERE value <> '') as MergedTicketsCount
                FROM Tickets t
                LEFT JOIN AspNetUsers cu ON t.CreatedByUserId = cu.Id
                LEFT JOIN MergedTickets mp ON mp.PrimaryTicketId = t.Id
                WHERE t.Status != 99
                  AND (@ExcludeTicketId IS NULL OR t.Id != @ExcludeTicketId)
                ORDER BY t.CreatedAt DESC";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Limit", cappedLimit);
            // Use explicit SqlDbType for nullable GUID parameter to avoid type inference issues
            var excludeParam = command.Parameters.Add("@ExcludeTicketId", System.Data.SqlDbType.UniqueIdentifier);
            excludeParam.Value = string.IsNullOrEmpty(excludeTicketId) ? DBNull.Value : Guid.Parse(excludeTicketId);

            var tickets = new List<object>();
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var isPrimaryMerged = reader["IsPrimaryMerged"] != DBNull.Value && (int)reader["IsPrimaryMerged"] == 1;
                var wasMergedInto = reader["WasMergedInto"] != DBNull.Value && (int)reader["WasMergedInto"] == 1;
                var mergedTicketsCount = reader["MergedTicketsCount"] != DBNull.Value ? (int)reader["MergedTicketsCount"] : 0;
                
                tickets.Add(new
                {
                    id = reader["Id"].ToString(),
                    publicId = reader["PublicId"] != DBNull.Value ? (int)reader["PublicId"] : (int?)null,
                    title = reader["Title"].ToString(),
                    description = reader["Description"] != DBNull.Value ? reader["Description"].ToString() : string.Empty,
                    category = reader["Category"] != DBNull.Value ? (int)reader["Category"] : (int?)null,
                    priority = (int)reader["Priority"],
                    status = (int)reader["Status"],
                    createdAt = ((DateTime)reader["CreatedAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    categoryId = reader["CategoryId"] != DBNull.Value ? (int)reader["CategoryId"] : (int?)null,
                    subcategoryId = reader["SubcategoryId"] != DBNull.Value ? (int)reader["SubcategoryId"] : (int?)null,
                    createdByName = reader["CreatedByName"]?.ToString() ?? "Unknown User",
                    // Merge information
                    hasMergedTickets = isPrimaryMerged,
                    wasMergedIntoAnother = wasMergedInto,
                    mergedTicketsCount = mergedTicketsCount
                });
            }

            return Ok(tickets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching tickets list");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{ticketId:guid}")]
    public async Task<ActionResult> GetTicket(Guid ticketId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT t.Id, t.PublicId, t.Title, t.Description, t.Category, t.Priority, t.Status, 
                       t.Source, t.CreatedByUserId, t.AssignedToUserId, t.CreatedAt, t.UpdatedAt,
                       t.FirstResponseAt, t.ResolvedAt, 
                       CASE WHEN t.SlaResolutionDueAt IS NOT NULL AND t.SlaResolutionDueAt < GETUTCDATE() AND t.Status NOT IN (5, 6) THEN 1 ELSE 0 END as IsOverdue,
                       t.CategoryId, t.SubcategoryId, t.DepartmentId,
                       cu.FirstName as CreatedByFirstName, cu.LastName as CreatedByLastName, cu.Email as CreatedByEmail,
                       au.FirstName as AssignedToFirstName, au.LastName as AssignedToLastName, au.Email as AssignedToEmail
                FROM Tickets t
                LEFT JOIN AspNetUsers cu ON t.CreatedByUserId = cu.Id
                LEFT JOIN AspNetUsers au ON t.AssignedToUserId = au.Id
                WHERE t.Id = @TicketId";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@TicketId", ticketId);
            
            using var reader = await command.ExecuteReaderAsync();
            
            if (await reader.ReadAsync())
            {
                var ticket = new
                {
                    id = reader["Id"].ToString(),
                    publicId = reader["PublicId"] != DBNull.Value ? (int)reader["PublicId"] : (int?)null,
                    title = reader["Title"].ToString(),
                    description = reader["Description"].ToString(),
                    category = (int)reader["Category"],
                    priority = (int)reader["Priority"],
                    status = (int)reader["Status"],
                    source = (int)reader["Source"],
                    createdByUserId = reader["CreatedByUserId"].ToString(),
                    assignedToUserId = reader["AssignedToUserId"]?.ToString(),
                    createdAt = ((DateTime)reader["CreatedAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    updatedAt = ((DateTime)reader["UpdatedAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    firstResponseAt = reader["FirstResponseAt"] != DBNull.Value ? ((DateTime)reader["FirstResponseAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ") : null,
                    resolvedAt = reader["ResolvedAt"] != DBNull.Value ? ((DateTime)reader["ResolvedAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ") : null,
                    isOverdue = reader["IsOverdue"] != DBNull.Value && (int)reader["IsOverdue"] == 1,
                    categoryId = reader["CategoryId"] != DBNull.Value ? (int)reader["CategoryId"] : (int?)null,
                    subcategoryId = reader["SubcategoryId"] != DBNull.Value ? (int)reader["SubcategoryId"] : (int?)null,
                    departmentId = reader["DepartmentId"] != DBNull.Value ? (int)reader["DepartmentId"] : (int?)null,
                    createdByUser = reader["CreatedByFirstName"] != DBNull.Value ? new
                    {
                        id = reader["CreatedByUserId"].ToString(),
                        firstName = reader["CreatedByFirstName"].ToString(),
                        lastName = reader["CreatedByLastName"].ToString(),
                        email = reader["CreatedByEmail"].ToString()
                    } : null,
                    assignedToUser = reader["AssignedToFirstName"] != DBNull.Value ? new
                    {
                        id = reader["AssignedToUserId"].ToString(),
                        firstName = reader["AssignedToFirstName"].ToString(),
                        lastName = reader["AssignedToLastName"].ToString(),
                        email = reader["AssignedToEmail"].ToString()
                    } : null
                };
                
                // Now close the first reader and get attachments
                reader.Close();
                
                // Get attachments for this ticket
                var attachmentSql = @"
                    SELECT Id, FileName, ContentType, SizeBytes, CreatedAt
                    FROM Attachments
                    WHERE TicketId = @TicketId
                    ORDER BY CreatedAt";
                    
                using var attachmentCommand = new SqlCommand(attachmentSql, connection);
                attachmentCommand.Parameters.AddWithValue("@TicketId", ticketId);
                
                var attachments = new List<object>();
                using var attachmentReader = await attachmentCommand.ExecuteReaderAsync();
                
                while (await attachmentReader.ReadAsync())
                {
                    attachments.Add(new
                    {
                        id = attachmentReader["Id"].ToString(),
                        fileName = attachmentReader["FileName"].ToString(),
                        contentType = attachmentReader["ContentType"].ToString(),
                        sizeBytes = (long)attachmentReader["SizeBytes"],
                        createdAt = ((DateTime)attachmentReader["CreatedAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ")
                    });
                }
                
                // Get merged tickets information
                attachmentReader.Close();
                
                // Check if this ticket has merged tickets or was merged into another
                var mergedInfoSql = @"
                    -- Check if this ticket is a primary ticket (has other tickets merged into it)
                    SELECT 'PRIMARY' as MergeType, Id as MergeId, MergedTicketIds, MergeReason, MergedAt
                    FROM MergedTickets
                    WHERE PrimaryTicketId = @TicketId
                    
                    UNION ALL
                    
                    -- Check if this ticket was merged into another ticket
                    SELECT 'MERGED_INTO' as MergeType, mt.Id as MergeId, 
                           CAST(mt.PrimaryTicketId AS NVARCHAR(36)) as MergedTicketIds, 
                           mt.MergeReason, mt.MergedAt
                    FROM MergedTickets mt
                    WHERE ',' + mt.MergedTicketIds + ',' LIKE '%,' + CAST(@TicketId AS NVARCHAR(36)) + ',%'";
                
                using var mergedCommand = new SqlCommand(mergedInfoSql, connection);
                mergedCommand.Parameters.AddWithValue("@TicketId", ticketId);
                
                var mergedTicketsInfo = new List<object>();
                var wasMergedInto = (object?)null;
                
                using var mergedReader = await mergedCommand.ExecuteReaderAsync();
                while (await mergedReader.ReadAsync())
                {
                    var mergeType = mergedReader["MergeType"].ToString();
                    if (mergeType == "PRIMARY")
                    {
                        var mergedTicketIds = mergedReader["MergedTicketIds"].ToString()?.Split(',') ?? Array.Empty<string>();
                        mergedTicketsInfo.Add(new
                        {
                            mergeId = mergedReader["MergeId"],
                            mergedTicketIds = mergedTicketIds,
                            mergeReason = mergedReader["MergeReason"],
                            mergedAt = mergedReader["MergedAt"]
                        });
                    }
                    else if (mergeType == "MERGED_INTO")
                    {
                        wasMergedInto = new
                        {
                            mergeId = mergedReader["MergeId"],
                            primaryTicketId = mergedReader["MergedTicketIds"],
                            mergeReason = mergedReader["MergeReason"],
                            mergedAt = mergedReader["MergedAt"]
                        };
                    }
                }
                
                // Get custom field values for this ticket
                mergedReader.Close();
                
                                var customFieldSql = @"
                                        SELECT tcfv.CustomFieldId, tcfv.Value, cf.Name as FieldName, cf.Label as FieldLabel
                                        FROM TicketFieldValues tcfv
                                        INNER JOIN CustomFields cf ON tcfv.CustomFieldId = cf.Id
                                        WHERE tcfv.TicketId = @TicketId
                                            AND cf.IsActive = 1";
                
                using var customFieldCommand = new SqlCommand(customFieldSql, connection);
                customFieldCommand.Parameters.AddWithValue("@TicketId", ticketId);
                
                var customFieldValues = new List<object>();
                using var customFieldReader = await customFieldCommand.ExecuteReaderAsync();
                
                while (await customFieldReader.ReadAsync())
                {
                    customFieldValues.Add(new
                    {
                        customFieldId = (int)customFieldReader["CustomFieldId"],
                        value = customFieldReader["Value"].ToString(),
                        fieldName = customFieldReader["FieldName"].ToString(),
                        fieldLabel = customFieldReader["FieldLabel"].ToString()
                    });
                }
                
                // Return ticket with attachments, merge information, and custom fields included
                var result = new
                {
                    ticket.id,
                    ticket.publicId,
                    ticket.title,
                    ticket.description,
                    ticket.category,
                    ticket.priority,
                    ticket.status,
                    ticket.source,
                    ticket.createdByUserId,
                    ticket.assignedToUserId,
                    ticket.createdAt,
                    ticket.updatedAt,
                    ticket.firstResponseAt,
                    ticket.resolvedAt,
                    ticket.isOverdue,
                    ticket.categoryId,
                    ticket.subcategoryId,
                    ticket.departmentId,
                    ticket.createdByUser,
                    ticket.assignedToUser,
                    attachments, // Include attachments in the response
                    customFieldValues, // Include custom field values
                    mergeInfo = new
                    {
                        hasMergedTickets = mergedTicketsInfo.Any(),
                        mergedTickets = mergedTicketsInfo,
                        wasMergedInto = wasMergedInto
                    }
                };
                
                return Ok(result);
            }
            else
            {
                return NotFound(new { message = "Ticket not found" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // GET TICKET BY PUBLIC ID - Lookup ticket by public ID and return the GUID
    [HttpGet("by-public-id/{publicId:int}")]
    public async Task<ActionResult> GetTicketByPublicId(int publicId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT Id, PublicId, Title
                FROM Tickets
                WHERE PublicId = @PublicId";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@PublicId", publicId);
            
            using var reader = await command.ExecuteReaderAsync();
            
            if (!await reader.ReadAsync())
            {
                return NotFound(new { error = $"Ticket #{publicId} not found" });
            }
            
            return Ok(new
            {
                id = reader["Id"].ToString(),
                publicId = (int)reader["PublicId"],
                title = reader["Title"].ToString()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error looking up ticket by public ID {PublicId}", publicId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // GET COMMENTS
    [HttpGet("{ticketId:guid}/comments")]
    public async Task<ActionResult> GetComments(Guid ticketId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            // Get comments
            var commentSql = @"
                SELECT c.Id, c.Body, c.AuthorUserId, c.IsInternal, c.CreatedAt,
                       u.FirstName + ' ' + u.LastName as AuthorName
                FROM TicketComments c
                LEFT JOIN AspNetUsers u ON c.AuthorUserId = u.Id
                WHERE c.TicketId = @TicketId
                ORDER BY c.CreatedAt ASC";
                
            using var commentCommand = new SqlCommand(commentSql, connection);
            commentCommand.Parameters.AddWithValue("@TicketId", ticketId);
            
            var commentsList = new List<Dictionary<string, object>>();
            using var commentReader = await commentCommand.ExecuteReaderAsync();
            
            while (await commentReader.ReadAsync())
            {
                var commentId = (Guid)commentReader["Id"];
                commentsList.Add(new Dictionary<string, object>
                {
                    ["id"] = commentId,
                    ["body"] = commentReader["Body"],
                    ["authorUserId"] = commentReader["AuthorUserId"],
                    ["authorName"] = commentReader["AuthorName"] ?? "Unknown User",
                    ["isInternal"] = commentReader["IsInternal"],
                    ["createdAt"] = ((DateTime)commentReader["CreatedAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ["attachments"] = new List<object>() // Will be populated below
                });
            }
            commentReader.Close();
            
            // Get attachments for each comment (only if CommentId column exists)
            var attachmentsByComment = new Dictionary<Guid, List<object>>();
            
            try
            {
                var attachmentSql = @"
                    SELECT Id, CommentId, FileName, ContentType, SizeBytes, CreatedAt
                    FROM Attachments
                    WHERE TicketId = @TicketId AND CommentId IS NOT NULL
                    ORDER BY CreatedAt ASC";
                    
                using var attachmentCommand = new SqlCommand(attachmentSql, connection);
                attachmentCommand.Parameters.AddWithValue("@TicketId", ticketId);
                
                using var attachmentReader = await attachmentCommand.ExecuteReaderAsync();
                
                while (await attachmentReader.ReadAsync())
                {
                    // Handle potential NULL CommentId (shouldn't happen with IS NOT NULL filter, but be safe)
                    if (attachmentReader["CommentId"] == DBNull.Value)
                        continue;
                        
                    var commentId = (Guid)attachmentReader["CommentId"];
                    if (!attachmentsByComment.ContainsKey(commentId))
                    {
                        attachmentsByComment[commentId] = new List<object>();
                    }
                    
                    attachmentsByComment[commentId].Add(new
                    {
                        id = attachmentReader["Id"],
                        fileName = attachmentReader["FileName"],
                        contentType = attachmentReader["ContentType"],
                        sizeBytes = attachmentReader["SizeBytes"],
                        createdAt = ((DateTime)attachmentReader["CreatedAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ")
                    });
                }
            }
            catch (SqlException ex) when (ex.Message.Contains("Invalid column name 'CommentId'"))
            {
                // CommentId column doesn't exist yet - migration not applied
                // This is fine, just return comments without attachments
                _logger.LogWarning("CommentId column not found in Attachments table - migration may not be applied");
            }
            
            // Attach attachments to comments
            foreach (var comment in commentsList)
            {
                var commentId = (Guid)comment["id"];
                if (attachmentsByComment.ContainsKey(commentId))
                {
                    comment["attachments"] = attachmentsByComment[commentId];
                }
            }
            
            return Ok(commentsList);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comments");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // UPDATE TICKET - Categories, SubCategories, Departments, etc.
    [HttpPut("{ticketId:guid}")]
    public async Task<ActionResult> UpdateTicket(Guid ticketId, [FromBody] UpdateTicketV2Request request)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            // Get current ticket details before update (to check if assignment or status changed)
            string? oldAssignedToUserId = null;
            int? oldStatus = null;
            string? createdByUserId = null;
            using (var checkCmd = new SqlCommand("SELECT AssignedToUserId, Status, CreatedByUserId FROM Tickets WHERE Id = @TicketId", connection))
            {
                checkCmd.Parameters.AddWithValue("@TicketId", ticketId);
                using var reader = await checkCmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    oldAssignedToUserId = reader["AssignedToUserId"] != DBNull.Value ? reader["AssignedToUserId"].ToString() : null;
                    oldStatus = reader["Status"] != DBNull.Value ? (int?)reader["Status"] : null;
                    createdByUserId = reader["CreatedByUserId"] != DBNull.Value ? reader["CreatedByUserId"].ToString() : null;
                }
            }
            
            // Start transaction for atomicity
            using var transaction = connection.BeginTransaction();
            
            try
            {
                // Convert priority from database ID (1-4) to enum value (0-3) if provided
                // Database: Low=1, Medium=2, High=3, Critical=4
                // Enum:     Low=0, Medium=1, High=2, Critical=3
                int? priorityEnumValue = null;
                if (request.Priority.HasValue)
                {
                    // If priority is 1-4, convert to 0-3 (database ID to enum)
                    // If priority is already 0-3, keep as-is (backwards compatibility)
                    priorityEnumValue = request.Priority.Value >= 1 && request.Priority.Value <= 4
                        ? request.Priority.Value - 1
                        : request.Priority.Value;
                }
                
                // Update main ticket fields
                // Set ResolvedAt when status changes to Resolved (4)
                // Set FirstResponseAt if this is the first response from non-creator
                var sql = @"
                    UPDATE Tickets SET 
                        Title = COALESCE(@Title, Title),
                        Description = COALESCE(@Description, Description),
                        Category = COALESCE(@Category, Category),
                        Priority = COALESCE(@Priority, Priority),
                        Status = COALESCE(@Status, Status),
                        CategoryId = COALESCE(@CategoryId, CategoryId),
                        SubcategoryId = COALESCE(@SubcategoryId, SubcategoryId),
                        DepartmentId = COALESCE(@DepartmentId, DepartmentId),
                        AssignedToUserId = COALESCE(@AssignedToUserId, AssignedToUserId),
                        UpdatedAt = @UpdatedAt,
                        ResolvedAt = CASE 
                            WHEN @Status = 4 AND ResolvedAt IS NULL THEN @UpdatedAt 
                            ELSE ResolvedAt 
                        END,
                        FirstResponseAt = CASE 
                            WHEN FirstResponseAt IS NULL AND CreatedByUserId != @CurrentUserId THEN @UpdatedAt 
                            ELSE FirstResponseAt 
                        END
                    WHERE Id = @TicketId";
                    
                using var command = new SqlCommand(sql, connection, transaction);
                command.Parameters.AddWithValue("@TicketId", ticketId);
                command.Parameters.AddWithValue("@Title", (object?)request.Title ?? DBNull.Value);
                command.Parameters.AddWithValue("@Description", (object?)request.Description ?? DBNull.Value);
                command.Parameters.AddWithValue("@Category", (object?)request.Category ?? DBNull.Value);
                command.Parameters.AddWithValue("@Priority", (object?)priorityEnumValue ?? DBNull.Value);
                command.Parameters.AddWithValue("@Status", (object?)request.Status ?? DBNull.Value);
                command.Parameters.AddWithValue("@CategoryId", (object?)request.CategoryId ?? DBNull.Value);
                command.Parameters.AddWithValue("@SubcategoryId", (object?)request.SubcategoryId ?? DBNull.Value);
                command.Parameters.AddWithValue("@DepartmentId", (object?)request.DepartmentId ?? DBNull.Value);
                command.Parameters.AddWithValue("@AssignedToUserId", (object?)request.AssignedToUserId ?? DBNull.Value);
                command.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                                 ?? User.FindFirst("sub")?.Value
                                 ?? User.FindFirst("userId")?.Value
                                 ?? "";
                command.Parameters.AddWithValue("@CurrentUserId", currentUserId);
                
                var rowsAffected = await command.ExecuteNonQueryAsync();
                
                if (rowsAffected == 0)
                {
                    transaction.Rollback();
                    return NotFound(new { error = "Ticket not found" });
                }
                
                // Handle custom fields if provided
                if (request.CustomFields != null && request.CustomFields.Any())
                {
                    _logger.LogInformation("Updating custom fields for ticket {TicketId}: {@CustomFields}", ticketId, request.CustomFields);
                    
                    foreach (var customField in request.CustomFields)
                    {
                        if (int.TryParse(customField.Key, out int fieldId))
                        {
                            var fieldValue = customField.Value?.ToString() ?? "";
                            
                            // First, try to update existing custom field value
                            var updateCustomFieldSql = @"
                                UPDATE TicketFieldValues 
                                SET Value = @Value, UpdatedAt = @UpdatedAt
                                WHERE TicketId = @TicketId AND CustomFieldId = @CustomFieldId";
                            
                            using var updateCmd = new SqlCommand(updateCustomFieldSql, connection, transaction);
                            updateCmd.Parameters.AddWithValue("@TicketId", ticketId);
                            updateCmd.Parameters.AddWithValue("@CustomFieldId", fieldId);
                            updateCmd.Parameters.AddWithValue("@Value", fieldValue);
                            updateCmd.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
                            
                            var customFieldRowsAffected = await updateCmd.ExecuteNonQueryAsync();
                            
                            // If no existing record was updated, insert a new one
                            if (customFieldRowsAffected == 0)
                            {
                                var insertCustomFieldSql = @"
                                    INSERT INTO TicketFieldValues (TicketId, CustomFieldId, Value, CreatedAt, UpdatedAt)
                                    VALUES (@TicketId, @CustomFieldId, @Value, @CreatedAt, @UpdatedAt)";
                                
                                using var insertCmd = new SqlCommand(insertCustomFieldSql, connection, transaction);
                                insertCmd.Parameters.AddWithValue("@TicketId", ticketId);
                                insertCmd.Parameters.AddWithValue("@CustomFieldId", fieldId);
                                insertCmd.Parameters.AddWithValue("@Value", fieldValue);
                                insertCmd.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                                insertCmd.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
                                
                                await insertCmd.ExecuteNonQueryAsync();
                                _logger.LogInformation("Inserted new custom field value: TicketId={TicketId}, FieldId={FieldId}, Value={Value}", ticketId, fieldId, fieldValue);
                            }
                            else
                            {
                                _logger.LogInformation("Updated existing custom field value: TicketId={TicketId}, FieldId={FieldId}, Value={Value}", ticketId, fieldId, fieldValue);
                            }
                        }
                        else
                        {
                            _logger.LogWarning("Invalid custom field ID format: {FieldKey}", customField.Key);
                        }
                    }
                }
                
                // Commit the transaction
                transaction.Commit();
                
                // Send email notification if agent was assigned
                if (request.AssignedToUserId != null && request.AssignedToUserId != oldAssignedToUserId)
                {
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            using var notifConnection = new SqlConnection(_connectionString);
                            await notifConnection.OpenAsync();
                            
                            // Get ticket details
                            var ticketSql = @"SELECT t.Id, t.PublicId, t.Title, t.Description, t.Priority, t.Status, t.CreatedAt 
                                            FROM Tickets t WHERE t.Id = @TicketId";
                            using var ticketCmd = new SqlCommand(ticketSql, notifConnection);
                            ticketCmd.Parameters.AddWithValue("@TicketId", ticketId);
                            using var ticketReader = await ticketCmd.ExecuteReaderAsync();
                            
                            if (await ticketReader.ReadAsync())
                            {
                                var ticket = new ERPTraining.Core.Entities.Ticketing.Ticket
                                {
                                    Id = (Guid)ticketReader["Id"],
                                    PublicId = ticketReader["PublicId"] != DBNull.Value ? (int?)ticketReader["PublicId"] : null,
                                    Title = ticketReader["Title"]?.ToString() ?? "",
                                    Description = ticketReader["Description"]?.ToString() ?? string.Empty,
                                    Priority = (ERPTraining.Core.Entities.Ticketing.TicketPriority)(int)ticketReader["Priority"],
                                    Status = (int)ticketReader["Status"],
                                    CreatedAt = (DateTime)ticketReader["CreatedAt"]
                                };
                                ticketReader.Close();
                                
                                // Get agent details
                                var agentSql = @"SELECT Id, FirstName, LastName, Email FROM AspNetUsers WHERE Id = @UserId";
                                using var agentCmd = new SqlCommand(agentSql, notifConnection);
                                agentCmd.Parameters.AddWithValue("@UserId", request.AssignedToUserId);
                                using var agentReader = await agentCmd.ExecuteReaderAsync();
                                
                                if (await agentReader.ReadAsync())
                                {
                                    var agent = new ERPTraining.Core.Entities.User
                                    {
                                        Id = agentReader["Id"]?.ToString() ?? string.Empty,
                                        FirstName = agentReader["FirstName"]?.ToString() ?? string.Empty,
                                        LastName = agentReader["LastName"]?.ToString() ?? string.Empty,
                                        Email = agentReader["Email"]?.ToString() ?? string.Empty
                                    };

                                    await _emailService.SendTicketAssignmentNotificationAsync(ticket, agent);
                                    _logger.LogInformation("Sent assignment notification for ticket {TicketId} to agent {AgentEmail}", ticketId, agent.Email);
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error sending assignment notification for ticket {TicketId}", ticketId);
                        }
                    });
                }
                
                // Send email notification if ticket status changed (notify user of any status change)
                if (request.Status != null && request.Status != oldStatus)
                {
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            using var notifConnection = new SqlConnection(_connectionString);
                            await notifConnection.OpenAsync();
                            
                            // Get ticket details
                            var ticketSql = @"SELECT t.Id, t.PublicId, t.Title, t.Description, t.Priority, t.Status, t.CreatedAt, t.ResolvedAt 
                                            FROM Tickets t WHERE t.Id = @TicketId";
                            using var ticketCmd = new SqlCommand(ticketSql, notifConnection);
                            ticketCmd.Parameters.AddWithValue("@TicketId", ticketId);
                            using var ticketReader = await ticketCmd.ExecuteReaderAsync();
                            
                            if (await ticketReader.ReadAsync())
                            {
                                var ticket = new ERPTraining.Core.Entities.Ticketing.Ticket
                                {
                                    Id = (Guid)ticketReader["Id"],
                                    PublicId = ticketReader["PublicId"] != DBNull.Value ? (int?)ticketReader["PublicId"] : null,
                                    Title = ticketReader["Title"]?.ToString() ?? "",
                                    Description = ticketReader["Description"]?.ToString() ?? string.Empty,
                                    Priority = (ERPTraining.Core.Entities.Ticketing.TicketPriority)(int)ticketReader["Priority"],
                                    Status = (int)ticketReader["Status"],
                                    CreatedAt = (DateTime)ticketReader["CreatedAt"],
                                    ResolvedAt = ticketReader["ResolvedAt"] != DBNull.Value ? (DateTime?)ticketReader["ResolvedAt"] : null
                                };
                                ticketReader.Close();
                                
                                // Get creator details
                                if (!string.IsNullOrEmpty(createdByUserId))
                                {
                                    var creatorSql = @"SELECT Id, FirstName, LastName, Email FROM AspNetUsers WHERE Id = @UserId";
                                    using var creatorCmd = new SqlCommand(creatorSql, notifConnection);
                                    creatorCmd.Parameters.AddWithValue("@UserId", createdByUserId);
                                    using var creatorReader = await creatorCmd.ExecuteReaderAsync();
                                    
                                    if (await creatorReader.ReadAsync())
                                    {
                                        var creator = new ERPTraining.Core.Entities.User
                                        {
                                            Id = creatorReader["Id"]?.ToString() ?? string.Empty,
                                            FirstName = creatorReader["FirstName"]?.ToString() ?? string.Empty,
                                            LastName = creatorReader["LastName"]?.ToString() ?? string.Empty,
                                            Email = creatorReader["Email"]?.ToString() ?? string.Empty
                                        };
                                        creatorReader.Close();
                                        
                                        // Get the new status name
                                        var statusName = request.Status switch
                                        {
                                            1 => "Open",
                                            2 => "In Progress",
                                            3 => "Waiting for User",
                                            4 => "Resolved",
                                            5 => "Closed",
                                            _ => $"Status {request.Status}"
                                        };
                                        
                                        // If resolved, use the specialized resolved notification
                                        if (request.Status == 4)
                                        {
                                            // Get resolution notes from latest comment if exists
                                            string? resolutionNotes = null;
                                            var notesSql = @"SELECT TOP 1 Body FROM TicketComments 
                                                           WHERE TicketId = @TicketId AND IsInternal = 0 
                                                           ORDER BY CreatedAt DESC";
                                            using var notesCmd = new SqlCommand(notesSql, notifConnection);
                                            notesCmd.Parameters.AddWithValue("@TicketId", ticketId);
                                            resolutionNotes = (await notesCmd.ExecuteScalarAsync())?.ToString();
                                            
                                            await _emailService.SendTicketResolvedNotificationAsync(ticket, creator, resolutionNotes);
                                            _logger.LogInformation("Sent resolution notification for ticket {TicketId} to creator {CreatorEmail}", ticketId, creator.Email);
                                        }
                                        else
                                        {
                                            // For other status changes, send a generic status update notification
                                            await _emailService.SendTicketStatusUpdateAsync(ticket, creator.Email!, statusName);
                                            _logger.LogInformation("Sent status update notification ({Status}) for ticket {TicketId} to {CreatorEmail}", statusName, ticketId, creator.Email);
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error sending status notification for ticket {TicketId}", ticketId);
                        }
                    });
                }
                
                _logger.LogInformation("Ticket {TicketId} updated successfully with custom fields", ticketId);
                return Ok(new { message = "Ticket updated successfully" });
            }
            catch (Exception)
            {
                transaction.Rollback();
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Error updating ticket" });
        }
    }

    // CLOSE TICKET
    [HttpPost("{ticketId}/close")]
    public async Task<IActionResult> CloseTicket(string ticketId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Get the "Closed" status ID (assuming status 4 is Closed based on frontend)
            var closedStatusId = 4;

            var query = @"
                UPDATE Tickets 
                SET Status = @Status, 
                    UpdatedAt = @UpdatedAt
                WHERE Id = @TicketId AND Status != 99";

            using var command = new SqlCommand(query, connection);
            command.Parameters.Add("@TicketId", SqlDbType.UniqueIdentifier).Value = Guid.Parse(ticketId);
            command.Parameters.Add("@Status", SqlDbType.Int).Value = closedStatusId;
            command.Parameters.Add("@UpdatedAt", SqlDbType.DateTime2).Value = GetUtcNow();

            var rowsAffected = await command.ExecuteNonQueryAsync();
            
            if (rowsAffected == 0)
            {
                return NotFound(new { message = "Ticket not found or already deleted" });
            }

            _logger.LogInformation("Ticket {TicketId} closed successfully", ticketId);
            return Ok(new { message = "Ticket closed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing ticket {TicketId}", ticketId);
            return StatusCode(500, new { message = "An error occurred while closing the ticket" });
        }
    }

    // REOPEN TICKET
    [HttpPost("{ticketId}/reopen")]
    public async Task<IActionResult> ReopenTicket(string ticketId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Get the "Open" status ID (assuming status 1 is Open)
            var openStatusId = 1;

            var query = @"
                UPDATE Tickets 
                SET Status = @Status, 
                    UpdatedAt = @UpdatedAt
                WHERE Id = @TicketId AND Status != 99";

            using var command = new SqlCommand(query, connection);
            command.Parameters.Add("@TicketId", SqlDbType.UniqueIdentifier).Value = Guid.Parse(ticketId);
            command.Parameters.Add("@Status", SqlDbType.Int).Value = openStatusId;
            command.Parameters.Add("@UpdatedAt", SqlDbType.DateTime2).Value = GetUtcNow();

            var rowsAffected = await command.ExecuteNonQueryAsync();
            
            if (rowsAffected == 0)
            {
                return NotFound(new { message = "Ticket not found or deleted" });
            }

            _logger.LogInformation("Ticket {TicketId} reopened successfully", ticketId);
            return Ok(new { message = "Ticket reopened successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reopening ticket {TicketId}", ticketId);
            return StatusCode(500, new { message = "An error occurred while reopening the ticket" });
        }
    }

    [HttpDelete("{ticketId}")]
    public async Task<IActionResult> DeleteTicket(string ticketId, [FromBody] DeleteTicketRequest request)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // First, soft delete the ticket (mark as deleted instead of hard delete)
            var query = @"
                UPDATE Tickets 
                SET Status = 99, 
                    UpdatedAt = @UpdatedAt,
                    Description = CONCAT(Description, CHAR(13) + CHAR(10) + 'DELETED: ' + @Reason)
                WHERE Id = @TicketId";

            using var command = new SqlCommand(query, connection);
            command.Parameters.Add("@TicketId", SqlDbType.UniqueIdentifier).Value = Guid.Parse(ticketId);
            command.Parameters.Add("@UpdatedAt", SqlDbType.DateTime2).Value = GetUtcNow();
            command.Parameters.Add("@Reason", SqlDbType.NVarChar).Value = request.Reason ?? "No reason provided";

            var rowsAffected = await command.ExecuteNonQueryAsync();
            
            if (rowsAffected == 0)
            {
                return NotFound(new { message = "Ticket not found" });
            }

            _logger.LogInformation("Ticket {TicketId} marked as deleted with reason: {Reason}", ticketId, request.Reason);
            return Ok(new { message = "Ticket deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ticket {TicketId}", ticketId);
            return StatusCode(500, new { message = "An error occurred while deleting the ticket" });
        }
    }

    // GET CATEGORIES
    [HttpGet("categories")]
    public async Task<ActionResult> GetCategories()
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = "SELECT Id, Name, Description FROM TicketCategories WHERE IsActive = 1 ORDER BY DisplayOrder";
            using var command = new SqlCommand(sql, connection);
            
            var categories = new List<object>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                categories.Add(new
                {
                    id = reader["Id"],
                    name = reader["Name"],
                    description = reader["Description"]
                });
            }
            
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // GET SUBCATEGORIES by Category
    [HttpGet("categories/{categoryId}/subcategories")]
    public async Task<ActionResult> GetSubCategories(int categoryId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = "SELECT Id, Name, Description FROM TicketSubCategories WHERE CategoryId = @CategoryId AND IsActive = 1 ORDER BY DisplayOrder";
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@CategoryId", categoryId);
            
            var subcategories = new List<object>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                subcategories.Add(new
                {
                    id = reader["Id"],
                    name = reader["Name"],
                    description = reader["Description"]
                });
            }
            
            return Ok(subcategories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subcategories");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // GET AGENTS
    [HttpGet("agents")]
    public async Task<ActionResult> GetAgents()
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT a.Id, a.UserId, a.Name, a.Email, a.Department, a.IsActive
                FROM Agents a
                WHERE a.IsActive = 1
                ORDER BY a.Name";
                
            using var command = new SqlCommand(sql, connection);
            
            var agents = new List<object>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                agents.Add(new
                {
                    id = reader["Id"],
                    userId = reader["UserId"],
                    name = reader["Name"],
                    email = reader["Email"],
                    department = reader["Department"],
                    isActive = reader["IsActive"]
                });
            }
            
            return Ok(agents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agents");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // GET DEPARTMENTS
    [HttpGet("departments")]
    public async Task<ActionResult> GetDepartments()
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT Id, Name, Description, IsActive
                FROM Departments
                WHERE IsActive = 1
                ORDER BY Name";
                
            using var command = new SqlCommand(sql, connection);
            
            var departments = new List<object>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                departments.Add(new
                {
                    id = reader["Id"],
                    name = reader["Name"],
                    description = reader["Description"],
                    isActive = reader["IsActive"]
                });
            }
            
            return Ok(departments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting departments");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // GET AGENTS BY DEPARTMENT
    [HttpGet("departments/{departmentId}/agents")]
    public async Task<ActionResult> GetAgentsByDepartment(int departmentId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT a.Id, a.UserId, a.Name, a.Email, a.Department, a.IsActive
                FROM Agents a
                INNER JOIN Departments d ON a.Department = d.Name
                WHERE d.Id = @DepartmentId AND a.IsActive = 1
                ORDER BY a.Name";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@DepartmentId", departmentId);
            
            var agents = new List<object>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                agents.Add(new
                {
                    id = reader["Id"],
                    userId = reader["UserId"],
                    name = reader["Name"],
                    email = reader["Email"],
                    department = reader["Department"],
                    isActive = reader["IsActive"]
                });
            }
            
            return Ok(agents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agents by department");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // DOWNLOAD ATTACHMENT - AllowAnonymous so users can download from direct links in emails/browser
    [AllowAnonymous]
    [HttpGet("attachments/{attachmentId:guid}/download")]
    public async Task<ActionResult> DownloadAttachment(Guid attachmentId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT FileName, StoragePath, ContentType, SizeBytes
                FROM Attachments
                WHERE Id = @AttachmentId";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@AttachmentId", attachmentId);
            
            using var reader = await command.ExecuteReaderAsync();
            
            if (await reader.ReadAsync())
            {
                var fileName = reader["FileName"].ToString();
                var storagePath = reader["StoragePath"].ToString();
                var contentType = reader["ContentType"].ToString();
                var sizeBytes = (long)reader["SizeBytes"];
                
                // Build the full file path - handle both absolute and relative paths
                string fullPath;
                if (Path.IsPathRooted(storagePath))
                {
                    // StoragePath is already an absolute path
                    fullPath = storagePath ?? "";
                }
                else
                {
                    // StoragePath is relative, combine with current directory
                    fullPath = Path.Combine(Directory.GetCurrentDirectory(), storagePath ?? "");
                }
                
                _logger.LogInformation("Attempting to download attachment from path: {Path}", fullPath);
                
                if (!System.IO.File.Exists(fullPath))
                {
                    _logger.LogWarning("File not found at path: {Path}", fullPath);
                    return NotFound(new { message = "File not found on disk", path = fullPath });
                }
                
                // Read the file and return it
                var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
                
                return File(fileBytes, contentType ?? "application/octet-stream", fileName);
            }
            else
            {
                return NotFound(new { message = "Attachment not found" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading attachment {AttachmentId}", attachmentId);
            return StatusCode(500, new { error = "Error downloading attachment" });
        }
    }

    // SEARCH TICKETS for merge functionality
    [HttpGet("search")]
    public async Task<ActionResult> SearchTickets([FromQuery] string query, [FromQuery] string? excludeTicketId = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Ok(new List<object>());
            }

            var trimmedQuery = query.Trim();
            var numericQuery = string.Empty;

            // Allow searches like "#12345" or "Ticket #12345" to match PublicId values
            if (trimmedQuery.StartsWith("#"))
            {
                numericQuery = new string(trimmedQuery.Skip(1).Where(char.IsDigit).ToArray());
            }
            else if (trimmedQuery.All(char.IsDigit))
            {
                numericQuery = trimmedQuery;
            }
            else
            {
                var hashIndex = trimmedQuery.IndexOf('#');
                if (hashIndex >= 0 && hashIndex + 1 < trimmedQuery.Length)
                {
                    var afterHash = trimmedQuery[(hashIndex + 1)..];
                    numericQuery = new string(afterHash.Where(char.IsDigit).ToArray());
                }
            }

            var hasNumericQuery = !string.IsNullOrEmpty(numericQuery);

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT TOP 10 t.Id, t.PublicId, t.Title, t.Status, t.Priority, t.CreatedAt,
                       cu.FirstName + ' ' + cu.LastName as CreatedByName
                FROM Tickets t
                LEFT JOIN AspNetUsers cu ON t.CreatedByUserId = cu.Id
                WHERE (
                    t.Title LIKE @Query 
                    OR CAST(t.PublicId AS NVARCHAR) LIKE @Query
                    OR t.Description LIKE @Query
                    OR (@PublicIdLikeQuery IS NOT NULL AND CAST(t.PublicId AS NVARCHAR) LIKE @PublicIdLikeQuery)
                ) 
                AND t.Status != 99 -- Exclude deleted tickets
                AND (@ExcludeTicketId IS NULL OR t.Id != @ExcludeTicketId)
                ORDER BY 
                    CASE 
                        WHEN @PublicIdExactQuery IS NOT NULL AND CAST(t.PublicId AS NVARCHAR) = @PublicIdExactQuery THEN 0
                        WHEN t.Title LIKE @ExactQuery THEN 1
                        WHEN CAST(t.PublicId AS NVARCHAR) = @PlainQuery THEN 2
                        WHEN @PublicIdLikeQuery IS NOT NULL AND CAST(t.PublicId AS NVARCHAR) LIKE @PublicIdLikeQuery THEN 3
                        WHEN t.Title LIKE @StartQuery THEN 4
                        ELSE 5
                    END,
                    t.CreatedAt DESC";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Query", $"%{trimmedQuery}%");
            command.Parameters.AddWithValue("@ExactQuery", trimmedQuery);
            command.Parameters.AddWithValue("@StartQuery", $"{trimmedQuery}%");
            command.Parameters.AddWithValue("@PlainQuery", trimmedQuery);
            command.Parameters.AddWithValue("@PublicIdLikeQuery", hasNumericQuery ? $"%{numericQuery}%" : DBNull.Value);
            command.Parameters.AddWithValue("@PublicIdExactQuery", hasNumericQuery ? numericQuery : DBNull.Value);
            command.Parameters.AddWithValue("@ExcludeTicketId", 
                string.IsNullOrEmpty(excludeTicketId) ? DBNull.Value : Guid.Parse(excludeTicketId));
            
            var tickets = new List<object>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                tickets.Add(new
                {
                    id = reader["Id"].ToString(),
                    publicId = reader["PublicId"] != DBNull.Value ? (int)reader["PublicId"] : (int?)null,
                    title = reader["Title"].ToString(),
                    status = (int)reader["Status"],
                    priority = (int)reader["Priority"],
                    createdAt = ((DateTime)reader["CreatedAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    createdByName = reader["CreatedByName"]?.ToString() ?? "Unknown User"
                });
            }
            
            return Ok(tickets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching tickets");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // MERGE TICKETS - Merge multiple tickets into one primary ticket
    [HttpPost("{primaryTicketId:guid}/merge")]
    public async Task<ActionResult> MergeTickets(Guid primaryTicketId, [FromBody] MergeTicketsRequest request)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            using var transaction = connection.BeginTransaction();
            
            try
            {
                // Validate primary ticket exists and is not deleted
                var checkPrimarySql = "SELECT Id, Title, PublicId FROM Tickets WHERE Id = @PrimaryTicketId AND Status != 99";
                using var checkCommand = new SqlCommand(checkPrimarySql, connection, transaction);
                checkCommand.Parameters.AddWithValue("@PrimaryTicketId", primaryTicketId);
                
                var primaryTicketTitle = "";
                var primaryTicketPublicId = 0;
                using var checkReader = await checkCommand.ExecuteReaderAsync();
                if (await checkReader.ReadAsync())
                {
                    primaryTicketTitle = checkReader["Title"].ToString() ?? "";
                    primaryTicketPublicId = checkReader["PublicId"] != DBNull.Value
                        ? (int)checkReader["PublicId"]
                        : 0;
                }
                else
                {
                    return NotFound(new { message = "Primary ticket not found or is deleted" });
                }
                checkReader.Close();

                if (primaryTicketPublicId <= 0)
                {
                    primaryTicketPublicId = await EnsureTicketPublicIdAsync(primaryTicketId, connection, transaction);
                }

                // Validate all tickets to merge exist and are not deleted
                var mergeTicketIds = request.TicketIds.Where(id => id != primaryTicketId).ToList();
                if (!mergeTicketIds.Any())
                {
                    return BadRequest(new { message = "No valid tickets selected for merging" });
                }

                var mergeTicketDetails = new List<(Guid TicketId, string Title, int PublicId)>();
                foreach (var ticketId in mergeTicketIds)
                {
                    var validateSql = "SELECT Id, Title, PublicId FROM Tickets WHERE Id = @TicketId AND Status != 99";
                    using var validateCommand = new SqlCommand(validateSql, connection, transaction);
                    validateCommand.Parameters.AddWithValue("@TicketId", ticketId);
                    
                    using var validateReader = await validateCommand.ExecuteReaderAsync();
                    if (await validateReader.ReadAsync())
                    {
                        var title = validateReader["Title"].ToString() ?? "";
                        var publicId = validateReader["PublicId"] != DBNull.Value
                            ? (int)validateReader["PublicId"]
                            : 0;
                        mergeTicketDetails.Add((ticketId, title, publicId));
                    }
                    else
                    {
                        return BadRequest(new { message = $"Ticket {ticketId} not found or is deleted" });
                    }
                    validateReader.Close();

                    var lastIndex = mergeTicketDetails.Count - 1;
                    if (mergeTicketDetails[lastIndex].PublicId <= 0)
                    {
                        var ensured = await EnsureTicketPublicIdAsync(ticketId, connection, transaction);
                        var lastEntry = mergeTicketDetails[lastIndex];
                        mergeTicketDetails[lastIndex] = (ticketId, lastEntry.Title, ensured);
                    }
                }

                mergeTicketIds = mergeTicketDetails.Select(d => d.TicketId).ToList();

                // Get the actual logged-in user's ID from JWT claims (do this early)
                var mergeUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                              ?? User.FindFirst("sub")?.Value
                              ?? User.FindFirst("userId")?.Value
                              ?? "system"; // Fallback to system if no user found

                // Get the "Merged" status ID from TicketStatuses table, or use 98 as fallback
                var getMergedStatusSql = "SELECT TOP 1 Id FROM TicketStatuses WHERE Name = 'Merged' AND IsActive = 1";
                using var statusCommand = new SqlCommand(getMergedStatusSql, connection, transaction);
                var mergedStatusIdObj = await statusCommand.ExecuteScalarAsync();
                var mergedStatusId = mergedStatusIdObj != null ? (int)mergedStatusIdObj : 98; // Use found status or fallback to 98

                // Create merge record in MergedTickets table with user info
                var mergeId = Guid.NewGuid();
                var createMergeSql = @"
                    INSERT INTO MergedTickets (Id, PrimaryTicketId, MergedTicketIds, MergeReason, MergedAt, MergedByUserId)
                    VALUES (@MergeId, @PrimaryTicketId, @MergedTicketIds, @MergeReason, @MergedAt, @MergedByUserId)";
                
                using var mergeCommand = new SqlCommand(createMergeSql, connection, transaction);
                mergeCommand.Parameters.AddWithValue("@MergeId", mergeId);
                mergeCommand.Parameters.AddWithValue("@PrimaryTicketId", primaryTicketId);
                mergeCommand.Parameters.AddWithValue("@MergedTicketIds", string.Join(",", mergeTicketIds));
                mergeCommand.Parameters.AddWithValue("@MergeReason", request.Reason);
                mergeCommand.Parameters.AddWithValue("@MergedAt", DateTime.UtcNow);
                mergeCommand.Parameters.AddWithValue("@MergedByUserId", mergeUserId);
                
                await mergeCommand.ExecuteNonQueryAsync();

                // Move all comments from merged tickets to primary ticket
                foreach (var ticketId in mergeTicketIds)
                {
                    var moveCommentsSql = @"
                        UPDATE TicketComments 
                        SET TicketId = @PrimaryTicketId
                        WHERE TicketId = @MergedTicketId";
                    
                    using var moveCommand = new SqlCommand(moveCommentsSql, connection, transaction);
                    moveCommand.Parameters.AddWithValue("@PrimaryTicketId", primaryTicketId);
                    moveCommand.Parameters.AddWithValue("@MergedTicketId", ticketId);
                    
                    await moveCommand.ExecuteNonQueryAsync();
                }

                // Move all attachments from merged tickets to primary ticket
                foreach (var ticketId in mergeTicketIds)
                {
                    var moveAttachmentsSql = @"
                        UPDATE Attachments 
                        SET TicketId = @PrimaryTicketId
                        WHERE TicketId = @MergedTicketId";
                    
                    using var moveAttachmentsCommand = new SqlCommand(moveAttachmentsSql, connection, transaction);
                    moveAttachmentsCommand.Parameters.AddWithValue("@PrimaryTicketId", primaryTicketId);
                    moveAttachmentsCommand.Parameters.AddWithValue("@MergedTicketId", ticketId);
                    
                    await moveAttachmentsCommand.ExecuteNonQueryAsync();
                }

                // Update merged tickets status to "Merged" and add merge info to description
                foreach (var ticket in mergeTicketDetails)
                {
                    var updateMergedSql = @"
                        UPDATE Tickets 
                        SET Status = @MergedStatusId,
                            UpdatedAt = @UpdatedAt,
                            Description = CONCAT(Description, CHAR(13) + CHAR(10) + CHAR(13) + CHAR(10) + 
                                                '--- MERGED INTO TICKET #' + CAST(@PrimaryTicketPublicId AS NVARCHAR) + ' ---' + CHAR(13) + CHAR(10) + 
                                                'Merge Reason: ' + @MergeReason + CHAR(13) + CHAR(10) + 
                                                'Merged At: ' + FORMAT(@UpdatedAt, 'yyyy-MM-dd HH:mm:ss'))
                        WHERE Id = @MergedTicketId";
                    
                    using var updateCommand = new SqlCommand(updateMergedSql, connection, transaction);
                    updateCommand.Parameters.AddWithValue("@MergedTicketId", ticket.TicketId);
                    updateCommand.Parameters.AddWithValue("@MergeReason", request.Reason);
                    updateCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
                    updateCommand.Parameters.AddWithValue("@PrimaryTicketPublicId", primaryTicketPublicId);
                    updateCommand.Parameters.AddWithValue("@MergedStatusId", mergedStatusId);
                    
                    await updateCommand.ExecuteNonQueryAsync();
                }

                // Add a comment to the primary ticket about the merge
                // Format: [#PublicId](ticketId:GUID) Title - allows frontend to create clickable links
                var mergeCommentId = Guid.NewGuid();
                var mergeComment = $"Merged {mergeTicketDetails.Count} ticket(s) into this ticket:\n" +
                                 $"{string.Join("\n", mergeTicketDetails.Select(details => $"• [#{details.PublicId}](ticket:{details.TicketId}) {details.Title}"))}\n\n" +
                                 $"Merge Reason: {request.Reason}";
                
                var addMergeCommentSql = @"
                    INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                    VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
                
                using var commentCommand = new SqlCommand(addMergeCommentSql, connection, transaction);
                commentCommand.Parameters.AddWithValue("@Id", mergeCommentId);
                commentCommand.Parameters.AddWithValue("@TicketId", primaryTicketId);
                commentCommand.Parameters.AddWithValue("@Body", mergeComment);
                commentCommand.Parameters.AddWithValue("@AuthorUserId", mergeUserId); // Use actual logged-in user
                commentCommand.Parameters.AddWithValue("@IsInternal", true); // Internal comment
                commentCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                
                await commentCommand.ExecuteNonQueryAsync();

                // Update primary ticket's UpdatedAt timestamp
                var updatePrimarySql = "UPDATE Tickets SET UpdatedAt = @UpdatedAt WHERE Id = @PrimaryTicketId";
                using var updatePrimaryCommand = new SqlCommand(updatePrimarySql, connection, transaction);
                updatePrimaryCommand.Parameters.AddWithValue("@PrimaryTicketId", primaryTicketId);
                updatePrimaryCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
                
                await updatePrimaryCommand.ExecuteNonQueryAsync();

                // Commit the transaction
                transaction.Commit();
                
                return Ok(new { 
                    message = $"Successfully merged {mergeTicketIds.Count} ticket(s) into primary ticket",
                    mergeId = mergeId,
                    primaryTicketId = primaryTicketId,
                    primaryTicketPublicId,
                    mergedTicketIds = mergeTicketIds
                });
            }
            catch (Exception)
            {
                transaction.Rollback();
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error merging tickets into {PrimaryTicketId}", primaryTicketId);
            return StatusCode(500, new { error = "Error merging tickets" });
        }
    }

    // GET MERGED TICKETS INFO
    [HttpGet("{ticketId:guid}/merged-info")]
    public async Task<ActionResult> GetMergedTicketsInfo(Guid ticketId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            // Check if this ticket is a primary ticket (has other tickets merged into it)
            var primaryCheckSql = @"
                SELECT mt.Id, mt.MergedTicketIds, mt.MergeReason, mt.MergedAt, mt.MergedByUserId,
                       u.FirstName + ' ' + u.LastName as MergedByName
                FROM MergedTickets mt
                LEFT JOIN AspNetUsers u ON mt.MergedByUserId = u.Id
                WHERE mt.PrimaryTicketId = @TicketId
                ORDER BY mt.MergedAt DESC";
                
            using var primaryCommand = new SqlCommand(primaryCheckSql, connection);
            primaryCommand.Parameters.AddWithValue("@TicketId", ticketId);
            
            var mergedIntoThis = new List<object>();
            using var primaryReader = await primaryCommand.ExecuteReaderAsync();
            
            while (await primaryReader.ReadAsync())
            {
                var mergedTicketIdsRaw = primaryReader["MergedTicketIds"].ToString()?.Split(',') ?? Array.Empty<string>();
                
                mergedIntoThis.Add(new
                {
                    mergeId = primaryReader["Id"],
                    mergedTicketIds = mergedTicketIdsRaw,
                    mergeReason = primaryReader["MergeReason"],
                    mergedAt = primaryReader["MergedAt"],
                    mergedByUserId = primaryReader["MergedByUserId"]?.ToString(),
                    mergedByName = primaryReader["MergedByName"]?.ToString() ?? "System"
                });
            }
            primaryReader.Close();
            
            // Get public IDs for merged tickets
            var mergedTicketDetails = new List<object>();
            foreach (var merge in mergedIntoThis)
            {
                var mergeObj = (dynamic)merge;
                foreach (var ticketIdStr in mergeObj.mergedTicketIds)
                {
                    Guid mergedId;
                    if (Guid.TryParse(ticketIdStr?.ToString(), out mergedId))
                    {
                        var getDetailsSql = "SELECT Id, PublicId, Title FROM Tickets WHERE Id = @Id";
                        using var detailsCmd = new SqlCommand(getDetailsSql, connection);
                        detailsCmd.Parameters.AddWithValue("@Id", mergedId);
                        using var detailsReader = await detailsCmd.ExecuteReaderAsync();
                        if (await detailsReader.ReadAsync())
                        {
                            mergedTicketDetails.Add(new
                            {
                                id = detailsReader["Id"].ToString(),
                                publicId = detailsReader["PublicId"] != DBNull.Value ? (int)detailsReader["PublicId"] : 0,
                                title = detailsReader["Title"]?.ToString()
                            });
                        }
                    }
                }
            }

            // Check if this ticket was merged into another ticket
            var mergedIntoCheckSql = @"
                SELECT mt.Id, mt.PrimaryTicketId, mt.MergeReason, mt.MergedAt, mt.MergedByUserId,
                       t.PublicId as PrimaryTicketPublicId, t.Title as PrimaryTicketTitle,
                       u.FirstName + ' ' + u.LastName as MergedByName
                FROM MergedTickets mt
                INNER JOIN Tickets t ON mt.PrimaryTicketId = t.Id
                LEFT JOIN AspNetUsers u ON mt.MergedByUserId = u.Id
                WHERE ',' + mt.MergedTicketIds + ',' LIKE '%,' + CAST(@TicketId AS NVARCHAR(36)) + ',%'";
                
            using var mergedCommand = new SqlCommand(mergedIntoCheckSql, connection);
            mergedCommand.Parameters.AddWithValue("@TicketId", ticketId);
            
            object? mergedIntoTicket = null;
            using var mergedReader = await mergedCommand.ExecuteReaderAsync();
            
            if (await mergedReader.ReadAsync())
            {
                mergedIntoTicket = new
                {
                    mergeId = mergedReader["Id"],
                    primaryTicketId = mergedReader["PrimaryTicketId"],
                    primaryTicketPublicId = mergedReader["PrimaryTicketPublicId"],
                    primaryTicketTitle = mergedReader["PrimaryTicketTitle"],
                    mergeReason = mergedReader["MergeReason"],
                    mergedAt = mergedReader["MergedAt"],
                    mergedByUserId = mergedReader["MergedByUserId"]?.ToString(),
                    mergedByName = mergedReader["MergedByName"]?.ToString() ?? "System"
                };
            }
            
            return Ok(new
            {
                ticketId = ticketId,
                hasMergedTickets = mergedIntoThis.Any(),
                mergedTickets = mergedIntoThis,
                mergedTicketDetails = mergedTicketDetails, // New: includes publicId for clickable links
                wasMergedInto = mergedIntoTicket
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting merged tickets info for {TicketId}", ticketId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // REPLY TO EMAIL FUNCTIONALITY
    [HttpPost("{ticketId:guid}/reply-email")]
    public async Task<ActionResult> ReplyToEmail(
        Guid ticketId, 
        [FromForm] string replyMessage, 
        [FromForm] List<IFormFile>? attachments = null,
        [FromForm] string? ccEmails = null)
    {
        try
        {
            // Get the actual logged-in user's ID from JWT claims
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value
                      ?? User.FindFirst("userId")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            // Parse CC emails (comma-separated)
            var ccEmailList = string.IsNullOrWhiteSpace(ccEmails)
                ? new List<string>()
                : ccEmails.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(e => e.Trim())
                    .Where(e => !string.IsNullOrEmpty(e) && e.Contains("@"))
                    .ToList();

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Get ticket information including public ID for subject line
            var ticketSql = @"
                SELECT PublicId, Title, Description, CreatedByUserId,
                       cu.Email as CreatedByEmail, cu.FirstName + ' ' + cu.LastName as CreatedByName
                FROM Tickets t
                LEFT JOIN AspNetUsers cu ON t.CreatedByUserId = cu.Id
                WHERE t.Id = @TicketId";
                
            using var ticketCommand = new SqlCommand(ticketSql, connection);
            ticketCommand.Parameters.AddWithValue("@TicketId", ticketId);
            
            using var ticketReader = await ticketCommand.ExecuteReaderAsync();
            
            if (!await ticketReader.ReadAsync())
            {
                return NotFound(new { message = "Ticket not found" });
            }
            
            var publicIdRaw = ticketReader["PublicId"] != DBNull.Value ? (int?)ticketReader["PublicId"] : null;
            var title = ticketReader["Title"]?.ToString() ?? "";
            var createdByEmail = ticketReader["CreatedByEmail"]?.ToString();
            var createdByName = ticketReader["CreatedByName"]?.ToString() ?? "User";
            
            ticketReader.Close();
            var ticketPublicId = publicIdRaw.HasValue && publicIdRaw.Value > 0
                ? publicIdRaw.Value
                : await EnsureTicketPublicIdAsync(ticketId, connection);

            if (string.IsNullOrWhiteSpace(title))
            {
                title = $"Ticket #{ticketPublicId}";
            }
            
            if (string.IsNullOrEmpty(createdByEmail))
            {
                return BadRequest(new { message = "Cannot reply - ticket creator email not found" });
            }

            // Create email subject with Public Ticket ID
            var subject = $"Re: [Ticket #{ticketPublicId}] {title}";
            
            // Create reply email body
            var emailBody = $@"Dear {createdByName},

{replyMessage}

---
This is a reply to your support ticket #{ticketPublicId}: {title}

Best regards,
Support Team

Please do not remove the ticket number from the subject line to ensure proper tracking.";

            var preparedAttachments = await PrepareAttachmentsAsync(attachments);
            var outgoingAttachments = preparedAttachments
                .Select(a => new OutgoingEmailAttachment(a.FileName, a.ContentType, a.Data))
                .ToList();

            // Send the email with CC recipients if provided
            if (ccEmailList.Count > 0)
            {
                await _emailService.SendEmailWithCcAsync(createdByEmail, ccEmailList, subject, emailBody, false, outgoingAttachments);
                _logger.LogInformation("Email reply sent to {To} with {CcCount} CC recipients for ticket {TicketId}", 
                    createdByEmail, ccEmailList.Count, ticketId);
            }
            else
            {
                await SendEmail(createdByEmail, subject, emailBody, outgoingAttachments);
            }

            // Save CC recipients as ticket participants for future email matching
            foreach (var ccEmail in ccEmailList)
            {
                var participantSql = @"
                    IF NOT EXISTS (SELECT 1 FROM TicketParticipants WHERE TicketId = @TicketId AND Email = @Email)
                    BEGIN
                        INSERT INTO TicketParticipants (Id, TicketId, Email, ParticipantType, AddedAt, AddedByUserId, IsActive)
                        VALUES (@Id, @TicketId, @Email, 'CC', @AddedAt, @AddedByUserId, 1)
                    END";
                using var participantCmd = new SqlCommand(participantSql, connection);
                participantCmd.Parameters.AddWithValue("@Id", Guid.NewGuid());
                participantCmd.Parameters.AddWithValue("@TicketId", ticketId);
                participantCmd.Parameters.AddWithValue("@Email", ccEmail);
                participantCmd.Parameters.AddWithValue("@AddedAt", DateTime.UtcNow);
                participantCmd.Parameters.AddWithValue("@AddedByUserId", userId);
                await participantCmd.ExecuteNonQueryAsync();
            }
            
            // Add the reply as a comment to the ticket FIRST (so we have a commentId for attachments)
            var commentId = Guid.NewGuid();
            var ccNote = ccEmailList.Count > 0 ? $"\nCC: {string.Join(", ", ccEmailList)}" : "";
            var attachmentNote = preparedAttachments.Any() ? "\n📎 Includes attachments" : "";
            var addCommentSql = @"
                INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
            
            using var commentCommand = new SqlCommand(addCommentSql, connection);
            commentCommand.Parameters.AddWithValue("@Id", commentId);
            commentCommand.Parameters.AddWithValue("@TicketId", ticketId);
            commentCommand.Parameters.AddWithValue("@Body", $"[EMAIL REPLY SENT]{ccNote}{attachmentNote}\n\n{replyMessage}");
            commentCommand.Parameters.AddWithValue("@AuthorUserId", userId);
            commentCommand.Parameters.AddWithValue("@IsInternal", false);
            commentCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
            
            await commentCommand.ExecuteNonQueryAsync();
            
            // Save attachments if provided - link them to the comment
            if (preparedAttachments.Any())
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "tickets");
                Directory.CreateDirectory(uploadsFolder);

                foreach (var attachment in preparedAttachments)
                {
                    var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(attachment.FileName)}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    await System.IO.File.WriteAllBytesAsync(filePath, attachment.Data);

                    // Save attachment record to database with CommentId
                    var attachmentId = Guid.NewGuid();
                    var attachmentSql = @"
                        INSERT INTO Attachments (Id, TicketId, CommentId, FileName, StoragePath, SizeBytes, ContentType, CreatedAt, UploadedByUserId)
                        VALUES (@Id, @TicketId, @CommentId, @FileName, @StoragePath, @SizeBytes, @ContentType, @CreatedAt, @UploadedByUserId)";
                    
                    using var attachmentCommand = new SqlCommand(attachmentSql, connection);
                    attachmentCommand.Parameters.AddWithValue("@Id", attachmentId);
                    attachmentCommand.Parameters.AddWithValue("@TicketId", ticketId);
                    attachmentCommand.Parameters.AddWithValue("@CommentId", commentId); // Link to comment
                    attachmentCommand.Parameters.AddWithValue("@FileName", attachment.FileName);
                    attachmentCommand.Parameters.AddWithValue("@StoragePath", filePath);
                    attachmentCommand.Parameters.AddWithValue("@SizeBytes", attachment.Data.LongLength);
                    attachmentCommand.Parameters.AddWithValue("@ContentType", attachment.ContentType);
                    attachmentCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                    attachmentCommand.Parameters.AddWithValue("@UploadedByUserId", userId);
                    
                    await attachmentCommand.ExecuteNonQueryAsync();
                }
            }
            
            // Update ticket's UpdatedAt timestamp
            var updateTicketSql = "UPDATE Tickets SET UpdatedAt = @UpdatedAt WHERE Id = @TicketId";
            using var updateCommand = new SqlCommand(updateTicketSql, connection);
            updateCommand.Parameters.AddWithValue("@TicketId", ticketId);
            updateCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
            
            await updateCommand.ExecuteNonQueryAsync();

            return Ok(new { 
                message = "Email reply sent successfully",
                sentTo = createdByEmail,
                subject = subject
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email reply for ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Error sending email reply" });
        }
    }

    // FORWARD EMAIL FUNCTIONALITY
    [HttpPost("{ticketId:guid}/forward-email")]
    public async Task<ActionResult> ForwardEmail(Guid ticketId, [FromForm] string recipientEmail, [FromForm] string forwardMessage, [FromForm] string? recipientName = null, [FromForm] List<IFormFile>? attachments = null)
    {
        try
        {
            // Get the actual logged-in user's ID from JWT claims
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value
                      ?? User.FindFirst("userId")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Get ticket information including public ID and all comments
            var ticketSql = @"
                SELECT t.PublicId, t.Title, t.Description, t.CreatedAt, 
                       cu.FirstName + ' ' + cu.LastName as CreatedByName
                FROM Tickets t
                LEFT JOIN AspNetUsers cu ON t.CreatedByUserId = cu.Id
                WHERE t.Id = @TicketId";
                
            using var ticketCommand = new SqlCommand(ticketSql, connection);
            ticketCommand.Parameters.AddWithValue("@TicketId", ticketId);
            
            using var ticketReader = await ticketCommand.ExecuteReaderAsync();
            
            if (!await ticketReader.ReadAsync())
            {
                return NotFound(new { message = "Ticket not found" });
            }
            
            var publicIdRaw = ticketReader["PublicId"] != DBNull.Value ? (int?)ticketReader["PublicId"] : null;
            var title = ticketReader["Title"]?.ToString() ?? "";
            var description = ticketReader["Description"]?.ToString() ?? "";
            var createdAt = ((DateTime)ticketReader["CreatedAt"]).ToString("yyyy-MM-ddTHH:mm:ssZ");
            var createdByName = ticketReader["CreatedByName"]?.ToString() ?? "User";
            
            ticketReader.Close();

            var ticketPublicId = publicIdRaw.HasValue && publicIdRaw.Value > 0
                ? publicIdRaw.Value
                : await EnsureTicketPublicIdAsync(ticketId, connection);

            if (string.IsNullOrWhiteSpace(title))
            {
                title = $"Ticket #{ticketPublicId}";
            }

            // Get all comments for the ticket (for context)
            var commentsSql = @"
                SELECT tc.Body, tc.CreatedAt, au.FirstName + ' ' + au.LastName as AuthorName, tc.IsInternal
                FROM TicketComments tc
                LEFT JOIN AspNetUsers au ON tc.AuthorUserId = au.Id
                WHERE tc.TicketId = @TicketId
                ORDER BY tc.CreatedAt";
                
            using var commentsCommand = new SqlCommand(commentsSql, connection);
            commentsCommand.Parameters.AddWithValue("@TicketId", ticketId);
            
            var commentsText = "";
            using var commentsReader = await commentsCommand.ExecuteReaderAsync();
            
            while (await commentsReader.ReadAsync())
            {
                var isInternal = (bool)commentsReader["IsInternal"];
                if (!isInternal) // Only include public comments in forward
                {
                    var authorName = commentsReader["AuthorName"]?.ToString() ?? "System";
                    var commentDate = commentsReader["CreatedAt"];
                    var body = commentsReader["Body"]?.ToString() ?? "";
                    
                    commentsText += $"\n---\n{authorName} ({commentDate:yyyy-MM-dd HH:mm:ss}):\n{body}\n";
                }
            }
            
            commentsReader.Close();

            // Create forward email subject with Public Ticket ID
            var subject = $"Fwd: [Ticket #{ticketPublicId}] {title}";
            
            // Create forward email body
            var emailBody = $@"Dear {recipientName ?? "Colleague"},

{forwardMessage}

------- Forwarded Ticket Information -------

Ticket #{ticketPublicId}: {title}
Created: {createdAt}
Created by: {createdByName}

Original Description:
{description}

Comments:
{commentsText}

---
Please include the ticket number [Ticket #{ticketPublicId}] in any replies to maintain proper tracking.

Best regards,
Support Team";

            // Send the forward email
            var preparedAttachments = await PrepareAttachmentsAsync(attachments);
            var outgoingAttachments = preparedAttachments
                .Select(a => new OutgoingEmailAttachment(a.FileName, a.ContentType, a.Data))
                .ToList();

            await SendEmail(recipientEmail, subject, emailBody, outgoingAttachments);

            // Save forward recipient as ticket participant for future email matching
            var participantSql = @"
                IF NOT EXISTS (SELECT 1 FROM TicketParticipants WHERE TicketId = @TicketId AND Email = @Email)
                BEGIN
                    INSERT INTO TicketParticipants (Id, TicketId, Email, Name, ParticipantType, AddedAt, AddedByUserId, IsActive)
                    VALUES (@Id, @TicketId, @Email, @Name, 'Forward', @AddedAt, @AddedByUserId, 1)
                END";
            using var participantCmd = new SqlCommand(participantSql, connection);
            participantCmd.Parameters.AddWithValue("@Id", Guid.NewGuid());
            participantCmd.Parameters.AddWithValue("@TicketId", ticketId);
            participantCmd.Parameters.AddWithValue("@Email", recipientEmail);
            participantCmd.Parameters.AddWithValue("@Name", (object?)recipientName ?? DBNull.Value);
            participantCmd.Parameters.AddWithValue("@AddedAt", DateTime.UtcNow);
            participantCmd.Parameters.AddWithValue("@AddedByUserId", userId);
            await participantCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Saved forward recipient {Email} as participant for ticket {TicketId}", recipientEmail, ticketId);
            
            // Add the forward action as a comment to the ticket FIRST (so we have a commentId for attachments)
            var commentId = Guid.NewGuid();
            var attachmentNote = preparedAttachments.Any() ? "\n📎 Includes attachments" : "";
            var addCommentSql = @"
                INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
            
            using var commentCommand = new SqlCommand(addCommentSql, connection);
            commentCommand.Parameters.AddWithValue("@Id", commentId);
            commentCommand.Parameters.AddWithValue("@TicketId", ticketId);
            commentCommand.Parameters.AddWithValue("@Body", $"[EMAIL FORWARDED TO: {recipientEmail}]{attachmentNote}\n\nForward message:\n{forwardMessage}");
            commentCommand.Parameters.AddWithValue("@AuthorUserId", userId);
            commentCommand.Parameters.AddWithValue("@IsInternal", true); // Forward actions are internal
            commentCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
            
            await commentCommand.ExecuteNonQueryAsync();
            
            // Save attachments if provided - link them to the comment
            if (preparedAttachments.Any())
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "tickets");
                Directory.CreateDirectory(uploadsFolder);

                foreach (var attachment in preparedAttachments)
                {
                    var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(attachment.FileName)}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    await System.IO.File.WriteAllBytesAsync(filePath, attachment.Data);

                    // Save attachment record to database with CommentId
                    var attachmentId = Guid.NewGuid();
                    var attachmentSql = @"
                        INSERT INTO Attachments (Id, TicketId, CommentId, FileName, StoragePath, SizeBytes, ContentType, CreatedAt, UploadedByUserId)
                        VALUES (@Id, @TicketId, @CommentId, @FileName, @StoragePath, @SizeBytes, @ContentType, @CreatedAt, @UploadedByUserId)";
                    
                    using var attachmentCommand = new SqlCommand(attachmentSql, connection);
                    attachmentCommand.Parameters.AddWithValue("@Id", attachmentId);
                    attachmentCommand.Parameters.AddWithValue("@TicketId", ticketId);
                    attachmentCommand.Parameters.AddWithValue("@CommentId", commentId); // Link to comment
                    attachmentCommand.Parameters.AddWithValue("@FileName", attachment.FileName);
                    attachmentCommand.Parameters.AddWithValue("@StoragePath", filePath);
                    attachmentCommand.Parameters.AddWithValue("@SizeBytes", attachment.Data.LongLength);
                    attachmentCommand.Parameters.AddWithValue("@ContentType", attachment.ContentType);
                    attachmentCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                    attachmentCommand.Parameters.AddWithValue("@UploadedByUserId", userId);
                    
                    await attachmentCommand.ExecuteNonQueryAsync();
                }
            }
            
            // Update ticket's UpdatedAt timestamp
            var updateTicketSql = "UPDATE Tickets SET UpdatedAt = @UpdatedAt WHERE Id = @TicketId";
            using var updateCommand = new SqlCommand(updateTicketSql, connection);
            updateCommand.Parameters.AddWithValue("@TicketId", ticketId);
            updateCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
            
            await updateCommand.ExecuteNonQueryAsync();

            return Ok(new { 
                message = "Email forwarded successfully",
                sentTo = recipientEmail,
                subject = subject
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error forwarding email for ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Error forwarding email" });
        }
    }

    // PROCESS INCOMING EMAIL ENDPOINT (for testing email processing)
    [HttpPost("process-email")]
    public async Task<ActionResult> ProcessIncomingEmail([FromBody] ProcessEmailRequest request)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Extract ticket ID from subject line using regex
            var ticketIdPattern = @"\[Ticket #(\d+)\]|#(\d+)";
            var match = System.Text.RegularExpressions.Regex.Match(request.Subject, ticketIdPattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            if (match.Success)
            {
                // Extract the ticket number
                var ticketNumber = match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value;
                
                if (int.TryParse(ticketNumber, out var publicId))
                {
                    // Try to find existing ticket by PublicId
                    var findTicketSql = "SELECT Id FROM Tickets WHERE PublicId = @PublicId AND Status != 99";
                    using var findCommand = new SqlCommand(findTicketSql, connection);
                    findCommand.Parameters.AddWithValue("@PublicId", publicId);
                    
                    var ticketIdObj = await findCommand.ExecuteScalarAsync();
                    
                    if (ticketIdObj != null && Guid.TryParse(ticketIdObj.ToString(), out var ticketId))
                    {
                        // Add email as comment to existing ticket
                        var commentId = Guid.NewGuid();
                        var commentBody = $"[EMAIL RECEIVED]\n\nFrom: {request.FromEmail}\nSubject: {request.Subject}\n\n{request.Body}";
                        
                        // Try to find user by email, fallback to system user
                        var findUserSql = "SELECT Id FROM AspNetUsers WHERE Email = @Email";
                        using var findUserCommand = new SqlCommand(findUserSql, connection);
                        findUserCommand.Parameters.AddWithValue("@Email", request.FromEmail);
                        var userIdFromEmail = await findUserCommand.ExecuteScalarAsync();
                        var authorUserId = userIdFromEmail?.ToString() ?? "system";
                        
                        var addCommentSql = @"
                            INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                            VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
                        
                        using var commentCommand = new SqlCommand(addCommentSql, connection);
                        commentCommand.Parameters.AddWithValue("@Id", commentId);
                        commentCommand.Parameters.AddWithValue("@TicketId", ticketId);
                        commentCommand.Parameters.AddWithValue("@Body", commentBody);
                        commentCommand.Parameters.AddWithValue("@AuthorUserId", authorUserId); // Use found user or system
                        commentCommand.Parameters.AddWithValue("@IsInternal", false);
                        commentCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                        
                        await commentCommand.ExecuteNonQueryAsync();
                        
                        // Update ticket's UpdatedAt timestamp
                        var updateTicketSql = "UPDATE Tickets SET UpdatedAt = @UpdatedAt WHERE Id = @TicketId";
                        using var updateCommand = new SqlCommand(updateTicketSql, connection);
                        updateCommand.Parameters.AddWithValue("@TicketId", ticketId);
                        updateCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
                        
                        await updateCommand.ExecuteNonQueryAsync();
                        
                        return Ok(new { 
                            action = "CommentAdded",
                            ticketId = ticketId,
                            publicId = publicId,
                            message = $"Email added as comment to existing ticket #{publicId}"
                        });
                    }
                }
            }

            // If no ticket ID found or ticket doesn't exist, create new ticket
            var newTicketId = Guid.NewGuid();
            
            // Get next public ID
            var getMaxPublicIdSql = "SELECT ISNULL(MAX(PublicId), 0) + 1 FROM Tickets";
            using var maxIdCommand = new SqlCommand(getMaxPublicIdSql, connection);
            var newPublicId = (int)(await maxIdCommand.ExecuteScalarAsync() ?? 1);
            
            // Try to find user by email, fallback to system user
            var findCreatorSql = "SELECT Id FROM AspNetUsers WHERE Email = @Email";
            using var findCreatorCommand = new SqlCommand(findCreatorSql, connection);
            findCreatorCommand.Parameters.AddWithValue("@Email", request.FromEmail);
            var creatorIdFromEmail = await findCreatorCommand.ExecuteScalarAsync();
            var createdByUserId = creatorIdFromEmail?.ToString() ?? "system";
            
            // Get IT category ID (for emails to IT support)
            int? categoryId = null;
            var getCategorySql = "SELECT Id FROM TicketCategories WHERE LOWER(Name) LIKE '%it%' AND IsActive = 1";
            using var getCategoryCommand = new SqlCommand(getCategorySql, connection);
            var categoryResult = await getCategoryCommand.ExecuteScalarAsync();
            if (categoryResult != null)
            {
                categoryId = Convert.ToInt32(categoryResult);
            }
            
            // Determine subcategory based on keywords in subject and body
            // Only set subcategory if matching keywords are found
            int? subcategoryId = await DetermineSubcategoryFromEmailAsync(request.Subject, request.Body, connection);
            if (subcategoryId.HasValue)
            {
                _logger.LogInformation("Auto-matched subcategory {SubcategoryId} for email subject: {Subject}", subcategoryId, request.Subject);
            }
            else
            {
                _logger.LogInformation("No keyword match found for email subject: {Subject} - subcategory will be null", request.Subject);
            }
            
            // Create ticket with CategoryId and SubcategoryId (IsOverdue is computed, not stored)
            var createTicketSql = @"
                INSERT INTO Tickets (Id, PublicId, Title, Description, Category, CategoryId, SubcategoryId, Priority, Status, Source, 
                                   CreatedByUserId, CreatedAt, UpdatedAt)
                VALUES (@Id, @PublicId, @Title, @Description, @Category, @CategoryId, @SubcategoryId, @Priority, @Status, @Source,
                       @CreatedByUserId, @CreatedAt, @UpdatedAt)";
            
            using var createCommand = new SqlCommand(createTicketSql, connection);
            createCommand.Parameters.AddWithValue("@Id", newTicketId);
            createCommand.Parameters.AddWithValue("@PublicId", newPublicId);
            createCommand.Parameters.AddWithValue("@Title", request.Subject);
            createCommand.Parameters.AddWithValue("@Description", $"From: {request.FromEmail}\n\n{request.Body}");
            createCommand.Parameters.AddWithValue("@Category", 1); // Technical category enum value
            createCommand.Parameters.AddWithValue("@CategoryId", (object?)categoryId ?? DBNull.Value);
            createCommand.Parameters.AddWithValue("@SubcategoryId", (object?)subcategoryId ?? DBNull.Value);
            createCommand.Parameters.AddWithValue("@Priority", 2); // Normal priority
            createCommand.Parameters.AddWithValue("@Status", 1); // Open status
            createCommand.Parameters.AddWithValue("@Source", 2); // Email source
            createCommand.Parameters.AddWithValue("@CreatedByUserId", createdByUserId); // Use found user or system
            createCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
            createCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
            
            await createCommand.ExecuteNonQueryAsync();
            
            // Send ticket creation confirmation email to the customer
            try
            {
                var ticketNumber = newPublicId.ToString();
                var subject = $"[Ticket #{ticketNumber}] Your Support Request Has Been Created - {request.Subject}";
                var emailBody = $@"
<html>
<body style='font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;'>
    <div style='max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
        <div style='background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;'>
            <h2 style='margin: 0;'>📩 Support Ticket Created</h2>
        </div>
        
        <div style='padding: 30px;'>
            <p>Thank you for contacting our support team. Your support request has been successfully created.</p>
            
            <div style='background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                <table style='width: 100%; border-collapse: collapse;'>
                    <tr>
                        <td style='padding: 8px 0; font-weight: bold;'>Ticket Number:</td>
                        <td style='padding: 8px 0; color: #2563eb; font-weight: bold; font-size: 18px;'>#{ticketNumber}</td>
                    </tr>
                    <tr>
                        <td style='padding: 8px 0; font-weight: bold;'>Subject:</td>
                        <td style='padding: 8px 0;'>{request.Subject}</td>
                    </tr>
                    <tr>
                        <td style='padding: 8px 0; font-weight: bold;'>Status:</td>
                        <td style='padding: 8px 0;'><span style='background-color: #3b82f6; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px;'>Open</span></td>
                    </tr>
                    <tr>
                        <td style='padding: 8px 0; font-weight: bold;'>Created:</td>
                        <td style='padding: 8px 0;'>{DateTime.UtcNow:dddd, MMMM dd, yyyy 'at' hh:mm tt} UTC</td>
                    </tr>
                </table>
            </div>
            
            <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                <p style='margin: 0; color: #1e40af;'><strong>💡 What's Next?</strong></p>
                <ul style='margin: 10px 0 0 0; color: #1e40af; padding-left: 20px;'>
                    <li>Our support team will review your request</li>
                    <li>You will receive an email when an agent responds</li>
                    <li>Reply to this email to add more information</li>
                    <li>Keep ticket number <strong>#{ticketNumber}</strong> in the subject line</li>
                </ul>
            </div>
            
            <p>Best regards,<br/><strong>IT Support Team</strong></p>
        </div>
        
        <div style='background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;'>
            <p style='font-size: 12px; color: #6b7280; margin: 0;'>This is an automated notification from the IT Help Desk.</p>
        </div>
    </div>
</body>
</html>";

                await SendEmail(request.FromEmail, subject, emailBody);
                _logger.LogInformation("📧 Sent ticket creation notification to {Email} for ticket #{TicketNumber}", request.FromEmail, ticketNumber);
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "⚠️ Failed to send ticket creation notification email for ticket #{PublicId}", newPublicId);
                // Don't fail the ticket creation if email fails
            }
            
            return Ok(new { 
                action = "TicketCreated",
                ticketId = newTicketId,
                publicId = newPublicId,
                message = $"New ticket #{newPublicId} created from email"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing incoming email");
            return StatusCode(500, new { error = "Error processing email" });
        }
    }

    // EMAIL NOTIFICATION METHODS
    private async Task SendCommentNotificationEmail(Guid ticketId, string commentContent, SqlConnection connection)
    {
        try
        {
            // Get ticket and user details
            var ticketSql = @"
                SELECT t.PublicId, t.Title, t.Description, u.Email as UserEmail, u.FirstName + ' ' + u.LastName as UserName
                FROM Tickets t
                LEFT JOIN AspNetUsers u ON t.CreatedByUserId = u.Id
                WHERE t.Id = @TicketId";
                
            using var command = new SqlCommand(ticketSql, connection);
            command.Parameters.AddWithValue("@TicketId", ticketId);
            
            using var reader = await command.ExecuteReaderAsync();
            if (reader.Read())
            {
                var publicIdRaw = reader["PublicId"] != DBNull.Value ? (int?)reader["PublicId"] : null;
                var title = reader["Title"]?.ToString() ?? "Unknown Ticket";
                var userEmail = reader["UserEmail"]?.ToString();
                var userName = reader["UserName"]?.ToString() ?? "User";
                
                if (!string.IsNullOrEmpty(userEmail))
                {
                    var ticketPublicId = publicIdRaw ?? await EnsureTicketPublicIdAsync(ticketId, connection);
                    var ticketNumber = ticketPublicId > 0
                        ? ticketPublicId.ToString()
                        : ticketId.ToString().Substring(0, 8);

                    var subject = $"[Ticket #{ticketNumber}] {title} - New Comment";
                    var body = $"Hello {userName},\n\n" +
                               "A new comment has been added to your ticket.\n\n" +
                               $"Ticket #{ticketNumber}: {title}\n" +
                               "------------------------------\n" +
                               commentContent + "\n\n" +
                               "Please keep the ticket number in the subject when replying so we can track everything.\n\n" +
                               "Best regards,\nSupport Team";

                    await SendEmail(
                        userEmail, 
                        subject,
                        body
                    );
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send comment notification email for ticket {TicketId}", ticketId);
        }
    }

    private static async Task<int> EnsureTicketPublicIdAsync(
        Guid ticketId,
        SqlConnection connection,
        SqlTransaction? transaction = null)
    {
        var ownsTransaction = transaction is null;
        var effectiveTransaction = transaction ?? connection.BeginTransaction(IsolationLevel.Serializable);

        try
        {
            using var currentCommand = new SqlCommand(
                "SELECT PublicId FROM Tickets WITH (UPDLOCK, HOLDLOCK) WHERE Id = @TicketId",
                connection,
                effectiveTransaction);
            currentCommand.Parameters.AddWithValue("@TicketId", ticketId);

            var currentValue = await currentCommand.ExecuteScalarAsync();
            if (currentValue is int existing && existing > 0)
            {
                if (ownsTransaction)
                {
                    effectiveTransaction.Commit();
                }

                return existing;
            }

            using var nextCommand = new SqlCommand(
                "SELECT ISNULL(MAX(PublicId), 0) + 1 FROM Tickets WITH (UPDLOCK, HOLDLOCK)",
                connection,
                effectiveTransaction);
            var nextValue = (int)(await nextCommand.ExecuteScalarAsync() ?? 1);

            using var updateCommand = new SqlCommand(
                "UPDATE Tickets SET PublicId = @PublicId WHERE Id = @TicketId",
                connection,
                effectiveTransaction);
            updateCommand.Parameters.AddWithValue("@PublicId", nextValue);
            updateCommand.Parameters.AddWithValue("@TicketId", ticketId);
            await updateCommand.ExecuteNonQueryAsync();

            if (ownsTransaction)
            {
                effectiveTransaction.Commit();
            }

            return nextValue;
        }
        catch
        {
            if (ownsTransaction)
            {
                effectiveTransaction.Rollback();
            }

            throw;
        }
    }

    private sealed record PreparedAttachment(string FileName, string ContentType, byte[] Data);

    private static async Task<List<PreparedAttachment>> PrepareAttachmentsAsync(List<IFormFile>? attachments)
    {
        var prepared = new List<PreparedAttachment>();

        if (attachments == null || attachments.Count == 0)
        {
            return prepared;
        }

        foreach (var file in attachments)
        {
            if (file.Length <= 0)
            {
                continue;
            }

            await using var stream = file.OpenReadStream();
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);

            var contentType = string.IsNullOrWhiteSpace(file.ContentType)
                ? "application/octet-stream"
                : file.ContentType;

            prepared.Add(new PreparedAttachment(
                file.FileName,
                contentType,
                memoryStream.ToArray()));
        }

        return prepared;
    }

    private async Task SendEmail(string toEmail, string subject, string body, List<OutgoingEmailAttachment>? attachments = null)
    {
        try
        {
            _logger.LogInformation("📧 Attempting to send email via Microsoft Graph to: {Email}, Subject: {Subject}, Attachments: {AttachmentCount}",
                toEmail,
                subject,
                attachments?.Count ?? 0);
            
            // Use Microsoft Graph API for sending emails (more reliable than SMTP)
            if (_emailService != null)
            {
                try
                {
                    await _emailService.SendEmailAsync(
                        toEmail,
                        subject,
                        body,
                        isHtml: false,
                        attachments: attachments);
                    _logger.LogInformation("✅ Email sent successfully via Microsoft Graph to: {Email}", toEmail);
                }
                catch (Exception graphEx)
                {
                    _logger.LogWarning(graphEx, "⚠️ Graph API email failed (this is OK - action will still be recorded). To: {Email}, Details: {Message}", 
                        toEmail, graphEx.Message);
                    // Continue - don't throw, just log the warning
                }
            }
            else
            {
                _logger.LogWarning("⚠️ Email service not configured. Would have sent email to: {Email}, Subject: {Subject}", toEmail, subject);
                _logger.LogInformation("Email body preview: {Body}", body.Length > 200 ? body.Substring(0, 200) + "..." : body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Unexpected error in SendEmail method for: {Email}. Recording action anyway.", toEmail);
            // Don't throw - allow the action to be recorded even if email fails
        }
    }

    [HttpGet("custom-fields/analytics")]
    public async Task<ActionResult> GetCustomFieldAnalytics([FromQuery] int days = 7, [FromQuery] string? categoryIds = null)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var endDate = GetUtcNow();
            var startDate = endDate.AddDays(-days);

            // Parse category IDs if provided (for Category Admin filtering)
            var categoryIdList = new List<int>();
            if (!string.IsNullOrEmpty(categoryIds))
            {
                categoryIdList = categoryIds.Split(',')
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : 0)
                    .Where(id => id > 0)
                    .ToList();
            }

            _logger.LogInformation($"Getting custom field analytics for date range: {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}, categoryIds: {categoryIds ?? "all"}");

            // Add category filter if provided
            var categoryFilter = categoryIdList.Any() 
                ? $"AND t.CategoryId IN ({string.Join(",", categoryIdList)})" 
                : "";

            // Simplified query for faster implementation
            var sql = $@"
                SELECT 
                    cf.Label as CustomFieldName,
                    tfv.Value as CustomFieldValue,
                    ISNULL(cat.Name, 'Uncategorized') as CategoryName,
                    ISNULL(subcat.Name, 'Uncategorized') as SubcategoryName,
                    COUNT(*) as TotalTickets,
                    SUM(CASE WHEN t.Status = 1 THEN 1 ELSE 0 END) as OpenCount,
                    SUM(CASE WHEN t.Status = 2 THEN 1 ELSE 0 END) as InProgressCount,
                    SUM(CASE WHEN t.Status = 4 THEN 1 ELSE 0 END) as ResolvedCount,
                    SUM(CASE WHEN t.Status = 5 THEN 1 ELSE 0 END) as ClosedCount
                FROM Tickets t
                INNER JOIN TicketFieldValues tfv ON t.Id = tfv.TicketId
                INNER JOIN CustomFields cf ON tfv.CustomFieldId = cf.Id
                LEFT JOIN TicketCategories cat ON t.CategoryId = cat.Id
                LEFT JOIN TicketSubCategories subcat ON t.SubcategoryId = subcat.Id
                WHERE t.CreatedAt >= @StartDate 
                    AND t.CreatedAt <= @EndDate
                    AND cf.IsActive = 1
                    AND cf.IsDeleted = 0
                    AND tfv.Value IS NOT NULL 
                    AND tfv.Value != ''
                    {categoryFilter}
                GROUP BY cf.Label, tfv.Value, cat.Name, subcat.Name
                ORDER BY CategoryName, SubcategoryName, CustomFieldName, TotalTickets DESC";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@StartDate", startDate);
            command.Parameters.AddWithValue("@EndDate", endDate);

            var results = new List<object>();
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var ticketCount = (int)reader["TotalTickets"];
                var resolvedCount = (int)reader["ResolvedCount"];
                var resolutionRate = ticketCount > 0 ? Math.Round((double)resolvedCount / ticketCount * 100, 1) : 0;

                results.Add(new
                {
                    customFieldName = reader["CustomFieldName"].ToString(),
                    customFieldValue = reader["CustomFieldValue"].ToString(),
                    categoryName = reader["CategoryName"].ToString(),
                    subcategoryName = reader["SubcategoryName"].ToString(),
                    totalTickets = ticketCount,
                    openCount = (int)reader["OpenCount"],
                    inProgressCount = (int)reader["InProgressCount"],
                    resolvedCount = resolvedCount,
                    closedCount = (int)reader["ClosedCount"],
                    resolutionRate = resolutionRate
                });
            }

            reader.Close();

            // Group by Category -> Subcategory -> Custom Field
            var grouped = results
                .GroupBy(r => ((dynamic)r).categoryName)
                .Select(catGroup => new
                {
                    categoryName = catGroup.Key,
                    totalTickets = catGroup.Sum(x => ((dynamic)x).totalTickets),
                    subcategories = catGroup
                        .GroupBy(r => ((dynamic)r).subcategoryName)
                        .Select(subGroup => new
                        {
                            subcategoryName = subGroup.Key,
                            totalTickets = subGroup.Sum(x => ((dynamic)x).totalTickets),
                            customFields = subGroup
                                .GroupBy(r => ((dynamic)r).customFieldName)
                                .Select(fieldGroup => new
                                {
                                    fieldName = fieldGroup.Key,
                                    totalTickets = fieldGroup.Sum(x => ((dynamic)x).totalTickets),
                                    values = fieldGroup.Select(x => new
                                    {
                                        value = ((dynamic)x).customFieldValue,
                                        totalTickets = ((dynamic)x).totalTickets,
                                        openCount = ((dynamic)x).openCount,
                                        inProgressCount = ((dynamic)x).inProgressCount,
                                        resolvedCount = ((dynamic)x).resolvedCount,
                                        closedCount = ((dynamic)x).closedCount,
                                        resolutionRate = ((dynamic)x).resolutionRate
                                    }).OrderByDescending(v => v.totalTickets).ToList()
                                }).OrderByDescending(f => f.totalTickets).ToList()
                        }).OrderByDescending(s => s.totalTickets).ToList()
                })
                .OrderByDescending(c => c.totalTickets)
                .ToList();

            var totalTickets = results.Sum(r => ((dynamic)r).totalTickets);
            _logger.LogInformation($"Custom field analytics: Found {grouped.Count} categories, {totalTickets} total tickets");

            return Ok(new
            {
                dateRange = new
                {
                    startDate = startDate.ToString("yyyy-MM-dd"),
                    endDate = endDate.ToString("yyyy-MM-dd"),
                    days = days
                },
                summary = new
                {
                    totalCategories = grouped.Count,
                    totalTickets = totalTickets,
                    totalRecords = results.Count
                },
                data = grouped
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting custom field analytics");
            return StatusCode(500, new { message = "Failed to get custom field analytics", error = ex.Message });
        }
    }

    [HttpGet("department-analytics")]
    public async Task<ActionResult> GetDepartmentAnalytics([FromQuery] int days = 7, [FromQuery] string? categoryIds = null)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var endDate = GetUtcNow();
            var startDate = endDate.AddDays(-days);

            // Parse category IDs if provided (for Category Admin filtering)
            var categoryIdList = new List<int>();
            if (!string.IsNullOrEmpty(categoryIds))
            {
                categoryIdList = categoryIds.Split(',')
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : 0)
                    .Where(id => id > 0)
                    .ToList();
            }

            _logger.LogInformation($"Getting department analytics for date range: {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}, categoryIds: {categoryIds ?? "all"}");

            var categoryFilter = categoryIdList.Any() 
                ? $"AND t.CategoryId IN ({string.Join(",", categoryIdList)})" 
                : "";

            var sql = $@"
                SELECT 
                    ISNULL(d.Name, 'Unassigned') as DepartmentName,
                    COUNT(*) as TotalTickets,
                    SUM(CASE WHEN t.Status = 1 THEN 1 ELSE 0 END) as OpenCount,
                    SUM(CASE WHEN t.Status = 2 THEN 1 ELSE 0 END) as InProgressCount,
                    SUM(CASE WHEN t.Status = 4 THEN 1 ELSE 0 END) as ResolvedCount,
                    SUM(CASE WHEN t.Status = 5 THEN 1 ELSE 0 END) as ClosedCount
                FROM Tickets t
                LEFT JOIN TicketDepartments d ON t.DepartmentId = d.Id
                WHERE t.CreatedAt >= @StartDate 
                    AND t.CreatedAt <= @EndDate
                    {categoryFilter}
                GROUP BY d.Name
                ORDER BY TotalTickets DESC";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@StartDate", startDate);
            command.Parameters.AddWithValue("@EndDate", endDate);

            var results = new List<object>();
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                results.Add(new
                {
                    departmentName = reader["DepartmentName"].ToString(),
                    totalTickets = (int)reader["TotalTickets"],
                    openCount = (int)reader["OpenCount"],
                    inProgressCount = (int)reader["InProgressCount"],
                    resolvedCount = (int)reader["ResolvedCount"],
                    closedCount = (int)reader["ClosedCount"]
                });
            }

            var totalTickets = results.Sum(r => ((dynamic)r).totalTickets);
            _logger.LogInformation($"Department analytics: Found {results.Count} departments, {totalTickets} total tickets");

            return Ok(new
            {
                dateRange = new
                {
                    startDate = startDate.ToString("yyyy-MM-dd"),
                    endDate = endDate.ToString("yyyy-MM-dd"),
                    days = days
                },
                summary = new
                {
                    totalDepartments = results.Count,
                    totalTickets = totalTickets
                },
                data = results
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting department analytics");
            return StatusCode(500, new { message = "Failed to get department analytics", error = ex.Message });
        }
    }

    [HttpGet("agent-performance")]
    public async Task<ActionResult> GetAgentPerformance([FromQuery] int days = 7, [FromQuery] string? categoryIds = null)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var endDate = GetUtcNow();
            var startDate = endDate.AddDays(-days);

            // Parse category IDs if provided (for Category Admin filtering)
            var categoryIdList = new List<int>();
            if (!string.IsNullOrEmpty(categoryIds))
            {
                categoryIdList = categoryIds.Split(',')
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : 0)
                    .Where(id => id > 0)
                    .ToList();
            }

            _logger.LogInformation($"Getting agent performance for date range: {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}, categoryIds: {categoryIds ?? "all"}");

            var categoryFilter = categoryIdList.Any() 
                ? $"AND t.CategoryId IN ({string.Join(",", categoryIdList)})" 
                : "";

            var sql = $@"
                WITH AgentStats AS (
                    SELECT 
                        t.AssignedToUserId,
                        COUNT(*) as TotalTickets,
                        SUM(CASE WHEN t.Status = 1 THEN 1 ELSE 0 END) as OpenCount,
                        SUM(CASE WHEN t.Status = 2 THEN 1 ELSE 0 END) as InProgressCount,
                        SUM(CASE WHEN t.Status = 4 THEN 1 ELSE 0 END) as ResolvedCount,
                        SUM(CASE WHEN t.Status = 5 THEN 1 ELSE 0 END) as ClosedCount,
                        AVG(CASE 
                            WHEN t.ResolvedAt IS NOT NULL AND t.CreatedAt IS NOT NULL 
                            THEN DATEDIFF(hour, t.CreatedAt, t.ResolvedAt) 
                            ELSE NULL 
                        END) as AvgResolutionHours
                    FROM Tickets t
                    WHERE t.CreatedAt >= @StartDate 
                        AND t.CreatedAt <= @EndDate
                        AND t.AssignedToUserId IS NOT NULL
                        {categoryFilter}
                    GROUP BY t.AssignedToUserId
                )
                , OrderedAgentStats AS (
                    SELECT 
                        AssignedToUserId,
                        TotalTickets,
                        OpenCount,
                        InProgressCount,
                        ResolvedCount,
                        ClosedCount,
                        AvgResolutionHours,
                        ROW_NUMBER() OVER (ORDER BY TotalTickets DESC) AS RowNum
                    FROM AgentStats
                )
                SELECT 
                    COALESCE(
                        NULLIF(ag.Name, ''),
                        NULLIF(LTRIM(RTRIM(CONCAT(u.FirstName, ' ', u.LastName))), ''),
                        CONCAT('Agent ', oas.RowNum)
                    ) as AgentName,
                    COALESCE(NULLIF(ag.Email, ''), u.Email, CONCAT('agent', oas.RowNum, '@company.com')) as AgentEmail,
                    COALESCE(NULLIF(ag.Department, ''), NULLIF(u.Department, ''), 'Unassigned') as Department,
                    oas.TotalTickets,
                    oas.OpenCount,
                    oas.InProgressCount,
                    oas.ResolvedCount,
                    oas.ClosedCount,
                    oas.AvgResolutionHours
                FROM OrderedAgentStats oas
                LEFT JOIN Agents ag ON ag.UserId = oas.AssignedToUserId
                LEFT JOIN AspNetUsers u ON u.Id = oas.AssignedToUserId
                ORDER BY oas.TotalTickets DESC";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@StartDate", startDate);
            command.Parameters.AddWithValue("@EndDate", endDate);

            var results = new List<object>();
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var agentTotalTickets = (int)reader["TotalTickets"];
                var resolvedCount = (int)reader["ResolvedCount"];
                var resolutionRate = agentTotalTickets > 0 ? Math.Round((double)resolvedCount / agentTotalTickets * 100, 1) : 0;
                
                // Handle AvgResolutionHours - can be int, double, or DBNull
                double? avgHours = null;
                if (reader["AvgResolutionHours"] != DBNull.Value)
                {
                    avgHours = Convert.ToDouble(reader["AvgResolutionHours"]);
                }
                
                var avgResolutionTime = avgHours.HasValue ? 
                    (avgHours.Value < 24 ? $"{avgHours.Value:F1}h" : $"{avgHours.Value / 24:F1}d") : "N/A";

                results.Add(new
                {
                    agentName = reader["AgentName"].ToString(),
                    agentEmail = reader["AgentEmail"].ToString(),
                    department = reader["Department"].ToString(),
                    totalTickets = agentTotalTickets,
                    openCount = (int)reader["OpenCount"],
                    inProgressCount = (int)reader["InProgressCount"],
                    resolvedCount = resolvedCount,
                    closedCount = (int)reader["ClosedCount"],
                    avgResolutionTime = avgResolutionTime,
                    resolutionRate = resolutionRate
                });
            }

            var totalTickets = results.Sum(r => ((dynamic)r).totalTickets);
            _logger.LogInformation($"Agent performance: Found {results.Count} agents, {totalTickets} total tickets");

            return Ok(new
            {
                dateRange = new
                {
                    startDate = startDate.ToString("yyyy-MM-dd"),
                    endDate = endDate.ToString("yyyy-MM-dd"),
                    days = days
                },
                summary = new
                {
                    totalAgents = results.Count,
                    totalTickets = totalTickets
                },
                data = results
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agent performance");
            return StatusCode(500, new { message = "Failed to get agent performance", error = ex.Message });
        }
    }
    
    // REOPEN TICKET - For users who are not satisfied with resolution
    [HttpGet("{ticketId:guid}/reopen")]
    [AllowAnonymous] // Allow anonymous access from email links
    public async Task<IActionResult> ReopenTicket(Guid ticketId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            // Check if ticket exists and is resolved
            var checkSql = @"SELECT Id, PublicId, Title, Status, CreatedByUserId 
                           FROM Tickets WHERE Id = @TicketId";
            
            using var checkCmd = new SqlCommand(checkSql, connection);
            checkCmd.Parameters.AddWithValue("@TicketId", ticketId);
            
            using var reader = await checkCmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                return NotFound(new { error = "Ticket not found" });
            }
            
            var ticketNumber = reader["PublicId"] != DBNull.Value ? reader["PublicId"].ToString() : ticketId.ToString().Substring(0, 8);
            var status = (int)reader["Status"];
            var createdByUserId = reader["CreatedByUserId"].ToString();
            reader.Close();
            
            // Check if ticket is in resolved state (only resolved tickets can be reopened, not closed)
            if (status != 4) // 4 = Resolved (Closed tickets cannot be reopened)
            {
                var statusMessage = status == 5 ? "closed and cannot be reopened" : "not in a resolved status and cannot be reopened";
                // Redirect to a friendly message page or return HTML
                return Content($@"
<!DOCTYPE html>
<html>
<head>
    <title>Ticket Reopen</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }}
        .info {{ background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }}
    </style>
</head>
<body>
    <h2>ℹ️ Ticket Status</h2>
    <div class='info'>
        <p><strong>Ticket #{ticketNumber}</strong> is {statusMessage}.</p>
        <p>Only resolved tickets can be reopened. Please contact support if you need assistance.</p>
    </div>
    <p>If you need assistance, please contact support directly.</p>
</body>
</html>", "text/html");
            }
            
            // Get the "Reopen" status ID from database (status names are configurable)
            var getStatusSql = "SELECT Id FROM TicketStatuses WHERE Name = 'Reopen' AND IsActive = 1";
            int? reopenStatusId = null;
            
            using (var statusCmd = new SqlCommand(getStatusSql, connection))
            {
                var result = await statusCmd.ExecuteScalarAsync();
                if (result != null)
                {
                    reopenStatusId = Convert.ToInt32(result);
                }
            }
            
            if (!reopenStatusId.HasValue)
            {
                _logger.LogWarning("Reopen status not found in database, falling back to 'In Progress' status");
                reopenStatusId = 2; // Fallback to In Progress if Reopen status doesn't exist
            }
            
            // Reopen the ticket by setting status to "Reopen" - ticket was resolved but customer not satisfied
            var reopenSql = @"UPDATE Tickets 
                            SET Status = @Status, 
                                ResolvedAt = NULL,
                                UpdatedAt = @UpdatedAt
                            WHERE Id = @TicketId";
            
            using var reopenCmd = new SqlCommand(reopenSql, connection);
            reopenCmd.Parameters.AddWithValue("@Status", reopenStatusId.Value);
            reopenCmd.Parameters.AddWithValue("@TicketId", ticketId);
            reopenCmd.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
            
            var rowsAffected = await reopenCmd.ExecuteNonQueryAsync();
            
            if (rowsAffected > 0)
            {
                // Add a system comment indicating the ticket was reopened
                var commentSql = @"INSERT INTO TicketComments (TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                                 VALUES (@TicketId, @Body, @AuthorUserId, 0, @CreatedAt)";
                
                using var commentCmd = new SqlCommand(commentSql, connection);
                commentCmd.Parameters.AddWithValue("@TicketId", ticketId);
                commentCmd.Parameters.AddWithValue("@Body", "Ticket reopened by customer - issue not fully resolved");
                commentCmd.Parameters.AddWithValue("@AuthorUserId", createdByUserId);
                commentCmd.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                
                await commentCmd.ExecuteNonQueryAsync();
                
                _logger.LogInformation("Ticket {TicketId} (#{TicketNumber}) reopened by user", ticketId, ticketNumber);
                
                // Return a friendly HTML response
                return Content($@"
<!DOCTYPE html>
<html>
<head>
    <title>Ticket Reopened</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }}
        .success {{ background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }}
        .button {{ background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }}
    </style>
</head>
<body>
    <h2>✅ Ticket Successfully Reopened</h2>
    <div class='success'>
        <p><strong>Ticket #{ticketNumber}</strong> has been reopened.</p>
        <p>Our support team will review your case and get back to you shortly.</p>
    </div>
    <p>Thank you for your patience!</p>
</body>
</html>", "text/html");
            }
            
            return StatusCode(500, new { error = "Failed to reopen ticket" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reopening ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = ex.Message });
        }
    }
    
    private string GetStatusName(int status)
    {
        return status switch
        {
            1 => "Open",
            2 => "In Progress",
            3 => "On Hold",
            4 => "Resolved",
            5 => "Closed",
            _ => "Unknown"
        };
    }
    
    /// <summary>
    /// Determines subcategory based on keywords in email subject and body.
    /// Returns null if no matching keywords are found (subcategory should be "Select" option).
    /// </summary>
    private async Task<int?> DetermineSubcategoryFromEmailAsync(string subject, string body, SqlConnection connection)
    {
        try
        {
            var content = $"{subject} {body}".ToLowerInvariant();
            
            if (string.IsNullOrWhiteSpace(content))
            {
                return null;
            }
            
            // Query ticket tags (keywords) with their associated subcategories
            var sql = @"
                SELECT tt.SubCategoryId, tt.Name 
                FROM TicketTags tt 
                WHERE tt.IsActive = 1 AND tt.IsDeleted = 0
                ORDER BY tt.SubCategoryId";
            
            using var command = new SqlCommand(sql, connection);
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                var subCategoryId = reader.GetInt32(0); // SubCategoryId
                var tagName = reader.GetString(1);      // Name (comma-separated keywords)
                
                // Split tag name by common separators and check each keyword
                var keywords = tagName.Split(new[] { ',', ';', '|', '/' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                
                foreach (var keyword in keywords)
                {
                    var cleanKeyword = keyword.Trim().ToLowerInvariant();
                    if (!string.IsNullOrWhiteSpace(cleanKeyword) && content.Contains(cleanKeyword))
                    {
                        _logger.LogInformation("Email keyword match: '{Keyword}' -> subcategory ID {SubCategoryId}", cleanKeyword, subCategoryId);
                        return subCategoryId;
                    }
                }
            }
            
            // No keyword match found - return null to leave subcategory empty
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error determining subcategory from email content");
            return null;
        }
    }
}

// Request DTOs
public class AddCommentV2Request
{
    public string Content { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = false;
}

public class UpdateTicketV2Request
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? Category { get; set; }
    public int? Priority { get; set; }
    public int? Status { get; set; }
    public int? CategoryId { get; set; }
    public int? SubcategoryId { get; set; }
    public int? DepartmentId { get; set; }
    public string? AssignedToUserId { get; set; }
    public Dictionary<string, object>? CustomFields { get; set; }
}

public class DeleteTicketRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class MergeTicketsRequest
{
    public List<Guid> TicketIds { get; set; } = new();
    public string Reason { get; set; } = string.Empty;
}

public class ReplyEmailRequest
{
    public string ReplyMessage { get; set; } = string.Empty;
    public string? SentByUserId { get; set; }
}

public class ForwardEmailRequest
{
    public string RecipientEmail { get; set; } = string.Empty;
    public string? RecipientName { get; set; }
    public string ForwardMessage { get; set; } = string.Empty;
    public string? SentByUserId { get; set; }
}

public class ProcessEmailRequest
{
    public string FromEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}
