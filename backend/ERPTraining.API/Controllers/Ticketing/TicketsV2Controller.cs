using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using ERPTraining.Infrastructure.Services.Ticketing;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/tickets-v2")]
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

    // COMMENTS - Direct SQL approach that WORKS + Email Notifications
    [HttpPost("{ticketId:guid}/comments")]
    public async Task<ActionResult> AddComment(Guid ticketId, [FromBody] AddCommentV2Request request)
    {
        try
        {
            var commentId = Guid.NewGuid();
            var userId = "0016f2fc-c4da-42d7-a635-236b4b95c6f1"; // Default user for dev
            
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
            command.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
            
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

    // GET SINGLE TICKET
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
                       t.FirstResponseAt, t.ResolvedAt, t.IsOverdue,
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
                    createdAt = reader["CreatedAt"].ToString(),
                    updatedAt = reader["UpdatedAt"].ToString(),
                    firstResponseAt = reader["FirstResponseAt"]?.ToString(),
                    resolvedAt = reader["ResolvedAt"]?.ToString(),
                    isOverdue = (bool)reader["IsOverdue"],
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
                        createdAt = attachmentReader["CreatedAt"].ToString()
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
                
                // Return ticket with attachments and merge information included
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

    // GET COMMENTS
    [HttpGet("{ticketId:guid}/comments")]
    public async Task<ActionResult> GetComments(Guid ticketId)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT c.Id, c.Body, c.AuthorUserId, c.IsInternal, c.CreatedAt,
                       u.FirstName + ' ' + u.LastName as AuthorName
                FROM TicketComments c
                LEFT JOIN AspNetUsers u ON c.AuthorUserId = u.Id
                WHERE c.TicketId = @TicketId
                ORDER BY c.CreatedAt ASC";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@TicketId", ticketId);
            
            var comments = new List<object>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                comments.Add(new
                {
                    id = reader["Id"],
                    body = reader["Body"],
                    authorUserId = reader["AuthorUserId"],
                    authorName = reader["AuthorName"] ?? "Unknown User",
                    isInternal = reader["IsInternal"],
                    createdAt = reader["CreatedAt"]
                });
            }
            
            return Ok(comments);
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
                    UpdatedAt = @UpdatedAt
                WHERE Id = @TicketId";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@TicketId", ticketId);
            command.Parameters.AddWithValue("@Title", (object?)request.Title ?? DBNull.Value);
            command.Parameters.AddWithValue("@Description", (object?)request.Description ?? DBNull.Value);
            command.Parameters.AddWithValue("@Category", (object?)request.Category ?? DBNull.Value);
            command.Parameters.AddWithValue("@Priority", (object?)request.Priority ?? DBNull.Value);
            command.Parameters.AddWithValue("@Status", (object?)request.Status ?? DBNull.Value);
            command.Parameters.AddWithValue("@CategoryId", (object?)request.CategoryId ?? DBNull.Value);
            command.Parameters.AddWithValue("@SubcategoryId", (object?)request.SubcategoryId ?? DBNull.Value);
            command.Parameters.AddWithValue("@DepartmentId", (object?)request.DepartmentId ?? DBNull.Value);
            command.Parameters.AddWithValue("@AssignedToUserId", (object?)request.AssignedToUserId ?? DBNull.Value);
            command.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
            
            var rowsAffected = await command.ExecuteNonQueryAsync();
            
            if (rowsAffected == 0)
                return NotFound(new { error = "Ticket not found" });
                
            return Ok(new { message = "Ticket updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating ticket {TicketId}", ticketId);
            return StatusCode(500, new { error = "Error updating ticket" });
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
            command.Parameters.Add("@UpdatedAt", SqlDbType.DateTime2).Value = DateTime.UtcNow;
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

    // DOWNLOAD ATTACHMENT
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
                
                // Build the full file path
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), storagePath ?? "");
                
                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound(new { message = "File not found on disk" });
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
                ) 
                AND t.Status != 99 -- Exclude deleted tickets
                AND (@ExcludeTicketId IS NULL OR t.Id != @ExcludeTicketId)
                ORDER BY 
                    CASE 
                        WHEN t.Title LIKE @ExactQuery THEN 1
                        WHEN CAST(t.PublicId AS NVARCHAR) = @PlainQuery THEN 2
                        WHEN t.Title LIKE @StartQuery THEN 3
                        ELSE 4
                    END,
                    t.CreatedAt DESC";
                
            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Query", $"%{query}%");
            command.Parameters.AddWithValue("@ExactQuery", query);
            command.Parameters.AddWithValue("@StartQuery", $"{query}%");
            command.Parameters.AddWithValue("@PlainQuery", query);
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
                    createdAt = reader["CreatedAt"].ToString(),
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
                var checkPrimarySql = "SELECT Id, Title FROM Tickets WHERE Id = @PrimaryTicketId AND Status != 99";
                using var checkCommand = new SqlCommand(checkPrimarySql, connection, transaction);
                checkCommand.Parameters.AddWithValue("@PrimaryTicketId", primaryTicketId);
                
                var primaryTicketTitle = "";
                using var checkReader = await checkCommand.ExecuteReaderAsync();
                if (await checkReader.ReadAsync())
                {
                    primaryTicketTitle = checkReader["Title"].ToString() ?? "";
                }
                else
                {
                    return NotFound(new { message = "Primary ticket not found or is deleted" });
                }
                checkReader.Close();

                // Validate all tickets to merge exist and are not deleted
                var mergeTicketIds = request.TicketIds.Where(id => id != primaryTicketId).ToList();
                if (!mergeTicketIds.Any())
                {
                    return BadRequest(new { message = "No valid tickets selected for merging" });
                }

                var mergeTicketTitles = new List<string>();
                foreach (var ticketId in mergeTicketIds)
                {
                    var validateSql = "SELECT Id, Title FROM Tickets WHERE Id = @TicketId AND Status != 99";
                    using var validateCommand = new SqlCommand(validateSql, connection, transaction);
                    validateCommand.Parameters.AddWithValue("@TicketId", ticketId);
                    
                    using var validateReader = await validateCommand.ExecuteReaderAsync();
                    if (await validateReader.ReadAsync())
                    {
                        mergeTicketTitles.Add(validateReader["Title"].ToString() ?? "");
                    }
                    else
                    {
                        return BadRequest(new { message = $"Ticket {ticketId} not found or is deleted" });
                    }
                    validateReader.Close();
                }

                // Create merge record in a MergedTickets table (we'll need to create this table)
                var mergeId = Guid.NewGuid();
                var createMergeSql = @"
                    INSERT INTO MergedTickets (Id, PrimaryTicketId, MergedTicketIds, MergeReason, MergedAt)
                    VALUES (@MergeId, @PrimaryTicketId, @MergedTicketIds, @MergeReason, @MergedAt)";
                
                using var mergeCommand = new SqlCommand(createMergeSql, connection, transaction);
                mergeCommand.Parameters.AddWithValue("@MergeId", mergeId);
                mergeCommand.Parameters.AddWithValue("@PrimaryTicketId", primaryTicketId);
                mergeCommand.Parameters.AddWithValue("@MergedTicketIds", string.Join(",", mergeTicketIds));
                mergeCommand.Parameters.AddWithValue("@MergeReason", request.Reason);
                mergeCommand.Parameters.AddWithValue("@MergedAt", DateTime.UtcNow);
                
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

                // Update merged tickets status to "Merged" (status 98) and add merge info to description
                foreach (var ticketId in mergeTicketIds)
                {
                    var updateMergedSql = @"
                        UPDATE Tickets 
                        SET Status = 98,
                            UpdatedAt = @UpdatedAt,
                            Description = CONCAT(Description, CHAR(13) + CHAR(10) + CHAR(13) + CHAR(10) + 
                                                '--- MERGED INTO TICKET #' + CAST((SELECT PublicId FROM Tickets WHERE Id = @PrimaryTicketId) AS NVARCHAR) + ' ---' + CHAR(13) + CHAR(10) + 
                                                'Merge Reason: ' + @MergeReason + CHAR(13) + CHAR(10) + 
                                                'Merged At: ' + FORMAT(@UpdatedAt, 'yyyy-MM-dd HH:mm:ss'))
                        WHERE Id = @MergedTicketId";
                    
                    using var updateCommand = new SqlCommand(updateMergedSql, connection, transaction);
                    updateCommand.Parameters.AddWithValue("@MergedTicketId", ticketId);
                    updateCommand.Parameters.AddWithValue("@PrimaryTicketId", primaryTicketId);
                    updateCommand.Parameters.AddWithValue("@MergeReason", request.Reason);
                    updateCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
                    
                    await updateCommand.ExecuteNonQueryAsync();
                }

                // Add a comment to the primary ticket about the merge
                var mergeCommentId = Guid.NewGuid();
                var mergeComment = $"Merged {mergeTicketIds.Count} ticket(s) into this ticket:\n" +
                                 $"{string.Join("\n", mergeTicketTitles.Select((title, i) => $"• {title}"))}\n\n" +
                                 $"Merge Reason: {request.Reason}";
                
                var addMergeCommentSql = @"
                    INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                    VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
                
                using var commentCommand = new SqlCommand(addMergeCommentSql, connection, transaction);
                commentCommand.Parameters.AddWithValue("@Id", mergeCommentId);
                commentCommand.Parameters.AddWithValue("@TicketId", primaryTicketId);
                commentCommand.Parameters.AddWithValue("@Body", mergeComment);
                commentCommand.Parameters.AddWithValue("@AuthorUserId", "0016f2fc-c4da-42d7-a635-236b4b95c6f1"); // System user
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
                SELECT Id, MergedTicketIds, MergeReason, MergedAt
                FROM MergedTickets
                WHERE PrimaryTicketId = @TicketId
                ORDER BY MergedAt DESC";
                
            using var primaryCommand = new SqlCommand(primaryCheckSql, connection);
            primaryCommand.Parameters.AddWithValue("@TicketId", ticketId);
            
            var mergedIntoThis = new List<object>();
            using var primaryReader = await primaryCommand.ExecuteReaderAsync();
            
            while (await primaryReader.ReadAsync())
            {
                var mergedTicketIds = primaryReader["MergedTicketIds"].ToString()?.Split(',') ?? Array.Empty<string>();
                
                mergedIntoThis.Add(new
                {
                    mergeId = primaryReader["Id"],
                    mergedTicketIds = mergedTicketIds,
                    mergeReason = primaryReader["MergeReason"],
                    mergedAt = primaryReader["MergedAt"]
                });
            }
            primaryReader.Close();

            // Check if this ticket was merged into another ticket
            var mergedIntoCheckSql = @"
                SELECT mt.Id, mt.PrimaryTicketId, mt.MergeReason, mt.MergedAt,
                       t.PublicId as PrimaryTicketPublicId, t.Title as PrimaryTicketTitle
                FROM MergedTickets mt
                INNER JOIN Tickets t ON mt.PrimaryTicketId = t.Id
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
                    mergedAt = mergedReader["MergedAt"]
                };
            }
            
            return Ok(new
            {
                ticketId = ticketId,
                hasMergedTickets = mergedIntoThis.Any(),
                mergedTickets = mergedIntoThis,
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
    public async Task<ActionResult> ReplyToEmail(Guid ticketId, [FromBody] ReplyEmailRequest request)
    {
        try
        {
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
            
            var publicId = ticketReader["PublicId"] != DBNull.Value ? (int)ticketReader["PublicId"] : 0;
            var title = ticketReader["Title"]?.ToString() ?? "";
            var createdByEmail = ticketReader["CreatedByEmail"]?.ToString();
            var createdByName = ticketReader["CreatedByName"]?.ToString() ?? "User";
            
            ticketReader.Close();
            
            if (string.IsNullOrEmpty(createdByEmail))
            {
                return BadRequest(new { message = "Cannot reply - ticket creator email not found" });
            }

            // Create email subject with Public Ticket ID
            var subject = $"Re: [Ticket #{publicId}] {title}";
            
            // Create reply email body
            var emailBody = $@"Dear {createdByName},

{request.ReplyMessage}

---
This is a reply to your support ticket #{publicId}: {title}

Best regards,
Support Team

Please do not remove the ticket number from the subject line to ensure proper tracking.";

            // Send the email
            await SendEmail(createdByEmail, subject, emailBody);
            
            // Add the reply as a comment to the ticket
            var commentId = Guid.NewGuid();
            var addCommentSql = @"
                INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
            
            using var commentCommand = new SqlCommand(addCommentSql, connection);
            commentCommand.Parameters.AddWithValue("@Id", commentId);
            commentCommand.Parameters.AddWithValue("@TicketId", ticketId);
            commentCommand.Parameters.AddWithValue("@Body", $"[EMAIL REPLY SENT]\n\n{request.ReplyMessage}");
            commentCommand.Parameters.AddWithValue("@AuthorUserId", request.SentByUserId ?? "0016f2fc-c4da-42d7-a635-236b4b95c6f1");
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
    public async Task<ActionResult> ForwardEmail(Guid ticketId, [FromBody] ForwardEmailRequest request)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Get ticket information including public ID and all comments
            var ticketSql = @"
                SELECT PublicId, Title, Description, CreatedAt, 
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
            
            var publicId = ticketReader["PublicId"] != DBNull.Value ? (int)ticketReader["PublicId"] : 0;
            var title = ticketReader["Title"]?.ToString() ?? "";
            var description = ticketReader["Description"]?.ToString() ?? "";
            var createdAt = ticketReader["CreatedAt"];
            var createdByName = ticketReader["CreatedByName"]?.ToString() ?? "User";
            
            ticketReader.Close();

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
            var subject = $"Fwd: [Ticket #{publicId}] {title}";
            
            // Create forward email body
            var emailBody = $@"Dear {request.RecipientName ?? "Colleague"},

{request.ForwardMessage}

------- Forwarded Ticket Information -------

Ticket #{publicId}: {title}
Created: {createdAt:yyyy-MM-dd HH:mm:ss}
Created by: {createdByName}

Original Description:
{description}

Comments:
{commentsText}

---
Please include the ticket number [Ticket #{publicId}] in any replies to maintain proper tracking.

Best regards,
Support Team";

            // Send the forward email
            await SendEmail(request.RecipientEmail, subject, emailBody);
            
            // Add the forward action as a comment to the ticket
            var commentId = Guid.NewGuid();
            var addCommentSql = @"
                INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
            
            using var commentCommand = new SqlCommand(addCommentSql, connection);
            commentCommand.Parameters.AddWithValue("@Id", commentId);
            commentCommand.Parameters.AddWithValue("@TicketId", ticketId);
            commentCommand.Parameters.AddWithValue("@Body", $"[EMAIL FORWARDED TO: {request.RecipientEmail}]\n\nForward message:\n{request.ForwardMessage}");
            commentCommand.Parameters.AddWithValue("@AuthorUserId", request.SentByUserId ?? "0016f2fc-c4da-42d7-a635-236b4b95c6f1");
            commentCommand.Parameters.AddWithValue("@IsInternal", true); // Forward actions are internal
            commentCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
            
            await commentCommand.ExecuteNonQueryAsync();
            
            // Update ticket's UpdatedAt timestamp
            var updateTicketSql = "UPDATE Tickets SET UpdatedAt = @UpdatedAt WHERE Id = @TicketId";
            using var updateCommand = new SqlCommand(updateTicketSql, connection);
            updateCommand.Parameters.AddWithValue("@TicketId", ticketId);
            updateCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
            
            await updateCommand.ExecuteNonQueryAsync();

            return Ok(new { 
                message = "Email forwarded successfully",
                sentTo = request.RecipientEmail,
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
                        
                        var addCommentSql = @"
                            INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
                            VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
                        
                        using var commentCommand = new SqlCommand(addCommentSql, connection);
                        commentCommand.Parameters.AddWithValue("@Id", commentId);
                        commentCommand.Parameters.AddWithValue("@TicketId", ticketId);
                        commentCommand.Parameters.AddWithValue("@Body", commentBody);
                        commentCommand.Parameters.AddWithValue("@AuthorUserId", "0016f2fc-c4da-42d7-a635-236b4b95c6f1"); // System user
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
            
            // Create ticket
            var createTicketSql = @"
                INSERT INTO Tickets (Id, PublicId, Title, Description, Category, Priority, Status, Source, 
                                   CreatedByUserId, CreatedAt, UpdatedAt, IsOverdue)
                VALUES (@Id, @PublicId, @Title, @Description, @Category, @Priority, @Status, @Source,
                       @CreatedByUserId, @CreatedAt, @UpdatedAt, @IsOverdue)";
            
            using var createCommand = new SqlCommand(createTicketSql, connection);
            createCommand.Parameters.AddWithValue("@Id", newTicketId);
            createCommand.Parameters.AddWithValue("@PublicId", newPublicId);
            createCommand.Parameters.AddWithValue("@Title", request.Subject);
            createCommand.Parameters.AddWithValue("@Description", $"From: {request.FromEmail}\n\n{request.Body}");
            createCommand.Parameters.AddWithValue("@Category", 1); // Default category
            createCommand.Parameters.AddWithValue("@Priority", 2); // Normal priority
            createCommand.Parameters.AddWithValue("@Status", 1); // Open status
            createCommand.Parameters.AddWithValue("@Source", 2); // Email source
            createCommand.Parameters.AddWithValue("@CreatedByUserId", "0016f2fc-c4da-42d7-a635-236b4b95c6f1"); // System user
            createCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
            createCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
            createCommand.Parameters.AddWithValue("@IsOverdue", false);
            
            await createCommand.ExecuteNonQueryAsync();
            
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
                SELECT t.Title, t.Description, u.Email as UserEmail, u.FirstName + ' ' + u.LastName as UserName
                FROM Tickets t
                LEFT JOIN AspNetUsers u ON t.CreatedByUserId = u.Id
                WHERE t.Id = @TicketId";
                
            using var command = new SqlCommand(ticketSql, connection);
            command.Parameters.AddWithValue("@TicketId", ticketId);
            
            using var reader = await command.ExecuteReaderAsync();
            if (reader.Read())
            {
                var title = reader["Title"]?.ToString() ?? "Unknown Ticket";
                var userEmail = reader["UserEmail"]?.ToString();
                var userName = reader["UserName"]?.ToString() ?? "User";
                
                if (!string.IsNullOrEmpty(userEmail))
                {
                    await SendEmail(
                        userEmail, 
                        $"New Comment on Ticket: {title}",
                        $"Hello {userName},\n\nA new comment has been added to your ticket:\n\n{commentContent}\n\nTicket: {title}\n\nBest regards,\nSupport Team"
                    );
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send comment notification email for ticket {TicketId}", ticketId);
        }
    }

    private async Task SendEmail(string toEmail, string subject, string body)
    {
        try
        {
            _logger.LogInformation("Sending email via Microsoft Graph to: {Email}, Subject: {Subject}", toEmail, subject);
            
            // Use Microsoft Graph API for sending emails (more reliable than SMTP)
            await _emailService.SendEmailAsync(toEmail, subject, body, isHtml: false);
            
            _logger.LogInformation("Email sent successfully via Microsoft Graph to: {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via Microsoft Graph to: {Email}", toEmail);
            throw;
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