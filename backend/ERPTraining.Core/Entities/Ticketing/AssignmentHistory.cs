using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.Entities.Ticketing;

public class AssignmentHistory
{
    public int Id { get; set; }
    
    [Required]
    public Guid TicketId { get; set; }
    
    public string? PreviousAssigneeId { get; set; } // User ID
    public string? NewAssigneeId { get; set; } // User ID
    
    public int? PreviousAgentId { get; set; }
    public int? NewAgentId { get; set; }
    
    public int? PreviousGroupId { get; set; }
    public int? NewGroupId { get; set; }
    
    public AssignmentType AssignmentType { get; set; }
    public AssignmentReason Reason { get; set; }
    
    public int? AutoAssignmentRuleId { get; set; } // If assigned by a rule
    
    public string? AssignedByUserId { get; set; } // Manual assignment
    
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Ticket Ticket { get; set; } = null!;
    public virtual User? PreviousAssignee { get; set; }
    public virtual User? NewAssignee { get; set; }
    public virtual Agent? PreviousAgent { get; set; }
    public virtual Agent? NewAgent { get; set; }
    public virtual TicketGroup? PreviousGroup { get; set; }
    public virtual TicketGroup? NewGroup { get; set; }
    public virtual AutoAssignmentRule? AutoAssignmentRule { get; set; }
    public virtual User? AssignedByUser { get; set; }
}

public enum AssignmentType
{
    UserAssignment = 0,    // Direct user assignment
    AgentAssignment = 1,   // Agent assignment
    GroupAssignment = 2    // Group assignment
}

public enum AssignmentReason
{
    ManualAssignment = 0,     // Manual assignment by user
    AutoAssignmentRule = 1,   // Assigned by auto assignment rule
    WorkloadBalancing = 2,    // Reassigned for workload balancing
    AgentUnavailable = 3,     // Reassigned due to agent unavailability
    Escalation = 4,           // Escalated to higher level
    SkillMatch = 5,           // Assigned based on skill matching
    RoundRobin = 6,           // Round robin assignment
    LeastBusy = 7             // Assigned to least busy agent
}