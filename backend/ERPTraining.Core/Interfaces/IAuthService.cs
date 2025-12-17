using ERPTraining.Core.DTOs;

namespace ERPTraining.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto);
    Task<UserDto?> GetCurrentUserAsync(string userId);
    Task<UserDto?> UpdateProfileAsync(string userId, UserDto updateDto);
    Task<bool> AssignRoleAsync(string userId, string role);
    Task<List<string>> GetUserRolesAsync(string userId);
    Task<AuthResponseDto?> RefreshTokenAsync(string userId);
    Task<PasswordChangeResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
}

public class PasswordChangeResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorType { get; set; }

    public static PasswordChangeResult Succeeded() => new() { Success = true };
    public static PasswordChangeResult Failed(string message, string errorType = "General") => new() 
    { 
        Success = false, 
        ErrorMessage = message, 
        ErrorType = errorType 
    };
}