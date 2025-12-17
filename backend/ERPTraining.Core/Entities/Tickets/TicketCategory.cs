using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.Core.Entities.Tickets;

public class TicketCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public string? Color { get; set; }
    public string? IconName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }
    
    // Navigation properties
    public virtual ICollection<TicketSubCategory> SubCategories { get; set; } = new List<TicketSubCategory>();
    public virtual ICollection<CategoryAdmin> CategoryAdmins { get; set; } = new List<CategoryAdmin>();
}