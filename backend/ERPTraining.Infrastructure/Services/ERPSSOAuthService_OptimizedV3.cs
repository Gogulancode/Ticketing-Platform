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
/// ULTRA-OPTIMIZED SSO Authentication Service V3
/// Performance improvement: Use local database for user lookup instead of ERP API
/// 
/// Key optimization: Since users are synced daily from ERP to local DB,
/// we only need to validate credentials with ERP, then lookup user from local DB.
/// 
/// Expected performance:
/// - Before: 3.8 seconds (ERP login + ERP GetUserMasterList + DB queries)
/// - After: 300-600ms (ERP login + single DB query) - 85-90% faster! 🚀
/// </summary>
public class ERPSSOAuthService_OptimizedV3 : IAuthService
{
    private readonly IERPApiService _erpApiService;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ERPSSOAuthService_OptimizedV3> _logger;
    private readonly ApplicationDbContext _context;

    public ERPSSOAuthService_OptimizedV3(
        IERPApiService erpApiService,
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger<ERPSSOAuthService_OptimizedV3> logger,
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
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            // Use Email field if provided, otherwise fall back to UserName for backward compatibility
            string email = !string.IsNullOrEmpty(loginDto.Email) ? loginDto.Email : loginDto.UserName;
            
            _logger.LogInformation("Attempting SSO login for {Email}", email);

            // Step 1: Validate credentials against ERP API (REQUIRED - cannot skip)
            // DEV MODE: If ERP API is unreachable, skip validation for development testing
            var erpLoginTime = System.Diagnostics.Stopwatch.StartNew();
            var erpToken = await _erpApiService.LoginAsync(email, loginDto.Password);
            erpLoginTime.Stop();
            
            if (string.IsNullOrEmpty(erpToken))
            {
                _logger.LogWarning("ERP authentication failed for {Email}", email);
                return null;
            }

            _logger.LogInformation("ERP authentication successful for {Email} in {ElapsedMs}ms", 
                email, erpLoginTime.ElapsedMilliseconds);

            // Step 2: Find user in LOCAL DATABASE (FAST! No ERP API call needed)
            // Since users are synced daily, the user should already exist in local DB
            var dbQueryTime = System.Diagnostics.Stopwatch.StartNew();
            var localUser = await GetOrCreateLocalUserFromDatabaseAsync(email);
            dbQueryTime.Stop();
            
            if (localUser == null)
            {
                _logger.LogError("Failed to find/create local user for {Email}", email);
                return null;
            }

            _logger.LogDebug("Database lookup completed in {ElapsedMs}ms", dbQueryTime.ElapsedMilliseconds);

            // Step 3: Generate JWT token and map to DTO (combined to avoid duplicate queries)
            var (jwtToken, userDto) = await GenerateTokenAndMapUserAsync(localUser);
            
            stopwatch.Stop();
            _logger.LogInformation("SSO login successful for {Email}, UserId: {UserId}, Total time: {ElapsedMs}ms", 
                email, localUser.Id, stopwatch.ElapsedMilliseconds);

            return new AuthResponseDto
            {
                Token = jwtToken,
                User = userDto,
                Expires = DateTime.UtcNow.AddDays(1)
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Error during SSO login for {Email}, Time: {ElapsedMs}ms", 
                !string.IsNullOrEmpty(loginDto.Email) ? loginDto.Email : loginDto.UserName,
                stopwatch.ElapsedMilliseconds);
            return null;
        }
    }

    /// <summary>
    /// OPTIMIZED: Find user in local database only (no ERP API call)
    /// Since users are synced daily, they should already exist in local DB
    /// </summary>
    private async Task<User?> GetOrCreateLocalUserFromDatabaseAsync(string email)
    {
        try
        {
            // OPTIMIZATION: Single query without UserRoles (we use UserManager for roles)
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (existingUser != null)
            {
                // User found in database (normal case after daily sync)
                _logger.LogDebug("Found existing user {Email} in local database", email);
                
                // Update last login time (optional)
                existingUser.UpdatedAt = DateTime.UtcNow;
                _context.Users.Update(existingUser);
                await _context.SaveChangesAsync();
                
                return existingUser;
            }

            // User not found in local database (rare case - before first sync or new user)
            // Create minimal user record with email only
            // User details will be populated during next daily sync
            _logger.LogWarning("User {Email} not found in local DB - creating minimal record. " +
                             "User details will be synced in next scheduled sync.", email);

            var newUser = new User
            {
                Id = Guid.NewGuid().ToString(),
                UserName = email,
                Email = email,
                FirstName = ExtractNameFromEmail(email), // Extract from email as fallback
                LastName = "",
                Department = "",
                ERPUserId = null, // Will be set during next sync
                IsActive = true,
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
            
            _logger.LogInformation("Created minimal user record for {Email}. Will be populated in next sync.", email);
            
            // Reload user with roles
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == newUser.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting/creating local user for {Email}", email);
            return null;
        }
    }

    /// <summary>
    /// Extract first name from email as fallback (e.g., "john.doe@company.com" -> "John Doe")
    /// </summary>
    private string ExtractNameFromEmail(string email)
    {
        try
        {
            var localPart = email.Split('@')[0];
            var nameParts = localPart.Split(new[] { '.', '_', '-' }, StringSplitOptions.RemoveEmptyEntries);
            
            // Capitalize each part
            var capitalizedParts = nameParts.Select(p => 
                char.ToUpper(p[0]) + p.Substring(1).ToLower());
            
            return string.Join(" ", capitalizedParts);
        }
        catch
        {
            return email.Split('@')[0]; // Fallback to local part if parsing fails
        }
    }

    /// <summary>
    /// OPTIMIZATION: Combined JWT generation and user mapping to avoid duplicate role queries
    /// Returns both JWT token and UserDto in single operation
    /// </summary>
    private async Task<(string jwtToken, UserDto userDto)> GenerateTokenAndMapUserAsync(User user)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Get user roles ONCE (reuse for both JWT and DTO)
        var userRoles = await _userManager.GetRolesAsync(user);

        // Build JWT claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim("FullName", $"{user.FirstName} {user.LastName}".Trim()),
            new Claim("Department", user.Department ?? ""),
            new Claim("ERPUserId", user.ERPUserId?.ToString() ?? ""),
            new Claim("AuthType", "SSO")
        };

        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Generate JWT token
        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: creds
        );

        var jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

        // Build UserDto (reusing the roles we already retrieved)
        var userDto = new UserDto
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
            Roles = userRoles.ToList()
        };

        return (jwtToken, userDto);
    }

    // Implement other interface methods
    public Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        _logger.LogWarning("Registration attempt blocked - SSO users must be created in ERP system first");
        return Task.FromResult<AuthResponseDto?>(null);
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);
            
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
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null) return null;

        user.FirstName = updateDto.FirstName;
        user.LastName = updateDto.LastName;
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

    public async Task<List<string>> GetUserRolesAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return new List<string>();

        var roles = await _userManager.GetRolesAsync(user);
        return roles.ToList();
    }
}
