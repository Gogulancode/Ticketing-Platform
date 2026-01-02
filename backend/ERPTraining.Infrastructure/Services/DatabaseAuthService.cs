using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ERPTraining.Infrastructure.Services;

/// <summary>
/// Database-backed authentication service using ASP.NET Core Identity
/// </summary>
public class DatabaseAuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _config;
    private readonly ILogger<DatabaseAuthService> _logger;
    private readonly ApplicationDbContext _context;

    public DatabaseAuthService(
        UserManager<User> userManager,
        IConfiguration config,
        ILogger<DatabaseAuthService> logger,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _config = config;
        _logger = logger;
        _context = context;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        try
        {
            var identifier = string.IsNullOrWhiteSpace(loginDto.UserName)
                ? loginDto.Email
                : loginDto.UserName;

            identifier = identifier?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(identifier))
            {
                _logger.LogWarning("Login attempt with empty identifier");
                return null;
            }

            // Find user by email or username
            var user = await _userManager.FindByEmailAsync(identifier)
                ?? await _userManager.FindByNameAsync(identifier);

            if (user == null)
            {
                _logger.LogWarning("Login failed: User not found for identifier {Identifier}", identifier);
                return null;
            }

            if (!user.IsActive)
            {
                _logger.LogWarning("Login failed: User {UserId} is inactive", user.Id);
                return null;
            }

            // Verify password
            var passwordValid = await _userManager.CheckPasswordAsync(user, loginDto.Password);
            if (!passwordValid)
            {
                _logger.LogWarning("Login failed: Invalid password for user {UserId}", user.Id);
                return null;
            }

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);

            _logger.LogInformation("User {UserId} ({Email}) logged in successfully", user.Id, user.Email);

            return await BuildAuthResponseAsync(user, roles.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for identifier {Identifier}", loginDto.UserName ?? loginDto.Email);
            return null;
        }
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("Registration failed: Email {Email} already exists", registerDto.Email);
                return null;
            }

            var user = new User
            {
                UserName = registerDto.UserName ?? registerDto.Email,
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Department = registerDto.Department ?? string.Empty,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Registration failed for {Email}: {Errors}", registerDto.Email, errors);
                return null;
            }

            // Assign default role
            await _userManager.AddToRoleAsync(user, "User");

            var roles = await _userManager.GetRolesAsync(user);
            _logger.LogInformation("User {UserId} ({Email}) registered successfully", user.Id, user.Email);

            return await BuildAuthResponseAsync(user, roles.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for {Email}", registerDto.Email);
            return null;
        }
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return null;

            var roles = await _userManager.GetRolesAsync(user);
            return await CreateUserDtoAsync(user, roles.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user {UserId}", userId);
            return null;
        }
    }

    public async Task<UserDto?> UpdateProfileAsync(string userId, UserDto updateDto)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return null;

            user.FirstName = updateDto.FirstName ?? user.FirstName;
            user.LastName = updateDto.LastName ?? user.LastName;
            user.Department = updateDto.Department ?? user.Department;
            user.Avatar = updateDto.Avatar ?? user.Avatar;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                _logger.LogWarning("Failed to update profile for user {UserId}", userId);
                return null;
            }

            var roles = await _userManager.GetRolesAsync(user);
            return await CreateUserDtoAsync(user, roles.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile for user {UserId}", userId);
            return null;
        }
    }

    public async Task<bool> AssignRoleAsync(string userId, string role)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;

            // Check if role exists, create if not
            var roleManager = _context.Roles;
            if (!await roleManager.AnyAsync(r => r.Name == role))
            {
                _logger.LogWarning("Role {Role} does not exist", role);
                return false;
            }

            var result = await _userManager.AddToRoleAsync(user, role);
            return result.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role {Role} to user {UserId}", role, userId);
            return false;
        }
    }

    public async Task<List<string>> GetUserRolesAsync(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return new List<string>();

            var roles = await _userManager.GetRolesAsync(user);
            return roles.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting roles for user {UserId}", userId);
            return new List<string>();
        }
    }

    public async Task<AuthResponseDto?> RefreshTokenAsync(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || !user.IsActive) return null;

            var roles = await _userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing token for user {UserId}", userId);
            return null;
        }
    }

    private string GenerateJwtToken(User user, List<string> roles)
    {
        var jwtSection = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim("FullName", user.FullName ?? ""),
            new Claim("Department", user.Department ?? ""),
            new Claim("IsAgent", user.IsAgent.ToString().ToLower()),
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var expiryHours = int.TryParse(jwtSection["ExpiryInHours"], out var hours) ? hours : 24;
        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<UserDto> CreateUserDtoAsync(User user, List<string> roles)
    {
        // Check if user is a Category Admin - wrapped in try-catch for database schema compatibility
        var isCategoryAdmin = false;
        var categoryIds = new List<int>();
        
        try
        {
            var categoryAdminEntries = await _context.CategoryAdmins
                .Where(ca => ca.UserId == user.Id && ca.IsActive)
                .ToListAsync();
            
            isCategoryAdmin = categoryAdminEntries.Any();
            categoryIds = categoryAdminEntries.Select(ca => ca.CategoryId).ToList();
        }
        catch (Exception ex)
        {
            // Log but don't fail login if CategoryAdmins table has schema issues
            _logger.LogWarning(ex, "Failed to check CategoryAdmin status for user {UserId}, proceeding without category admin data", user.Id);
        }
        
        // If user is a category admin, add CategoryAdmin to their roles for frontend use
        var effectiveRoles = roles.ToList();
        if (isCategoryAdmin && !effectiveRoles.Contains("CategoryAdmin"))
        {
            effectiveRoles.Add("CategoryAdmin");
        }
        
        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Department = user.Department,
            JoinDate = user.JoinDate,
            Avatar = user.Avatar,
            IsActive = user.IsActive,
            Roles = effectiveRoles,
            IsCategoryAdmin = isCategoryAdmin,
            CategoryIds = categoryIds
        };
    }

    private async Task<AuthResponseDto> BuildAuthResponseAsync(User user, List<string> roles)
    {
        var expiryHours = int.TryParse(_config["Jwt:ExpiryInHours"], out var hours) ? hours : 24;
        return new AuthResponseDto
        {
            Token = GenerateJwtToken(user, roles),
            User = await CreateUserDtoAsync(user, roles),
            Expires = DateTime.UtcNow.AddHours(expiryHours)
        };
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
                _logger.LogWarning("Reset password failed: User {Email} not found", email);
                return PasswordChangeResult.Failed("User not found", "UserNotFound");
            }

            // Generate password reset token and reset
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Reset password failed for user {Email}: {Errors}", email, errors);
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
