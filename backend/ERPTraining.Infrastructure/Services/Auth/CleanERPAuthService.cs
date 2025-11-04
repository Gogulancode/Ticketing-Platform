using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;

namespace ERPTraining.Infrastructure.Services.Auth;

/// <summary>
/// Clean authentication: ERP for password validation, Platform for roles
/// Fast and simple - single DB query, no complex ERP role mapping
/// </summary>
public class CleanERPAuthService : IAuthService
{
    private readonly IERPApiService _erpApiService;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CleanERPAuthService> _logger;

    public CleanERPAuthService(
        IERPApiService erpApiService,
        ApplicationDbContext context,
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger<CleanERPAuthService> logger)
    {
        _erpApiService = erpApiService;
        _context = context;
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        // Accept both email and userName (userName is the email field in login form)
        var email = (!string.IsNullOrEmpty(loginDto.Email) ? loginDto.Email : loginDto.UserName).ToLowerInvariant();
        
        try
        {
            // Check if user exists locally first
            var existingUser = await _userManager.FindByEmailAsync(email);
            
            // Step 1: Try to validate with ERP (with timeout fallback for network issues)
            _logger.LogInformation("Authenticating {Email} with ERP...", email);
            string? erpToken = null;
            bool erpAvailable = true;
            
            try
            {
                var erpTask = _erpApiService.LoginAsync(email, loginDto.Password);
                if (await Task.WhenAny(erpTask, Task.Delay(5000)) == erpTask)
                {
                    erpToken = await erpTask;
                }
                else
                {
                    _logger.LogWarning("ERP authentication timed out after 5 seconds for {Email}", email);
                    erpAvailable = false;
                }
            }
            catch (Exception erpEx)
            {
                _logger.LogWarning(erpEx, "ERP authentication error for {Email}: {Message}", email, erpEx.Message);
                erpAvailable = false;
            }
            
            // If ERP failed but user exists locally with password, validate locally
            if (string.IsNullOrEmpty(erpToken) && existingUser != null && existingUser.PasswordHash != null)
            {
                _logger.LogInformation("ERP unavailable, using local authentication for existing user {Email}", email);
                
                // Verify password against local hash
                if (!await _userManager.CheckPasswordAsync(existingUser, loginDto.Password))
                {
                    _logger.LogWarning("Local password verification failed for {Email}", email);
                    return null;
                }
                
                _logger.LogInformation("Local authentication successful for {Email}", email);
                // Continue with existing user (skip ERP user creation)
            }
            else if (string.IsNullOrEmpty(erpToken))
            {
                _logger.LogWarning("ERP authentication failed for {Email} (ERP available: {ErpAvailable})", email, erpAvailable);
                return null;
            }
            else
            {
                _logger.LogInformation("ERP authentication successful for {Email}", email);
            }

            // Step 2: Get or create local user with roles (reuse existingUser if already loaded)
            var user = existingUser ?? await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                _logger.LogInformation("Creating new local user for {Email}", email);
                user = await CreateLocalUserAsync(email);
            }
            else
            {
                // Update last activity
                user.UpdatedAt = DateTime.UtcNow;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
            }

            // Step 3: Get roles from Identity (local platform roles)
            var roles = await _userManager.GetRolesAsync(user);

            // Step 4: Generate JWT with platform roles
            var token = GenerateJwtToken(user, roles.ToList());

            _logger.LogInformation("Login successful for {Email} with roles: {Roles}", 
                email, string.Join(", ", roles));

            return new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    UserName = user.UserName ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    FullName = $"{user.FirstName} {user.LastName}".Trim(),
                    Department = user.Department,
                    IsActive = user.IsActive,
                    Roles = roles.ToList()
                },
                Expires = DateTime.UtcNow.AddHours(24)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for {Email}: {Message}", email, ex.Message);
            return null;
        }
    }

    private async Task<User> CreateLocalUserAsync(string email)
    {
        var user = new User
        {
            UserName = email,
            Email = email,
            NormalizedUserName = email.ToUpperInvariant(),
            NormalizedEmail = email.ToUpperInvariant(),
            EmailConfirmed = true,
            SecurityStamp = Guid.NewGuid().ToString(),
            FirstName = email.Split('@')[0], // Use email prefix as first name
            LastName = "",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user);
        
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception($"Failed to create user: {errors}");
        }

        // Assign default User role (platform manages roles)
        await _userManager.AddToRoleAsync(user, "User");
        
        _logger.LogInformation("Created local user {Email} with default User role", email);
        
        return user;
    }

    private string GenerateJwtToken(User user, List<string> roles)
    {
        var jwtKey = _configuration["Jwt:Key"] 
            ?? throw new InvalidOperationException("JWT Key not configured");
        
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? ""),
            new(ClaimTypes.Name, user.UserName ?? ""),
            new("firstName", user.FirstName ?? ""),
            new("lastName", user.LastName ?? "")
        };

        // Add role claims
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Simple implementations for other interface methods
    public Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        _logger.LogWarning("Direct registration not allowed - users must exist in ERP");
        return Task.FromResult<AuthResponseDto?>(null);
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        var roles = await _userManager.GetRolesAsync(user);
        
        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = $"{user.FirstName} {user.LastName}".Trim(),
            Department = user.Department,
            JoinDate = user.JoinDate,
            IsActive = user.IsActive,
            Roles = roles.ToList()
        };
    }

    public async Task<UserDto?> UpdateProfileAsync(string userId, UserDto updateDto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        user.FirstName = updateDto.FirstName;
        user.LastName = updateDto.LastName;
        user.Department = updateDto.Department;
        user.UpdatedAt = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        var roles = await _userManager.GetRolesAsync(user);
        
        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = $"{user.FirstName} {user.LastName}".Trim(),
            Department = user.Department,
            JoinDate = user.JoinDate,
            IsActive = user.IsActive,
            Roles = roles.ToList()
        };
    }

    public async Task<bool> AssignRoleAsync(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;

        var result = await _userManager.AddToRoleAsync(user, role);
        return result.Succeeded;
    }

    public async Task<bool> RemoveRoleAsync(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;

        var result = await _userManager.RemoveFromRoleAsync(user, role);
        return result.Succeeded;
    }

    public async Task<List<string>> GetUserRolesAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return new List<string>();

        var roles = await _userManager.GetRolesAsync(user);
        return roles.ToList();
    }

    public Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        _logger.LogWarning("Password changes must be done in ERP system");
        return Task.FromResult(false);
    }

    public Task<bool> ResetPasswordAsync(string email)
    {
        _logger.LogWarning("Password reset must be done in ERP system");
        return Task.FromResult(false);
    }
}
