using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace ERPTraining.Infrastructure.Services;

public class ERPSyncService : IERPSyncService
{
	private const string AgentRoleName = "Agent";

	private readonly IERPApiService _erpApiService;
	private readonly ApplicationDbContext _dbContext;
	private readonly UserManager<User> _userManager;
	private readonly RoleManager<IdentityRole> _roleManager;
	private readonly ILogger<ERPSyncService> _logger;

	public ERPSyncService(
		IERPApiService erpApiService,
		ApplicationDbContext dbContext,
		UserManager<User> userManager,
		RoleManager<IdentityRole> roleManager,
		ILogger<ERPSyncService> logger)
	{
		_erpApiService = erpApiService;
		_dbContext = dbContext;
		_userManager = userManager;
		_roleManager = roleManager;
		_logger = logger;
	}

	public async Task<bool> EnsureERPTokenAsync()
	{
		var hasToken = await _erpApiService.EnsureAuthenticatedAsync();
		if (!hasToken)
		{
			_logger.LogWarning("Unable to acquire ERP token. Check ERP credentials and connectivity.");
		}

		return hasToken;
	}

	public async Task SyncAllDataAsync()
	{
		_logger.LogInformation("Starting full ERP data sync (modules, sections, roles, role details, and users).");

		if (!await EnsureERPTokenAsync())
		{
			throw new InvalidOperationException("ERP token acquisition failed; aborting sync.");
		}

		await SyncModulesAsync();
		await SyncSectionsAsync();
		await SyncRolesAsync();
		await SyncRoleDetailsAsync();
		await SyncERPUsersAsync();

		_logger.LogInformation("Completed full ERP data sync run.");
	}

	public async Task SyncModulesAsync()
	{
		if (!await EnsureERPTokenAsync())
		{
			throw new InvalidOperationException("ERP token acquisition failed; cannot sync modules.");
		}

		var token = _erpApiService.GetCurrentToken();
		if (string.IsNullOrWhiteSpace(token))
		{
			throw new InvalidOperationException("ERP token unavailable after authentication.");
		}

		var modules = await _erpApiService.GetModulesAsync(token);
		_logger.LogInformation("Retrieved {Count} modules from ERP. Module persistence is not yet implemented.", modules.Count);
	}

	public async Task SyncSectionsAsync()
	{
		if (!await EnsureERPTokenAsync())
		{
			throw new InvalidOperationException("ERP token acquisition failed; cannot sync sections.");
		}

		var token = _erpApiService.GetCurrentToken();
		if (string.IsNullOrWhiteSpace(token))
		{
			throw new InvalidOperationException("ERP token unavailable after authentication.");
		}

		var sections = await _erpApiService.GetSectionsAsync(token);
		_logger.LogInformation("Retrieved {Count} sections from ERP. Section persistence is not yet implemented.", sections.Count);
	}

	public async Task SyncRolesAsync()
	{
		if (!await EnsureERPTokenAsync())
		{
			throw new InvalidOperationException("ERP token acquisition failed; cannot sync roles.");
		}

		var token = _erpApiService.GetCurrentToken();
		if (string.IsNullOrWhiteSpace(token))
		{
			throw new InvalidOperationException("ERP token unavailable after authentication.");
		}

		var roles = await _erpApiService.GetRolesAsync(token);
		_logger.LogInformation("Retrieved {Count} roles from ERP. Role persistence is not yet implemented.", roles.Count);
	}

	public async Task SyncRoleDetailsAsync()
	{
		if (!await EnsureERPTokenAsync())
		{
			throw new InvalidOperationException("ERP token acquisition failed; cannot sync role details.");
		}

		var token = _erpApiService.GetCurrentToken();
		if (string.IsNullOrWhiteSpace(token))
		{
			throw new InvalidOperationException("ERP token unavailable after authentication.");
		}

		var roleDetails = await _erpApiService.GetAllRoleDetailsAsync(token);
		_logger.LogInformation("Retrieved {Count} role details from ERP. Role detail persistence is not yet implemented.", roleDetails.Count);
	}

	public async Task SyncUsersAsync()
	{
		await SyncERPUsersAsync();
	}

	public async Task SyncERPUsersAsync()
	{
		_logger.LogInformation("Starting ERP user synchronisation job.");

		if (!await EnsureERPTokenAsync())
		{
			throw new InvalidOperationException("ERP token acquisition failed; cannot sync ERP users.");
		}

		var token = _erpApiService.GetCurrentToken();
		if (string.IsNullOrWhiteSpace(token))
		{
			throw new InvalidOperationException("ERP token unavailable after authentication.");
		}

		var erpUsers = await _erpApiService.GetUserMasterListAsync(token);
		if (erpUsers.Count == 0)
		{
			_logger.LogWarning("No users returned from ERP. Skipping sync.");
			return;
		}

		var now = DateTime.UtcNow;
		var createdUsers = 0;
		var updatedUsers = 0;
		var activatedAgents = 0;
		var deactivatedAgents = 0;

		var processedUserIds = new HashSet<string>();
		var erpRoleIds = erpUsers.Select(u => u.SafeRoleId).Where(rid => rid > 0).ToHashSet();

		var roleMasters = await _dbContext.RoleMasters
			.Where(r => r.ERPRoleId.HasValue && erpRoleIds.Contains(r.ERPRoleId.Value))
			.ToDictionaryAsync(r => r.ERPRoleId!.Value);

		foreach (var erpUser in erpUsers)
		{
			try
			{
				var rawEmail = (erpUser.sEmail ?? string.Empty).Trim();
				var fallbackEmail = $"erp-{erpUser.lId}@sync.local";
				var effectiveEmail = string.IsNullOrWhiteSpace(rawEmail) ? fallbackEmail : rawEmail;
				var user = await _dbContext.Users
					.FirstOrDefaultAsync(u => u.ERPUserId == erpUser.lId);

				if (user == null && !string.IsNullOrWhiteSpace(rawEmail))
				{
					user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == rawEmail);
				}

				if (user == null)
				{
					user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == fallbackEmail);
				}

				if (user == null)
				{
					user = new User
					{
						UserName = effectiveEmail,
						Email = effectiveEmail,
						ERPUserId = erpUser.lId,
						IsERPUser = true,
						ERPSource = "ERP",
						IsActive = true,
						CreatedAt = now,
						UpdatedAt = now,
						JoinDate = now,
						LastSyncedFromERP = now
					};

					ApplyName(user, erpUser.sName);

					var createResult = await _userManager.CreateAsync(user, GenerateSecurePassword());
					if (!createResult.Succeeded)
					{
						var errorSummary = string.Join("; ", createResult.Errors.Select(e => e.Description));
						_logger.LogWarning("Failed to create ERP user {ErpUserId} ({Email}). Errors: {Errors}", erpUser.lId, effectiveEmail, errorSummary);
						continue;
					}

					createdUsers++;
				}
				else
				{
					ApplyName(user, erpUser.sName);
					user.ERPUserId = erpUser.lId;
					user.IsERPUser = true;
					user.IsActive = true;
					user.ERPSource = "ERP";
					user.LastSyncedFromERP = now;
					user.UpdatedAt = now;

					if (!string.IsNullOrWhiteSpace(rawEmail))
					{
						user.Email = rawEmail;
						user.UserName = rawEmail;
					}
					else if (string.IsNullOrWhiteSpace(user.Email))
					{
						user.Email = fallbackEmail;
						user.UserName = fallbackEmail;
					}

					var updateResult = await _userManager.UpdateAsync(user);
					if (!updateResult.Succeeded)
					{
						var errorSummary = string.Join("; ", updateResult.Errors.Select(e => e.Description));
						_logger.LogWarning("Failed to update ERP user {ErpUserId} ({UserId}). Errors: {Errors}", erpUser.lId, user.Id, errorSummary);
					}
					else
					{
						updatedUsers++;
					}
				}

				processedUserIds.Add(user.Id);

				IList<string>? cachedRoles = null;
				async Task<IList<string>> GetUserRolesAsync()
				{
					if (cachedRoles == null)
					{
						cachedRoles = await _userManager.GetRolesAsync(user);
					}

					return cachedRoles;
				}

				// Role assignment based on ERP role
				var assignedRoleNames = new List<string>();
				if (erpUser.SafeRoleId > 0 && roleMasters.TryGetValue(erpUser.SafeRoleId, out var erpRoleMaster))
				{
					var normalizedRoleName = erpRoleMaster.RoleName.Trim();
					if (!string.IsNullOrEmpty(normalizedRoleName))
					{
						await EnsureIdentityRoleExists(normalizedRoleName);

						var currentRoles = await GetUserRolesAsync();
						if (!currentRoles.Contains(normalizedRoleName, StringComparer.OrdinalIgnoreCase))
						{
							var roleResult = await _userManager.AddToRoleAsync(user, normalizedRoleName);
							if (!roleResult.Succeeded)
							{
								var errorSummary = string.Join("; ", roleResult.Errors.Select(e => e.Description));
								_logger.LogWarning("Failed to assign role {Role} to user {UserId}. Errors: {Errors}", normalizedRoleName, user.Id, errorSummary);
							}
							else
							{
								cachedRoles = null;
							}
						}

						assignedRoleNames.Add(normalizedRoleName);
					}
				}

				// Determine agent status
				var shouldBeAgent = assignedRoleNames.Any(role => role.Contains("agent", StringComparison.OrdinalIgnoreCase));

				if (shouldBeAgent && !await _roleManager.RoleExistsAsync(AgentRoleName))
				{
					var createAgentRole = await _roleManager.CreateAsync(new IdentityRole(AgentRoleName));
					if (!createAgentRole.Succeeded)
					{
						var errorSummary = string.Join("; ", createAgentRole.Errors.Select(e => e.Description));
						_logger.LogWarning("Failed to ensure Agent role exists. Errors: {Errors}", errorSummary);
					}
				}

				if (shouldBeAgent)
				{
					var currentRoles = await GetUserRolesAsync();
					if (!currentRoles.Contains(AgentRoleName, StringComparer.OrdinalIgnoreCase))
					{
						var roleResult = await _userManager.AddToRoleAsync(user, AgentRoleName);
						if (!roleResult.Succeeded)
						{
							var errorSummary = string.Join("; ", roleResult.Errors.Select(e => e.Description));
							_logger.LogWarning("Failed to assign Agent role to user {UserId}. Errors: {Errors}", user.Id, errorSummary);
						}
						else
						{
							cachedRoles = null;
						}
					}
				}

				user.IsAgent = shouldBeAgent;

				var agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.UserId == user.Id);

				if (shouldBeAgent)
				{
					if (agent == null)
					{
						agent = new Agent
						{
							UserId = user.Id,
							Name = BuildDisplayName(user),
							Email = user.Email ?? string.Empty,
							Department = user.Department ?? string.Empty,
							IsActive = true,
							CreatedAt = now,
							UpdatedAt = now
						};

						_dbContext.Agents.Add(agent);
						activatedAgents++;
					}
					else
					{
						var originalStatus = agent.IsActive;
						agent.Name = BuildDisplayName(user);
						agent.Email = user.Email ?? agent.Email;
						agent.Department = user.Department ?? agent.Department;
						agent.IsActive = true;
						agent.UpdatedAt = now;
						if (!originalStatus)
						{
							activatedAgents++;
						}
					}
				}
				else if (agent != null && agent.IsActive)
				{
					agent.IsActive = false;
					agent.UpdatedAt = now;
					deactivatedAgents++;
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Failed to sync ERP user {ErpUserId}", erpUser.lId);
			}
		}

		// Deactivate agent records for ERP users no longer returned from the endpoint
		var erpUserIds = erpUsers.Select(u => u.lId).ToHashSet();
		var staleErpAgents = await _dbContext.Users
			.Where(u => u.IsERPUser && u.ERPUserId.HasValue && !erpUserIds.Contains(u.ERPUserId.Value))
			.Join(_dbContext.Agents, u => u.Id, a => a.UserId, (u, a) => a)
			.Where(a => a.IsActive)
			.ToListAsync();

		foreach (var agent in staleErpAgents)
		{
			agent.IsActive = false;
			agent.UpdatedAt = now;
			deactivatedAgents++;
		}

		await _dbContext.SaveChangesAsync();

		_logger.LogInformation(
			"ERP user sync completed. Created: {Created}, Updated: {Updated}, Agents Activated: {ActivatedAgents}, Agents Deactivated: {DeactivatedAgents}",
			createdUsers,
			updatedUsers,
			activatedAgents,
			deactivatedAgents);
	}

	private static void ApplyName(User user, string? fullName)
	{
		if (string.IsNullOrWhiteSpace(fullName))
		{
			return;
		}

		var trimmedName = fullName.Trim();
		var parts = trimmedName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

		if (parts.Length == 0)
		{
			return;
		}

		user.FirstName = parts[0];
		user.LastName = parts.Length > 1 ? string.Join(' ', parts.Skip(1)) : string.Empty;
	}

	private static string BuildDisplayName(User user)
	{
		var nameBuilder = new StringBuilder();
		if (!string.IsNullOrWhiteSpace(user.FirstName))
		{
			nameBuilder.Append(user.FirstName.Trim());
		}
		if (!string.IsNullOrWhiteSpace(user.LastName))
		{
			if (nameBuilder.Length > 0)
			{
				nameBuilder.Append(' ');
			}
			nameBuilder.Append(user.LastName.Trim());
		}

		if (nameBuilder.Length == 0)
		{
			return user.Email ?? user.UserName ?? "";
		}

		return nameBuilder.ToString();
	}

	private static string GenerateSecurePassword()
	{
		Span<byte> randomBytes = stackalloc byte[8];
		RandomNumberGenerator.Fill(randomBytes);

		var hex = Convert.ToHexString(randomBytes);
		return $"Erp@{hex[..8]}1a";
	}

	private async Task EnsureIdentityRoleExists(string roleName)
	{
		if (await _roleManager.RoleExistsAsync(roleName))
		{
			return;
		}

		var result = await _roleManager.CreateAsync(new IdentityRole(roleName));
		if (!result.Succeeded)
		{
			var errorSummary = string.Join("; ", result.Errors.Select(e => e.Description));
			_logger.LogWarning("Failed to create identity role {Role}. Errors: {Errors}", roleName, errorSummary);
		}
	}
}
