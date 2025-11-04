using ERPTraining.Core.DTOs;

namespace ERPTraining.Core.Services;

public interface ITicketingAclService
{
    Task<TicketingPermissions> GetUserTicketingPermissionsAsync(string userId);
    Task<bool> CanAccessPageAsync(string userId, string pageName);
    Task<bool> CanPerformActionAsync(string userId, string action, string? ticketId = null);
    Task<bool> IsTicketingAdminAsync(string userId);
    Task<bool> IsTicketingAgentAsync(string userId);
    Task<bool> ConvertUserToAgentAsync(string userId);
    Task<bool> RemoveAgentAccessAsync(string userId);
    Task<List<TicketingPageAccess>> GetUserPagesAsync(string userId);
}

public class TicketingPermissions
{
    public string UserId { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public List<string> Pages { get; set; } = new();
    public List<string> Actions { get; set; } = new();
    public bool IsAdmin { get; set; }
    public bool IsAgent { get; set; }
    public bool IsUser { get; set; }
}

public class TicketingPageAccess
{
    public string PageName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public bool CanAccess { get; set; }
}