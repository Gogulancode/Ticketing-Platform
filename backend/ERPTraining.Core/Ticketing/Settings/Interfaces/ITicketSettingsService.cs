using ERPTraining.Core.Entities.Tickets;

namespace ERPTraining.Core.Ticketing.Settings.Interfaces;

public interface IA_TicketSettingsService
{
    // Categories (phase 1)
    Task<IReadOnlyList<TicketCategory>> GetCategoriesAsync(bool includeInactive = false);
    Task<TicketCategory?> GetCategoryAsync(int id);
    Task<TicketCategory> CreateCategoryAsync(TicketCategory category, CancellationToken ct = default);
    Task<TicketCategory?> UpdateCategoryAsync(int id, Action<TicketCategory> mutate, CancellationToken ct = default);
    Task<bool> SoftDeleteCategoryAsync(int id, CancellationToken ct = default);

    // SubCategories (phase 2)
    Task<IReadOnlyList<TicketSubCategory>> GetSubCategoriesAsync(int? categoryId = null, bool includeInactive = false);
    Task<TicketSubCategory?> GetSubCategoryAsync(int id);
    Task<TicketSubCategory> CreateSubCategoryAsync(TicketSubCategory subCategory, CancellationToken ct = default);
    Task<TicketSubCategory?> UpdateSubCategoryAsync(int id, Action<TicketSubCategory> mutate, CancellationToken ct = default);
    Task<bool> SoftDeleteSubCategoryAsync(int id, CancellationToken ct = default);

    // Departments (phase 3)
    Task<IReadOnlyList<TicketDepartment>> GetDepartmentsAsync(bool includeInactive = false);
    Task<TicketDepartment?> GetDepartmentAsync(int id);
    Task<TicketDepartment> CreateDepartmentAsync(TicketDepartment department, CancellationToken ct = default);
    Task<TicketDepartment?> UpdateDepartmentAsync(int id, Action<TicketDepartment> mutate, CancellationToken ct = default);
    Task<bool> SoftDeleteDepartmentAsync(int id, CancellationToken ct = default);

    // Priorities (phase 4)
    Task<IReadOnlyList<TicketPriority>> GetPrioritiesAsync(bool includeInactive = false);
    Task<TicketPriority?> GetPriorityAsync(int id);
    Task<TicketPriority> CreatePriorityAsync(TicketPriority priority, CancellationToken ct = default);
    Task<TicketPriority?> UpdatePriorityAsync(int id, Action<TicketPriority> mutate, CancellationToken ct = default);
    Task<bool> SoftDeletePriorityAsync(int id, CancellationToken ct = default);

    // Statuses (phase 5)
    Task<IReadOnlyList<TicketStatus>> GetStatusesAsync(bool includeInactive = false);
    Task<TicketStatus?> GetStatusAsync(int id);
    Task<TicketStatus> CreateStatusAsync(TicketStatus status, CancellationToken ct = default);
    Task<TicketStatus?> UpdateStatusAsync(int id, Action<TicketStatus> mutate, CancellationToken ct = default);
    Task<bool> SoftDeleteStatusAsync(int id, CancellationToken ct = default);

    // Issue Types (phase 5.5)
    Task<IReadOnlyList<IssueType>> GetIssueTypesAsync(bool includeInactive = false);
    Task<IssueType?> GetIssueTypeAsync(int id);
    Task<IssueType> CreateIssueTypeAsync(IssueType issueType, CancellationToken ct = default);
    Task<IssueType?> UpdateIssueTypeAsync(int id, Action<IssueType> mutate, CancellationToken ct = default);
    Task<bool> SoftDeleteIssueTypeAsync(int id, CancellationToken ct = default);

    // Groups (phase 6)
    Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.TicketGroup>> GetGroupsAsync(int? categoryId = null, int? subCategoryId = null, bool includeInactive = false);
    Task<ERPTraining.Core.Entities.Ticketing.TicketGroup?> GetGroupAsync(int id);
    Task<ERPTraining.Core.Entities.Ticketing.TicketGroup> CreateGroupAsync(ERPTraining.Core.Entities.Ticketing.TicketGroup group, CancellationToken ct = default);
    Task<ERPTraining.Core.Entities.Ticketing.TicketGroup?> UpdateGroupAsync(int id, Action<ERPTraining.Core.Entities.Ticketing.TicketGroup> mutate, CancellationToken ct = default);
    Task<bool> SoftDeleteGroupAsync(int id, CancellationToken ct = default);

    // Agents (phase 7)
    Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.Agent>> GetAgentsAsync(bool includeInactive = false);
    Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.Agent>> GetUnassignedAgentsAsync(bool includeInactive = false);
    Task<ERPTraining.Core.Entities.Ticketing.Agent?> GetAgentAsync(int id);
    Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.TicketGroup>> GetGroupsForAgentAsync(int agentId, bool includeInactive = false);
    Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.TicketGroupAgent>> GetGroupMembershipsForAgentsAsync(IEnumerable<int> agentIds, bool includeInactive = false);

    // Group membership (TicketGroupAgents)
    Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.TicketGroupAgent>> GetGroupMembersAsync(int groupId, bool includeInactive = false);
    Task<ERPTraining.Core.Entities.Ticketing.TicketGroupAgent> AddAgentToGroupAsync(int groupId, int agentId, CancellationToken ct = default);
    Task<bool> RemoveAgentFromGroupAsync(int groupMemberId, CancellationToken ct = default);
}
