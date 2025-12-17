using ERPTraining.Core.DTOs.AI;

namespace ERPTraining.Core.Interfaces;

/// <summary>
/// Interface for AI-powered ticket assistance features
/// </summary>
public interface IAIService
{
    /// <summary>
    /// Check if AI service is enabled and connected
    /// </summary>
    Task<AIStatusResponse> GetStatusAsync();
    
    /// <summary>
    /// Suggest category and priority for a ticket based on its content
    /// </summary>
    Task<CategorizationResponse> CategorizeTicketAsync(CategorizationRequest request);
    
    /// <summary>
    /// Generate response suggestions for agents
    /// </summary>
    Task<ResponseSuggestionResponse> SuggestResponsesAsync(ResponseSuggestionRequest request);
    
    /// <summary>
    /// Summarize a ticket thread
    /// </summary>
    Task<SummarizationResponse> SummarizeTicketAsync(SummarizationRequest request);
    
    /// <summary>
    /// Search knowledge base for relevant articles (future feature)
    /// </summary>
    Task<KnowledgeSearchResponse> SearchKnowledgeBaseAsync(KnowledgeSearchRequest request);
    
    /// <summary>
    /// Generate AI insights for dashboard analytics
    /// </summary>
    Task<DashboardInsightsResponse> GenerateDashboardInsightsAsync(DashboardInsightsRequest request);
    
    /// <summary>
    /// Generate AI-powered weekly/monthly report
    /// </summary>
    Task<AIReportResponse> GenerateReportAsync(AIReportRequest request);
    
    /// <summary>
    /// Enhance/improve text using AI (grammar, clarity, professionalism)
    /// </summary>
    Task<EnhanceTextResponse> EnhanceTextAsync(EnhanceTextRequest request);
}
