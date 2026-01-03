using ERPTraining.Core.DTOs.AI;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace ERPTraining.API.Controllers;

/// <summary>
/// Manage AI configuration settings (Admin only)
/// </summary>
[ApiController]
[Route("ai/settings")]
[Authorize(Roles = "Admin,SuperAdmin,Administrator")]
public class AISettingsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AISettingsController> _logger;
    private readonly AISettings _currentSettings;

    public AISettingsController(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        IOptions<AISettings> aiSettings,
        ILogger<AISettingsController> logger)
    {
        _configuration = configuration;
        _environment = environment;
        _currentSettings = aiSettings.Value;
        _logger = logger;
    }

    /// <summary>
    /// Get current AI settings (API key masked)
    /// </summary>
    [HttpGet]
    public ActionResult<AISettingsResponseDto> GetSettings()
    {
        var response = new AISettingsResponseDto
        {
            Enabled = _currentSettings.Enabled,
            Provider = _currentSettings.Provider ?? "deepseek",
            HasApiKey = !string.IsNullOrEmpty(_currentSettings.ApiKey),
            ApiKeyMasked = MaskApiKey(_currentSettings.ApiKey),
            BaseUrl = _currentSettings.BaseUrl ?? "https://api.deepseek.com/v1",
            Model = _currentSettings.Model ?? "deepseek-chat",
            MaxTokens = _currentSettings.MaxTokens,
            Temperature = _currentSettings.Temperature,
            TimeoutSeconds = _currentSettings.TimeoutSeconds,
            AzureApiVersion = _currentSettings.AzureApiVersion
        };

        return Ok(response);
    }

    /// <summary>
    /// Update AI settings
    /// </summary>
    [HttpPut]
    public async Task<ActionResult<AISettingsResponseDto>> UpdateSettings([FromBody] UpdateAISettingsRequest request)
    {
        try
        {
            // Read the appsettings.json file
            var appSettingsPath = Path.Combine(_environment.ContentRootPath, "appsettings.json");
            
            if (!System.IO.File.Exists(appSettingsPath))
            {
                return BadRequest(new { error = "Configuration file not found" });
            }

            var json = await System.IO.File.ReadAllTextAsync(appSettingsPath);
            using var document = JsonDocument.Parse(json);
            
            // Create a new JSON object with updated values
            var root = document.RootElement;
            var options = new JsonSerializerOptions { WriteIndented = true };
            
            using var stream = new MemoryStream();
            using var writer = new Utf8JsonWriter(stream, new JsonWriterOptions { Indented = true });
            
            // Resolve API key outside the loop for use in response
            var resolvedApiKey = request.ApiKey;
            if (string.IsNullOrEmpty(resolvedApiKey) || resolvedApiKey.Contains("*"))
            {
                resolvedApiKey = _currentSettings.ApiKey;
            }
            
            writer.WriteStartObject();
            
            foreach (var property in root.EnumerateObject())
            {
                if (property.Name == "AISettings")
                {
                    writer.WritePropertyName("AISettings");
                    writer.WriteStartObject();
                    
                    // Write updated or existing values
                    writer.WriteBoolean("Enabled", request.Enabled ?? _currentSettings.Enabled);
                    writer.WriteString("Provider", request.Provider ?? _currentSettings.Provider ?? "deepseek");
                    writer.WriteString("ApiKey", resolvedApiKey ?? "");
                    
                    writer.WriteString("BaseUrl", request.BaseUrl ?? _currentSettings.BaseUrl ?? "https://api.deepseek.com/v1");
                    writer.WriteString("Model", request.Model ?? _currentSettings.Model ?? "deepseek-chat");
                    writer.WriteNumber("MaxTokens", request.MaxTokens ?? _currentSettings.MaxTokens);
                    writer.WriteNumber("Temperature", request.Temperature ?? _currentSettings.Temperature);
                    writer.WriteNumber("TimeoutSeconds", request.TimeoutSeconds ?? _currentSettings.TimeoutSeconds);
                    
                    if (!string.IsNullOrEmpty(request.AzureApiVersion ?? _currentSettings.AzureApiVersion))
                    {
                        writer.WriteString("AzureApiVersion", request.AzureApiVersion ?? _currentSettings.AzureApiVersion);
                    }
                    
                    writer.WriteEndObject();
                }
                else
                {
                    property.WriteTo(writer);
                }
            }
            
            writer.WriteEndObject();
            writer.Flush();
            
            // Write back to file
            var updatedJson = Encoding.UTF8.GetString(stream.ToArray());
            await System.IO.File.WriteAllTextAsync(appSettingsPath, updatedJson);
            
            _logger.LogInformation("AI settings updated successfully");

            // Return the updated settings (masked)
            return Ok(new AISettingsResponseDto
            {
                Enabled = request.Enabled ?? _currentSettings.Enabled,
                Provider = request.Provider ?? _currentSettings.Provider ?? "deepseek",
                HasApiKey = !string.IsNullOrEmpty(resolvedApiKey),
                ApiKeyMasked = MaskApiKey(resolvedApiKey),
                BaseUrl = request.BaseUrl ?? _currentSettings.BaseUrl ?? "https://api.deepseek.com/v1",
                Model = request.Model ?? _currentSettings.Model ?? "deepseek-chat",
                MaxTokens = request.MaxTokens ?? _currentSettings.MaxTokens,
                Temperature = request.Temperature ?? _currentSettings.Temperature,
                TimeoutSeconds = request.TimeoutSeconds ?? _currentSettings.TimeoutSeconds,
                AzureApiVersion = request.AzureApiVersion ?? _currentSettings.AzureApiVersion
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update AI settings");
            return StatusCode(500, new { error = "Failed to update settings", details = ex.Message });
        }
    }

    /// <summary>
    /// Get list of available AI providers
    /// </summary>
    [HttpGet("providers")]
    public ActionResult<AIProvidersResponse> GetProviders()
    {
        var providers = new AIProvidersResponse
        {
            Providers = new List<AIProviderInfo>
            {
                new AIProviderInfo
                {
                    Id = "deepseek",
                    Name = "DeepSeek",
                    DefaultBaseUrl = "https://api.deepseek.com/v1",
                    SuggestedModels = new List<string> { "deepseek-chat", "deepseek-coder" }
                },
                new AIProviderInfo
                {
                    Id = "openai",
                    Name = "OpenAI",
                    DefaultBaseUrl = "https://api.openai.com/v1",
                    SuggestedModels = new List<string> { "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo" }
                },
                new AIProviderInfo
                {
                    Id = "azure",
                    Name = "Azure OpenAI",
                    DefaultBaseUrl = "https://{resource}.openai.azure.com/openai/deployments/{deployment}",
                    SuggestedModels = new List<string> { "gpt-4", "gpt-35-turbo" }
                },
                new AIProviderInfo
                {
                    Id = "ollama",
                    Name = "Ollama (Local)",
                    DefaultBaseUrl = "http://localhost:11434/v1",
                    SuggestedModels = new List<string> { "deepseek-coder:6.7b", "deepseek-coder:1.3b", "llama2", "mistral", "codellama", "phi", "qwen2:7b" }
                },
                new AIProviderInfo
                {
                    Id = "custom",
                    Name = "Custom OpenAI-Compatible",
                    DefaultBaseUrl = "",
                    SuggestedModels = new List<string>()
                }
            }
        };

        return Ok(providers);
    }

    /// <summary>
    /// Test AI connection with provided settings
    /// </summary>
    [HttpPost("test")]
    public async Task<ActionResult<TestAIConnectionResponse>> TestConnection([FromBody] TestAIConnectionRequest request)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            var provider = request.Provider ?? _currentSettings.Provider ?? "deepseek";
            var apiKey = request.ApiKey;
            
            // If no API key provided or it's masked, use existing
            if (string.IsNullOrEmpty(apiKey) || apiKey.Contains("*"))
            {
                apiKey = _currentSettings.ApiKey;
            }
            
            var baseUrl = request.BaseUrl ?? _currentSettings.BaseUrl ?? "https://api.deepseek.com/v1";
            var model = request.Model ?? _currentSettings.Model ?? "deepseek-chat";

            if (string.IsNullOrEmpty(apiKey))
            {
                return Ok(new TestAIConnectionResponse
                {
                    Success = false,
                    Message = "API key is required"
                });
            }

            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);
            
            // Set authorization header
            if (provider.ToLower() == "azure")
            {
                httpClient.DefaultRequestHeaders.Add("api-key", apiKey);
            }
            else
            {
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
            }

            // Build the URL
            var url = baseUrl.TrimEnd('/') + "/chat/completions";
            if (provider.ToLower() == "azure")
            {
                url += $"?api-version={_currentSettings.AzureApiVersion ?? "2024-02-01"}";
            }

            // Create test request
            var testPayload = new
            {
                model = model,
                messages = new[]
                {
                    new { role = "user", content = "Say 'OK' if you can read this." }
                },
                max_tokens = 10
            };

            var content = new StringContent(
                JsonSerializer.Serialize(testPayload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await httpClient.PostAsync(url, content);
            stopwatch.Stop();

            if (response.IsSuccessStatusCode)
            {
                return Ok(new TestAIConnectionResponse
                {
                    Success = true,
                    Message = $"Successfully connected to {provider} ({model})",
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                });
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return Ok(new TestAIConnectionResponse
                {
                    Success = false,
                    Message = $"Connection failed: {response.StatusCode} - {errorContent}",
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                });
            }
        }
        catch (HttpRequestException ex)
        {
            stopwatch.Stop();
            return Ok(new TestAIConnectionResponse
            {
                Success = false,
                Message = $"Connection error: {ex.Message}",
                ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
            });
        }
        catch (TaskCanceledException)
        {
            stopwatch.Stop();
            return Ok(new TestAIConnectionResponse
            {
                Success = false,
                Message = "Connection timed out",
                ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
            });
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Error testing AI connection");
            return Ok(new TestAIConnectionResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
            });
        }
    }

    private static string MaskApiKey(string? apiKey)
    {
        if (string.IsNullOrEmpty(apiKey))
            return "";
        
        if (apiKey.Length <= 8)
            return new string('*', apiKey.Length);
        
        return apiKey.Substring(0, 4) + new string('*', apiKey.Length - 8) + apiKey.Substring(apiKey.Length - 4);
    }
}
