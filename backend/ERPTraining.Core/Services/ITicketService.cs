using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Entities; // Add for User

namespace ERPTraining.Core.Services;

public interface ITicketService
{
    // Core CRUD operations
    Task<Ticket> CreateTicketAsync(Ticket ticket);
    Task<Ticket?> GetTicketByIdAsync(Guid id);
    Task<IEnumerable<Ticket>> GetAllTicketsAsync();
    Task<Ticket> UpdateTicketAsync(Ticket ticket);
    Task<bool> DeleteTicketAsync(Guid id);

    // Filtered queries
    Task<IEnumerable<Ticket>> GetTicketsByUserAsync(string userId);
    Task<IEnumerable<Ticket>> GetTicketsByStatusAsync(TicketStatus status);
    Task<IEnumerable<Ticket>> GetTicketsByPriorityAsync(TicketPriority priority);
    Task<IEnumerable<Ticket>> GetTicketsByCategoryAsync(TicketCategory category);
    Task<IEnumerable<Ticket>> GetFilteredTicketsAsync(TicketStatus? status = null, TicketPriority? priority = null, TicketCategory? category = null);

    // Status management
    Task<Ticket> UpdateTicketStatusAsync(Guid ticketId, TicketStatus status, string userId);
    Task<Ticket> AssignTicketAsync(Guid ticketId, string assignedToUserId, string assignedByUserId);
    Task<Ticket> AssignTicketAsync(Guid ticketId, string assignedToUserId);
    Task<Ticket> UnassignTicketAsync(Guid ticketId);

    // Comments
    Task<TicketComment> AddCommentAsync(Guid ticketId, string content, string authorUserId, bool isInternal = false);
    Task<bool> AddCommentDirectAsync(Guid ticketId, Guid commentId, string content, string authorUserId, bool isInternal, DateTime createdAt);
    Task<IEnumerable<TicketComment>> GetTicketCommentsAsync(Guid ticketId);
    Task<IEnumerable<TicketComment>> GetTicketCommentsForUserAsync(Guid ticketId, bool isAgentOrAdmin = false);

    // Attachments
    Task<Attachment> AddAttachmentAsync(Attachment attachment);
    Task<IEnumerable<Attachment>> GetTicketAttachmentsAsync(Guid ticketId);

    // Statistics
    Task<object> GetTicketStatisticsAsync();
    
    // SLA management
    Task<bool> IsTicketOverdueAsync(Guid ticketId);
    Task CalculateOverdueTicketsAsync();
    
    // User role checking
    Task<bool> IsUserAgentOrAdminAsync(string userId);
    
    // Helper methods for safe data access
    Task<User?> GetUserAsync(string userId);
    
    // Collaborator management
    Task<TicketCollaborator> AddCollaboratorAsync(Guid ticketId, string userId, string addedByUserId, string role = "Collaborator");
    Task<bool> RemoveCollaboratorAsync(Guid ticketId, string userId);
    Task<IEnumerable<TicketCollaborator>> GetCollaboratorsAsync(Guid ticketId);
    Task<IEnumerable<Ticket>> GetUserTicketsAsync(string userId);
}