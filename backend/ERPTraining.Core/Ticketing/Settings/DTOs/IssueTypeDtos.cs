namespace ERPTraining.Core.Ticketing.Settings.DTOs;

public record IssueTypeDto(int Id, string Name, string? Description, bool IsActive, int DisplayOrder, string? Color);

public record CreateIssueTypeRequest(string Name, string? Description, int? DisplayOrder, string? Color);

public record UpdateIssueTypeRequest(string Name, string? Description, int? DisplayOrder, bool IsActive, string? Color);