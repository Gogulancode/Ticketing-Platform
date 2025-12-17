
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace ERPTraining.Infrastructure.Services;

public class AuthService : IAuthService
{

    private readonly IConfiguration _config;

    // For demo, use in-memory users
    private static readonly List<User> DummyUsers = new()
    {
        new User { Id = "1", UserName = "admin", Email = "admin@erptraining.com", FirstName = "Admin", LastName = "User", Department = "IT", IsActive = true },
        new User { Id = "2", UserName = "qa", Email = "qa@erptraining.com", FirstName = "QA", LastName = "User", Department = "QA", IsActive = true },
        new User { Id = "3", UserName = "manager", Email = "manager@erptraining.com", FirstName = "Manager", LastName = "User", Department = "Management", IsActive = true }
    };
    private static readonly Dictionary<string, string> DummyPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        { "admin@erptraining.com", "admin123" },
        { "admin", "admin123" },
        { "qa@erptraining.com", "qa123" },
        { "qa", "qa123" },
        { "manager@erptraining.com", "manager123" },
        { "manager", "manager123" }
    };
    private static readonly Dictionary<string, List<string>> DummyRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        { "admin@erptraining.com", new List<string> { "Admin" } },
        { "admin", new List<string> { "Admin" } },
        { "qa@erptraining.com", new List<string> { "QA" } },
        { "qa", new List<string> { "QA" } },
        { "manager@erptraining.com", new List<string> { "Manager" } },
        { "manager", new List<string> { "Manager" } }
    };

    public AuthService(IConfiguration config)
    {
        _config = config;
    }

    public Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        var identifier = string.IsNullOrWhiteSpace(loginDto.UserName)
            ? loginDto.Email
            : loginDto.UserName;

        identifier = identifier?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(identifier))
        {
            return Task.FromResult<AuthResponseDto?>(null);
        }

        var user = DummyUsers.FirstOrDefault(u =>
            u.IsActive && (
                string.Equals(u.Email, identifier, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(u.UserName, identifier, StringComparison.OrdinalIgnoreCase)));

        if (user == null)
        {
            return Task.FromResult<AuthResponseDto?>(null);
        }

        if (!IsPasswordValid(user, identifier, loginDto.Password))
        {
            return Task.FromResult<AuthResponseDto?>(null);
        }

        var roles = GetRolesForUser(user, identifier);
        return Task.FromResult<AuthResponseDto?>(BuildAuthResponse(user, roles));
    }

    public Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        // For demo, just add to DummyUsers and DummyPasswords
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            UserName = registerDto.UserName,
            Email = registerDto.Email,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            Department = registerDto.Department,
            IsActive = true
        };
        DummyUsers.Add(user);
        DummyPasswords[registerDto.UserName] = registerDto.Password;
        var defaultRoles = new List<string> { "User" };
        DummyRoles[registerDto.UserName] = new List<string>(defaultRoles);
        if (!string.IsNullOrWhiteSpace(registerDto.Email))
        {
            DummyRoles[registerDto.Email] = new List<string>(defaultRoles);
        }

        return Task.FromResult<AuthResponseDto?>(BuildAuthResponse(user, defaultRoles));
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
        };
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }
        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }


    public Task<UserDto?> GetCurrentUserAsync(string userId)
    {
        var user = DummyUsers.FirstOrDefault(u => u.Id == userId);
        if (user == null) return Task.FromResult<UserDto?>(null);
        var roles = GetRolesForUser(user);
        var userDto = CreateUserDto(user, roles);
        return Task.FromResult<UserDto?>(userDto);
    }

    public Task<UserDto?> UpdateProfileAsync(string userId, UserDto updateDto)
    {
        // Dummy: just echo back the updated data for UAT/demo
        updateDto.Id = userId;
        return Task.FromResult<UserDto?>(updateDto);
    }

    public Task<bool> AssignRoleAsync(string userId, string role)
    {
        // Always return true
        return Task.FromResult(true);
    }

    public Task<List<string>> GetUserRolesAsync(string userId)
    {
        // Always return Admin
        return Task.FromResult(new List<string> { "Admin" });
    }

    public Task<AuthResponseDto?> RefreshTokenAsync(string userId)
    {
        var user = DummyUsers.FirstOrDefault(u => u.Id == userId && u.IsActive);
        if (user == null) return Task.FromResult<AuthResponseDto?>(null);

        var roles = GetRolesForUser(user);
        return Task.FromResult<AuthResponseDto?>(BuildAuthResponse(user, roles));
    }

    private static List<string> GetRolesForUser(User user, string? fallbackKey = null)
    {
        if (!string.IsNullOrWhiteSpace(fallbackKey) && DummyRoles.TryGetValue(fallbackKey, out var fallbackRoles))
            return fallbackRoles;

        if (!string.IsNullOrWhiteSpace(user.Email) && DummyRoles.TryGetValue(user.Email, out var emailRoles))
            return emailRoles;

        if (!string.IsNullOrWhiteSpace(user.UserName) && DummyRoles.TryGetValue(user.UserName, out var usernameRoles))
            return usernameRoles;

        return new List<string> { "User" };
    }

    private static bool IsPasswordValid(User user, string identifier, string providedPassword)
    {
        if (string.IsNullOrEmpty(providedPassword))
        {
            return false;
        }

        var possibleKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(identifier))
            possibleKeys.Add(identifier);
        if (!string.IsNullOrWhiteSpace(user.Email))
            possibleKeys.Add(user.Email);
        if (!string.IsNullOrWhiteSpace(user.UserName))
            possibleKeys.Add(user.UserName);

        foreach (var key in possibleKeys)
        {
            if (DummyPasswords.TryGetValue(key, out var storedPassword) && storedPassword == providedPassword)
            {
                return true;
            }
        }

        return false;
    }

    private static UserDto CreateUserDto(User user, List<string> roles)
    {
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
            Roles = roles
        };
    }

    private AuthResponseDto BuildAuthResponse(User user, List<string> roles)
    {
        return new AuthResponseDto
        {
            Token = GenerateJwtToken(user, roles),
            User = CreateUserDto(user, roles),
            Expires = DateTime.UtcNow.AddDays(7)
        };
    }

    public Task<PasswordChangeResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        // Find user by ID
        var user = DummyUsers.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return Task.FromResult(PasswordChangeResult.Failed("User not found", "UserNotFound"));
        }

        // Check current password
        var identifier = user.Email ?? user.UserName ?? "";
        if (!IsPasswordValid(user, identifier, currentPassword))
        {
            return Task.FromResult(PasswordChangeResult.Failed("Current password is incorrect", "InvalidCurrentPassword"));
        }

        // Update password in dummy storage
        var key = user.UserName ?? user.Email ?? "";
        if (!string.IsNullOrEmpty(key))
        {
            DummyPasswords[key] = newPassword;
        }

        return Task.FromResult(PasswordChangeResult.Succeeded());
    }
}
