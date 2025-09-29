using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.DTOs.Ticketing;

public class GraphEmailConfigDto
{
    public int Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public bool ProcessIncomingEmails { get; set; }
    public bool CreateTicketsFromEmails { get; set; }
    public bool SendNotifications { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateGraphEmailConfigDto
{
    [Required]
    [StringLength(100)]
    public string TenantId { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string ClientId { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string ClientSecret { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public int? CategoryId { get; set; }

    public bool ProcessIncomingEmails { get; set; } = true;
    
    public bool CreateTicketsFromEmails { get; set; } = true;
    
    public bool SendNotifications { get; set; } = true;
}

public class UpdateGraphEmailConfigDto
{
    [Required]
    [StringLength(100)]
    public string TenantId { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string ClientId { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string ClientSecret { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public int? CategoryId { get; set; }

    public bool ProcessIncomingEmails { get; set; }
    
    public bool CreateTicketsFromEmails { get; set; }
    
    public bool SendNotifications { get; set; }
}