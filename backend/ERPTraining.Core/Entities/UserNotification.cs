using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.Entities;

public class UserNotification
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string Type { get; set; } = "Info"; // Info, Success, Warning, Error
    
    public bool IsRead { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(500)]
    public string? ActionUrl { get; set; }
}
