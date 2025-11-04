namespace ERPTraining.Core.Ticketing.Settings.DTOs;

public record TicketSubCategoryDto(int Id, int CategoryId, string Name, string? Description, bool IsActive, int DisplayOrder);

public record CreateTicketSubCategoryRequest(int CategoryId, string Name, string? Description, int? DisplayOrder);

public record UpdateTicketSubCategoryRequest(string Name, string? Description, int? DisplayOrder, bool IsActive);
