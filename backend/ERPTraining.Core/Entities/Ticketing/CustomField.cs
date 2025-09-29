using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing
{
    [Table("CustomFields")]
    public class CustomField
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Label { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // text, number, date, select, textarea, checkbox, email, phone

        public int? CategoryId { get; set; }
        
        public int? SubCategoryId { get; set; }

        [StringLength(1000)]
        public string? Options { get; set; } // JSON array for select type fields

        [StringLength(500)]
        public string? Placeholder { get; set; }

        public bool IsRequired { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public int DisplayOrder { get; set; } = 0;

        [StringLength(1000)]
        public string? ValidationRules { get; set; } // JSON object with min, max, pattern

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("CategoryId")]
        public virtual ERPTraining.Core.Entities.Tickets.TicketCategory? Category { get; set; }

        [ForeignKey("SubCategoryId")]
        public virtual ERPTraining.Core.Entities.Tickets.TicketSubCategory? SubCategory { get; set; }
    }
}