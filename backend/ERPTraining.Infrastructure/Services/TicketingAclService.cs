using Microsoft.AspNetCore.Identity;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Services;
using ERPTraining.Core.DTOs;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.Entities.Ticketing;
using Microsoft.EntityFrameworkCore;

namespace ERPTraining.Infrastructure.Services;

public class TicketingAclService : ITicketingAclService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ApplicationDbContext _context;

    public TicketingAclService(UserManager<User> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
    }

    public async Task<TicketingPermissions> GetUserTicketingPermissionsAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return new TicketingPermissions { UserId = userId };
        }

        var userRoles = await _userManager.GetRolesAsync(user);
        var permissions = new TicketingPermissions
        {
            UserId = userId,
            Roles = userRoles.ToList()
        };

        // Determine permissions based on roles
        foreach (var role in userRoles)
        {
            switch (role)
            {
                case "SuperAdmin":
                    permissions.Pages.AddRange(GetAllTicketingPages());
                    permissions.Actions.AddRange(new[] { "create", "view_all", "edit_all", "delete", "manage_settings", "manage_agents", "reports" });
                    permissions.IsAdmin = true;
                    permissions.IsAgent = true;
                    break;

                case "Admin":
                    permissions.Pages.AddRange(new[] { 
                        "ticket-dashboard", "new-ticket", "my-tickets", "all-tickets", 
                        "ticket-details", "ticket-settings", "agent-management", "ticket-reports" 
                    });
                    permissions.Actions.AddRange(new[] { "create", "view_all", "edit_all", "assign", "manage_settings", "manage_agents" });
                    permissions.IsAdmin = true;
                    permissions.IsAgent = true;
                    break;

                case "Agent":
                    permissions.Pages.AddRange(new[] { 
                        "ticket-dashboard", "new-ticket", "my-tickets", "assigned-tickets", "ticket-details" 
                    });
                    permissions.Actions.AddRange(new[] { "create", "view_assigned", "view_own", "respond", "update_status" });
                    permissions.IsAgent = true;
                    break;

                default:
                    // Regular user (or unknown role)
                    permissions.Pages.AddRange(new[] { 
                        "ticket-dashboard", "new-ticket", "my-tickets", "ticket-details" 
                    });
                    permissions.Actions.AddRange(new[] { "create", "view_own" });
                    permissions.IsUser = true;
                    break;
            }
        }

        // Remove duplicates
        permissions.Pages = permissions.Pages.Distinct().ToList();
        permissions.Actions = permissions.Actions.Distinct().ToList();

        return permissions;
    }

    public async Task<bool> CanAccessPageAsync(string userId, string pageName)
    {
        var permissions = await GetUserTicketingPermissionsAsync(userId);
        return permissions.Pages.Contains(pageName) || permissions.Pages.Contains("*");
    }

    public async Task<bool> CanPerformActionAsync(string userId, string action, string? ticketId = null)
    {
        var permissions = await GetUserTicketingPermissionsAsync(userId);
        return permissions.Actions.Contains(action) || permissions.Actions.Contains("*");
    }

    public async Task<bool> IsTicketingAdminAsync(string userId)
    {
        var permissions = await GetUserTicketingPermissionsAsync(userId);
        return permissions.IsAdmin;
    }

    public async Task<bool> IsTicketingAgentAsync(string userId)
    {
        var permissions = await GetUserTicketingPermissionsAsync(userId);
        return permissions.IsAgent;
    }

    public async Task<bool> ConvertUserToAgentAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;

        // Check if user is already an agent
        var existingAgent = await _context.Agents.FirstOrDefaultAsync(a => a.UserId == userId);
        if (existingAgent != null)
        {
            // User is already an agent, just ensure they have the role
            if (!(await _userManager.IsInRoleAsync(user, "Agent")))
            {
                await _userManager.AddToRoleAsync(user, "Agent");
            }
            return true;
        }

        // Add Agent role to make them an agent
        var roleResult = await _userManager.AddToRoleAsync(user, "Agent");
        if (!roleResult.Succeeded) return false;

        // Create Agent record
        var agent = new Agent
        {
            UserId = userId,
            Name = $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email ?? "",
            Department = user.Department ?? "General",
            IsActive = true,
            MaxTicketsCapacity = 10, // Default capacity
            CurrentTicketCount = 0,
            AvailabilityStatus = "Available",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Agents.Add(agent);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RemoveAgentAccessAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;

        // Remove agent roles
        var agentRoles = new[] { "Agent" };
        var userRoles = await _userManager.GetRolesAsync(user);
        
        foreach (var role in agentRoles.Where(r => userRoles.Contains(r)))
        {
            await _userManager.RemoveFromRoleAsync(user, role);
        }

        // Remove Agent record from database
        var existingAgent = await _context.Agents.FirstOrDefaultAsync(a => a.UserId == userId);
        if (existingAgent != null)
        {
            _context.Agents.Remove(existingAgent);
            await _context.SaveChangesAsync();
        }

        return true;
    }

    public async Task<List<TicketingPageAccess>> GetUserPagesAsync(string userId)
    {
        var permissions = await GetUserTicketingPermissionsAsync(userId);
        var allPages = GetTicketingPageDefinitions();

        return allPages.Where(page => 
            permissions.Pages.Contains(page.PageName) || 
            permissions.Pages.Contains("*")
        ).ToList();
    }

    private List<string> GetAllTicketingPages()
    {
        return new List<string>
        {
            "ticket-dashboard", "new-ticket", "my-tickets", "all-tickets",
            "assigned-tickets", "ticket-details", "ticket-settings",
            "agent-management", "ticket-reports"
        };
    }

    private List<TicketingPageAccess> GetTicketingPageDefinitions()
    {
        return new List<TicketingPageAccess>
        {
            new() { PageName = "ticket-dashboard", DisplayName = "Dashboard", Icon = "dashboard", Route = "/ticketing/dashboard", CanAccess = true },
            new() { PageName = "new-ticket", DisplayName = "New Ticket", Icon = "plus", Route = "/ticketing/new", CanAccess = true },
            new() { PageName = "my-tickets", DisplayName = "My Tickets", Icon = "user", Route = "/ticketing/my-tickets", CanAccess = true },
            new() { PageName = "all-tickets", DisplayName = "All Tickets", Icon = "list", Route = "/ticketing/all-tickets", CanAccess = true },
            new() { PageName = "assigned-tickets", DisplayName = "Assigned Tickets", Icon = "clipboard", Route = "/ticketing/assigned", CanAccess = true },
            new() { PageName = "ticket-details", DisplayName = "Ticket Details", Icon = "eye", Route = "/ticketing/ticket/:id", CanAccess = true },
            new() { PageName = "ticket-settings", DisplayName = "Settings", Icon = "settings", Route = "/ticketing/settings", CanAccess = true },
            new() { PageName = "agent-management", DisplayName = "Agent Management", Icon = "users", Route = "/ticketing/agents", CanAccess = true },
            new() { PageName = "ticket-reports", DisplayName = "Reports", Icon = "chart", Route = "/ticketing/reports", CanAccess = true }
        };
    }
}