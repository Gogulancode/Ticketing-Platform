using ERPTraining.Core.Entities.Tickets;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing;

public class TicketGroup
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public int? SubCategoryId { get; set; } // If null, group covers ALL subcategories in the category

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(CategoryId))]
    public virtual ERPTraining.Core.Entities.Tickets.TicketCategory? Category { get; set; }

    [ForeignKey(nameof(SubCategoryId))]
    public virtual ERPTraining.Core.Entities.Tickets.TicketSubCategory? SubCategory { get; set; }

    public virtual ICollection<TicketGroupAgent> GroupAgents { get; set; } = new List<TicketGroupAgent>();
}

public class TicketGroupAgent
{
    public int Id { get; set; }

    [Required]
    public int TicketGroupId { get; set; }

    [Required]
    public int AgentId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(TicketGroupId))]
    public virtual TicketGroup TicketGroup { get; set; } = null!;

    [ForeignKey(nameof(AgentId))]
    public virtual Agent Agent { get; set; } = null!;
}
