using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Services;

public interface IERPIntegrationService
{
    Task<ERPApiResponse<List<ERPRole>>> GetRoleDetailsAsync();
    Task<ERPApiResponse<List<ERPUser>>> GetUserMasterListAsync();
    Task<bool> TestConnectionAsync(string apiUrl);
    Task<string?> AuthenticateAsync();
    Task<bool> TestAuthenticationAsync();
}

public class ERPIntegrationService : IERPIntegrationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ERPIntegrationService> _logger;
    private const string BASE_URL = "http://110.5.79.24:440/api";
    private const string ERP_USERNAME = "api@babajishivram.com";
    private const string ERP_PASSWORD = "Ap!@2025@!";
    private string? _jwtToken = null;
    private DateTime _tokenExpiry = DateTime.MinValue;

    public ERPIntegrationService(HttpClient httpClient, ILogger<ERPIntegrationService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate with ERP system and get JWT token
    /// </summary>
    public async Task<string?> AuthenticateAsync()
    {
        try
        {
            _logger.LogInformation("Authenticating with ERP system");

            var loginRequest = new
            {
                username = ERP_USERNAME,
                password = ERP_PASSWORD
            };

            var jsonContent = JsonSerializer.Serialize(loginRequest);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{BASE_URL}/auth/login", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var authResponse = JsonSerializer.Deserialize<AuthResponse>(responseContent, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                if (authResponse?.Token != null)
                {
                    _jwtToken = authResponse.Token;
                    _tokenExpiry = DateTime.UtcNow.AddHours(1); // Assume 1 hour expiry
                    
                    // Set default authorization header
                    _httpClient.DefaultRequestHeaders.Authorization = 
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _jwtToken);
                    
                    _logger.LogInformation("Successfully authenticated with ERP system");
                    return _jwtToken;
                }
            }
            
            _logger.LogWarning("Failed to authenticate with ERP system. Status: {StatusCode}", response.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error authenticating with ERP system");
            return null;
        }
    }

    /// <summary>
    /// Test authentication with ERP system
    /// </summary>
    public async Task<bool> TestAuthenticationAsync()
    {
        var token = await AuthenticateAsync();
        return !string.IsNullOrEmpty(token);
    }

    /// <summary>
    /// Ensure we have a valid JWT token
    /// </summary>
    private async Task<bool> EnsureAuthenticatedAsync()
    {
        if (string.IsNullOrEmpty(_jwtToken) || DateTime.UtcNow >= _tokenExpiry)
        {
            var token = await AuthenticateAsync();
            return !string.IsNullOrEmpty(token);
        }
        return true;
    }

    /// <summary>
    /// Get all role details from ERP system
    /// </summary>
    public async Task<ERPApiResponse<List<ERPRole>>> GetRoleDetailsAsync()
    {
        try
        {
            _logger.LogInformation("Fetching role details from ERP system");
            
            if (!await EnsureAuthenticatedAsync())
            {
                return new ERPApiResponse<List<ERPRole>>
                {
                    Success = false,
                    Data = new List<ERPRole>(),
                    Message = "Failed to authenticate with ERP system",
                    ResponseTime = DateTime.UtcNow
                };
            }
            
            var response = await _httpClient.GetAsync($"{BASE_URL}/CHAImport/GetAllRoleDetails");
            
            if (response.IsSuccessStatusCode)
            {
                var jsonContent = await response.Content.ReadAsStringAsync();
                var roles = JsonSerializer.Deserialize<List<ERPRole>>(jsonContent, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                _logger.LogInformation("Successfully fetched {Count} roles from ERP system", roles?.Count ?? 0);
                
                return new ERPApiResponse<List<ERPRole>>
                {
                    Success = true,
                    Data = roles ?? new List<ERPRole>(),
                    Message = "Roles fetched successfully",
                    ResponseTime = DateTime.UtcNow
                };
            }
            else
            {
                _logger.LogWarning("Failed to fetch roles from ERP system. Status: {StatusCode}", response.StatusCode);
                return new ERPApiResponse<List<ERPRole>>
                {
                    Success = false,
                    Data = new List<ERPRole>(),
                    Message = $"Failed to fetch roles. HTTP {response.StatusCode}",
                    ResponseTime = DateTime.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching role details from ERP system");
            return new ERPApiResponse<List<ERPRole>>
            {
                Success = false,
                Data = new List<ERPRole>(),
                Message = $"Error: {ex.Message}",
                ResponseTime = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Get all users from ERP system user master list
    /// </summary>
    public async Task<ERPApiResponse<List<ERPUser>>> GetUserMasterListAsync()
    {
        try
        {
            _logger.LogInformation("Fetching user master list from ERP system");
            
            if (!await EnsureAuthenticatedAsync())
            {
                return new ERPApiResponse<List<ERPUser>>
                {
                    Success = false,
                    Data = new List<ERPUser>(),
                    Message = "Failed to authenticate with ERP system",
                    ResponseTime = DateTime.UtcNow
                };
            }
            
            var response = await _httpClient.GetAsync($"{BASE_URL}/CHAImport/GetUserMasterList");
            
            if (response.IsSuccessStatusCode)
            {
                var jsonContent = await response.Content.ReadAsStringAsync();
                var users = JsonSerializer.Deserialize<List<ERPUser>>(jsonContent, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                _logger.LogInformation("Successfully fetched {Count} users from ERP system", users?.Count ?? 0);
                
                return new ERPApiResponse<List<ERPUser>>
                {
                    Success = true,
                    Data = users ?? new List<ERPUser>(),
                    Message = "Users fetched successfully",
                    ResponseTime = DateTime.UtcNow
                };
            }
            else
            {
                _logger.LogWarning("Failed to fetch users from ERP system. Status: {StatusCode}", response.StatusCode);
                return new ERPApiResponse<List<ERPUser>>
                {
                    Success = false,
                    Data = new List<ERPUser>(),
                    Message = $"Failed to fetch users. HTTP {response.StatusCode}",
                    ResponseTime = DateTime.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user master list from ERP system");
            return new ERPApiResponse<List<ERPUser>>
            {
                Success = false,
                Data = new List<ERPUser>(),
                Message = $"Error: {ex.Message}",
                ResponseTime = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Test connection to ERP API endpoint
    /// </summary>
    public async Task<bool> TestConnectionAsync(string apiUrl)
    {
        try
        {
            _logger.LogInformation("Testing connection to ERP API: {ApiUrl}", apiUrl);
            
            if (!await EnsureAuthenticatedAsync())
            {
                _logger.LogWarning("Authentication failed during connection test");
                return false;
            }
            
            var response = await _httpClient.GetAsync(apiUrl);
            var isSuccess = response.IsSuccessStatusCode;
            
            _logger.LogInformation("Connection test result for {ApiUrl}: {Success}", apiUrl, isSuccess);
            
            return isSuccess;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing connection to ERP API: {ApiUrl}", apiUrl);
            return false;
        }
    }
}

// Data models for ERP integration
public class ERPApiResponse<T>
{
    public bool Success { get; set; }
    public T Data { get; set; } = default!;
    public string Message { get; set; } = string.Empty;
    public DateTime ResponseTime { get; set; }
}

public class AuthResponse
{
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime Expiry { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
}

public class ERPRole
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? Remarks { get; set; }
}

public class ERPUser
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Department { get; set; }
    public string? Designation { get; set; }
    public int? RoleId { get; set; }
    public string? RoleName { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? EmployeeCode { get; set; }
}
