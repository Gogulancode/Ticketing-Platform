namespace ERPTraining.Core.Ticketing.Settings.DTOs;

public record TicketGroupDto(
    int Id,
    string Name,
    string? Description,
    bool IsActive,
    int CategoryId,
    string CategoryName,
    int? SubCategoryId,
    string? SubCategoryName,
    int AgentCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public class CreateTicketGroupRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required int CategoryId { get; set; }
    public int? SubCategoryId { get; set; }
    public bool? IsActive { get; set; }
}

public class UpdateTicketGroupRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? CategoryId { get; set; }
    public int? SubCategoryId { get; set; }
    public bool IsActive { get; set; } = true;
}
