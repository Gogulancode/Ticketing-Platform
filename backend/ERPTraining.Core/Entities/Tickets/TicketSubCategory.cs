namespace ERPTraining.Core.Entities.Tickets;

public class TicketSubCategory
{
    public int Id { get; set; }
    public int CategoryId { get; set; }  // This is TicketCategoryId in EF conventions but maps to CategoryId in DB
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public virtual TicketCategory Category { get; set; } = null!;
}