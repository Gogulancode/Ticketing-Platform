using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.DTOs.Ticketing;

public class TicketTagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SubCategoryId { get; set; }
    public string SubCategoryName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTicketTagDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int SubCategoryId { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateTicketTagDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int SubCategoryId { get; set; }

    public bool IsActive { get; set; }
}