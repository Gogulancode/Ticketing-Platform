using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.Entities;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ERPTraining.Infrastructure.Services;

/// <summary>
/// Local Development Authentication Service - bypasses ERP API for testing
/// Use only in development environment
/// Default password: "Test@123"
/// </summary>
public class LocalDevAuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LocalDevAuthService> _logger;
    private readonly ApplicationDbContext _context;
    private const string DEV_PASSWORD = "Test@123"; // Default test password

    public LocalDevAuthService(
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger<LocalDevAuthService> logger,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
        _context = context;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        try
        {
            string email = !string.IsNullOrEmpty(loginDto.Email) ? loginDto.Email : loginDto.UserName;
            
            _logger.LogInformation("🔓 LOCAL DEV AUTH - Attempting login for {Email}", email);

            // Check if password matches the dev password
            if (loginDto.Password != DEV_PASSWORD)
            {
                _logger.LogWarning("❌ LOCAL DEV AUTH - Invalid password for {Email}", email);
                return null;
            }

            // Find user in local database
            var localUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email || u.UserName == email);
            
            if (localUser == null)
            {
                _logger.LogWarning("❌ LOCAL DEV AUTH - User not found: {Email}", email);
                return null;
            }

            _logger.LogInformation("✅ LOCAL DEV AUTH - Login successful for {Email}", email);

            // Generate JWT token
            var tokenAndUser = await GenerateTokenAndMapUserAsync(localUser);
            var jwtToken = tokenAndUser.token;
            var userDto = tokenAndUser.userDto;

            return new AuthResponseDto
            {
                Token = jwtToken,
                User = userDto,
                Expires = DateTime.UtcNow.AddDays(1)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ LOCAL DEV AUTH - Error during login");
            return null;
        }
    }

    private async Task<(string token, UserDto userDto)> GenerateTokenAndMapUserAsync(User user)
    {
        // Get user roles
        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "User";

        // Generate JWT token
        var token = GenerateJwtToken(user, role);

        // Map to UserDto
        var userDto = new UserDto
        {
            Id = user.Id,
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            FirstName = user.FirstName ?? "",
            LastName = user.LastName ?? "",
            Roles = roles.ToList()
        };

        return (token, userDto);
    }

    private string GenerateJwtToken(User user, string role)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
        var jwtAudience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Email ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        _logger.LogWarning("⚠️ LOCAL DEV AUTH - Registration not supported, use existing users");
        return null;
    }

    public async Task<bool> LogoutAsync(string userId)
    {
        _logger.LogInformation("🔓 LOCAL DEV AUTH - Logout for user {UserId}", userId);
        return true;
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return null;

        var roles = await _userManager.GetRolesAsync(user);

        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            FirstName = user.FirstName ?? "",
            LastName = user.LastName ?? "",
            Roles = roles.ToList()
        };
    }

    public async Task<AuthResponseDto?> RefreshTokenAsync(string userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return null;
        }

        var (token, userDto) = await GenerateTokenAndMapUserAsync(user);

        return new AuthResponseDto
        {
            Token = token,
            User = userDto,
            Expires = DateTime.UtcNow.AddDays(1)
        };
    }

    public async Task<UserDto?> UpdateProfileAsync(string userId, UserDto userDto)
    {
        _logger.LogWarning("⚠️ LOCAL DEV AUTH - Profile update not implemented");
        return null;
    }

    public async Task<bool> AssignRoleAsync(string userId, string role)
    {
        _logger.LogWarning("⚠️ LOCAL DEV AUTH - Role assignment not implemented");
        return false;
    }

    public async Task<List<string>> GetUserRolesAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return new List<string>();
        
        var roles = await _userManager.GetRolesAsync(user);
        return roles.ToList();
    }

    public async Task<PasswordChangeResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("Change password failed: User {UserId} not found", userId);
                return PasswordChangeResult.Failed("User not found", "UserNotFound");
            }

            // Verify current password
            var isCurrentPasswordValid = await _userManager.CheckPasswordAsync(user, currentPassword);
            if (!isCurrentPasswordValid)
            {
                _logger.LogWarning("Change password failed: Invalid current password for user {UserId}", userId);
                return PasswordChangeResult.Failed("Current password is incorrect", "InvalidCurrentPassword");
            }

            // Change password
            var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Change password failed for user {UserId}: {Errors}", userId, errors);
                return PasswordChangeResult.Failed(errors, "ValidationFailed");
            }

            _logger.LogInformation("Password changed successfully for user {UserId}", userId);
            return PasswordChangeResult.Succeeded();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user {UserId}", userId);
            return PasswordChangeResult.Failed("An error occurred while changing password", "Exception");
        }
    }

    public async Task<PasswordChangeResult> ResetPasswordAsync(string email, string newPassword)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return PasswordChangeResult.Failed("User not found", "UserNotFound");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return PasswordChangeResult.Failed(errors, "ValidationFailed");
            }

            _logger.LogInformation("Password reset successfully for user {Email}", email);
            return PasswordChangeResult.Succeeded();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {Email}", email);
            return PasswordChangeResult.Failed("An error occurred while resetting password", "Exception");
        }
    }
}
