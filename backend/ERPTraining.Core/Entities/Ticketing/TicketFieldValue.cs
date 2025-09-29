using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing
{
    [Table("TicketFieldValues")]
    public class TicketFieldValue
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid TicketId { get; set; }

        public int CustomFieldId { get; set; }

        [StringLength(2000)]
        public string? Value { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("TicketId")]
        public virtual Ticket? Ticket { get; set; }

        [ForeignKey("CustomFieldId")]
        public virtual CustomField? CustomField { get; set; }
    }
}