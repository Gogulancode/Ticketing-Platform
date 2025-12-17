using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPTraining.Core.Entities.Tickets;

namespace ERPTraining.Core.Entities.Ticketing;

/// <summary>
/// Junction table to assign users as admins for specific ticket categories.
/// Category admins can:
/// - View dashboard filtered to their categories
/// - Manage agents assigned to their categories
/// - See tickets only in their categories
/// - Manage subcategories under their categories
/// </summary>
public class CategoryAdmin
{
    public int Id { get; set; }

    /// <summary>
    /// The user who is a category admin
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// The category this user administers
    /// </summary>
    [Required]
    public int CategoryId { get; set; }

    /// <summary>
    /// Can view tickets in this category
    /// </summary>
    public bool CanViewTickets { get; set; } = true;

    /// <summary>
    /// Can manage (assign/reassign) agents in this category
    /// </summary>
    public bool CanManageAgents { get; set; } = true;

    /// <summary>
    /// Can view reports/analytics for this category
    /// </summary>
    public bool CanViewReports { get; set; } = true;

    /// <summary>
    /// Can manage subcategories under this category
    /// </summary>
    public bool CanManageSubcategories { get; set; } = true;

    /// <summary>
    /// Can configure category settings (auto-assignment rules, etc.)
    /// </summary>
    public bool CanConfigureSettings { get; set; } = false;

    /// <summary>
    /// Can manage SLA policies for this category
    /// </summary>
    public bool CanManageSLA { get; set; } = true;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public virtual User? User { get; set; }

    [ForeignKey(nameof(CategoryId))]
    public virtual ERPTraining.Core.Entities.Tickets.TicketCategory? Category { get; set; }
}
