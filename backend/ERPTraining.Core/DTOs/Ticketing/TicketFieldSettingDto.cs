using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.DTOs.Ticketing;

public class TicketFieldSettingDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public bool IsMandatory { get; set; }
    public bool IsActive { get; set; }
    public string? Options { get; set; }
    public string? PlaceholderText { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTicketFieldSettingDto
{
    [Required]
    public int CategoryId { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FieldName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string FieldType { get; set; } = string.Empty; // "Dropdown", "Text", "Date", "Number"

    public bool IsMandatory { get; set; } = false;

    public bool IsActive { get; set; } = true;

    [StringLength(1000)]
    public string? Options { get; set; }

    [StringLength(200)]
    public string? PlaceholderText { get; set; }

    public int DisplayOrder { get; set; } = 0;
}

public class UpdateTicketFieldSettingDto
{
    [Required]
    public int CategoryId { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FieldName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string FieldType { get; set; } = string.Empty;

    public bool IsMandatory { get; set; }

    public bool IsActive { get; set; }

    [StringLength(1000)]
    public string? Options { get; set; }

    [StringLength(200)]
    public string? PlaceholderText { get; set; }

    public int DisplayOrder { get; set; }
}