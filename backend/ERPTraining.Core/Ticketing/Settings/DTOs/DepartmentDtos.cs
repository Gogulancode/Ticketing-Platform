namespace ERPTraining.Core.Ticketing.Settings.DTOs;

public record TicketDepartmentDto(
    int Id,
    string Name,
    string? Description,
    bool IsActive,
    int DisplayOrder
);

public record CreateTicketDepartmentRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
}

public record UpdateTicketDepartmentRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
