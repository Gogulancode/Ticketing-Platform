using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing;

/// <summary>
/// Tracks email participants (CC'd and forwarded recipients) for a ticket.
/// This enables replies from these participants to be matched back to the ticket.
/// </summary>
public class TicketParticipant
{
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// The ticket this participant is associated with
    /// </summary>
    public Guid TicketId { get; set; }
    
    /// <summary>
    /// The email address of the participant
    /// </summary>
    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// The name of the participant (if known)
    /// </summary>
    [MaxLength(256)]
    public string? Name { get; set; }
    
    /// <summary>
    /// Type of participant: "CC", "Forward", "BCC", "Collaborator"
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ParticipantType { get; set; } = "CC";
    
    /// <summary>
    /// When this participant was added
    /// </summary>
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// The user who added this participant
    /// </summary>
    [MaxLength(450)]
    public string? AddedByUserId { get; set; }
    
    /// <summary>
    /// Whether the participant is still active (can be removed from CC)
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    [ForeignKey("TicketId")]
    public virtual Ticket? Ticket { get; set; }
}
