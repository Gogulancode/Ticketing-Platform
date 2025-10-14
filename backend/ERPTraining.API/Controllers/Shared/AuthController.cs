
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
[Route("api/[controller]")]
[Tags("Auth")]
[Produces("application/json")]
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
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                     User.FindFirst("sub")?.Value ?? 
                     User.FindFirst("userid")?.Value;
        
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _authService.GetCurrentUserAsync(userId);
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(user);
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
}

public class AssignRoleDto
{
    public string UserId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
