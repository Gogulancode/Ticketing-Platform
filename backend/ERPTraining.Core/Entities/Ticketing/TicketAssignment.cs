using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing;

public class TicketAssignment
{
    public int Id { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public int? SubCategoryId { get; set; } // If null, agent handles ALL subcategories in the category

    [Required]
    public int AgentId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(CategoryId))]
    public virtual TicketCategory? Category { get; set; }

    [ForeignKey(nameof(SubCategoryId))]
    public virtual ERPTraining.Core.Entities.Tickets.TicketSubCategory? SubCategory { get; set; }

    [ForeignKey(nameof(AgentId))]
    public virtual Agent Agent { get; set; } = null!;
}
