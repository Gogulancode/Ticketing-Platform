namespace ERPTraining.Core.Ticketing.Settings.DTOs;

public record TicketCategoryDto(int Id, string Name, string? Description, bool IsActive, int DisplayOrder, string? Color, string? IconName);

public record CreateTicketCategoryRequest(string Name, string? Description, int? DisplayOrder, string? Color, string? IconName);

public record UpdateTicketCategoryRequest(string Name, string? Description, int? DisplayOrder, bool IsActive, string? Color, string? IconName);
