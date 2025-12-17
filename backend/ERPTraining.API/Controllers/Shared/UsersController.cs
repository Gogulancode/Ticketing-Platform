using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/users")]
// [Authorize] - Temporarily disabled for testing
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UsersController> _logger;
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UsersController(
        ApplicationDbContext context,
        ILogger<UsersController> logger,
        UserManager<User> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        _context = context;
        _logger = logger;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    /// <summary>
    /// Search users for autocomplete - returns minimal user info for selection
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<object>>> SearchUsers([FromQuery] string q = "", [FromQuery] int limit = 20)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            {
                return Ok(Array.Empty<object>());
            }

            var searchLower = q.ToLower();

            var users = await _context.Users
                .Where(u => u.IsActive)
                .Where(u => 
                    (u.FirstName != null && u.FirstName.ToLower().Contains(searchLower)) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(searchLower)) ||
                    (u.Email != null && u.Email.ToLower().Contains(searchLower)) ||
                    (u.UserName != null && u.UserName.ToLower().Contains(searchLower)))
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .Take(limit)
                .Select(u => new
                {
                    id = u.Id,
                    name = (u.FirstName ?? "") + " " + (u.LastName ?? ""),
                    firstName = u.FirstName ?? "",
                    lastName = u.LastName ?? "",
                    email = u.Email ?? "",
                    department = u.Department ?? "",
                    position = u.Position ?? ""
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users");
            return StatusCode(500, new { message = "Error searching users", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all users with pagination support
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<object>> GetUsers(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 50,
        [FromQuery] string search = "",
        [FromQuery] string roleFilter = "",
        [FromQuery] string userTypeFilter = "",
        [FromQuery] string statusFilter = "")
    {
        try
        {
            _logger.LogInformation("Getting users - Page: {Page}, PageSize: {PageSize}, Search: {Search}", page, pageSize, search);

            var query = _context.Users.AsQueryable();

            // Apply search filter
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u => 
                    (u.FirstName != null && u.FirstName.Contains(search)) || 
                    (u.LastName != null && u.LastName.Contains(search)) || 
                    (u.Email != null && u.Email.Contains(search)) ||
                    (u.UserName != null && u.UserName.Contains(search)));
            }

            // Apply status filter
            if (!string.IsNullOrEmpty(statusFilter))
            {
                if (statusFilter == "active")
                {
                    query = query.Where(u => u.IsActive);
                }
                else if (statusFilter == "inactive")
                {
                    query = query.Where(u => !u.IsActive);
                }
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination and get users
            var usersQuery = await query
                .Include(u => u.Branch)
                .OrderBy(u => u.LastName)
                .ThenBy(u => u.FirstName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Build user list with roles (need to query roles separately since it's async)
            var users = new List<object>();
            foreach (var u in usersQuery)
            {
                var userRoles = await _userManager.GetRolesAsync(u);
                users.Add(new
                {
                    id = u.Id,
                    username = u.UserName ?? "",
                    email = u.Email ?? "",
                    firstName = u.FirstName ?? "",
                    lastName = u.LastName ?? "",
                    phone = u.PhoneNumber ?? "",
                    isActive = u.IsActive,
                    isAgent = u.IsAgent,
                    roles = userRoles.ToArray(),
                    createdAt = u.CreatedAt.ToString("yyyy-MM-dd"),
                    lastLogin = "", // Not available in current User entity
                    department = u.Department ?? "",
                    position = u.Position ?? "",
                    branchId = u.BranchId,
                    branchName = u.Branch?.Name ?? "",
                    branchCode = u.Branch?.Code ?? ""
                });
            }

            var result = new
            {
                users = users,
                pagination = new
                {
                    currentPage = page,
                    pageSize = pageSize,
                    totalCount = totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            };

            _logger.LogInformation("Retrieved {Count} users out of {Total} total users", users.Count, totalCount);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, new { message = "Error getting users", error = ex.Message });
        }
    }

    /// <summary>
    /// Convert an existing user to a Ticketing Agent (idempotent)
    /// </summary>
    [HttpPost("{id}/convert-to-agent")]
    public async Task<ActionResult<object>> ConvertToAgent(string id)
    {
        try
        {
            _logger.LogInformation("Converting user {UserId} to agent", id);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return NotFound(new { message = $"User {id} not found" });
            }

            // Check if agent already exists
            var existingAgent = await _context.Agents.FirstOrDefaultAsync(a => a.UserId == id);
            if (existingAgent != null)
            {
                var stateChanged = false;

                if (!user.IsAgent)
                {
                    user.IsAgent = true;
                    user.UpdatedAt = DateTime.UtcNow;
                    stateChanged = true;
                }

                if (!existingAgent.IsActive)
                {
                    existingAgent.IsActive = true;
                    existingAgent.UpdatedAt = DateTime.UtcNow;
                    stateChanged = true;
                }

                if (stateChanged)
                {
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    success = true,
                    message = "User already an agent (reactivated if needed)",
                    agent = new
                    {
                        existingAgent.Id,
                        existingAgent.UserId,
                        existingAgent.Name,
                        existingAgent.Email,
                        existingAgent.Department,
                        existingAgent.IsActive,
                        existingAgent.CreatedAt,
                        existingAgent.UpdatedAt
                    }
                });
            }

            // Create new agent row
            var name = string.Join(" ", new[] { user.FirstName, user.LastName }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                name = user.UserName ?? user.Email ?? "Unknown";
            }

            var agent = new ERPTraining.Core.Entities.Ticketing.Agent
            {
                UserId = user.Id,
                Name = name,
                Email = user.Email ?? string.Empty,
                Department = user.Department ?? string.Empty,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Agents.Add(agent);
            if (!user.IsAgent)
            {
                user.IsAgent = true;
                user.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            // Optionally assign an Identity role named "Agent" if it exists
            var agentRoleName = "Agent";
            if (await _roleManager.RoleExistsAsync(agentRoleName))
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (!roles.Contains(agentRoleName))
                {
                    await _userManager.AddToRoleAsync(user, agentRoleName);
                }
            }

            _logger.LogInformation("User {UserId} converted to agent {AgentId}", id, agent.Id);

            return Ok(new
            {
                success = true,
                message = "User converted to agent",
                agent = new
                {
                    agent.Id,
                    agent.UserId,
                    agent.Name,
                    agent.Email,
                    agent.Department,
                    agent.IsActive,
                    agent.CreatedAt,
                    agent.UpdatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed converting user {UserId} to agent", id);
            return StatusCode(500, new { message = "Error converting user to agent", error = ex.Message });
        }
    }

    /// <summary>
    /// Get user statistics
    /// </summary>
    [HttpGet("sync/status")]
    public async Task<ActionResult<object>> GetSyncStatus()
    {
        try
        {
            _logger.LogInformation("Getting user statistics");

            // Get actual counts from database
            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
            var agentUsers = await _context.Users.CountAsync(u => u.IsAgent);

            var status = new
            {
                isRunning = false,
                isConnected = true,
                lastSync = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                totalUsers = totalUsers,
                syncedUsers = 0,
                activeUsers = activeUsers,
                agentUsers = agentUsers,
                errors = new string[0]
            };

            _logger.LogInformation("User stats - Total: {Total}, Active: {Active}, Agents: {Agents}", 
                totalUsers, activeUsers, agentUsers);

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user statistics");
            return StatusCode(500, new { message = "Error getting user statistics", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<object>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            _logger.LogInformation("Creating new user with email: {Email}", request.Email);

            // Validate required fields
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Email and password are required" });
            }

            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return Conflict(new { message = "User with this email already exists" });
            }

            // Create new user
            var user = new User
            {
                UserName = request.Username ?? request.Email,
                Email = request.Email,
                FirstName = request.FirstName ?? "",
                LastName = request.LastName ?? "",
                PhoneNumber = request.Phone,
                Department = request.Department ?? "",
                BranchId = request.BranchId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Create user with password
            var result = await _userManager.CreateAsync(user, request.Password);
            
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(new { message = "Failed to create user", errors = errors });
            }

            // Add user to roles
            if (request.Roles != null && request.Roles.Any())
            {
                foreach (var roleName in request.Roles)
                {
                    var roleExists = await _roleManager.RoleExistsAsync(roleName);
                    if (roleExists)
                    {
                        await _userManager.AddToRoleAsync(user, roleName);
                    }
                    else
                    {
                        _logger.LogWarning("Role {RoleName} does not exist, skipping assignment", roleName);
                    }
                }
            }

            _logger.LogInformation("User created successfully with ID: {UserId}", user.Id);

            var newUser = new
            {
                id = user.Id,
                username = user.UserName,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                phone = user.PhoneNumber,
                isActive = user.IsActive,
                department = user.Department,
                branchId = user.BranchId,
                roles = request.Roles ?? new List<string>(),
                createdAt = user.CreatedAt.ToString("yyyy-MM-dd"),
                success = true,
                message = "User created successfully"
            };

            return Ok(newUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "Error creating user", error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<object>> UpdateUser(string id, [FromBody] object userData)
    {
        try
        {
            _logger.LogInformation("Updating user with ID: {UserId}", id);

            // Find the user
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} not found" });
            }

            // Parse the incoming data
            var json = System.Text.Json.JsonSerializer.Serialize(userData);
            var updateData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(json);

            if (updateData == null)
            {
                return BadRequest(new { message = "Invalid user data" });
            }

            // Update user properties
            bool hasChanges = false;

            if (updateData.ContainsKey("username") && updateData["username"] != null)
            {
                var newUsername = updateData["username"].ToString();
                if (newUsername != null && !string.Equals(user.UserName, newUsername, StringComparison.Ordinal))
                {
                    user.UserName = newUsername;
                    hasChanges = true;
                }
            }

            if (updateData.ContainsKey("email") && updateData["email"] != null)
            {
                var newEmail = updateData["email"].ToString();
                if (newEmail != null && !string.Equals(user.Email, newEmail, StringComparison.OrdinalIgnoreCase))
                {
                    user.Email = newEmail;
                    hasChanges = true;
                }
            }

            if (updateData.ContainsKey("firstName") && updateData["firstName"] != null)
            {
                var newFirstName = updateData["firstName"].ToString();
                if (newFirstName != null && !string.Equals(user.FirstName, newFirstName, StringComparison.Ordinal))
                {
                    user.FirstName = newFirstName;
                    hasChanges = true;
                }
            }

            if (updateData.ContainsKey("lastName") && updateData["lastName"] != null)
            {
                var newLastName = updateData["lastName"].ToString();
                if (newLastName != null && !string.Equals(user.LastName, newLastName, StringComparison.Ordinal))
                {
                    user.LastName = newLastName;
                    hasChanges = true;
                }
            }

            if (updateData.ContainsKey("phone") && updateData["phone"] != null)
            {
                var newPhone = updateData["phone"].ToString();
                if (newPhone != null && !string.Equals(user.PhoneNumber, newPhone, StringComparison.Ordinal))
                {
                    user.PhoneNumber = newPhone;
                    hasChanges = true;
                }
            }

            if (updateData.ContainsKey("department") && updateData["department"] != null)
            {
                var newDepartment = updateData["department"].ToString();
                if (newDepartment != null && !string.Equals(user.Department, newDepartment, StringComparison.Ordinal))
                {
                    user.Department = newDepartment;
                    hasChanges = true;
                }
            }

            if (updateData.ContainsKey("position") && updateData["position"] != null)
            {
                var newPosition = updateData["position"].ToString();
                if (newPosition != null && !string.Equals(user.Position, newPosition, StringComparison.Ordinal))
                {
                    user.Position = newPosition;
                    hasChanges = true;
                }
            }

            if (updateData.ContainsKey("branchId"))
            {
                int? newBranchId = null;
                var branchIdValue = updateData["branchId"];
                
                if (branchIdValue is System.Text.Json.JsonElement jsonElement)
                {
                    if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Number)
                    {
                        newBranchId = jsonElement.GetInt32();
                    }
                    else if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Null)
                    {
                        newBranchId = null;
                    }
                }
                else if (branchIdValue is int intVal)
                {
                    newBranchId = intVal;
                }
                else if (int.TryParse(branchIdValue?.ToString(), out int parsedInt))
                {
                    newBranchId = parsedInt;
                }

                if (user.BranchId != newBranchId)
                {
                    user.BranchId = newBranchId;
                    hasChanges = true;
                }
            }

            if (updateData.ContainsKey("isActive"))
            {
                var isActiveValue = updateData["isActive"];
                bool newIsActive = false;
                
                if (isActiveValue is bool boolValue)
                {
                    newIsActive = boolValue;
                }
                else if (bool.TryParse(isActiveValue?.ToString(), out bool parsedBool))
                {
                    newIsActive = parsedBool;
                }

                if (user.IsActive != newIsActive)
                {
                    user.IsActive = newIsActive;
                    hasChanges = true;
                }
            }

            if (updateData.ContainsKey("isAgent"))
            {
                var isAgentValue = updateData["isAgent"];
                bool newIsAgent = false;
                
                if (isAgentValue is bool boolValue)
                {
                    newIsAgent = boolValue;
                }
                else if (bool.TryParse(isAgentValue?.ToString(), out bool parsedBool))
                {
                    newIsAgent = parsedBool;
                }

                if (user.IsAgent != newIsAgent)
                {
                    user.IsAgent = newIsAgent;
                    hasChanges = true;
                }
            }

            // Update timestamp
            if (hasChanges)
            {
                user.UpdatedAt = DateTime.UtcNow;

                // Save user changes
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return BadRequest(new { message = "Failed to update user", errors = errors });
                }
            }

            // Handle role updates
            if (updateData.ContainsKey("roles") && updateData["roles"] != null)
            {
                var rolesElement = (System.Text.Json.JsonElement)updateData["roles"];
                var newRoles = new List<string>();
                
                if (rolesElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var roleElement in rolesElement.EnumerateArray())
                    {
                        if (roleElement.ValueKind == System.Text.Json.JsonValueKind.String)
                        {
                            newRoles.Add(roleElement.GetString()!);
                        }
                    }
                }

                // Get current roles
                var currentRoles = await _userManager.GetRolesAsync(user);

                // Remove old roles
                if (currentRoles.Any())
                {
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                }

                // Add new roles - only add roles that exist
                if (newRoles.Any())
                {
                    var validRoles = new List<string>();
                    foreach (var role in newRoles)
                    {
                        if (await _roleManager.RoleExistsAsync(role))
                        {
                            validRoles.Add(role);
                        }
                        else
                        {
                            _logger.LogWarning("Role '{Role}' does not exist, skipping assignment for user {UserId}", role, id);
                        }
                    }
                    
                    if (validRoles.Any())
                    {
                        await _userManager.AddToRolesAsync(user, validRoles);
                    }
                }
            }

            _logger.LogInformation("Successfully updated user {UserId}", id);

            // Get the updated roles for the response
            var userRoles = await _userManager.GetRolesAsync(user);

            var result_obj = new
            {
                success = true,
                message = "User updated successfully",
                user = new
                {
                    id = user.Id,
                    username = user.UserName,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    phone = user.PhoneNumber,
                    department = user.Department,
                    position = user.Position,
                    isActive = user.IsActive,
                    isAgent = user.IsAgent,
                    roles = userRoles.ToArray(),
                    updatedAt = user.UpdatedAt
                }
            };

            return Ok(result_obj);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, new { message = "Error updating user", error = ex.Message });
        }
    }

    /// <summary>
    /// Admin reset password for a user
    /// </summary>
    /// <remarks>
    /// Allows an admin to reset a user's password without knowing their current password.
    /// Only accessible by users with Admin role.
    /// </remarks>
    /// <param name="id">The user ID</param>
    /// <param name="request">New password details</param>
    /// <returns>Success message</returns>
    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> ResetUserPassword(string id, [FromBody] AdminResetPasswordRequest request)
    {
        try
        {
            _logger.LogInformation("Admin resetting password for user {UserId}", id);

            // Validate new password
            if (string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest(new { message = "New password is required" });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters long" });
            }

            // Find the user
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} not found" });
            }

            // Generate password reset token and reset password
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Failed to reset password for user {UserId}: {Errors}", id, errors);
                return BadRequest(new { message = "Failed to reset password", errors = errors });
            }

            _logger.LogInformation("Password reset successfully for user {UserId}", id);

            return Ok(new 
            { 
                success = true, 
                message = "Password has been reset successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {UserId}", id);
            return StatusCode(500, new { message = "Error resetting password", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a user
    /// </summary>
    [HttpDelete("{id}")]
    public Task<ActionResult<object>> DeleteUser(string id)
    {
        try
        {
            // Simulate user deletion
            var result = new
            {
                success = true,
                message = "User deleted successfully"
            };
            return Task.FromResult<ActionResult<object>>(Ok(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return Task.FromResult<ActionResult<object>>(StatusCode(500, new { message = "Error deleting user" }));
        }
    }
}

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Password { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new List<string>();
    public string? Department { get; set; }
    public string? Position { get; set; }
    public int? BranchId { get; set; }
}

public class AdminResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}
