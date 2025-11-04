using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.Core.Interfaces.Ticketing;

public interface IAutoAssignmentService
{
    /// <summary>
    /// Automatically assign a ticket based on configured rules
    /// </summary>
    Task<AssignmentResult> AutoAssignTicketAsync(Guid ticketId);
    
    /// <summary>
    /// Auto-assign based on email content with keyword matching
    /// </summary>
    Task<AssignmentResult> AutoAssignFromEmailAsync(object emailContext);
    
    /// <summary>
    /// Evaluate assignment rules for a ticket without actually assigning
    /// </summary>
    Task<AssignmentRecommendation> EvaluateAssignmentRulesAsync(Guid ticketId);
    
    /// <summary>
    /// Get all active auto assignment rules
    /// </summary>
    Task<IEnumerable<AutoAssignmentRule>> GetActiveRulesAsync();
    
    /// <summary>
    /// Create a new auto assignment rule
    /// </summary>
    Task<AutoAssignmentRule> CreateRuleAsync(CreateAutoAssignmentRuleRequest request);
    
    /// <summary>
    /// Update an existing auto assignment rule
    /// </summary>
    Task<AutoAssignmentRule> UpdateRuleAsync(int ruleId, UpdateAutoAssignmentRuleRequest request);
    
    /// <summary>
    /// Delete an auto assignment rule
    /// </summary>
    Task DeleteRuleAsync(int ruleId);
    
    /// <summary>
    /// Get agent workload statistics
    /// </summary>
    Task<IEnumerable<AgentWorkload>> GetAgentWorkloadsAsync();
    
    /// <summary>
    /// Rebalance workloads across agents
    /// </summary>
    Task<RebalanceResult> RebalanceWorkloadsAsync();
}

public class AssignmentResult
{
    public bool Success { get; set; }
    public string? AssignedToUserId { get; set; }
    public int? AssignedToAgentId { get; set; }
    public int? AssignedToGroupId { get; set; }
    public AssignmentReason Reason { get; set; }
    public string? RuleName { get; set; }
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }
}

public class AssignmentRecommendation
{
    public List<AssignmentOption> Options { get; set; } = new();
    public AssignmentOption? RecommendedOption { get; set; }
}

public class AssignmentOption
{
    public string? UserId { get; set; }
    public int? AgentId { get; set; }
    public int? GroupId { get; set; }
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public int Score { get; set; } // Higher = better match
    public string Reasoning { get; set; } = string.Empty;
    public AssignmentReason Reason { get; set; }
    public int CurrentWorkload { get; set; }
    public string AvailabilityStatus { get; set; } = string.Empty;
}

public class AgentWorkload
{
    public int AgentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int ActiveTickets { get; set; }
    public int TotalTickets { get; set; }
    public double AvgResponseTime { get; set; } // in hours
    public double AvgResolutionTime { get; set; } // in hours
    public string AvailabilityStatus { get; set; } = string.Empty;
    public int MaxCapacity { get; set; }
    public double WorkloadPercentage => MaxCapacity > 0 ? (double)ActiveTickets / MaxCapacity * 100 : 0;
}

public class RebalanceResult
{
    public bool Success { get; set; }
    public int TicketsReassigned { get; set; }
    public List<string> Changes { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

public class CreateAutoAssignmentRuleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? CategoryId { get; set; }
    public int? SubCategoryId { get; set; }
    public int? TicketPriority { get; set; }
    public int? DepartmentId { get; set; }
    public List<string> Keywords { get; set; } = new();
    public AssignmentStrategy Strategy { get; set; }
    public int Priority { get; set; } = 100;
    public List<int> AgentIds { get; set; } = new();
    public List<int> GroupIds { get; set; } = new();
    public Dictionary<int, int> AgentWeights { get; set; } = new(); // AgentId -> Weight
    public Dictionary<int, int> GroupWeights { get; set; } = new(); // GroupId -> Weight
}

public class UpdateAutoAssignmentRuleRequest : CreateAutoAssignmentRuleRequest
{
    public bool IsActive { get; set; } = true;
}