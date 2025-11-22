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
using Microsoft.Extensions.Caching.Memory;

namespace ERPTraining.Infrastructure.Services;

/// <summary>
/// OPTIMIZED SSO Authentication Service with caching and reduced API calls
/// Performance improvements:
/// 1. Cache ERP user data to avoid repeated API calls
/// 2. Single database query with Include for roles
/// 3. Eliminate redundant GetRolesAsync calls
/// 4. Batch user lookups when possible
/// </summary>
public class ERPSSOAuthService_Optimized : IAuthService
{
    private readonly IERPApiService _erpApiService;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ERPSSOAuthService_Optimized> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;

    // Cache settings
    private static readonly TimeSpan UserCacheDuration = TimeSpan.FromMinutes(15);
    private const string UserCacheKeyPrefix = "erp_user_";

    public ERPSSOAuthService_Optimized(
        IERPApiService erpApiService,
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger<ERPSSOAuthService_Optimized> logger,
        ApplicationDbContext context,
        IMemoryCache cache)
    {
        _erpApiService = erpApiService;
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
        _context = context;
        _cache = cache;
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

            // Step 2: Get user details from ERP (with caching)
            var erpUser = await GetERPUserWithCachingAsync(email, erpToken);
            if (erpUser == null)
            {
                _logger.LogWarning("User {Email} not found in ERP user list", email);
                return null;
            }

            // Step 3: Find or create local user account (optimized query)
            var localUser = await GetOrCreateLocalUserOptimizedAsync(erpUser);
            if (localUser == null)
            {
                _logger.LogError("Failed to create/update local user for {Email}", email);
                return null;
            }

            // Step 4 & 5: Generate JWT token and map to DTO (combined to avoid duplicate role query)
            var (jwtToken, userDto) = await GenerateTokenAndMapUserAsync(localUser);
            
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

    /// <summary>
    /// Get ERP user with caching to avoid repeated API calls
    /// </summary>
    private async Task<ERPUserMasterApiDto?> GetERPUserWithCachingAsync(string email, string erpToken)
    {
        var cacheKey = $"{UserCacheKeyPrefix}{email.ToLowerInvariant()}";

        // Try to get from cache first
        if (_cache.TryGetValue<ERPUserMasterApiDto>(cacheKey, out var cachedUser))
        {
            _logger.LogDebug("Retrieved ERP user {Email} from cache", email);
            return cachedUser;
        }

        // Not in cache, fetch from API
        var erpUsers = await _erpApiService.GetUserMasterListAsync(erpToken);
        var erpUser = erpUsers.FirstOrDefault(u => 
            u.sEmail?.Equals(email, StringComparison.OrdinalIgnoreCase) == true);

        // Cache the result (even if null, to avoid repeated lookups for invalid users)
        if (erpUser != null)
        {
            _cache.Set(cacheKey, erpUser, UserCacheDuration);
            _logger.LogDebug("Cached ERP user {Email} for {Duration} minutes", email, UserCacheDuration.TotalMinutes);
        }

        return erpUser;
    }

    /// <summary>
    /// Optimized user lookup and creation with single database query
    /// </summary>
    private async Task<User?> GetOrCreateLocalUserOptimizedAsync(ERPUserMasterApiDto erpUser)
    {
        try
        {
            // OPTIMIZATION: Single query with conditional logic
            // Try to find existing user by ERP ID OR email in one query
            var existingUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.ERPUserId == erpUser.lId || u.Email == erpUser.sEmail);

            if (existingUser != null)
            {
                // Update existing user with latest ERP data
                var needsUpdate = false;

                if (existingUser.ERPUserId != erpUser.lId)
                {
                    existingUser.ERPUserId = erpUser.lId;
                    needsUpdate = true;
                }

                if (existingUser.UserName != erpUser.sEmail)
                {
                    existingUser.UserName = erpUser.sEmail;
                    needsUpdate = true;
                }

                if (existingUser.Email != erpUser.sEmail)
                {
                    existingUser.Email = erpUser.sEmail;
                    needsUpdate = true;
                }

                if (existingUser.FirstName != (erpUser.sName ?? ""))
                {
                    existingUser.FirstName = erpUser.sName ?? "";
                    needsUpdate = true;
                }

                if (!existingUser.IsActive)
                {
                    existingUser.IsActive = true;
                    needsUpdate = true;
                }

                if (needsUpdate)
                {
                    existingUser.UpdatedAt = DateTime.UtcNow;
                    _context.Users.Update(existingUser);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Updated existing user {UserId} from ERP", existingUser.Id);
                }

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
            
            _logger.LogInformation("Created new SSO user {UserId} for ERP ID {ERPUserId}", 
                newUser.Id, erpUser.lId);
            
            // Reload user with roles for immediate use
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == newUser.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating local user for ERP user {ERPUserId}", 
                erpUser.lId);
            return null;
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

    public async Task<AuthResponseDto?> RefreshTokenAsync(string userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        var (token, userDto) = await GenerateTokenAndMapUserAsync(user);

        return new AuthResponseDto
        {
            Token = token,
            User = userDto,
            Expires = DateTime.UtcNow.AddDays(1)
        };
    }

    // Implement other interface methods (keep existing implementation)
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
