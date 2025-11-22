using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;
using System.Data.Common;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Entities; // Add this for User
using ERPTraining.Core.Services;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Data;

namespace ERPTraining.Infrastructure.Services;

public class TicketService : ITicketService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TicketService> _logger;
    private readonly IEmailService _emailService;

    public TicketService(ApplicationDbContext context, ILogger<TicketService> logger, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task<Ticket> CreateTicketAsync(Ticket ticket)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var nextPublicId = await _context.Database
                .SqlQueryRaw<int>("SELECT ISNULL(MAX(PublicId), 0) + 1 AS Value FROM Tickets WITH (UPDLOCK, HOLDLOCK)")
                .SingleAsync();

            ticket.Id = Guid.NewGuid();
            ticket.PublicId = nextPublicId;
            ticket.CreatedAt = DateTime.UtcNow;
            ticket.UpdatedAt = DateTime.UtcNow;
            ticket.Status = 1; // New status ID

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return ticket;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<Ticket?> GetTicketByIdAsync(Guid id)
    {
        // Include navigation properties for controllers to shape lightweight DTOs without extra queries
        return await _context.Tickets
            .AsNoTracking()
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<Ticket>> GetAllTicketsAsync()
    {
        return await _context.Tickets.AsNoTracking()
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            
            
            
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<Ticket> UpdateTicketAsync(Ticket ticket)
    {
        ticket.UpdatedAt = DateTime.UtcNow;
        
        _context.Tickets.Update(ticket);
        await _context.SaveChangesAsync();
        
        // Return the ticket directly to avoid the problematic query for now
        return ticket;
    }

    public async Task<bool> DeleteTicketAsync(Guid id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return false;

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<Ticket>> GetTicketsByUserAsync(string userId)
    {
        return await _context.Tickets
            .AsNoTracking()
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Where(t => t.CreatedByUserId == userId || t.AssignedToUserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Ticket>> GetTicketsByStatusAsync(TicketStatus status)
    {
        return await _context.Tickets.AsNoTracking()
            
            
            
            .Where(t => t.Status == (int)status)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Ticket>> GetTicketsByPriorityAsync(TicketPriority priority)
    {
        return await _context.Tickets.AsNoTracking()
            
            
            
            .Where(t => t.Priority == priority)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Ticket>> GetTicketsByCategoryAsync(TicketCategory category)
    {
        return await _context.Tickets.AsNoTracking()
            
            
            
            .Where(t => t.Category == category)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Ticket>> GetFilteredTicketsAsync(TicketStatus? status = null, TicketPriority? priority = null, TicketCategory? category = null)
    {
        // Include lightweight user navigation data so controllers avoid N+1 lookups
        var query = _context.Tickets
            .AsNoTracking()
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Where(t => t.Status != 99) // Exclude deleted tickets (status 99)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(t => t.Status == (int)status.Value);

        if (priority.HasValue)
            query = query.Where(t => t.Priority == priority.Value);

        if (category.HasValue)
        {
            // Support both old enum-based filtering and new CategoryId-based filtering
            var categoryId = (int)category.Value;
            query = query.Where(t => t.Category == category.Value || t.CategoryId == categoryId);
        }

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<Ticket> UpdateTicketStatusAsync(Guid ticketId, TicketStatus status, string userId)
    {
        var ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
            throw new ArgumentException("Ticket not found", nameof(ticketId));

        var oldStatus = ticket.Status;
        ticket.Status = (int)status;
        ticket.UpdatedAt = DateTime.UtcNow;

        if ((int)status == 4 && ticket.ResolvedAt == null) // 4 = Resolved status ID
        {
            ticket.ResolvedAt = DateTime.UtcNow;
        }

        // Add audit log
        var auditLog = new AuditLog
        {
            TicketId = ticketId,
            Field = "Status",
            OldValue = oldStatus.ToString(),
            NewValue = status.ToString(),
            ChangedByUserId = userId,
            ChangedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();
        
        // Return the ticket directly to avoid the problematic query for now
        return ticket;
    }

    public async Task<Ticket> AssignTicketAsync(Guid ticketId, string assignedToUserId, string assignedByUserId)
    {
        var ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
            throw new ArgumentException("Ticket not found", nameof(ticketId));

        var oldAssignee = ticket.AssignedToUserId;
        ticket.AssignedToUserId = assignedToUserId;
        ticket.UpdatedAt = DateTime.UtcNow;

        // Add audit log
        var auditLog = new AuditLog
        {
            TicketId = ticketId,
            Field = "AssignedTo",
            OldValue = oldAssignee,
            NewValue = assignedToUserId,
            ChangedByUserId = assignedByUserId,
            ChangedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();
        
        // Return the ticket directly to avoid the problematic query for now
        return ticket;
    }

    public async Task<Ticket> AssignTicketAsync(Guid ticketId, string assignedToUserId)
    {
        var ticket = await _context.Tickets
            
            
            .FirstOrDefaultAsync(t => t.Id == ticketId);
            
        if (ticket == null)
            throw new ArgumentException("Ticket not found", nameof(ticketId));

        var oldAssignee = ticket.AssignedToUserId;
        ticket.AssignedToUserId = assignedToUserId;
        ticket.UpdatedAt = DateTime.UtcNow;

        // Add audit log with system as the changer - TEMPORARILY DISABLED due to column mapping issue
        // var auditLog = new AuditLog
        // {
        //     TicketId = ticketId,
        //     Field = "AssignedTo",
        //     OldValue = oldAssignee,
        //     NewValue = assignedToUserId,
        //     ChangedByUserId = assignedToUserId, // Agent assigned themselves or system assignment
        //     ChangedAt = DateTime.UtcNow
        // };
        // _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();
        
        return ticket;
    }

    public async Task<Ticket> UnassignTicketAsync(Guid ticketId)
    {
        var ticket = await _context.Tickets
            
            
            .FirstOrDefaultAsync(t => t.Id == ticketId);
            
        if (ticket == null)
            throw new ArgumentException("Ticket not found", nameof(ticketId));

        var oldAssignee = ticket.AssignedToUserId;
        ticket.AssignedToUserId = null;
        ticket.UpdatedAt = DateTime.UtcNow;

        // Add audit log - TEMPORARILY DISABLED due to column mapping issue
        // var auditLog = new AuditLog
        // {
        //     TicketId = ticketId,
        //     Field = "AssignedTo",
        //     OldValue = oldAssignee,
        //     NewValue = null,
        //     ChangedByUserId = oldAssignee ?? "system", // Previous assignee or system
        //     ChangedAt = DateTime.UtcNow
        // };
        // _context.AuditLogs.Add(auditLog);

        await _context.SaveChangesAsync();
        
        return ticket;
    }

    public async Task<TicketComment> AddCommentAsync(Guid ticketId, string content, string authorUserId, bool isInternal = false)
    {
        // DIRECT SQL APPROACH - bypass Entity Framework complexity
        var commentId = Guid.NewGuid();
        var createdAt = DateTime.UtcNow;
        
        using var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();
        
        using var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
            VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
            
        var parameters = new DbParameter[]
        {
            new SqlParameter("@Id", commentId),
            new SqlParameter("@TicketId", ticketId),
            new SqlParameter("@Body", content),
            new SqlParameter("@AuthorUserId", authorUserId),
            new SqlParameter("@IsInternal", isInternal),
            new SqlParameter("@CreatedAt", createdAt)
        };
        
        command.Parameters.AddRange(parameters);
        await command.ExecuteNonQueryAsync();
        
        // Return the created comment
        return new TicketComment
        {
            Id = commentId,
            TicketId = ticketId,
            Body = content,
            AuthorUserId = authorUserId,
            IsInternal = isInternal,
            CreatedAt = createdAt
        };
    }

    public async Task<bool> AddCommentDirectAsync(Guid ticketId, Guid commentId, string content, string authorUserId, bool isInternal, DateTime createdAt)
    {
        try
        {
            // Direct database insertion to avoid Entity Framework circular reference issues
            var comment = new TicketComment
            {
                Id = commentId,
                TicketId = ticketId,
                Body = content,
                AuthorUserId = authorUserId,
                IsInternal = isInternal,
                CreatedAt = createdAt
            };

            _context.TicketComments.Add(comment);
            
            // Update ticket's UpdatedAt timestamp directly
            var ticket = await _context.Tickets.FindAsync(ticketId);
            if (ticket != null)
            {
                ticket.UpdatedAt = DateTime.UtcNow;
                _context.Tickets.Update(ticket);
            }
            
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error adding comment directly: {ex.Message}");
            return false;
        }
    }

    public async Task<IEnumerable<TicketComment>> GetTicketCommentsAsync(Guid ticketId)
    {
        return await _context.TicketComments.AsNoTracking()
            .AsNoTracking()
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get ticket comments filtered by user role - agents see all, regular users only see public comments
    /// </summary>
    /// <param name="ticketId">Ticket ID</param>
    /// <param name="isAgentOrAdmin">True if the requesting user is an agent or admin who can see internal notes</param>
    /// <returns>Filtered comments based on user role</returns>
    public async Task<IEnumerable<TicketComment>> GetTicketCommentsForUserAsync(Guid ticketId, bool isAgentOrAdmin = false)
    {
        var query = _context.TicketComments
            .AsNoTracking()
            .Where(c => c.TicketId == ticketId);

        // If not an agent/admin, filter out internal comments (notes)
        if (!isAgentOrAdmin)
        {
            query = query.Where(c => !c.IsInternal);
        }

        return await query
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<Attachment> AddAttachmentAsync(Attachment attachment)
    {
        _context.Attachments.Add(attachment);
        await _context.SaveChangesAsync();
        return attachment;
    }

    public async Task<object> GetTicketStatisticsAsync()
    {
        var totalCount = await _context.Tickets.CountAsync();
        var openCount = await _context.Tickets.CountAsync(t => t.Status == 1); // New
        var inProgressCount = await _context.Tickets.CountAsync(t => t.Status == 2); // In Progress
        var resolvedCount = await _context.Tickets.CountAsync(t => t.Status == 4); // Resolved
        var closedCount = await _context.Tickets.CountAsync(t => t.Status == 5); // Closed

        var priorityStats = await _context.Tickets
            .GroupBy(t => t.Priority)
            .Select(g => new { Priority = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Priority, x => x.Count);

        var categoryStats = await _context.Tickets
            .GroupBy(t => t.Category)
            .Select(g => new { Category = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Category, x => x.Count);

        return new
        {
            total = totalCount,
            open = openCount,
            inProgress = inProgressCount,
            resolved = resolvedCount,
            closed = closedCount,
            byPriority = priorityStats,
            byCategory = categoryStats
        };
    }

    public async Task<bool> IsTicketOverdueAsync(Guid ticketId)
    {
        var ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null) return false;

        // Simple SLA logic - can be enhanced with SLA table later
        var overdueThreshold = ticket.Priority switch
        {
            TicketPriority.Critical => TimeSpan.FromHours(4),
            TicketPriority.High => TimeSpan.FromHours(24),
            TicketPriority.Medium => TimeSpan.FromDays(3),
            TicketPriority.Low => TimeSpan.FromDays(7),
            _ => TimeSpan.FromDays(7)
        };

        return DateTime.UtcNow - ticket.CreatedAt > overdueThreshold && 
               ticket.Status != 4 && // Resolved
               ticket.Status != 5; // Closed
    }

    public async Task CalculateOverdueTicketsAsync()
    {
        var openTickets = await _context.Tickets
            .Where(t => t.Status != 4 && t.Status != 5) // Not Resolved and Not Closed
            .ToListAsync();

        foreach (var ticket in openTickets)
        {
            ticket.IsOverdue = await IsTicketOverdueAsync(ticket.Id);
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Send email notification to the ticket creator when a public comment is added
    /// Internal notes (IsInternal = true) do not trigger notifications
    /// </summary>
    private async Task SendCommentNotificationAsync(Ticket ticket, TicketComment comment, string authorUserId)
    {
        try
        {
            // Don't send notification if the comment author is the same as ticket creator
            if (authorUserId == ticket.CreatedByUserId)
                return;

            // Get the comment author's name
            var author = await _context.Users.FindAsync(authorUserId);
            var authorName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : "Agent";

            // Get the ticket creator's email
            var ticketCreator = await _context.Users.FindAsync(ticket.CreatedByUserId);
            if (ticketCreator == null || string.IsNullOrEmpty(ticketCreator.Email))
                return;

            // Prepare email content
            var subject = $"New Comment on Ticket #{ticket.Id.ToString()[..8]} - {ticket.Title}";
            var body = $@"
                <h2>New Comment on Your Ticket</h2>
                <p><strong>Ticket:</strong> #{ticket.Id.ToString()[..8]} - {ticket.Title}</p>
                <p><strong>Comment from:</strong> {authorName}</p>
                <p><strong>Date:</strong> {comment.CreatedAt:yyyy-MM-dd HH:mm}</p>
                
                <div style='border-left: 4px solid #007bff; padding-left: 16px; margin: 16px 0;'>
                    <p>{comment.Body.Replace("\n", "<br>")}</p>
                </div>
                
                <p>You can view and respond to this ticket by logging into the training portal.</p>
                <p><em>Note: This is an automated notification. Please do not reply to this email.</em></p>
            ";

            // TODO: Implement actual email sending using IEmailService
            // For now, we'll log the notification attempt
            _logger.LogInformation("Comment notification would be sent to {Email} for ticket {TicketId}", 
                ticketCreator.Email, ticket.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send comment notification for ticket {TicketId}", ticket.Id);
        }
    }

    /// <summary>
    /// Check if a user is an agent or admin who can see internal notes
    /// </summary>
    public async Task<bool> IsUserAgentOrAdminAsync(string userId)
    {
        try
        {
            // Check if user is an agent (exists in Agents table)
            var isAgent = await _context.Agents.AnyAsync(a => a.UserId == userId && a.IsActive);
            if (isAgent) return true;
            
            // TODO: Add admin role checking based on your authentication system
            // For now, we'll only check agent status
            
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user agent status for user {UserId}", userId);
            return false;
        }
    }

    /// <summary>
    /// Get ticket attachments safely without circular references
    /// </summary>
    public async Task<IEnumerable<Attachment>> GetTicketAttachmentsAsync(Guid ticketId)
    {
        return await _context.Attachments
            .AsNoTracking()
            .Where(a => a.TicketId == ticketId)
            .ToListAsync();
    }

    /// <summary>
    /// Get user by ID safely
    /// </summary>
    public async Task<User?> GetUserAsync(string userId)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    /// <summary>
    /// Add a collaborator to a ticket
    /// </summary>
    public async Task<TicketCollaborator> AddCollaboratorAsync(Guid ticketId, string userId, string addedByUserId, string role = "Collaborator")
    {
        // Check if collaborator already exists
        var existing = await _context.TicketCollaborators
            .FirstOrDefaultAsync(tc => tc.TicketId == ticketId && tc.UserId == userId);
        
        if (existing != null)
        {
            throw new InvalidOperationException("User is already a collaborator on this ticket");
        }

        var collaborator = new TicketCollaborator
        {
            TicketId = ticketId,
            UserId = userId,
            Role = role,
            AddedByUserId = addedByUserId,
            AddedAt = DateTime.UtcNow
        };

        _context.TicketCollaborators.Add(collaborator);
        await _context.SaveChangesAsync();

        // Send notification email to the new collaborator
        _ = Task.Run(async () =>
        {
            try
            {
                var ticket = await _context.Tickets.FindAsync(ticketId);
                var collaboratorUser = await _context.Users.FindAsync(userId);
                var addedByUser = await _context.Users.FindAsync(addedByUserId);

                if (ticket != null && collaboratorUser != null && addedByUser != null)
                {
                    await _emailService.SendCollaboratorAddedNotificationAsync(ticket, collaboratorUser, addedByUser);
                    _logger.LogInformation("Sent collaborator notification to {Email} for ticket {TicketId}", collaboratorUser.Email, ticketId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send collaborator notification for ticket {TicketId}", ticketId);
            }
        });

        return collaborator;
    }

    /// <summary>
    /// Remove a collaborator from a ticket
    /// </summary>
    public async Task<bool> RemoveCollaboratorAsync(Guid ticketId, string userId)
    {
        var collaborator = await _context.TicketCollaborators
            .FirstOrDefaultAsync(tc => tc.TicketId == ticketId && tc.UserId == userId);
        
        if (collaborator == null)
        {
            return false;
        }

        _context.TicketCollaborators.Remove(collaborator);
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// Get all collaborators for a ticket with user details
    /// </summary>
    public async Task<IEnumerable<TicketCollaborator>> GetCollaboratorsAsync(Guid ticketId)
    {
        return await _context.TicketCollaborators
            .AsNoTracking()
            .Include(tc => tc.User)
            .Include(tc => tc.AddedByUser)
            .Where(tc => tc.TicketId == ticketId)
            .ToListAsync();
    }

    /// <summary>
    /// Get tickets where user is creator, assigned, or is a collaborator
    /// </summary>
    public async Task<IEnumerable<Ticket>> GetUserTicketsAsync(string userId)
    {
        var ticketIds = await _context.TicketCollaborators
            .Where(tc => tc.UserId == userId)
            .Select(tc => tc.TicketId)
            .ToListAsync();

        return await _context.Tickets
            .AsNoTracking()
            .Where(t => t.CreatedByUserId == userId || t.AssignedToUserId == userId || ticketIds.Contains(t.Id))
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }
}
