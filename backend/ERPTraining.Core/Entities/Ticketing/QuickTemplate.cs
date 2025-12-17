using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing;

public class QuickTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string TitleTemplate { get; set; } = string.Empty;
    public string DescriptionTemplate { get; set; } = string.Empty;
    public string IconName { get; set; } = "FileText"; // Lucide icon name
    public string Category { get; set; } = "general-inquiry"; // Category slug
    public int Priority { get; set; } = 2; // Maps to TicketPriority enum (0=Low, 1=Medium, 2=High, 3=Critical)
    public int? CategoryId { get; set; } // Optional: Link to TicketCategory
    public int? SubcategoryId { get; set; } // Optional: Link to SubCategory
    public int? DepartmentId { get; set; } // Optional: Link to Department
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties - use ForeignKey attribute to map to CategoryId column
    [ForeignKey("CategoryId")]
    public virtual ERPTraining.Core.Entities.Tickets.TicketCategory? TicketCategory { get; set; }
    
    [ForeignKey("SubcategoryId")]
    public virtual ERPTraining.Core.Entities.Tickets.TicketSubCategory? SubCategory { get; set; }
}
