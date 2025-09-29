using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPTraining.Core.Entities.Ticketing;

public class AutoAssignmentRule
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    // Rule conditions
    public int? CategoryId { get; set; }
    public int? SubCategoryId { get; set; }
    public int? TicketPriority { get; set; } // TicketPriority enum value
    public int? DepartmentId { get; set; }
    
    // Keywords to match in title/description
    public string? Keywords { get; set; } // JSON array of keywords
    
    // Assignment strategy
    public AssignmentStrategy Strategy { get; set; } = AssignmentStrategy.RoundRobin;
    
    // Rule execution order (lower numbers execute first)
    public int Priority { get; set; } = 100;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [NotMapped]
    public virtual TicketCategory? Category { get; set; }
    [NotMapped]
    public virtual ERPTraining.Core.Entities.Tickets.TicketSubCategory? SubCategory { get; set; }
    public virtual ICollection<AutoAssignmentRuleAgent> RuleAgents { get; set; } = new List<AutoAssignmentRuleAgent>();
    public virtual ICollection<AutoAssignmentRuleGroup> RuleGroups { get; set; } = new List<AutoAssignmentRuleGroup>();
}

public enum AssignmentStrategy
{
    RoundRobin = 0,     // Distribute tickets evenly
    LeastBusy = 1,      // Assign to agent with fewest active tickets
    SkillBased = 2,     // Assign based on agent expertise/category specialization
    Availability = 3,   // Assign to first available agent
    Weighted = 4        // Assign based on agent capacity weights
}

public class AutoAssignmentRuleAgent
{
    public int Id { get; set; }
    public int RuleId { get; set; }
    public int AgentId { get; set; }
    public int Weight { get; set; } = 1; // For weighted assignment
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual AutoAssignmentRule Rule { get; set; } = null!;
    public virtual Agent Agent { get; set; } = null!;
}

public class AutoAssignmentRuleGroup
{
    public int Id { get; set; }
    public int RuleId { get; set; }
    public int GroupId { get; set; }
    public int Weight { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual AutoAssignmentRule Rule { get; set; } = null!;
    public virtual TicketGroup Group { get; set; } = null!;
}