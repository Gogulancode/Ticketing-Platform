using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.Entities
{
    public class RoleSyncLog
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public DateTime SyncTime { get; set; }
        
        [Required]
        public bool Success { get; set; }
        
        [StringLength(1000)]
        public string Message { get; set; } = string.Empty;
        
        public int SyncedCount { get; set; }
        public int NewCount { get; set; }
        public int UpdatedCount { get; set; }
        public double ResponseTimeMs { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
