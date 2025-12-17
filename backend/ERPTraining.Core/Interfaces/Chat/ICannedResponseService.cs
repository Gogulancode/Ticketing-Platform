namespace ERPTraining.Core.Interfaces.Chat;

/// <summary>
/// Service interface for canned responses
/// </summary>
public interface ICannedResponseService
{
    Task<CannedResponseDto> CreateAsync(string userId, CreateCannedResponseDto dto);
    Task<CannedResponseDto> UpdateAsync(int id, string userId, CreateCannedResponseDto dto);
    Task DeleteAsync(int id, string userId);
    Task<CannedResponseDto?> GetByIdAsync(int id, string userId);
    Task<List<CannedResponseDto>> GetUserResponsesAsync(string userId, string? category = null);
    Task<List<CannedResponseDto>> GetSharedResponsesAsync(string? category = null);
    Task<List<CannedResponseDto>> SearchResponsesAsync(string userId, string query);
    Task IncrementUsageAsync(int id);
}

public record CannedResponseDto
{
    public int Id { get; init; }
    public string Title { get; init; } = null!;
    public string? Shortcut { get; init; }
    public string Content { get; init; } = null!;
    public string? Category { get; init; }
    public bool IsPersonal { get; init; }
    public int UsageCount { get; init; }
}

public record CreateCannedResponseDto
{
    public string Title { get; init; } = null!;
    public string? Shortcut { get; init; }
    public string Content { get; init; } = null!;
    public string? Category { get; init; }
    public bool IsPersonal { get; init; } = true;
}
