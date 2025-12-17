namespace ERPTraining.Core.DTOs.AI;

/// <summary>
/// DTO for reading/updating AI settings
/// </summary>
public class AISettingsDto
{
    public bool Enabled { get; set; }
    public string Provider { get; set; } = "deepseek";
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.deepseek.com/v1";
    public string Model { get; set; } = "deepseek-chat";
    public int MaxTokens { get; set; } = 1024;
    public double Temperature { get; set; } = 0.3;
    public int TimeoutSeconds { get; set; } = 60;
    public string? AzureApiVersion { get; set; }
}

/// <summary>
/// Response for getting AI settings (masks API key)
/// </summary>
public class AISettingsResponseDto
{
    public bool Enabled { get; set; }
    public string Provider { get; set; } = string.Empty;
    public bool HasApiKey { get; set; }
    public string ApiKeyMasked { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int MaxTokens { get; set; }
    public double Temperature { get; set; }
    public int TimeoutSeconds { get; set; }
    public string? AzureApiVersion { get; set; }
}

/// <summary>
/// Request to update AI settings
/// </summary>
public class UpdateAISettingsRequest
{
    public bool? Enabled { get; set; }
    public string? Provider { get; set; }
    public string? ApiKey { get; set; }
    public string? BaseUrl { get; set; }
    public string? Model { get; set; }
    public int? MaxTokens { get; set; }
    public double? Temperature { get; set; }
    public int? TimeoutSeconds { get; set; }
    public string? AzureApiVersion { get; set; }
}

/// <summary>
/// Available AI providers for dropdown
/// </summary>
public class AIProviderInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DefaultBaseUrl { get; set; } = string.Empty;
    public List<string> SuggestedModels { get; set; } = new();
}

/// <summary>
/// Response with list of available providers
/// </summary>
public class AIProvidersResponse
{
    public List<AIProviderInfo> Providers { get; set; } = new();
}

/// <summary>
/// Test connection request
/// </summary>
public class TestAIConnectionRequest
{
    public string? Provider { get; set; }
    public string? ApiKey { get; set; }
    public string? BaseUrl { get; set; }
    public string? Model { get; set; }
}

/// <summary>
/// Test connection response
/// </summary>
public class TestAIConnectionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? ResponseTimeMs { get; set; }
}
