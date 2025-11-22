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
/// SSO Authentication Service that validates credentials against ERP API
/// and creates/updates local user accounts automatically
/// </summary>
public class ERPSSOAuthService : IAuthService
{
    private readonly IERPApiService _erpApiService;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ERPSSOAuthService> _logger;
    private readonly ApplicationDbContext _context;

    public ERPSSOAuthService(
        IERPApiService erpApiService,
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger<ERPSSOAuthService> logger,
        ApplicationDbContext context)
    {
        _erpApiService = erpApiService;
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
        _context = context;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        try
        {
            // Use Email field if provided, otherwise fall back to UserName for backward compatibility
            string email = !string.IsNullOrEmpty(loginDto.Email) ? loginDto.Email : loginDto.UserName;
            
            _logger.LogInformation("Attempting SSO login for {Email}", email);

            // Step 1: Validate credentials against ERP API
            var erpToken = await _erpApiService.LoginAsync(email, loginDto.Password);
            if (string.IsNullOrEmpty(erpToken))
            {
                _logger.LogWarning("ERP authentication failed for {Email}", email);
                return null;
            }

            _logger.LogInformation("ERP authentication successful for {Email}", email);

            // Step 2: Get user details from ERP
            var erpUsers = await _erpApiService.GetUserMasterListAsync(erpToken);
            var erpUser = erpUsers.FirstOrDefault(u => 
                u.sEmail?.Equals(email, StringComparison.OrdinalIgnoreCase) == true);

            if (erpUser == null)
            {
                _logger.LogWarning("User {Email} not found in ERP user list", email);
                return null;
            }

            // Step 3: Find or create local user account
            var localUser = await GetOrCreateLocalUserAsync(erpUser);
            if (localUser == null)
            {
                _logger.LogError("Failed to create/update local user for {Email}", email);
                return null;
            }

            // Step 4: Generate JWT token for local authentication
            var jwtToken = await GenerateJwtTokenAsync(localUser);

            // Step 5: Return authentication response
            var userDto = await MapToUserDtoAsync(localUser);
            
            _logger.LogInformation("SSO login successful for {Email}, UserId: {UserId}", 
                email, localUser.Id);

            return new AuthResponseDto
            {
                Token = jwtToken,
                User = userDto,
                Expires = DateTime.UtcNow.AddDays(1)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during SSO login for {Email}", 
                !string.IsNullOrEmpty(loginDto.Email) ? loginDto.Email : loginDto.UserName);
            return null;
        }
    }

    private async Task<User?> GetOrCreateLocalUserAsync(ERPUserMasterApiDto erpUser)
    {
        try
        {
            // Try to find existing user by ERP ID first
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.ERPUserId == erpUser.lId);

            if (existingUser != null)
            {
                // Update existing user with latest ERP data
                existingUser.UserName = erpUser.sEmail;
                existingUser.Email = erpUser.sEmail;
                existingUser.FirstName = erpUser.sName ?? "";
                existingUser.LastName = ""; // Not available in ERP API
                existingUser.Department = ""; // Not available in ERP API  
                existingUser.IsActive = true; // Assume active if they can login
                existingUser.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(existingUser);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Updated existing user {UserId} from ERP", existingUser.Id);
                return existingUser;
            }

            // Try to find by email if no ERP ID match
            existingUser = await _userManager.FindByEmailAsync(erpUser.sEmail);
            if (existingUser != null)
            {
                // Link existing user to ERP
                existingUser.ERPUserId = erpUser.lId;
                existingUser.FirstName = erpUser.sName ?? "";
                existingUser.LastName = ""; // Not available in ERP API
                existingUser.Department = ""; // Not available in ERP API
                existingUser.IsActive = true; // Assume active if they can login
                existingUser.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(existingUser);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Linked existing user {UserId} to ERP ID {ERPUserId}", 
                    existingUser.Id, erpUser.lId);
                return existingUser;
            }

            // Create new user
            var newUser = new User
            {
                Id = Guid.NewGuid().ToString(),
                UserName = erpUser.sEmail,
                Email = erpUser.sEmail,
                FirstName = erpUser.sName ?? "",
                LastName = "", // Not available in ERP API
                Department = "", // Not available in ERP API
                ERPUserId = erpUser.lId,
                IsActive = true, // Assume active if they can login
                JoinDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                EmailConfirmed = true // SSO users are pre-verified
            };

            // Create user without password (SSO-only authentication)
            var result = await _userManager.CreateAsync(newUser);
            if (!result.Succeeded)
            {
                _logger.LogError("Failed to create new user: {Errors}", 
                    string.Join(", ", result.Errors.Select(e => e.Description)));
                return null;
            }

            // Assign default role
            await _userManager.AddToRoleAsync(newUser, "User");
            
            _logger.LogInformation("Created new SSO user {UserId} for ERP ID {ERPUserId}", 
                newUser.Id, erpUser.lId);
            
            return newUser;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating local user for ERP user {ERPUserId}", 
                erpUser.lId);
            return null;
        }
    }

    private async Task<string> GenerateJwtTokenAsync(User user)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim("FullName", $"{user.FirstName} {user.LastName}".Trim()),
            new Claim("Department", user.Department ?? ""),
            new Claim("ERPUserId", user.ERPUserId?.ToString() ?? ""),
            new Claim("AuthType", "SSO") // Mark as SSO authentication
        };

        // Add user roles - using UserManager for proper role retrieval
        var userRoles = await _userManager.GetRolesAsync(user);

        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1), // 24-hour token
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<UserDto> MapToUserDtoAsync(User user)
    {
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

    public async Task<AuthResponseDto?> RefreshTokenAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        var token = await GenerateJwtTokenAsync(user);
        var userDto = await MapToUserDtoAsync(user);

        return new AuthResponseDto
        {
            Token = token,
            User = userDto,
            Expires = DateTime.UtcNow.AddDays(1)
        };
    }

    // Implement other interface methods (delegate to existing service or return appropriate responses)
    public Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        // SSO users cannot register directly - they must exist in ERP
        _logger.LogWarning("Registration attempt blocked - SSO users must be created in ERP system first");
        return Task.FromResult<AuthResponseDto?>(null);
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user != null ? await MapToUserDtoAsync(user) : null;
    }

    public async Task<UserDto?> UpdateProfileAsync(string userId, UserDto updateDto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        // Only allow certain fields to be updated for SSO users
        user.FirstName = updateDto.FirstName;
        user.LastName = updateDto.LastName;
        user.UpdatedAt = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return await MapToUserDtoAsync(user);
    }

    public async Task<bool> AssignRoleAsync(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;

        var result = await _userManager.AddToRoleAsync(user, role);
        return result.Succeeded;
    }

    public async Task<List<string>> GetUserRolesAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return new List<string>();

        var roles = await _userManager.GetRolesAsync(user);
        return roles.ToList();
    }
}