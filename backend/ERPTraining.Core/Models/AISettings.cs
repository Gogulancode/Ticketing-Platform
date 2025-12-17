namespace ERPTraining.Core.Models;

/// <summary>
/// Configuration settings for AI services (OpenAI-compatible endpoints)
/// Supports DeepSeek, OpenAI, Azure OpenAI, and other compatible providers
/// </summary>
public class AISettings
{
    public const string SectionName = "AISettings";
    
    /// <summary>
    /// Whether AI features are enabled
    /// </summary>
    public bool Enabled { get; set; } = false;
    
    /// <summary>
    /// AI Provider: "deepseek", "openai", "azure", "ollama", "custom"
    /// </summary>
    public string Provider { get; set; } = "deepseek";
    
    /// <summary>
    /// API Key for the AI service
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Base URL for the API endpoint
    /// DeepSeek: https://api.deepseek.com/v1
    /// OpenAI: https://api.openai.com/v1
    /// Azure: https://{resource}.openai.azure.com/openai/deployments/{deployment}
    /// Ollama: http://localhost:11434/v1
    /// </summary>
    public string BaseUrl { get; set; } = "https://api.deepseek.com/v1";
    
    /// <summary>
    /// Model name to use
    /// DeepSeek: deepseek-chat, deepseek-coder
    /// OpenAI: gpt-4, gpt-3.5-turbo
    /// </summary>
    public string Model { get; set; } = "deepseek-chat";
    
    /// <summary>
    /// Maximum tokens for responses
    /// </summary>
    public int MaxTokens { get; set; } = 1024;
    
    /// <summary>
    /// Temperature for response generation (0.0 - 2.0)
    /// Lower = more focused, Higher = more creative
    /// </summary>
    public double Temperature { get; set; } = 0.3;
    
    /// <summary>
    /// Request timeout in seconds
    /// </summary>
    public int TimeoutSeconds { get; set; } = 60;
    
    /// <summary>
    /// Azure-specific: API version
    /// </summary>
    public string? AzureApiVersion { get; set; } = "2024-02-01";
    
    /// <summary>
    /// System prompt for ticket categorization
    /// </summary>
    public string? CategorizationPrompt { get; set; }
    
    /// <summary>
    /// System prompt for response suggestions
    /// </summary>
    public string? ResponseSuggestionPrompt { get; set; }
    
    /// <summary>
    /// System prompt for ticket summarization
    /// </summary>
    public string? SummarizationPrompt { get; set; }
    
    /// <summary>
    /// Task-specific model overrides
    /// Allows using different models for different tasks (e.g., fast model for summaries, powerful model for analysis)
    /// </summary>
    public TaskModelSettings? TaskModels { get; set; }
}

/// <summary>
/// Task-specific model configuration
/// </summary>
public class TaskModelSettings
{
    /// <summary>
    /// Model for summarization tasks (fast model recommended)
    /// </summary>
    public string? Summary { get; set; }
    
    /// <summary>
    /// Model for reply/response suggestion tasks (fast model recommended)
    /// </summary>
    public string? Reply { get; set; }
    
    /// <summary>
    /// Model for analysis tasks like branch-wise reports (powerful model recommended)
    /// </summary>
    public string? Analysis { get; set; }
    
    /// <summary>
    /// Model for categorization tasks
    /// </summary>
    public string? Categorization { get; set; }
}
