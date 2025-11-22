using System.ComponentModel.DataAnnotations;

namespace ERPTraining.Core.DTOs.Ticketing;

public class TicketGroupDto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public string? CategoryName { get; set; }

    public int? SubCategoryId { get; set; }

    public string? SubCategoryName { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public bool AutoAssignmentEnabled { get; set; } = false;
    public int MaxTicketsPerAgent { get; set; } = 10;
    public List<int>? AssignedAgentIds { get; set; }
    public int TotalTickets { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    // Agent assignments
    public List<TicketGroupAgentDto> GroupAgents { get; set; } = new();
}

public class TicketGroupAgentDto
{
    public int Id { get; set; }

    [Required]
    public int TicketGroupId { get; set; }

    [Required]
    public int AgentId { get; set; }

    public string? AgentName { get; set; }

    public string? AgentEmail { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime AssignedAt { get; set; }
}