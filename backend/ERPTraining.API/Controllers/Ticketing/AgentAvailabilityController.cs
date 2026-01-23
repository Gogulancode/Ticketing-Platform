using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Security.Claims;

namespace ERPTraining.API.Controllers.Ticketing;

/// <summary>
/// Manages agent availability/shift status for ticket assignment
/// </summary>
[ApiController]
[Route("api/agents/availability")]
[Authorize]
public class AgentAvailabilityController : ControllerBase
{
    private readonly string _connectionString;
    private readonly ILogger<AgentAvailabilityController> _logger;

    public AgentAvailabilityController(
        IConfiguration configuration,
        ILogger<AgentAvailabilityController> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
        _logger = logger;
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("userId")?.Value;
    }

    /// <summary>
    /// Get current user's availability status
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult> GetMyAvailability()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                SELECT a.Id, a.Name, a.Email, a.IsAvailable, a.ShiftStatus, a.LastStatusChange,
                       a.CurrentTicketCount, a.MaxTicketsCapacity
                FROM Agents a
                WHERE a.UserId = @UserId AND a.IsActive = 1";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@UserId", userId);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return Ok(new
                {
                    agentId = reader["Id"],
                    name = reader["Name"]?.ToString(),
                    email = reader["Email"]?.ToString(),
                    isAvailable = reader["IsAvailable"] != DBNull.Value && (bool)reader["IsAvailable"],
                    shiftStatus = reader["ShiftStatus"]?.ToString() ?? "Available",
                    lastStatusChange = reader["LastStatusChange"] != DBNull.Value 
                        ? ((DateTime)reader["LastStatusChange"]).ToString("yyyy-MM-ddTHH:mm:ssZ") 
                        : null,
                    currentTicketCount = reader["CurrentTicketCount"] != DBNull.Value ? (int)reader["CurrentTicketCount"] : 0,
                    maxTicketsCapacity = reader["MaxTicketsCapacity"] != DBNull.Value ? (int)reader["MaxTicketsCapacity"] : 10
                });
            }

            return NotFound(new { error = "Agent profile not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agent availability");
            return StatusCode(500, new { error = "Error getting availability status" });
        }
    }

    /// <summary>
    /// Toggle current user's availability status
    /// </summary>
    [HttpPut("me")]
    public async Task<ActionResult> UpdateMyAvailability([FromBody] UpdateAvailabilityRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                UPDATE Agents 
                SET IsAvailable = @IsAvailable,
                    ShiftStatus = @ShiftStatus,
                    LastStatusChange = @LastStatusChange,
                    UpdatedAt = @UpdatedAt
                WHERE UserId = @UserId AND IsActive = 1";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@UserId", userId);
            command.Parameters.AddWithValue("@IsAvailable", request.IsAvailable);
            command.Parameters.AddWithValue("@ShiftStatus", request.ShiftStatus ?? (request.IsAvailable ? "Available" : "Shift Closed"));
            command.Parameters.AddWithValue("@LastStatusChange", DateTime.UtcNow);
            command.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            if (rowsAffected == 0)
            {
                return NotFound(new { error = "Agent profile not found" });
            }

            _logger.LogInformation("Agent {UserId} changed availability to {IsAvailable} ({ShiftStatus})", 
                userId, request.IsAvailable, request.ShiftStatus);

            return Ok(new
            {
                message = request.IsAvailable ? "You are now available for new tickets" : "Your shift is now closed",
                isAvailable = request.IsAvailable,
                shiftStatus = request.ShiftStatus ?? (request.IsAvailable ? "Available" : "Shift Closed")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating agent availability");
            return StatusCode(500, new { error = "Error updating availability status" });
        }
    }

    /// <summary>
    /// Get all agents with their availability status (for managers/admins)
    /// </summary>
    [HttpGet("all")]
    public async Task<ActionResult> GetAllAgentsAvailability()
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                SELECT a.Id, a.UserId, a.Name, a.Email, a.Department, 
                       a.IsAvailable, a.ShiftStatus, a.LastStatusChange,
                       a.CurrentTicketCount, a.MaxTicketsCapacity, a.IsActive
                FROM Agents a
                WHERE a.IsActive = 1
                ORDER BY a.IsAvailable DESC, a.Name";

            using var command = new SqlCommand(sql, connection);
            var agents = new List<object>();

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                agents.Add(new
                {
                    id = reader["Id"],
                    userId = reader["UserId"]?.ToString(),
                    name = reader["Name"]?.ToString(),
                    email = reader["Email"]?.ToString(),
                    department = reader["Department"]?.ToString(),
                    isAvailable = reader["IsAvailable"] != DBNull.Value && (bool)reader["IsAvailable"],
                    shiftStatus = reader["ShiftStatus"]?.ToString() ?? "Unknown",
                    lastStatusChange = reader["LastStatusChange"] != DBNull.Value
                        ? ((DateTime)reader["LastStatusChange"]).ToString("yyyy-MM-ddTHH:mm:ssZ")
                        : null,
                    currentTicketCount = reader["CurrentTicketCount"] != DBNull.Value ? (int)reader["CurrentTicketCount"] : 0,
                    maxTicketsCapacity = reader["MaxTicketsCapacity"] != DBNull.Value ? (int)reader["MaxTicketsCapacity"] : 10,
                    isActive = reader["IsActive"] != DBNull.Value && (bool)reader["IsActive"]
                });
            }

            var availableCount = agents.Count(a => ((dynamic)a).isAvailable);
            var unavailableCount = agents.Count - availableCount;

            return Ok(new
            {
                agents,
                summary = new
                {
                    total = agents.Count,
                    available = availableCount,
                    unavailable = unavailableCount
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all agents availability");
            return StatusCode(500, new { error = "Error getting agents availability" });
        }
    }

    /// <summary>
    /// Get only available agents (for ticket assignment)
    /// </summary>
    [HttpGet("available")]
    public async Task<ActionResult> GetAvailableAgents([FromQuery] int? departmentId = null)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                SELECT a.Id, a.UserId, a.Name, a.Email, a.Department,
                       a.CurrentTicketCount, a.MaxTicketsCapacity
                FROM Agents a
                WHERE a.IsActive = 1 
                  AND a.IsAvailable = 1 
                  AND a.ShiftStatus = 'Available'
                  AND (@DepartmentId IS NULL OR a.DepartmentId = @DepartmentId)
                ORDER BY a.CurrentTicketCount ASC, a.Name";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@DepartmentId", (object?)departmentId ?? DBNull.Value);

            var agents = new List<object>();
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                agents.Add(new
                {
                    id = reader["Id"],
                    userId = reader["UserId"]?.ToString(),
                    name = reader["Name"]?.ToString(),
                    email = reader["Email"]?.ToString(),
                    department = reader["Department"]?.ToString(),
                    currentTicketCount = reader["CurrentTicketCount"] != DBNull.Value ? (int)reader["CurrentTicketCount"] : 0,
                    maxTicketsCapacity = reader["MaxTicketsCapacity"] != DBNull.Value ? (int)reader["MaxTicketsCapacity"] : 10
                });
            }

            return Ok(agents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available agents");
            return StatusCode(500, new { error = "Error getting available agents" });
        }
    }

    /// <summary>
    /// Admin: Update any agent's availability
    /// </summary>
    [HttpPut("{agentId:int}")]
    public async Task<ActionResult> UpdateAgentAvailability(int agentId, [FromBody] UpdateAvailabilityRequest request)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                UPDATE Agents 
                SET IsAvailable = @IsAvailable,
                    ShiftStatus = @ShiftStatus,
                    LastStatusChange = @LastStatusChange,
                    UpdatedAt = @UpdatedAt
                WHERE Id = @AgentId";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@AgentId", agentId);
            command.Parameters.AddWithValue("@IsAvailable", request.IsAvailable);
            command.Parameters.AddWithValue("@ShiftStatus", request.ShiftStatus ?? (request.IsAvailable ? "Available" : "Shift Closed"));
            command.Parameters.AddWithValue("@LastStatusChange", DateTime.UtcNow);
            command.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            if (rowsAffected == 0)
            {
                return NotFound(new { error = "Agent not found" });
            }

            _logger.LogInformation("Admin updated agent {AgentId} availability to {IsAvailable}", agentId, request.IsAvailable);

            return Ok(new
            {
                message = "Agent availability updated",
                agentId,
                isAvailable = request.IsAvailable,
                shiftStatus = request.ShiftStatus
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating agent {AgentId} availability", agentId);
            return StatusCode(500, new { error = "Error updating agent availability" });
        }
    }
}

public class UpdateAvailabilityRequest
{
    public bool IsAvailable { get; set; }
    public string? ShiftStatus { get; set; }
}
