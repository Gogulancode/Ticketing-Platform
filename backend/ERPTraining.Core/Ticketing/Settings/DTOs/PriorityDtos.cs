namespace ERPTraining.Core.Ticketing.Settings.DTOs;

public record TicketPriorityDto(
    int Id,
    string Name,
    string? Description,
    int Level,
    string? Color,
    bool IsActive,
    int DisplayOrder
);

public record CreateTicketPriorityRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Level { get; set; }
    public string? Color { get; set; }
    public int? DisplayOrder { get; set; }
}

public record UpdateTicketPriorityRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? Level { get; set; }
    public string? Color { get; set; }
    public int? DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
