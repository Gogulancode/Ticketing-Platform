using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.Entities;

public class UserPushToken
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string PushToken { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string DeviceType { get; set; } = "android"; // android, ios, web
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
