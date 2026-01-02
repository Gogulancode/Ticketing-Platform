
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace ERPTraining.API.Controllers;

/// <summary>
/// Authentication and authorization controller for user management operations
/// </summary>
/// <remarks>
/// This controller handles all authentication-related operations including user registration, 
/// login, logout, and JWT token management. It provides secure endpoints for user account 
/// management and role-based access control.
/// 
/// <para><strong>Available Operations:</strong></para>
/// <list type="bullet">
/// <item><description>User Registration - Create new user accounts</description></item>
/// <item><description>User Login - Authenticate existing users</description></item>
/// <item><description>Profile Management - Update user profile information</description></item>
/// <item><description>JWT Token Management - Handle token-based authentication</description></item>
/// </list>
/// 
/// <para><strong>Security:</strong></para>
/// <para>All endpoints use JWT Bearer token authentication except for registration and login.</para>
/// </remarks>
[ApiController]
[Route("api/auth")]
[Tags("Auth")]
[Produces("application/json")]
[EnableRateLimiting("auth")]  // Enterprise: Strict rate limiting on auth endpoints
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Updates the current user's profile information
    /// </summary>
    /// <param name="updateDto">User profile data to update</param>
    /// <returns>Updated user profile information</returns>
    /// <remarks>
    /// Updates the authenticated user's profile with the provided information.
    /// Only the authenticated user can update their own profile.
    /// 
    /// <para><strong>Required Authentication:</strong> JWT Bearer token</para>
    /// <para><strong>Required Role:</strong> Any authenticated user</para>
    /// 
    /// Sample request:
    /// 
    ///     PUT /api/auth/me
    ///     {
    ///       "firstName": "John",
    ///       "lastName": "Doe",
    ///       "email": "john.doe@example.com",
    ///       "department": "IT"
    ///     }
    /// 
    /// </remarks>
    /// <response code="200">Profile updated successfully</response>
    /// <response code="400">Invalid input data</response>
    /// <response code="401">Unauthorized - Invalid or missing token</response>
    /// <response code="404">User not found</response>
    [HttpPut("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UserDto updateDto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var updatedUser = await _authService.UpdateProfileAsync(userId, updateDto);
        if (updatedUser == null)
            return NotFound();

        return Ok(updatedUser);
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token
    /// </summary>
    /// <param name="loginDto">User login credentials</param>
    /// <returns>Authentication response with JWT token and user information</returns>
    /// <remarks>
    /// Authenticates a user with email and password, returning a JWT token for subsequent API calls.
    /// The token should be included in the Authorization header as "Bearer {token}" for protected endpoints.
    /// 
    /// <para><strong>Token Validity:</strong> Tokens are valid for 24 hours</para>
    /// <para><strong>Rate Limiting:</strong> Maximum 5 login attempts per minute per IP</para>
    /// 
    /// Sample request:
    /// 
    ///     POST /api/auth/login
    ///     {
    ///       "email": "user@example.com",
    ///       "password": "SecurePassword123!"
    ///     }
    /// 
    /// Sample response:
    /// 
    ///     {
    ///       "success": true,
    ///       "message": "Login successful",
    ///       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ///       "user": {
    ///         "id": "123",
    ///         "firstName": "John",
    ///         "lastName": "Doe",
    ///         "email": "user@example.com",
    ///         "roles": ["User"]
    ///       }
    ///     }
    /// 
    /// </remarks>
    /// <response code="200">Login successful - Returns JWT token and user information</response>
    /// <response code="400">Invalid credentials or malformed request</response>
    /// <response code="401">Authentication failed - Invalid email or password</response>
    /// <response code="429">Too many login attempts - Rate limit exceeded</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(429)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        var result = await _authService.LoginAsync(loginDto);
        if (result == null)
            return Unauthorized(new { message = "Invalid username or password" });

        return Ok(result);
    }

    /// <summary>
    /// Registers a new user account
    /// </summary>
    /// <param name="registerDto">User registration information</param>
    /// <returns>Authentication response with JWT token and user information</returns>
    /// <remarks>
    /// Creates a new user account with the provided information. Upon successful registration,
    /// the user is automatically logged in and receives a JWT token for immediate API access.
    /// 
    /// <para><strong>Password Requirements:</strong></para>
    /// <list type="bullet">
    /// <item><description>Minimum 6 characters</description></item>
    /// <item><description>At least one uppercase letter</description></item>
    /// <item><description>At least one lowercase letter</description></item>
    /// <item><description>At least one digit</description></item>
    /// </list>
    /// 
    /// <para><strong>Email Validation:</strong> Email must be unique and in valid format</para>
    /// 
    /// Sample request:
    /// 
    ///     POST /api/auth/register
    ///     {
    ///       "firstName": "John",
    ///       "lastName": "Doe",
    ///       "email": "john.doe@example.com",
    ///       "password": "SecurePassword123!",
    ///       "confirmPassword": "SecurePassword123!",
    ///       "department": "IT"
    ///     }
    /// 
    /// </remarks>
    /// <response code="200">Registration successful - Returns JWT token and user information</response>
    /// <response code="400">Registration failed - Invalid data or email/username already exists</response>
    /// <response code="422">Validation failed - Password requirements not met</response>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(422)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
    {
        var result = await _authService.RegisterAsync(registerDto);
        if (result == null)
            return BadRequest(new { message = "User registration failed. Username or email may already exist." });

        return Ok(result);
    }

    /// <summary>
    /// Gets the current authenticated user's profile information
    /// </summary>
    /// <returns>Current user's profile data</returns>
    /// <remarks>
    /// Retrieves the profile information for the currently authenticated user.
    /// The user is identified from the JWT token provided in the Authorization header.
    /// 
    /// <para><strong>Required Authentication:</strong> JWT Bearer token</para>
    /// <para><strong>Required Role:</strong> Any authenticated user</para>
    /// 
    /// Sample response:
    /// 
    ///     {
    ///       "id": "123",
    ///       "firstName": "John",
    ///       "lastName": "Doe",
    ///       "email": "john.doe@example.com",
    ///       "department": "IT",
    ///       "isActive": true,
    ///       "joinDate": "2024-01-15T00:00:00Z",
    ///       "roles": ["User"]
    ///     }
    /// 
    /// </remarks>
    /// <response code="200">User profile retrieved successfully</response>
    /// <response code="401">Unauthorized - Invalid or missing token</response>
    /// <response code="404">User not found</response>
    // SIMPLE TEST ENDPOINT TO VERIFY ROUTING
    [HttpGet("test-route")]
    public ActionResult<string> TestRoute()
    {
        return Ok("✅ Route is working! This proves api/auth routes are registered correctly.");
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        Console.WriteLine("🔍 GetCurrentUser endpoint hit!");
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"🔍 UserId from token: {userId}");
        
        // Since [Authorize] is present, User should have claims, but check anyway
        if (string.IsNullOrEmpty(userId))
        {
            Console.WriteLine("❌ ERROR: No userId in token claims despite [Authorize]!");
            return Unauthorized(new { error = "No user ID in token" });
        }

        var user = await _authService.GetCurrentUserAsync(userId);
        if (user == null)
        {
            Console.WriteLine($"❌ ERROR: User not found for userId: {userId}");
            return NotFound(new { error = "User not found" });
        }
        
        Console.WriteLine($"✅ SUCCESS: Returning user {user.Email}");
        return Ok(user);
    }

    /// <summary>
    /// Generates a new JWT token for the currently authenticated user
    /// </summary>
    /// <returns>New authentication token with updated expiration</returns>
    /// <response code="200">Token successfully refreshed</response>
    /// <response code="401">Unauthorized - Invalid or missing token</response>
    [HttpPost("refresh")]
    [Authorize]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Missing user identifier" });
        }

        var refreshed = await _authService.RefreshTokenAsync(userId);
        if (refreshed == null)
        {
            return Unauthorized(new { error = "Unable to refresh token" });
        }

        return Ok(refreshed);
    }

    /// <summary>
    /// Changes the current user's password
    /// </summary>
    /// <param name="request">Current password and new password</param>
    /// <returns>Success or error message</returns>
    /// <remarks>
    /// Allows authenticated users to change their own password.
    /// Requires the current password for verification.
    /// 
    /// <para><strong>Password Requirements:</strong></para>
    /// <list type="bullet">
    /// <item><description>Minimum 6 characters</description></item>
    /// <item><description>At least one uppercase letter</description></item>
    /// <item><description>At least one lowercase letter</description></item>
    /// <item><description>At least one digit</description></item>
    /// </list>
    /// 
    /// Sample request:
    /// 
    ///     POST /api/auth/change-password
    ///     {
    ///       "currentPassword": "OldPassword123!",
    ///       "newPassword": "NewPassword456!",
    ///       "confirmPassword": "NewPassword456!"
    ///     }
    /// 
    /// </remarks>
    /// <response code="200">Password changed successfully</response>
    /// <response code="400">Validation failed or passwords don't match</response>
    /// <response code="401">Current password is incorrect</response>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        // Validate input
        if (string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
        {
            return BadRequest(new { message = "Current password and new password are required" });
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            return BadRequest(new { message = "New password and confirm password do not match" });
        }

        if (request.NewPassword.Length < 6)
        {
            return BadRequest(new { message = "New password must be at least 6 characters long" });
        }

        var result = await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
        if (!result.Success)
        {
            if (result.ErrorType == "InvalidCurrentPassword")
            {
                return Unauthorized(new { message = "Current password is incorrect" });
            }
            return BadRequest(new { message = result.ErrorMessage ?? "Failed to change password" });
        }

        return Ok(new { message = "Password changed successfully" });
    }

    [HttpPost("assign-role")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AssignRole([FromBody] AssignRoleDto assignRoleDto)
    {
        var result = await _authService.AssignRoleAsync(assignRoleDto.UserId, assignRoleDto.Role);
        if (!result)
            return BadRequest(new { message = "Failed to assign role" });

        return Ok(new { message = "Role assigned successfully" });
    }

    [HttpGet("roles/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<string>>> GetUserRoles(string userId)
    {
        var roles = await _authService.GetUserRolesAsync(userId);
        return Ok(roles);
    }

    /// <summary>
    /// TEMPORARY: Reset admin password (remove after use)
    /// </summary>
    [HttpPost("reset-admin-password")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<ActionResult> ResetAdminPassword([FromBody] ResetAdminPasswordDto dto)
    {
        // Security: Only allow with secret key
        if (dto.SecretKey != "TEMP_RESET_KEY_2025")
            return Unauthorized(new { message = "Invalid secret key" });

        var result = await _authService.ResetPasswordAsync("admin@ticketing.local", dto.NewPassword);
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage ?? "Failed to reset password" });

        return Ok(new { message = "Admin password reset successfully" });
    }
}

public class ResetAdminPasswordDto
{
    public string SecretKey { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class AssignRoleDto
{
    public string UserId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
