using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using ERPTraining.Core.DTOs.AI;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ERPTraining.Infrastructure.Services.AI;

/// <summary>
/// AI Service implementation using OpenAI-compatible API
/// Works with DeepSeek, OpenAI, Azure OpenAI, Ollama, and other compatible providers
/// </summary>
public class OpenAICompatibleService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly AISettings _settings;
    private readonly ILogger<OpenAICompatibleService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public OpenAICompatibleService(
        HttpClient httpClient,
        IOptions<AISettings> settings,
        ILogger<OpenAICompatibleService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        ConfigureHttpClient();
    }

    private void ConfigureHttpClient()
    {
        if (!string.IsNullOrEmpty(_settings.ApiKey))
        {
            _httpClient.DefaultRequestHeaders.Clear();
            
            if (_settings.Provider?.ToLower() == "azure")
            {
                _httpClient.DefaultRequestHeaders.Add("api-key", _settings.ApiKey);
            }
            else
            {
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_settings.ApiKey}");
            }
        }
        
        _httpClient.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);
    }

    /// <summary>
    /// Gets the appropriate model for a specific task type
    /// </summary>
    private string GetModelForTask(string taskType)
    {
        var taskModels = _settings.TaskModels;
        if (taskModels == null)
            return _settings.Model;

        return taskType.ToLower() switch
        {
            "summary" => taskModels.Summary ?? _settings.Model,
            "reply" => taskModels.Reply ?? _settings.Model,
            "analysis" => taskModels.Analysis ?? _settings.Model,
            "categorization" => taskModels.Categorization ?? _settings.Model,
            _ => _settings.Model
        };
    }

    public async Task<AIStatusResponse> GetStatusAsync()
    {
        var response = new AIStatusResponse
        {
            Enabled = _settings.Enabled,
            Provider = _settings.Provider ?? "unknown",
            Model = _settings.Model ?? "unknown"
        };

        if (!_settings.Enabled)
        {
            response.ErrorMessage = "AI features are disabled in configuration";
            return response;
        }

        // API key is optional for Ollama (local) provider
        if (string.IsNullOrEmpty(_settings.ApiKey) && _settings.Provider?.ToLower() != "ollama")
        {
            response.ErrorMessage = "API key is not configured";
            return response;
        }

        try
        {
            // Simple test request to check connectivity
            var testRequest = new ChatCompletionRequest
            {
                Model = _settings.Model,
                Messages = new List<ChatMessage>
                {
                    new() { Role = "user", Content = "Hello" }
                },
                MaxTokens = 5
            };

            var result = await SendChatCompletionAsync(testRequest);
            response.Connected = result != null;
            
            if (!response.Connected)
            {
                response.ErrorMessage = "Failed to connect to AI service";
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI service connection test failed");
            response.Connected = false;
            response.ErrorMessage = $"Connection error: {ex.Message}";
        }

        return response;
    }

    public async Task<CategorizationResponse> CategorizeTicketAsync(CategorizationRequest request)
    {
        if (!_settings.Enabled)
        {
            return new CategorizationResponse 
            { 
                Success = false, 
                ErrorMessage = "AI features are disabled" 
            };
        }

        try
        {
            var systemPrompt = _settings.CategorizationPrompt ?? GetDefaultCategorizationPrompt();
            
            var userPrompt = $@"Analyze this support ticket and suggest the best category and priority.

Subject: {request.Subject}
Description: {request.Description}

Available Categories: {string.Join(", ", request.AvailableCategories)}
Available Priorities: {string.Join(", ", request.AvailablePriorities)}

Respond in JSON format:
{{
    ""category"": ""selected category from the list"",
    ""priority"": ""selected priority"",
    ""confidence"": 0.0 to 1.0,
    ""reasoning"": ""brief explanation""
}}";

            var chatRequest = new ChatCompletionRequest
            {
                Model = GetModelForTask("categorization"),
                Messages = new List<ChatMessage>
                {
                    new() { Role = "system", Content = systemPrompt },
                    new() { Role = "user", Content = userPrompt }
                },
                MaxTokens = _settings.MaxTokens,
                Temperature = _settings.Temperature
            };

            _logger.LogInformation("Using model {Model} for categorization task", chatRequest.Model);
            var result = await SendChatCompletionAsync(chatRequest);
            
            if (result == null)
            {
                return new CategorizationResponse 
                { 
                    Success = false, 
                    ErrorMessage = "No response from AI service" 
                };
            }

            // Parse the JSON response
            var jsonResponse = ExtractJsonFromResponse(result);
            var parsed = JsonSerializer.Deserialize<CategorizationJsonResponse>(jsonResponse, _jsonOptions);
            
            return new CategorizationResponse
            {
                Success = true,
                SuggestedCategory = parsed?.Category,
                SuggestedPriority = parsed?.Priority,
                Confidence = parsed?.Confidence ?? 0.5,
                Reasoning = parsed?.Reasoning
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error categorizing ticket");
            return new CategorizationResponse 
            { 
                Success = false, 
                ErrorMessage = $"Error: {ex.Message}" 
            };
        }
    }

    public async Task<ResponseSuggestionResponse> SuggestResponsesAsync(ResponseSuggestionRequest request)
    {
        if (!_settings.Enabled)
        {
            return new ResponseSuggestionResponse 
            { 
                Success = false, 
                ErrorMessage = "AI features are disabled" 
            };
        }

        try
        {
            var systemPrompt = _settings.ResponseSuggestionPrompt ?? GetDefaultResponsePrompt();
            
            var commentsContext = "";
            if (request.RecentComments.Any())
            {
                commentsContext = "\n\nConversation History:\n" + 
                    string.Join("\n", request.RecentComments.Select(c => 
                        $"[{c.Author} - {(c.IsInternal ? "Internal" : "Customer")}]: {c.Content}"));
            }

            var userPrompt = $@"Generate {request.SuggestionCount} response suggestions for this support ticket.

Subject: {request.TicketSubject}
Description: {request.TicketDescription}
Category: {request.Category ?? "Not set"}
Priority: {request.Priority ?? "Not set"}
Customer: {request.CustomerName ?? "Customer"}
Desired Tone: {request.Tone}
{commentsContext}

Respond in JSON format:
{{
    ""suggestions"": [
        {{
            ""title"": ""Brief title for this response"",
            ""content"": ""Full response text"",
            ""tone"": ""tone description""
        }}
    ]
}}";

            var chatRequest = new ChatCompletionRequest
            {
                Model = GetModelForTask("reply"),
                Messages = new List<ChatMessage>
                {
                    new() { Role = "system", Content = systemPrompt },
                    new() { Role = "user", Content = userPrompt }
                },
                MaxTokens = _settings.MaxTokens * 2, // More tokens for multiple suggestions
                Temperature = 0.7 // Slightly higher for more variety
            };

            _logger.LogInformation("Using model {Model} for reply suggestion task", chatRequest.Model);

            var result = await SendChatCompletionAsync(chatRequest);
            
            if (result == null)
            {
                return new ResponseSuggestionResponse 
                { 
                    Success = false, 
                    ErrorMessage = "No response from AI service" 
                };
            }

            var jsonResponse = ExtractJsonFromResponse(result);
            var parsed = JsonSerializer.Deserialize<ResponseSuggestionJsonResponse>(jsonResponse, _jsonOptions);
            
            return new ResponseSuggestionResponse
            {
                Success = true,
                Suggestions = parsed?.Suggestions?.Select(s => new SuggestedResponse
                {
                    Title = s.Title ?? "Suggested Response",
                    Content = s.Content ?? "",
                    Tone = s.Tone ?? request.Tone ?? "professional"
                }).ToList() ?? new List<SuggestedResponse>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating response suggestions");
            return new ResponseSuggestionResponse 
            { 
                Success = false, 
                ErrorMessage = $"Error: {ex.Message}" 
            };
        }
    }

    public async Task<SummarizationResponse> SummarizeTicketAsync(SummarizationRequest request)
    {
        if (!_settings.Enabled)
        {
            return new SummarizationResponse 
            { 
                Success = false, 
                ErrorMessage = "AI features are disabled" 
            };
        }

        try
        {
            var systemPrompt = _settings.SummarizationPrompt ?? GetDefaultSummarizationPrompt();
            
            var commentsText = "";
            if (request.Comments.Any())
            {
                commentsText = "\n\nTicket Thread:\n" + 
                    string.Join("\n\n", request.Comments.Select(c => 
                        $"[{c.CreatedAt:g}] {c.Author} ({(c.IsInternal ? "Staff" : "Customer")}):\n{c.Content}"));
            }

            var userPrompt = $@"Summarize this support ticket thread.

Subject: {request.TicketSubject}
Initial Description: {request.TicketDescription}
Category: {request.Category ?? "Not set"}
Status: {request.Status ?? "Unknown"}
Summary Type: {request.SummaryType}
{commentsText}

Respond in JSON format:
{{
    ""summary"": ""Brief summary of the ticket"",
    ""keyPoints"": [""key point 1"", ""key point 2""],
    ""actionItems"": [""action 1"", ""action 2""],
    ""customerSentiment"": ""positive/neutral/negative/frustrated""
}}";

            var chatRequest = new ChatCompletionRequest
            {
                Model = GetModelForTask("summary"),
                Messages = new List<ChatMessage>
                {
                    new() { Role = "system", Content = systemPrompt },
                    new() { Role = "user", Content = userPrompt }
                },
                MaxTokens = _settings.MaxTokens,
                Temperature = 0.3 // Lower for more consistent summaries
            };

            _logger.LogInformation("Using model {Model} for summarization task", chatRequest.Model);
            var result = await SendChatCompletionAsync(chatRequest);
            
            if (result == null)
            {
                return new SummarizationResponse 
                { 
                    Success = false, 
                    ErrorMessage = "No response from AI service" 
                };
            }

            var jsonResponse = ExtractJsonFromResponse(result);
            var parsed = JsonSerializer.Deserialize<SummarizationJsonResponse>(jsonResponse, _jsonOptions);
            
            return new SummarizationResponse
            {
                Success = true,
                Summary = parsed?.Summary,
                KeyPoints = parsed?.KeyPoints ?? new List<string>(),
                ActionItems = parsed?.ActionItems ?? new List<string>(),
                CustomerSentiment = parsed?.CustomerSentiment
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error summarizing ticket");
            return new SummarizationResponse 
            { 
                Success = false, 
                ErrorMessage = $"Error: {ex.Message}" 
            };
        }
    }

    public async Task<KnowledgeSearchResponse> SearchKnowledgeBaseAsync(KnowledgeSearchRequest request)
    {
        // Placeholder for future knowledge base integration
        // This would integrate with a vector database or semantic search
        return new KnowledgeSearchResponse
        {
            Success = false,
            ErrorMessage = "Knowledge base search is not yet implemented. Coming in a future update."
        };
    }

    public async Task<DashboardInsightsResponse> GenerateDashboardInsightsAsync(DashboardInsightsRequest request)
    {
        if (!_settings.Enabled)
        {
            return new DashboardInsightsResponse
            {
                Success = false,
                ErrorMessage = "AI features are disabled"
            };
        }

        try
        {
            var model = GetModelForTask("analysis");
            _logger.LogInformation("Generating dashboard insights using model: {Model}", model);

            // Build data context, handling empty data
            var categoriesText = request.CategoryBreakdown.Any() 
                ? string.Join("\n", request.CategoryBreakdown.Select(c => $"- {c.Category}: {c.Count} tickets ({c.Percentage:F1}%)"))
                : "No category data available";
            
            var departmentsText = request.DepartmentBreakdown.Any()
                ? string.Join("\n", request.DepartmentBreakdown.Select(d => $"- {d.Department}: {d.Count} tickets, Avg Resolution: {d.AvgResolutionHours:F1}h"))
                : "No department data available";
            
            var agentsText = request.TopAgents.Any()
                ? string.Join("\n", request.TopAgents.Select(a => $"- {a.AgentName}: {a.TicketsResolved} resolved, Avg: {a.AvgResolutionHours:F1}h"))
                : "No agent performance data available";

            var dataContext = $@"
TICKET ANALYTICS DATA ({request.Period ?? "this week"}):
================================================
Total Tickets: {request.TotalTickets}
Open Tickets: {request.OpenTickets}
Resolved Tickets: {request.ResolvedTickets}
Overdue Tickets: {request.OverdueTickets}
Average Resolution Time: {request.AvgResolutionHours:F1} hours

CATEGORY BREAKDOWN:
{categoriesText}

DEPARTMENT BREAKDOWN:
{departmentsText}

TOP PERFORMING AGENTS:
{agentsText}
================================================";

            var prompt = $@"Analyze the following IT support ticketing data and provide specific, actionable insights.

{dataContext}

Based on this data, generate a JSON response with REAL insights (not placeholders). Each field must contain actual analysis:

{{
  ""summary"": ""Write a 2-3 sentence executive summary about the current ticket situation, mentioning specific numbers"",
  ""keyInsights"": [""Write 3 specific observations about the data - mention actual categories, departments, or numbers""],
  ""recommendations"": [""Write 2-3 specific actionable recommendations based on the patterns you see""],
  ""trends"": [""Write 2 observations about patterns or trends in the data""],
  ""alerts"": [""List any concerning issues like high overdue counts, slow resolution times, or imbalanced workloads. Write 'No critical alerts' if none""]
}}

IMPORTANT: Replace all placeholder text with ACTUAL insights based on the numbers above. Do not return example text.
Return ONLY valid JSON, no markdown code blocks.";

            var chatRequest = new ChatCompletionRequest
            {
                Model = model,
                Temperature = 0.5,
                MaxTokens = _settings.MaxTokens,
                Messages = new List<ChatMessage>
                {
                    new() { Role = "system", Content = "You are an IT support analytics expert. Analyze ticket data and provide specific, data-driven insights. Always respond with valid JSON containing real analysis, never placeholder text." },
                    new() { Role = "user", Content = prompt }
                }
            };

            var result = await SendChatCompletionAsync(chatRequest);
            
            _logger.LogDebug("AI Insights raw result: {Result}", result?.Substring(0, Math.Min(result?.Length ?? 0, 500)));
            
            if (string.IsNullOrEmpty(result))
            {
                return new DashboardInsightsResponse
                {
                    Success = false,
                    ErrorMessage = "No response from AI"
                };
            }

            var jsonContent = ExtractJsonFromResponse(result);
            var parsed = JsonSerializer.Deserialize<DashboardInsightsJsonResponse>(jsonContent, _jsonOptions);

            return new DashboardInsightsResponse
            {
                Success = true,
                Summary = parsed?.Summary ?? "Analysis complete",
                KeyInsights = parsed?.KeyInsights ?? new List<string>(),
                Recommendations = parsed?.Recommendations ?? new List<string>(),
                Trends = parsed?.Trends ?? new List<string>(),
                Alerts = parsed?.Alerts ?? new List<string>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating dashboard insights");
            return new DashboardInsightsResponse
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AIReportResponse> GenerateReportAsync(AIReportRequest request)
    {
        if (!_settings.Enabled)
        {
            return new AIReportResponse
            {
                Success = false,
                ErrorMessage = "AI features are disabled"
            };
        }

        try
        {
            var model = GetModelForTask("analysis");
            _logger.LogInformation("Generating {ReportType} report using model: {Model}", request.ReportType, model);

            var reportType = request.ReportType?.ToLower() ?? "weekly";
            var periodLabel = reportType switch
            {
                "weekly" => "Weekly Performance",
                "monthly" => "Monthly Performance",
                "quarterly" => "Quarterly Executive",
                "branch" => "Branch Performance Analysis",
                "agent-performance" => "Agent Performance",
                "sla" => "SLA Compliance",
                "category" => "Category Analysis",
                "executive" => "Executive Summary",
                _ => "Performance"
            };

            // Build data context from analytics data if provided
            var dataContext = BuildDataContext(request);

            var prompt = BuildReportPrompt(reportType, periodLabel, request, dataContext);

            var chatRequest = new ChatCompletionRequest
            {
                Model = model,
                Temperature = 0.5,
                MaxTokens = _settings.MaxTokens * 2, // Reports need more tokens
                Messages = new List<ChatMessage>
                {
                    new() { Role = "system", Content = "You are a professional IT support analytics expert. Generate comprehensive, data-driven reports in valid JSON format. Provide specific insights based on the actual data provided." },
                    new() { Role = "user", Content = prompt }
                }
            };

            var result = await SendChatCompletionAsync(chatRequest);
            
            _logger.LogDebug("Report AI result (first 500 chars): {Result}", result?.Substring(0, Math.Min(result?.Length ?? 0, 500)));
            
            if (string.IsNullOrEmpty(result))
            {
                return new AIReportResponse
                {
                    Success = false,
                    ErrorMessage = "No response from AI"
                };
            }

            var jsonContent = ExtractJsonFromResponse(result);
            
            // Try to parse the JSON, handle truncated responses gracefully
            AIReportJsonResponse? parsed = null;
            try
            {
                parsed = JsonSerializer.Deserialize<AIReportJsonResponse>(jsonContent, _jsonOptions);
            }
            catch (JsonException jsonEx)
            {
                _logger.LogWarning(jsonEx, "JSON parsing failed, attempting recovery. Raw content length: {Length}", jsonContent.Length);
                // Try to extract partial data from truncated response
                parsed = TryParsePartialReportJson(jsonContent);
            }

            return new AIReportResponse
            {
                Success = true,
                ReportTitle = $"{periodLabel} Report - {request.StartDate:MMM dd} to {request.EndDate:MMM dd, yyyy}",
                ExecutiveSummary = parsed?.ExecutiveSummary ?? "Report generation completed with partial data.",
                Sections = parsed?.Sections?.Select(s => new ReportSection
                {
                    Title = s.Title ?? "",
                    Content = s.Content ?? "",
                    Highlights = s.Highlights ?? new List<string>()
                }).ToList() ?? new List<ReportSection>(),
                KeyMetrics = parsed?.KeyMetrics ?? new List<string>(),
                Recommendations = parsed?.Recommendations ?? new List<string>(),
                Conclusion = parsed?.Conclusion,
                GeneratedAt = DateTime.UtcNow,
                BranchData = request.AnalyticsData?.BranchBreakdown
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating report");
            return new AIReportResponse
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private string BuildDataContext(AIReportRequest request)
    {
        var data = request.AnalyticsData;
        if (data == null)
        {
            return "Note: No analytics data available. Please provide general insights based on IT support best practices.";
        }

        var sb = new StringBuilder();
        sb.AppendLine("ACTUAL ANALYTICS DATA:");
        sb.AppendLine("=".PadRight(50, '='));
        sb.AppendLine($"Total Tickets: {data.TotalTickets}");
        sb.AppendLine($"Open Tickets: {data.OpenTickets}");
        sb.AppendLine($"Closed Tickets: {data.ClosedTickets}");
        sb.AppendLine($"Overdue Tickets: {data.OverdueTickets}");
        sb.AppendLine($"Average Resolution Time: {data.AvgResolutionHours:F1} hours");
        sb.AppendLine($"SLA Compliance Rate: {data.SlaComplianceRate:F1}%");
        sb.AppendLine($"Total Agents: {data.TotalAgents}");

        if (data.BranchBreakdown.Any())
        {
            sb.AppendLine();
            sb.AppendLine("BRANCH BREAKDOWN:");
            sb.AppendLine("-".PadRight(40, '-'));
            foreach (var branch in data.BranchBreakdown.OrderByDescending(b => b.TotalTickets))
            {
                sb.AppendLine($"• {branch.BranchName} ({branch.BranchCode}):");
                sb.AppendLine($"    Tickets: {branch.TotalTickets} (Open: {branch.OpenTickets}, Closed: {branch.ClosedTickets}, Overdue: {branch.OverdueTickets})");
                sb.AppendLine($"    Avg Resolution: {branch.AvgResolutionHours:F1}h, SLA Compliance: {branch.SlaComplianceRate:F1}%");
                sb.AppendLine($"    Agents: {branch.AgentCount}, Tickets/Agent: {branch.TicketsPerAgent:F1}");
            }
        }

        if (data.CategoryBreakdown.Any())
        {
            sb.AppendLine();
            sb.AppendLine("CATEGORY BREAKDOWN:");
            sb.AppendLine("-".PadRight(40, '-'));
            foreach (var cat in data.CategoryBreakdown.OrderByDescending(c => c.Count))
            {
                sb.AppendLine($"• {cat.Category}: {cat.Count} tickets ({cat.Percentage:F1}%)");
            }
        }

        if (data.AgentPerformance.Any())
        {
            sb.AppendLine();
            sb.AppendLine("AGENT PERFORMANCE:");
            sb.AppendLine("-".PadRight(40, '-'));
            foreach (var agent in data.AgentPerformance.OrderByDescending(a => a.TicketsResolved).Take(10))
            {
                sb.AppendLine($"• {agent.AgentName}: {agent.TicketsResolved} resolved, Avg: {agent.AvgResolutionHours:F1}h");
            }
        }

        sb.AppendLine("=".PadRight(50, '='));
        return sb.ToString();
    }

    private string BuildReportPrompt(string reportType, string periodLabel, AIReportRequest request, string dataContext)
    {
        var sectionsToInclude = reportType switch
        {
            "branch" => "Branch Overview, Branch Comparison, Top Performing Branches, Branches Needing Improvement, Resource Allocation Recommendations",
            "agent-performance" => "Agent Performance Summary, Top Performers, Training Needs, Workload Distribution, Recognition Recommendations",
            "sla" => "SLA Overview, Breach Analysis, Compliance Trends, At-Risk Areas, SLA Improvement Plan",
            "category" => "Category Distribution, Trending Issues, Category Resolution Analysis, Emerging Patterns, Category Management Recommendations",
            "executive" => "Executive Overview, Key Performance Indicators, Strategic Highlights, Risk Areas, Strategic Recommendations",
            _ => "Overview, Performance Analysis, Issue Categories, Resolution Efficiency, Recommendations"
        };

        return $@"Generate a comprehensive {periodLabel} Report for IT support operations.

Report Period: {request.StartDate:MMM dd, yyyy} to {request.EndDate:MMM dd, yyyy}
{(string.IsNullOrEmpty(request.Department) ? "Scope: All Departments" : $"Department: {request.Department}")}
{(request.BranchId.HasValue ? $"Branch Filter: ID {request.BranchId}" : "Scope: All Branches")}

{dataContext}

Based on the above ACTUAL DATA, generate a professional report in JSON format:

{{
  ""title"": ""{periodLabel} Report - {request.StartDate:MMM yyyy}"",
  ""executiveSummary"": ""Write a 3-4 sentence executive summary with specific numbers from the data above"",
  ""sections"": [
    {{
      ""title"": ""Section title"",
      ""content"": ""Detailed analysis paragraph with specific data points and insights"",
      ""highlights"": [""Key finding 1 with numbers"", ""Key finding 2 with numbers"", ""Key finding 3 with numbers""]
    }}
  ],
  ""keyMetrics"": [""Metric Name: Actual Value from data"", ""Second Metric: Value""],
  ""recommendations"": [""Specific actionable recommendation based on data"", ""Second recommendation""],
  ""conclusion"": ""Forward-looking conclusion summarizing key takeaways and next steps""
}}

REQUIRED SECTIONS: {sectionsToInclude}

{(request.IncludeBranchComparison ? "Include detailed branch-by-branch comparison with rankings." : "")}
{(request.IncludeSlaAnalysis ? "Include SLA compliance analysis with specific breach counts." : "")}
{(request.IncludeAgentAnalysis ? "Include agent performance rankings and insights." : "")}
{(request.IncludeTrends ? "Include trend observations and patterns." : "")}
{(request.IncludeRecommendations ? "Include 3-5 actionable recommendations." : "")}

IMPORTANT: Use the ACTUAL numbers from the data provided. Do not use placeholder or example values.
Return ONLY valid JSON, no markdown code blocks.";
    }

    #region Private Methods

    private async Task<string?> SendChatCompletionAsync(ChatCompletionRequest request)
    {
        var url = GetChatCompletionUrl();
        
        _logger.LogDebug("Sending request to {Url} with model {Model}", url, request.Model);
        
        var content = new StringContent(
            JsonSerializer.Serialize(request, _jsonOptions),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PostAsync(url, content);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("AI API error: {StatusCode} - {Content}", response.StatusCode, errorContent);
            throw new HttpRequestException($"AI API returned {response.StatusCode}: {errorContent}");
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        _logger.LogDebug("AI Response: {Response}", responseBody);
        
        var chatResponse = JsonSerializer.Deserialize<ChatCompletionResponse>(responseBody, _jsonOptions);
        var message = chatResponse?.Choices?.FirstOrDefault()?.Message;
        
        // For reasoning models like DeepSeek R1, prefer content but fall back to reasoning if content is empty
        var result = message?.Content;
        if (string.IsNullOrWhiteSpace(result) && !string.IsNullOrWhiteSpace(message?.Reasoning))
        {
            _logger.LogDebug("Using reasoning field as content is empty");
            result = message.Reasoning;
        }
        
        return result;
    }

    private string GetChatCompletionUrl()
    {
        var baseUrl = _settings.BaseUrl?.TrimEnd('/') ?? "https://api.deepseek.com/v1";
        
        if (_settings.Provider?.ToLower() == "azure")
        {
            // Azure OpenAI uses a different URL pattern
            return $"{baseUrl}/chat/completions?api-version={_settings.AzureApiVersion}";
        }
        
        return $"{baseUrl}/chat/completions";
    }

    private string ExtractJsonFromResponse(string response)
    {
        // Try to extract JSON from the response (handles markdown code blocks)
        var jsonStart = response.IndexOf('{');
        var jsonEnd = response.LastIndexOf('}');
        
        if (jsonStart >= 0 && jsonEnd > jsonStart)
        {
            return response.Substring(jsonStart, jsonEnd - jsonStart + 1);
        }
        
        return response;
    }

    /// <summary>
    /// Attempts to parse partial/truncated report JSON by extracting available fields
    /// </summary>
    private AIReportJsonResponse? TryParsePartialReportJson(string jsonContent)
    {
        try
        {
            var result = new AIReportJsonResponse();
            
            // Try to extract title
            var titleMatch = System.Text.RegularExpressions.Regex.Match(jsonContent, @"""title""\s*:\s*""([^""]+)""");
            if (titleMatch.Success) result.Title = titleMatch.Groups[1].Value;
            
            // Try to extract executiveSummary
            var summaryMatch = System.Text.RegularExpressions.Regex.Match(jsonContent, @"""executiveSummary""\s*:\s*""([^""]+)""");
            if (summaryMatch.Success) result.ExecutiveSummary = summaryMatch.Groups[1].Value;
            
            // Try to extract conclusion
            var conclusionMatch = System.Text.RegularExpressions.Regex.Match(jsonContent, @"""conclusion""\s*:\s*""([^""]+)""");
            if (conclusionMatch.Success) result.Conclusion = conclusionMatch.Groups[1].Value;
            
            // Extract key metrics array
            var metricsMatch = System.Text.RegularExpressions.Regex.Match(jsonContent, @"""keyMetrics""\s*:\s*\[(.*?)\]", System.Text.RegularExpressions.RegexOptions.Singleline);
            if (metricsMatch.Success)
            {
                var metricsContent = metricsMatch.Groups[1].Value;
                var metrics = System.Text.RegularExpressions.Regex.Matches(metricsContent, @"""([^""]+)""")
                    .Cast<System.Text.RegularExpressions.Match>()
                    .Select(m => m.Groups[1].Value)
                    .ToList();
                result.KeyMetrics = metrics;
            }
            
            // Extract recommendations array
            var recsMatch = System.Text.RegularExpressions.Regex.Match(jsonContent, @"""recommendations""\s*:\s*\[(.*?)\]", System.Text.RegularExpressions.RegexOptions.Singleline);
            if (recsMatch.Success)
            {
                var recsContent = recsMatch.Groups[1].Value;
                var recs = System.Text.RegularExpressions.Regex.Matches(recsContent, @"""([^""]+)""")
                    .Cast<System.Text.RegularExpressions.Match>()
                    .Select(m => m.Groups[1].Value)
                    .ToList();
                result.Recommendations = recs;
            }
            
            _logger.LogInformation("Partially recovered report: Title={Title}, HasSummary={HasSummary}", 
                result.Title ?? "null", result.ExecutiveSummary != null);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to recover partial report JSON");
            return null;
        }
    }

    private static string GetDefaultCategorizationPrompt() => """
        You are a support ticket categorization assistant. Your job is to analyze support tickets and suggest the most appropriate category and priority level.
        
        Guidelines:
        - Choose the category that best matches the ticket content
        - Consider urgency, impact, and keywords for priority
        - Critical: System down, security breach, data loss
        - High: Major feature broken, multiple users affected
        - Medium: Feature issue, single user affected
        - Low: Questions, minor issues, enhancement requests
        
        Always respond with valid JSON only.
        """;

    private static string GetDefaultResponsePrompt() => """
        You are a helpful support agent assistant. Generate professional, helpful response suggestions for support tickets.
        
        Guidelines:
        - Be empathetic and professional
        - Address the customer's specific issue
        - Provide clear next steps when possible
        - Vary the responses to give the agent options
        - Match the requested tone (professional, friendly, formal)
        
        Always respond with valid JSON only.
        """;

    private static string GetDefaultSummarizationPrompt() => """
        You are a support ticket summarization assistant. Your job is to provide clear, concise summaries of support ticket threads.
        
        Guidelines:
        - Capture the main issue and current status
        - Identify key points and decisions made
        - List any pending action items
        - Assess customer sentiment objectively
        - Keep summaries concise but complete
        
        Always respond with valid JSON only.
        """;

    #endregion

    #region Internal DTOs for API Communication

    private class ChatCompletionRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;
        
        [JsonPropertyName("messages")]
        public List<ChatMessage> Messages { get; set; } = new();
        
        [JsonPropertyName("max_tokens")]
        public int MaxTokens { get; set; }
        
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }
    }

    private class ChatMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;
        
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
        
        [JsonPropertyName("reasoning")]
        public string? Reasoning { get; set; }
    }

    private class ChatCompletionResponse
    {
        [JsonPropertyName("choices")]
        public List<ChatChoice>? Choices { get; set; }
    }

    private class ChatChoice
    {
        [JsonPropertyName("message")]
        public ChatMessage? Message { get; set; }
    }

    // Response parsing DTOs
    private class CategorizationJsonResponse
    {
        [JsonPropertyName("category")]
        public string? Category { get; set; }
        
        [JsonPropertyName("priority")]
        public string? Priority { get; set; }
        
        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }
        
        [JsonPropertyName("reasoning")]
        public string? Reasoning { get; set; }
    }

    private class ResponseSuggestionJsonResponse
    {
        [JsonPropertyName("suggestions")]
        public List<SuggestionItem>? Suggestions { get; set; }
    }

    private class SuggestionItem
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }
        
        [JsonPropertyName("content")]
        public string? Content { get; set; }
        
        [JsonPropertyName("tone")]
        public string? Tone { get; set; }
    }

    private class SummarizationJsonResponse
    {
        [JsonPropertyName("summary")]
        public string? Summary { get; set; }
        
        [JsonPropertyName("keyPoints")]
        public List<string>? KeyPoints { get; set; }
        
        [JsonPropertyName("actionItems")]
        public List<string>? ActionItems { get; set; }
        
        [JsonPropertyName("customerSentiment")]
        public string? CustomerSentiment { get; set; }
    }

    private class DashboardInsightsJsonResponse
    {
        [JsonPropertyName("summary")]
        public string? Summary { get; set; }
        
        [JsonPropertyName("keyInsights")]
        public List<string>? KeyInsights { get; set; }
        
        [JsonPropertyName("recommendations")]
        public List<string>? Recommendations { get; set; }
        
        [JsonPropertyName("trends")]
        public List<string>? Trends { get; set; }
        
        [JsonPropertyName("alerts")]
        public List<string>? Alerts { get; set; }
    }

    private class AIReportJsonResponse
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }
        
        [JsonPropertyName("executiveSummary")]
        public string? ExecutiveSummary { get; set; }
        
        [JsonPropertyName("sections")]
        public List<ReportSectionJson>? Sections { get; set; }
        
        [JsonPropertyName("keyMetrics")]
        public List<string>? KeyMetrics { get; set; }
        
        [JsonPropertyName("recommendations")]
        public List<string>? Recommendations { get; set; }
        
        [JsonPropertyName("conclusion")]
        public string? Conclusion { get; set; }
    }

    private class ReportSectionJson
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }
        
        [JsonPropertyName("content")]
        public string? Content { get; set; }
        
        [JsonPropertyName("highlights")]
        public List<string>? Highlights { get; set; }
    }

    private class EnhanceTextJsonResponse
    {
        [JsonPropertyName("enhancedText")]
        public string? EnhancedText { get; set; }
        
        [JsonPropertyName("improvements")]
        public List<string>? Improvements { get; set; }
    }

    #endregion

    /// <summary>
    /// Enhance/improve text using AI
    /// </summary>
    public async Task<EnhanceTextResponse> EnhanceTextAsync(EnhanceTextRequest request)
    {
        if (!_settings.Enabled)
        {
            return new EnhanceTextResponse
            {
                Success = false,
                ErrorMessage = "AI features are disabled"
            };
        }

        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return new EnhanceTextResponse
            {
                Success = false,
                ErrorMessage = "Text is required"
            };
        }

        try
        {
            var model = GetModelForTask("response");
            _logger.LogInformation("Enhancing text using model: {Model}", model);

            var instructions = new List<string>();
            if (request.FixGrammar) instructions.Add("fix any grammar and spelling errors");
            if (request.ImproveClarity) instructions.Add("improve clarity and readability");
            if (request.MakeMoreConcise) instructions.Add("make it more concise without losing meaning");
            
            var toneInstruction = request.Tone?.ToLower() switch
            {
                "formal" => "Use formal, business-appropriate language.",
                "friendly" => "Use a warm, friendly tone while remaining professional.",
                "concise" => "Be brief and to the point.",
                _ => "Use a professional tone."
            };

            var contextHint = request.Context?.ToLower() switch
            {
                "ticket description" => "This is a support ticket description that should clearly explain an issue or request.",
                "reply" => "This is a reply message to a customer.",
                "title" => "This is a title/subject line that should be brief and descriptive.",
                _ => "This is general text."
            };

            var prompt = $@"Improve the following text. {contextHint} {toneInstruction}

Instructions: {string.Join(", ", instructions)}.

Original text:
{request.Text}

Respond in JSON format:
{{
  ""enhancedText"": ""The improved version of the text"",
  ""improvements"": [""List of specific improvements made (2-4 items)""]
}}

Important: Keep the same meaning and intent. Only improve the writing quality.";

            var chatRequest = new ChatCompletionRequest
            {
                Model = model,
                Temperature = 0.3, // Lower temperature for more consistent output
                MaxTokens = _settings.MaxTokens,
                Messages = new List<ChatMessage>
                {
                    new() { Role = "system", Content = "You are a professional writing assistant. Improve text while keeping the original meaning. Always respond in valid JSON format." },
                    new() { Role = "user", Content = prompt }
                }
            };

            var result = await SendChatCompletionAsync(chatRequest);

            if (string.IsNullOrEmpty(result))
            {
                return new EnhanceTextResponse
                {
                    Success = false,
                    ErrorMessage = "No response from AI"
                };
            }

            var jsonContent = ExtractJsonFromResponse(result);
            var parsed = JsonSerializer.Deserialize<EnhanceTextJsonResponse>(jsonContent, _jsonOptions);

            return new EnhanceTextResponse
            {
                Success = true,
                EnhancedText = parsed?.EnhancedText ?? request.Text,
                Improvements = parsed?.Improvements ?? new List<string>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enhancing text");
            return new EnhanceTextResponse
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }
}
