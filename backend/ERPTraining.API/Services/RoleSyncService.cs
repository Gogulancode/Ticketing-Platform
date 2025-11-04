using ERPTraining.Core.Entities;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace ERPTraining.API.Services
{
    public class RoleSyncService : IRoleSyncService
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RoleSyncService> _logger;

        public RoleSyncService(
            ApplicationDbContext context,
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<RoleSyncService> logger)
        {
            _context = context;
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<RoleSyncResult> SyncRolesAsync()
        {
            var result = new RoleSyncResult { SyncTime = DateTime.UtcNow };
            
            try
            {
                _logger.LogInformation("Starting role synchronization from external API");

                var baseUrl = _configuration["ExternalApis:BsBaseUrl"]?.TrimEnd('/');
                var apiKey = _configuration["API_KEYS:Primary"];
                
                if (string.IsNullOrEmpty(baseUrl) || string.IsNullOrEmpty(apiKey))
                {
                    result.Message = "External API configuration is missing";
                    _logger.LogWarning(result.Message);
                    return result;
                }

                var url = $"{baseUrl}/api/CHAImport/GetAllRoleDetails";
                
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
                
                var startTime = DateTime.UtcNow;
                var response = await _httpClient.SendAsync(request);
                result.ResponseTimeMs = (DateTime.UtcNow - startTime).TotalMilliseconds;

                if (!response.IsSuccessStatusCode)
                {
                    result.Message = $"External API returned {response.StatusCode}: {response.ReasonPhrase}";
                    _logger.LogWarning(result.Message);
                    return result;
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(jsonContent))
                {
                    result.Message = "Empty response from external API";
                    _logger.LogWarning(result.Message);
                    return result;
                }

                var externalRoles = JsonSerializer.Deserialize<List<RemoteRoleDto>>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (externalRoles == null || !externalRoles.Any())
                {
                    result.Message = "No roles found in external API response";
                    _logger.LogInformation(result.Message);
                    return result;
                }

                // Process roles and update database
                foreach (var externalRole in externalRoles)
                {
                    var existingRole = await _context.RoleMasters
                        .FirstOrDefaultAsync(r => r.ERPRoleId == externalRole.lRoleId);
                    
                    if (existingRole == null)
                    {
                        // Create new role
                        var newRole = new RoleMaster
                        {
                            ERPRoleId = externalRole.lRoleId,
                            RoleName = externalRole.sName ?? "Unknown Role",
                            Remarks = $"Synced from external API on {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}",
                            IsActive = true,
                            IsERPRole = true,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        
                        _context.RoleMasters.Add(newRole);
                        result.NewCount++;
                        _logger.LogDebug($"Added new role: {newRole.RoleName} (ERP ID: {newRole.ERPRoleId})");
                    }
                    else
                    {
                        // Update existing role if changed
                        var newRoleName = externalRole.sName ?? "Unknown Role";
                        if (existingRole.RoleName != newRoleName)
                        {
                            existingRole.RoleName = newRoleName;
                            existingRole.UpdatedAt = DateTime.UtcNow;
                            existingRole.Remarks = $"Updated from external API on {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}";
                            result.UpdatedCount++;
                            _logger.LogDebug($"Updated role: {existingRole.RoleName} (ERP ID: {existingRole.ERPRoleId})");
                        }
                    }
                }

                await _context.SaveChangesAsync();
                result.SyncedCount = externalRoles.Count;
                result.Success = true;
                result.Message = $"Successfully synced {result.SyncedCount} roles ({result.NewCount} new, {result.UpdatedCount} updated)";
                
                _logger.LogInformation(result.Message);

                // Store sync log
                await StoreSyncLog(result);

                return result;
            }
            catch (HttpRequestException ex)
            {
                result.Message = $"Network error while connecting to external API: {ex.Message}";
                _logger.LogError(ex, result.Message);
                return result;
            }
            catch (JsonException ex)
            {
                result.Message = $"Error parsing response from external API: {ex.Message}";
                _logger.LogError(ex, result.Message);
                return result;
            }
            catch (Exception ex)
            {
                result.Message = $"Unexpected error during role sync: {ex.Message}";
                _logger.LogError(ex, result.Message);
                return result;
            }
        }

        public async Task<RoleSyncResult> TestConnectionAsync()
        {
            var result = new RoleSyncResult { SyncTime = DateTime.UtcNow };
            
            try
            {
                var baseUrl = _configuration["ExternalApis:BsBaseUrl"]?.TrimEnd('/');
                var apiKey = _configuration["API_KEYS:Primary"];
                
                if (string.IsNullOrEmpty(baseUrl) || string.IsNullOrEmpty(apiKey))
                {
                    result.Message = "External API configuration is missing";
                    return result;
                }

                var url = $"{baseUrl}/api/CHAImport/GetAllRoleDetails";
                
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
                
                var startTime = DateTime.UtcNow;
                var response = await _httpClient.SendAsync(request);
                result.ResponseTimeMs = (DateTime.UtcNow - startTime).TotalMilliseconds;

                result.Success = response.IsSuccessStatusCode;
                result.Message = result.Success 
                    ? $"Connection successful (Status: {response.StatusCode}, Response time: {result.ResponseTimeMs:F1}ms)"
                    : $"Connection failed (Status: {response.StatusCode}: {response.ReasonPhrase})";

                return result;
            }
            catch (Exception ex)
            {
                result.Message = $"Connection test failed: {ex.Message}";
                _logger.LogError(ex, "Error testing external API connection");
                return result;
            }
        }

        public async Task<RoleSyncStatus> GetSyncStatusAsync()
        {
            var status = new RoleSyncStatus();
            
            try
            {
                status.TotalRoles = await _context.RoleMasters.CountAsync();
                status.RecentlyUpdated = await _context.RoleMasters
                    .Where(r => r.UpdatedAt >= DateTime.UtcNow.AddDays(-1))
                    .CountAsync();

                var lastSyncLog = await _context.RoleSyncLogs
                    .OrderByDescending(l => l.SyncTime)
                    .FirstOrDefaultAsync();

                if (lastSyncLog != null)
                {
                    status.LastSyncTime = lastSyncLog.SyncTime;
                    status.LastSyncStatus = lastSyncLog.Success ? "Success" : "Failed";
                }

                var baseUrl = _configuration["ExternalApis:BsBaseUrl"];
                var apiKey = _configuration["API_KEYS:Primary"];
                status.IsConfigured = !string.IsNullOrEmpty(baseUrl) && !string.IsNullOrEmpty(apiKey);

                return status;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sync status");
                return status;
            }
        }

        private async Task StoreSyncLog(RoleSyncResult result)
        {
            try
            {
                var log = new RoleSyncLog
                {
                    SyncTime = result.SyncTime,
                    Success = result.Success,
                    Message = result.Message,
                    SyncedCount = result.SyncedCount,
                    NewCount = result.NewCount,
                    UpdatedCount = result.UpdatedCount,
                    ResponseTimeMs = result.ResponseTimeMs
                };

                _context.RoleSyncLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error storing sync log");
            }
        }
    }
}
