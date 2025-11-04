using System.Text;
using System.Text.Json;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Services;

public class ERPApiService : IERPApiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ERPApiService> _logger;
    private string? _currentToken;
    private DateTime _tokenExpiry;

    private readonly string _baseUrl;
    private readonly string _adminEmail;
    private readonly string _adminPassword;

    public ERPApiService(HttpClient httpClient, IConfiguration configuration, ILogger<ERPApiService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        // Read from configuration instead of hardcoding
        _baseUrl = configuration["ERPApi:BaseUrl"] ?? "http://154.84.227.120:440/api";
        _adminEmail = configuration["ERPApi:AdminEmail"] ?? "admin@babajishivram.com";
        _adminPassword = configuration["ERPApi:AdminPassword"] ?? "admin";

        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<string?> LoginAsync(string email, string password)
    {
        try
        {
            _logger.LogInformation("🔐 Attempting ERP login for {Email} at {Url}", email, $"{_baseUrl}/Login");
            
            var loginRequest = new ERPLoginRequestDto
            {
                Email = email,
                Password = password
            };

            var json = JsonSerializer.Serialize(loginRequest);
            _logger.LogDebug("📤 Request body: {Json}", json);
            
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogDebug("⏳ Sending POST request to ERP API...");
            var response = await _httpClient.PostAsync($"{_baseUrl}/Login", content);
            _logger.LogInformation("📥 ERP API response status: {StatusCode}", response.StatusCode);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("ERP Login successful for {Email}", email);

                // The ERP API might return just a token string or a JSON object
                try
                {
                    // Try to parse as JSON first
                    var loginResponse = JsonSerializer.Deserialize<ERPLoginResponseDto>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (loginResponse != null && !string.IsNullOrEmpty(loginResponse.Token))
                    {
                        _currentToken = loginResponse.Token.StartsWith("Bearer ") ? loginResponse.Token : $"Bearer {loginResponse.Token}";
                        _tokenExpiry = DateTime.UtcNow.AddHours(1);
                        return _currentToken;
                    }
                }
                catch (JsonException)
                {
                    // If JSON parsing fails, assume the response is just the token
                    if (!string.IsNullOrWhiteSpace(responseContent))
                    {
                        var token = responseContent.Trim().Trim('"'); // Remove any quotes
                        _currentToken = token.StartsWith("Bearer ") ? token : $"Bearer {token}";
                        _tokenExpiry = DateTime.UtcNow.AddHours(1);
                        return _currentToken;
                    }
                }
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("ERP Login failed for {Email}. Status: {Status}, Response: {Response}", 
                    email, response.StatusCode, errorContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during ERP login for {Email}", email);
        }

        return null;
    }

    public async Task<List<ERPModuleDto>> GetModulesAsync(string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", token);

            var response = await _httpClient.GetAsync($"{_baseUrl}/CHAImport/GetModulelist");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var modules = JsonSerializer.Deserialize<List<ERPModuleDto>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("Retrieved {Count} modules from ERP", modules?.Count ?? 0);
                return modules ?? new List<ERPModuleDto>();
            }
            else
            {
                _logger.LogWarning("Failed to get modules from ERP. Status: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving modules from ERP");
        }

        return new List<ERPModuleDto>();
    }

    public async Task<List<ERPSectionDto>> GetSectionsAsync(string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", token);

            var response = await _httpClient.GetAsync($"{_baseUrl}/CHAImport/GetPageMasterList");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var sections = JsonSerializer.Deserialize<List<ERPSectionDto>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("Retrieved {Count} sections from ERP", sections?.Count ?? 0);
                return sections ?? new List<ERPSectionDto>();
            }
            else
            {
                _logger.LogWarning("Failed to get sections from ERP. Status: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sections from ERP");
        }

        return new List<ERPSectionDto>();
    }

    public async Task<List<ERPUserDto>> GetUsersAsync(string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", token);

            var response = await _httpClient.GetAsync($"{_baseUrl}/CHAImport/GetUserMasterList");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var users = JsonSerializer.Deserialize<List<ERPUserDto>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("Retrieved {Count} users from ERP", users?.Count ?? 0);
                return users ?? new List<ERPUserDto>();
            }
            else
            {
                _logger.LogWarning("Failed to get users from ERP. Status: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users from ERP");
        }

        return new List<ERPUserDto>();
    }

    public async Task<List<ERPRoleDto>> GetRolesAsync(string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", token);

            var response = await _httpClient.GetAsync($"{_baseUrl}/CHAImport/GetAllRoleMaster");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                
                // Log a sample of the raw response for debugging
                var sampleContent = content.Length > 500 ? content.Substring(0, 500) + "..." : content;
                _logger.LogDebug("ERP Roles API response sample: {Content}", sampleContent);
                
                var roles = JsonSerializer.Deserialize<List<ERPRoleDto>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("Retrieved {Count} roles from ERP", roles?.Count ?? 0);
                
                // Log first few roles for debugging
                if (roles?.Count > 0)
                {
                    var firstRole = roles.First();
                    _logger.LogDebug("First role: lRoleId={lRoleId}, sName='{sName}', sRemarks='{sRemarks}'", 
                        firstRole.lRoleId, firstRole.sName, firstRole.sRemarks);
                }
                
                return roles ?? new List<ERPRoleDto>();
            }
            else
            {
                _logger.LogWarning("Failed to get roles from ERP. Status: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving roles from ERP");
        }

        return new List<ERPRoleDto>();
    }

    public async Task<List<ERPRoleDetailsDto>> GetRoleDetailsAsync(string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", token);

            var response = await _httpClient.GetAsync($"{_baseUrl}/CHAImport/GetAllRoleDetails");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var roleDetails = JsonSerializer.Deserialize<List<ERPRoleDetailsDto>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("Retrieved {Count} role details from ERP", roleDetails?.Count ?? 0);
                return roleDetails ?? new List<ERPRoleDetailsDto>();
            }
            else
            {
                _logger.LogWarning("Failed to get role details from ERP. Status: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving role details from ERP");
        }

        return new List<ERPRoleDetailsDto>();
    }

    public async Task<List<ERPRoleDetailApiDto>> GetAllRoleDetailsAsync(string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", token);

            var response = await _httpClient.GetAsync($"{_baseUrl}/CHAImport/GetAllRoleDetails");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                
                // Log a sample of the raw response for debugging
                var sampleContent = content.Length > 500 ? content.Substring(0, 500) + "..." : content;
                _logger.LogDebug("ERP Role Details API response sample: {Content}", sampleContent);
                
                var roleDetails = JsonSerializer.Deserialize<List<ERPRoleDetailApiDto>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("Retrieved {Count} role details from ERP GetAllRoleDetails API", roleDetails?.Count ?? 0);
                
                // Log first few role details for debugging
                if (roleDetails?.Count > 0)
                {
                    var firstDetail = roleDetails.First();
                    _logger.LogDebug("First role detail: lRoleId={lRoleId}, lModuleId={lModuleId}, lTaskId={lTaskId}, sTaskId='{sTaskId}'", 
                        firstDetail.lRoleId, firstDetail.lModuleId, firstDetail.lTaskId, firstDetail.sTaskId);
                }
                
                return roleDetails ?? new List<ERPRoleDetailApiDto>();
            }
            else
            {
                _logger.LogWarning("Failed to get role details from ERP GetAllRoleDetails API. Status: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving role details from ERP GetAllRoleDetails API");
        }

        return new List<ERPRoleDetailApiDto>();
    }

    public async Task<List<ERPUserMasterApiDto>> GetUserMasterListAsync(string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", token);

            var response = await _httpClient.GetAsync($"{_baseUrl}/CHAImport/GetUserMasterList");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                
                // Log a sample of the raw response for debugging
                _logger.LogDebug("ERP User Master API Response (first 500 chars): {ResponseSample}", 
                    content.Length > 500 ? content.Substring(0, 500) + "..." : content);

                var users = JsonSerializer.Deserialize<List<ERPUserMasterApiDto>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (users != null && users.Count > 0)
                {
                    _logger.LogInformation("Successfully retrieved {UserCount} users from ERP GetUserMasterList API", users.Count);
                    return users;
                }

                _logger.LogWarning("ERP GetUserMasterList API returned empty or null user list");
                return users ?? new List<ERPUserMasterApiDto>();
            }
            else
            {
                _logger.LogError("ERP GetUserMasterList API failed with status: {StatusCode}, Response: {Response}",
                    response.StatusCode, await response.Content.ReadAsStringAsync());
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users from ERP GetUserMasterList API");
        }

        return new List<ERPUserMasterApiDto>();
    }

    public async Task<bool> ValidateTokenAsync(string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", token);

            // Try to get modules to validate token
            var response = await _httpClient.GetAsync($"{_baseUrl}/CHAImport/GetModulelist");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task RefreshTokenIfNeededAsync()
    {
        if (string.IsNullOrEmpty(_currentToken) || DateTime.UtcNow >= _tokenExpiry.AddMinutes(-5))
        {
            _logger.LogInformation("Refreshing ERP token");
            var loginResponse = await LoginAsync(_adminEmail, _adminPassword);
            
            if (loginResponse == null)
            {
                _logger.LogError("Failed to refresh ERP token");
                throw new InvalidOperationException("Failed to refresh ERP token");
            }
        }
    }

    public async Task<bool> EnsureAuthenticatedAsync()
    {
        try
        {
            if (!string.IsNullOrEmpty(_currentToken) && DateTime.UtcNow < _tokenExpiry)
            {
                return true;
            }

            _logger.LogInformation("Authenticating with ERP API");
            var token = await LoginAsync(_adminEmail, _adminPassword);
            
            return !string.IsNullOrEmpty(token);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to ensure ERP authentication");
            return false;
        }
    }

    public string? GetCurrentToken()
    {
        return _currentToken;
    }
}
