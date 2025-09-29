using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class AutoAssignmentService : IAutoAssignmentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AutoAssignmentService> _logger;

    public AutoAssignmentService(ApplicationDbContext context, ILogger<AutoAssignmentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<AssignmentResult> AutoAssignTicketAsync(Guid ticketId)
    {
        try
        {
            var ticket = await _context.Tickets
                .Include(t => t.CreatedByUser)
                .FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null)
            {
                return new AssignmentResult 
                { 
                    Success = false, 
                    ErrorMessage = "Ticket not found" 
                };
            }

            // Skip if already assigned
            if (!string.IsNullOrEmpty(ticket.AssignedToUserId))
            {
                return new AssignmentResult 
                { 
                    Success = false, 
                    ErrorMessage = "Ticket is already assigned" 
                };
            }

            var recommendation = await EvaluateAssignmentRulesAsync(ticketId);
            
            if (recommendation.RecommendedOption == null)
            {
                return new AssignmentResult 
                { 
                    Success = false, 
                    ErrorMessage = "No suitable assignment found" 
                };
            }

            var option = recommendation.RecommendedOption;
            
            // Apply the assignment
            ticket.AssignedToUserId = option.UserId;
            ticket.UpdatedAt = DateTime.UtcNow;

            // Record assignment history
            var history = new AssignmentHistory
            {
                TicketId = ticketId,
                NewAssigneeId = option.UserId,
                NewAgentId = option.AgentId,
                NewGroupId = option.GroupId,
                AssignmentType = option.AgentId.HasValue ? AssignmentType.AgentAssignment : AssignmentType.UserAssignment,
                Reason = option.Reason,
                Notes = option.Reasoning
            };

            _context.AssignmentHistories.Add(history);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Auto-assigned ticket {TicketId} to user {UserId} via {Reason}", 
                ticketId, option.UserId, option.Reason);

            return new AssignmentResult
            {
                Success = true,
                AssignedToUserId = option.UserId,
                AssignedToAgentId = option.AgentId,
                AssignedToGroupId = option.GroupId,
                Reason = option.Reason,
                Message = $"Assigned to {option.DisplayName}: {option.Reasoning}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error auto-assigning ticket {TicketId}", ticketId);
            return new AssignmentResult 
            { 
                Success = false, 
                ErrorMessage = ex.Message 
            };
        }
    }

    public async Task<AssignmentResult> AutoAssignFromEmailAsync(object emailContextObj)
    {
        try
        {
            // Handle the email context properly - expect a dictionary or anonymous object
            var properties = emailContextObj.GetType().GetProperties();
            var senderEmail = properties.FirstOrDefault(p => p.Name == "SenderEmail")?.GetValue(emailContextObj)?.ToString() ?? "";
            var subject = properties.FirstOrDefault(p => p.Name == "Subject")?.GetValue(emailContextObj)?.ToString() ?? "";
            var content = properties.FirstOrDefault(p => p.Name == "Content")?.GetValue(emailContextObj)?.ToString() ?? "";
            var determinedCategory = (int)(properties.FirstOrDefault(p => p.Name == "DeterminedCategory")?.GetValue(emailContextObj) ?? 0);
            var priority = (int)(properties.FirstOrDefault(p => p.Name == "Priority")?.GetValue(emailContextObj) ?? 0);
            var matchedKeywords = properties.FirstOrDefault(p => p.Name == "MatchedKeywords")?.GetValue(emailContextObj) as List<string> ?? new List<string>();

            // Create a ticket context for rule evaluation
            var ticketContext = new EmailTicketContext
            {
                Category = (TicketCategory)determinedCategory,
                Priority = (TicketPriority)priority,
                Title = subject,
                Description = content,
                Keywords = matchedKeywords,
                SenderEmail = senderEmail
            };

            // Find matching rules based on email content
            var rules = await GetMatchingRulesForEmailAsync(ticketContext);
            
            var recommendation = new AssignmentRecommendation();
            
            foreach (var rule in rules.OrderBy(r => r.Priority))
            {
                var options = await EvaluateRuleForEmailAsync(ticketContext, rule);
                recommendation.Options.AddRange(options);
            }

            // If no rule-based options, fall back to general assignment
            if (!recommendation.Options.Any())
            {
                var fallbackOptions = await GetEmailFallbackAssignmentOptionsAsync(ticketContext);
                recommendation.Options.AddRange(fallbackOptions);
            }

            // Select the best option
            var bestOption = recommendation.Options
                .OrderByDescending(o => o.Score)
                .ThenBy(o => o.CurrentWorkload)
                .FirstOrDefault();

            if (bestOption == null)
            {
                return new AssignmentResult 
                { 
                    Success = false, 
                    ErrorMessage = "No suitable assignment found for email content" 
                };
            }

            // Log the email-based assignment
            _logger.LogInformation("Email auto-assignment recommended: {Email} -> {Agent} (Keywords: {Keywords})", 
                senderEmail, bestOption.DisplayName, string.Join(", ", matchedKeywords));

            return new AssignmentResult
            {
                Success = true,
                AssignedToUserId = bestOption.UserId,
                AssignedToAgentId = bestOption.AgentId,
                AssignedToGroupId = bestOption.GroupId,
                Reason = bestOption.Reason,
                Message = $"Email assigned to {bestOption.DisplayName}: {bestOption.Reasoning}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error auto-assigning from email");
            return new AssignmentResult 
            { 
                Success = false, 
                ErrorMessage = ex.Message 
            };
        }
    }

    public async Task<AssignmentRecommendation> EvaluateAssignmentRulesAsync(Guid ticketId)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
        {
            return new AssignmentRecommendation();
        }

        var recommendation = new AssignmentRecommendation();
        
        // Get matching rules ordered by priority
        var rules = await GetMatchingRulesAsync(ticket);
        
        foreach (var rule in rules.OrderBy(r => r.Priority))
        {
            var options = await EvaluateRuleAsync(ticket, rule);
            recommendation.Options.AddRange(options);
        }

        // If no rule-based options, fall back to general assignment
        if (!recommendation.Options.Any())
        {
            var fallbackOptions = await GetFallbackAssignmentOptionsAsync(ticket);
            recommendation.Options.AddRange(fallbackOptions);
        }

        // Select the best option
        recommendation.RecommendedOption = recommendation.Options
            .OrderByDescending(o => o.Score)
            .ThenBy(o => o.CurrentWorkload)
            .FirstOrDefault();

        return recommendation;
    }

    private async Task<List<AutoAssignmentRule>> GetMatchingRulesAsync(Ticket ticket)
    {
        var query = _context.AutoAssignmentRules
            .Where(r => r.IsActive);

        // Filter by category
        query = query.Where(r => r.CategoryId == null || r.CategoryId == (int)ticket.Category);

        // Filter by priority
        query = query.Where(r => r.TicketPriority == null || r.TicketPriority == (int)ticket.Priority);

        var rules = await query.ToListAsync();

        // Load related data separately to avoid navigation property issues
        foreach (var rule in rules)
        {
            rule.RuleAgents = await _context.AutoAssignmentRuleAgents
                .Where(ra => ra.RuleId == rule.Id)
                .ToListAsync();
                
            rule.RuleGroups = await _context.AutoAssignmentRuleGroups
                .Where(rg => rg.RuleId == rule.Id)
                .ToListAsync();
        }

        // Filter by keywords (in memory due to JSON complexity)
        var filteredRules = new List<AutoAssignmentRule>();
        
        foreach (var rule in rules)
        {
            if (string.IsNullOrEmpty(rule.Keywords))
            {
                filteredRules.Add(rule);
                continue;
            }

            try
            {
                var keywords = JsonSerializer.Deserialize<string[]>(rule.Keywords);
                if (keywords?.Any(keyword => 
                    ticket.Title.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                    ticket.Description.Contains(keyword, StringComparison.OrdinalIgnoreCase)) == true)
                {
                    filteredRules.Add(rule);
                }
            }
            catch (JsonException)
            {
                // Skip rules with invalid keyword JSON
                _logger.LogWarning("Invalid keywords JSON in rule {RuleId}", rule.Id);
            }
        }

        return filteredRules;
    }

    private async Task<List<AssignmentOption>> EvaluateRuleAsync(Ticket ticket, AutoAssignmentRule rule)
    {
        var options = new List<AssignmentOption>();

        switch (rule.Strategy)
        {
            case AssignmentStrategy.RoundRobin:
                options.AddRange(await GetRoundRobinOptionsAsync(rule));
                break;
            
            case AssignmentStrategy.LeastBusy:
                options.AddRange(await GetLeastBusyOptionsAsync(rule));
                break;
            
            case AssignmentStrategy.SkillBased:
                options.AddRange(await GetSkillBasedOptionsAsync(rule, ticket));
                break;
            
            case AssignmentStrategy.Availability:
                options.AddRange(await GetAvailabilityOptionsAsync(rule));
                break;
            
            case AssignmentStrategy.Weighted:
                options.AddRange(await GetWeightedOptionsAsync(rule));
                break;
        }

        // Set rule name for all options
        foreach (var option in options)
        {
            option.Reasoning = $"Rule: {rule.Name} - {option.Reasoning}";
        }

        return options;
    }

    private async Task<List<AssignmentOption>> GetRoundRobinOptionsAsync(AutoAssignmentRule rule)
    {
        var options = new List<AssignmentOption>();

        // Get agent assignments for round robin
        var agents = await _context.Agents
            .Where(a => rule.RuleAgents.Any(ra => ra.AgentId == a.Id && ra.IsActive))
            .Where(a => a.IsActive && a.AvailabilityStatus == "Available")
            .ToListAsync();

        if (agents.Any())
        {
            // Simple round robin - get agent with least recent assignment
            var lastAssignments = await _context.AssignmentHistories
                .Where(h => agents.Select(a => a.UserId).Contains(h.NewAssigneeId))
                .GroupBy(h => h.NewAssigneeId)
                .Select(g => new { UserId = g.Key, LastAssignment = g.Max(h => h.CreatedAt) })
                .ToListAsync();

            var nextAgent = agents
                .OrderBy(a => lastAssignments.FirstOrDefault(la => la.UserId == a.UserId)?.LastAssignment ?? DateTime.MinValue)
                .First();

            options.Add(new AssignmentOption
            {
                UserId = nextAgent.UserId,
                AgentId = nextAgent.Id,
                DisplayName = nextAgent.Name,
                Email = nextAgent.Email,
                Score = 90,
                Reasoning = "Round robin assignment",
                Reason = AssignmentReason.RoundRobin,
                CurrentWorkload = nextAgent.CurrentTicketCount,
                AvailabilityStatus = nextAgent.AvailabilityStatus
            });
        }

        return options;
    }

    private async Task<List<AssignmentOption>> GetLeastBusyOptionsAsync(AutoAssignmentRule rule)
    {
        var options = new List<AssignmentOption>();

        var agents = await _context.Agents
            .Where(a => rule.RuleAgents.Any(ra => ra.AgentId == a.Id && ra.IsActive))
            .Where(a => a.IsActive && a.AvailabilityStatus == "Available")
            .OrderBy(a => a.CurrentTicketCount)
            .Take(3) // Top 3 least busy
            .ToListAsync();

        int score = 95;
        foreach (var agent in agents)
        {
            options.Add(new AssignmentOption
            {
                UserId = agent.UserId,
                AgentId = agent.Id,
                DisplayName = agent.Name,
                Email = agent.Email,
                Score = score--,
                Reasoning = $"Least busy agent ({agent.CurrentTicketCount} active tickets)",
                Reason = AssignmentReason.LeastBusy,
                CurrentWorkload = agent.CurrentTicketCount,
                AvailabilityStatus = agent.AvailabilityStatus
            });
        }

        return options;
    }

    private async Task<List<AssignmentOption>> GetSkillBasedOptionsAsync(AutoAssignmentRule rule, Ticket ticket)
    {
        var options = new List<AssignmentOption>();

        // Get agents with assignments in the same category/subcategory
        var categoryAgents = await _context.TicketAssignments
            .Include(ta => ta.Agent)
            .Where(ta => ta.CategoryId == (int)ticket.Category && ta.IsActive)
            .Where(ta => rule.RuleAgents.Any(ra => ra.AgentId == ta.AgentId && ra.IsActive))
            .Where(ta => ta.Agent.IsActive && ta.Agent.AvailabilityStatus == "Available")
            .Select(ta => ta.Agent)
            .Distinct()
            .ToListAsync();

        int score = 85;
        foreach (var agent in categoryAgents.Take(5))
        {
            options.Add(new AssignmentOption
            {
                UserId = agent.UserId,
                AgentId = agent.Id,
                DisplayName = agent.Name,
                Email = agent.Email,
                Score = score--,
                Reasoning = $"Skill match for category (specializes in category {(int)ticket.Category})",
                Reason = AssignmentReason.SkillMatch,
                CurrentWorkload = agent.CurrentTicketCount,
                AvailabilityStatus = agent.AvailabilityStatus
            });
        }

        return options;
    }

    private async Task<List<AssignmentOption>> GetAvailabilityOptionsAsync(AutoAssignmentRule rule)
    {
        var options = new List<AssignmentOption>();

        var availableAgents = await _context.Agents
            .Where(a => rule.RuleAgents.Any(ra => ra.AgentId == a.Id && ra.IsActive))
            .Where(a => a.IsActive && a.AvailabilityStatus == "Available")
            .Take(5)
            .ToListAsync();

        int score = 80;
        foreach (var agent in availableAgents)
        {
            options.Add(new AssignmentOption
            {
                UserId = agent.UserId,
                AgentId = agent.Id,
                DisplayName = agent.Name,
                Email = agent.Email,
                Score = score--,
                Reasoning = "Available agent",
                Reason = AssignmentReason.AutoAssignmentRule,
                CurrentWorkload = agent.CurrentTicketCount,
                AvailabilityStatus = agent.AvailabilityStatus
            });
        }

        return options;
    }

    private async Task<List<AssignmentOption>> GetWeightedOptionsAsync(AutoAssignmentRule rule)
    {
        var options = new List<AssignmentOption>();

        var weightedAgents = await _context.Agents
            .Where(a => rule.RuleAgents.Any(ra => ra.AgentId == a.Id && ra.IsActive))
            .Where(a => a.IsActive && a.AvailabilityStatus == "Available")
            .Select(a => new { 
                Agent = a, 
                Weight = rule.RuleAgents.First(ra => ra.AgentId == a.Id).Weight 
            })
            .OrderByDescending(x => x.Weight)
            .ThenBy(x => x.Agent.CurrentTicketCount)
            .Take(5)
            .ToListAsync();

        foreach (var item in weightedAgents)
        {
            options.Add(new AssignmentOption
            {
                UserId = item.Agent.UserId,
                AgentId = item.Agent.Id,
                DisplayName = item.Agent.Name,
                Email = item.Agent.Email,
                Score = 70 + item.Weight * 5, // Higher weight = higher score
                Reasoning = $"Weighted assignment (weight: {item.Weight})",
                Reason = AssignmentReason.AutoAssignmentRule,
                CurrentWorkload = item.Agent.CurrentTicketCount,
                AvailabilityStatus = item.Agent.AvailabilityStatus
            });
        }

        return options;
    }

    private async Task<List<AssignmentOption>> GetFallbackAssignmentOptionsAsync(Ticket ticket)
    {
        var options = new List<AssignmentOption>();

        // Get any available agents as fallback
        var availableAgents = await _context.Agents
            .Where(a => a.IsActive && a.AvailabilityStatus == "Available")
            .OrderBy(a => a.CurrentTicketCount)
            .Take(3)
            .ToListAsync();

        int score = 50; // Lower score for fallback options
        foreach (var agent in availableAgents)
        {
            options.Add(new AssignmentOption
            {
                UserId = agent.UserId,
                AgentId = agent.Id,
                DisplayName = agent.Name,
                Email = agent.Email,
                Score = score--,
                Reasoning = "Fallback assignment - no specific rules matched",
                Reason = AssignmentReason.AutoAssignmentRule,
                CurrentWorkload = agent.CurrentTicketCount,
                AvailabilityStatus = agent.AvailabilityStatus
            });
        }

        return options;
    }

    public async Task<IEnumerable<AutoAssignmentRule>> GetActiveRulesAsync()
    {
        return await _context.AutoAssignmentRules
            .Where(r => r.IsActive)
            .OrderBy(r => r.Priority)
            .ToListAsync();
    }

    public async Task<AutoAssignmentRule> CreateRuleAsync(CreateAutoAssignmentRuleRequest request)
    {
        var rule = new AutoAssignmentRule
        {
            Name = request.Name,
            Description = request.Description,
            CategoryId = request.CategoryId,
            SubCategoryId = request.SubCategoryId,
            TicketPriority = request.TicketPriority,
            DepartmentId = request.DepartmentId,
            Keywords = request.Keywords.Any() ? JsonSerializer.Serialize(request.Keywords) : null,
            Strategy = request.Strategy,
            Priority = request.Priority
        };

        _context.AutoAssignmentRules.Add(rule);
        await _context.SaveChangesAsync();

        // Add agent assignments
        foreach (var agentId in request.AgentIds)
        {
            var ruleAgent = new AutoAssignmentRuleAgent
            {
                RuleId = rule.Id,
                AgentId = agentId,
                Weight = request.AgentWeights.GetValueOrDefault(agentId, 1)
            };
            _context.AutoAssignmentRuleAgents.Add(ruleAgent);
        }

        // Add group assignments
        foreach (var groupId in request.GroupIds)
        {
            var ruleGroup = new AutoAssignmentRuleGroup
            {
                RuleId = rule.Id,
                GroupId = groupId,
                Weight = request.GroupWeights.GetValueOrDefault(groupId, 1)
            };
            _context.AutoAssignmentRuleGroups.Add(ruleGroup);
        }

        await _context.SaveChangesAsync();

        return await _context.AutoAssignmentRules
            .Include(r => r.RuleAgents).ThenInclude(ra => ra.Agent)
            .Include(r => r.RuleGroups).ThenInclude(rg => rg.Group)
            .FirstAsync(r => r.Id == rule.Id);
    }

    public async Task<AutoAssignmentRule> UpdateRuleAsync(int ruleId, UpdateAutoAssignmentRuleRequest request)
    {
        var rule = await _context.AutoAssignmentRules
            .Include(r => r.RuleAgents)
            .Include(r => r.RuleGroups)
            .FirstOrDefaultAsync(r => r.Id == ruleId);

        if (rule == null)
            throw new ArgumentException("Rule not found");

        // Update rule properties
        rule.Name = request.Name;
        rule.Description = request.Description;
        rule.CategoryId = request.CategoryId;
        rule.SubCategoryId = request.SubCategoryId;
        rule.TicketPriority = request.TicketPriority;
        rule.DepartmentId = request.DepartmentId;
        rule.Keywords = request.Keywords.Any() ? JsonSerializer.Serialize(request.Keywords) : null;
        rule.Strategy = request.Strategy;
        rule.Priority = request.Priority;
        rule.IsActive = request.IsActive;
        rule.UpdatedAt = DateTime.UtcNow;

        // Remove existing agent/group assignments
        _context.AutoAssignmentRuleAgents.RemoveRange(rule.RuleAgents);
        _context.AutoAssignmentRuleGroups.RemoveRange(rule.RuleGroups);

        // Add new agent assignments
        foreach (var agentId in request.AgentIds)
        {
            var ruleAgent = new AutoAssignmentRuleAgent
            {
                RuleId = rule.Id,
                AgentId = agentId,
                Weight = request.AgentWeights.GetValueOrDefault(agentId, 1)
            };
            _context.AutoAssignmentRuleAgents.Add(ruleAgent);
        }

        // Add new group assignments
        foreach (var groupId in request.GroupIds)
        {
            var ruleGroup = new AutoAssignmentRuleGroup
            {
                RuleId = rule.Id,
                GroupId = groupId,
                Weight = request.GroupWeights.GetValueOrDefault(groupId, 1)
            };
            _context.AutoAssignmentRuleGroups.Add(ruleGroup);
        }

        await _context.SaveChangesAsync();

        return rule;
    }

    public async Task DeleteRuleAsync(int ruleId)
    {
        var rule = await _context.AutoAssignmentRules.FindAsync(ruleId);
        if (rule != null)
        {
            _context.AutoAssignmentRules.Remove(rule);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<AgentWorkload>> GetAgentWorkloadsAsync()
    {
        var agents = await _context.Agents
            .Where(a => a.IsActive)
            .ToListAsync();

        var workloads = new List<AgentWorkload>();

        foreach (var agent in agents)
        {
            var activeTickets = await _context.Tickets
                .CountAsync(t => t.AssignedToUserId == agent.UserId && 
                               (t.Status == TicketStatus.New || t.Status == TicketStatus.InReview));

            var totalTickets = await _context.Tickets
                .CountAsync(t => t.AssignedToUserId == agent.UserId);

            // Calculate average response and resolution times
            var responseTimes = await _context.Tickets
                .Where(t => t.AssignedToUserId == agent.UserId && t.FirstResponseAt.HasValue)
                .Select(t => EF.Functions.DateDiffHour(t.CreatedAt, t.FirstResponseAt!.Value))
                .ToListAsync();

            var resolutionTimes = await _context.Tickets
                .Where(t => t.AssignedToUserId == agent.UserId && t.ResolvedAt.HasValue)
                .Select(t => EF.Functions.DateDiffHour(t.CreatedAt, t.ResolvedAt!.Value))
                .ToListAsync();

            workloads.Add(new AgentWorkload
            {
                AgentId = agent.Id,
                Name = agent.Name,
                Email = agent.Email,
                ActiveTickets = activeTickets,
                TotalTickets = totalTickets,
                AvgResponseTime = responseTimes.Any() ? responseTimes.Average() : 0,
                AvgResolutionTime = resolutionTimes.Any() ? resolutionTimes.Average() : 0,
                AvailabilityStatus = agent.AvailabilityStatus,
                MaxCapacity = agent.MaxTicketsCapacity
            });
        }

        return workloads.OrderByDescending(w => w.WorkloadPercentage);
    }

    public async Task<RebalanceResult> RebalanceWorkloadsAsync()
    {
        var result = new RebalanceResult();
        
        try
        {
            var workloads = (await GetAgentWorkloadsAsync()).ToList();
            var overloadedAgents = workloads.Where(w => w.WorkloadPercentage > 80).ToList();
            var underutilizedAgents = workloads.Where(w => w.WorkloadPercentage < 50).ToList();

            if (!overloadedAgents.Any() || !underutilizedAgents.Any())
            {
                result.Success = true;
                result.Changes.Add("No rebalancing needed - workloads are well distributed");
                return result;
            }

            // Find tickets that can be reassigned
            foreach (var overloadedAgent in overloadedAgents)
            {
                var ticketsToReassign = await _context.Tickets
                    .Where(t => t.AssignedToUserId == overloadedAgent.Name && 
                               t.Status == TicketStatus.New &&
                               t.CreatedAt > DateTime.UtcNow.AddHours(-24)) // Only recent tickets
                    .OrderBy(t => t.CreatedAt)
                    .Take(2) // Limit reassignments
                    .ToListAsync();

                foreach (var ticket in ticketsToReassign)
                {
                    var targetAgent = underutilizedAgents
                        .OrderBy(a => a.ActiveTickets)
                        .FirstOrDefault();

                    if (targetAgent != null)
                    {
                        var targetAgentEntity = await _context.Agents
                            .FirstOrDefaultAsync(a => a.Id == targetAgent.AgentId);

                        if (targetAgentEntity != null)
                        {
                            ticket.AssignedToUserId = targetAgentEntity.UserId;
                            
                            // Record the rebalancing
                            var history = new AssignmentHistory
                            {
                                TicketId = ticket.Id,
                                PreviousAssigneeId = overloadedAgent.Name,
                                NewAssigneeId = targetAgentEntity.UserId,
                                AssignmentType = AssignmentType.UserAssignment,
                                Reason = AssignmentReason.WorkloadBalancing,
                                Notes = $"Rebalanced from {overloadedAgent.Name} to {targetAgent.Name}"
                            };

                            _context.AssignmentHistories.Add(history);
                            
                            targetAgent.ActiveTickets++;
                            result.TicketsReassigned++;
                            result.Changes.Add($"Reassigned ticket {ticket.Id} from {overloadedAgent.Name} to {targetAgent.Name}");
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            result.Success = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during workload rebalancing");
            result.Success = false;
            result.ErrorMessage = ex.Message;
        }

        return result;
    }

    #region Email-based Assignment Helper Methods

    private async Task<List<AutoAssignmentRule>> GetMatchingRulesForEmailAsync(EmailTicketContext ticketContext)
    {
        var categoryId = (int)ticketContext.Category;
        var priorityId = (int)ticketContext.Priority;
        
        var query = _context.AutoAssignmentRules
            .Include(r => r.RuleAgents).ThenInclude(ra => ra.Agent)
            .Include(r => r.RuleGroups).ThenInclude(rg => rg.Group)
            .Where(r => r.IsActive);

        // Filter by category
        query = query.Where(r => r.CategoryId == null || r.CategoryId == categoryId);

        // Filter by priority
        query = query.Where(r => r.TicketPriority == null || r.TicketPriority == priorityId);

        var rules = await query.ToListAsync();

        // Filter by keywords (in memory due to JSON complexity)
        var filteredRules = new List<AutoAssignmentRule>();
        
        foreach (var rule in rules)
        {
            if (string.IsNullOrEmpty(rule.Keywords))
            {
                filteredRules.Add(rule);
                continue;
            }

            try
            {
                var ruleKeywords = JsonSerializer.Deserialize<string[]>(rule.Keywords);
                
                // Check if any rule keywords match the ticket's matched keywords
                if (ruleKeywords?.Any(rk => ticketContext.Keywords.Any(tk => 
                    tk.Contains(rk, StringComparison.OrdinalIgnoreCase) ||
                    rk.Contains(tk, StringComparison.OrdinalIgnoreCase))) == true)
                {
                    filteredRules.Add(rule);
                }
            }
            catch (JsonException)
            {
                // Skip rules with invalid keyword JSON
                _logger.LogWarning("Invalid keywords JSON in rule {RuleId}", rule.Id);
            }
        }

        return filteredRules;
    }

    private async Task<List<AssignmentOption>> EvaluateRuleForEmailAsync(EmailTicketContext ticketContext, AutoAssignmentRule rule)
    {
        var options = new List<AssignmentOption>();

        switch (rule.Strategy)
        {
            case AssignmentStrategy.RoundRobin:
                options.AddRange(await GetRoundRobinOptionsAsync(rule));
                break;
            
            case AssignmentStrategy.LeastBusy:
                options.AddRange(await GetLeastBusyOptionsAsync(rule));
                break;
            
            case AssignmentStrategy.SkillBased:
                options.AddRange(await GetSkillBasedOptionsForEmailAsync(rule, ticketContext));
                break;
            
            case AssignmentStrategy.Availability:
                options.AddRange(await GetAvailabilityOptionsAsync(rule));
                break;
            
            case AssignmentStrategy.Weighted:
                options.AddRange(await GetWeightedOptionsAsync(rule));
                break;
        }

        // Boost score for keyword matches
        var ticketKeywords = ticketContext.Keywords;
        foreach (var option in options)
        {
            if (ticketKeywords.Any())
            {
                option.Score += 15; // Keyword match bonus
                option.Reasoning += $" (Keyword match: {string.Join(", ", ticketKeywords)})";
            }
            option.Reasoning = $"Email Rule: {rule.Name} - {option.Reasoning}";
        }

        return options;
    }

    private async Task<List<AssignmentOption>> GetSkillBasedOptionsForEmailAsync(AutoAssignmentRule rule, EmailTicketContext ticketContext)
    {
        var options = new List<AssignmentOption>();
        var categoryId = (int)ticketContext.Category;

        // Get agents with assignments in the same category
        var categoryAgents = await _context.TicketAssignments
            .Include(ta => ta.Agent)
            .Where(ta => ta.CategoryId == categoryId && ta.IsActive)
            .Where(ta => rule.RuleAgents.Any(ra => ra.AgentId == ta.AgentId && ra.IsActive))
            .Where(ta => ta.Agent.IsActive && ta.Agent.AvailabilityStatus == "Available")
            .Select(ta => ta.Agent)
            .Distinct()
            .ToListAsync();

        int score = 90; // Higher base score for email skill matching
        foreach (var agent in categoryAgents.Take(5))
        {
            options.Add(new AssignmentOption
            {
                UserId = agent.UserId,
                AgentId = agent.Id,
                DisplayName = agent.Name,
                Email = agent.Email,
                Score = score--,
                Reasoning = $"Email skill match for category {ticketContext.Category}",
                Reason = AssignmentReason.SkillMatch,
                CurrentWorkload = agent.CurrentTicketCount,
                AvailabilityStatus = agent.AvailabilityStatus
            });
        }

        return options;
    }

    private async Task<List<AssignmentOption>> GetEmailFallbackAssignmentOptionsAsync(EmailTicketContext ticketContext)
    {
        var options = new List<AssignmentOption>();

        // Get any available agents as fallback
        var availableAgents = await _context.Agents
            .Where(a => a.IsActive && a.AvailabilityStatus == "Available")
            .OrderBy(a => a.CurrentTicketCount)
            .Take(3)
            .ToListAsync();

        int score = 60; // Lower score for email fallback options
        foreach (var agent in availableAgents)
        {
            options.Add(new AssignmentOption
            {
                UserId = agent.UserId,
                AgentId = agent.Id,
                DisplayName = agent.Name,
                Email = agent.Email,
                Score = score--,
                Reasoning = "Email fallback assignment - no specific rules matched",
                Reason = AssignmentReason.AutoAssignmentRule,
                CurrentWorkload = agent.CurrentTicketCount,
                AvailabilityStatus = agent.AvailabilityStatus
            });
        }

        return options;
    }

    #endregion
}

public class EmailTicketContext
{
    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Keywords { get; set; } = new();
    public string SenderEmail { get; set; } = string.Empty;
}