using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Infrastructure.Data;
using System.Security.Claims;

namespace ERPTraining.API.Controllers.Ticketing;

// DISABLED: AutoAssignment functionality temporarily disabled due to circular reference issues
// User requested manual assignment only
/*
[ApiController]
[Route("api/tickets/auto-assignment")]
public class AutoAssignmentController : ControllerBase
{
    private readonly IAutoAssignmentService _autoAssignmentService;
    private readonly ILogger<AutoAssignmentController> _logger;
    private readonly ApplicationDbContext _context;

    public AutoAssignmentController(
        IAutoAssignmentService autoAssignmentService,
        ILogger<AutoAssignmentController> logger,
        ApplicationDbContext context)
    {
        _autoAssignmentService = autoAssignmentService;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Auto-assign a ticket based on configured rules
    /// </summary>
    [HttpPost("assign/{ticketId}")]
    public async Task<IActionResult> AutoAssignTicket(Guid ticketId)
    {
        try
        {
            var result = await _autoAssignmentService.AutoAssignTicketAsync(ticketId);
            
            if (result.Success)
            {
                return Ok(new { 
                    success = true, 
                    message = result.Message,
                    assignedToUserId = result.AssignedToUserId,
                    assignedToAgentId = result.AssignedToAgentId,
                    assignedToGroupId = result.AssignedToGroupId,
                    reason = result.Reason.ToString()
                });
            }
            
            return BadRequest(new { success = false, message = result.ErrorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error auto-assigning ticket {TicketId}", ticketId);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get assignment recommendations for a ticket without actually assigning it
    /// </summary>
    [HttpGet("recommendations/{ticketId}")]
    public async Task<IActionResult> GetAssignmentRecommendations(Guid ticketId)
    {
        try
        {
            var recommendation = await _autoAssignmentService.EvaluateAssignmentRulesAsync(ticketId);
            
            return Ok(new {
                recommendedOption = recommendation.RecommendedOption,
                allOptions = recommendation.Options.Take(5), // Limit to top 5 options
                hasRecommendations = recommendation.Options.Any()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assignment recommendations for ticket {TicketId}", ticketId);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Auto-assign ticket based on email content (subject and body) with keyword matching
    /// </summary>
    [HttpPost("assign-from-email")]
    public async Task<IActionResult> AutoAssignFromEmail([FromBody] EmailAssignmentRequest request)
    {
        try
        {
            // First, extract keywords and determine category/subcategory
            var categoryResult = await DetermineCategory(request.Subject, request.Content);
            
            if (categoryResult == null)
            {
                return BadRequest(new { 
                    success = false, 
                    message = "Unable to determine category from email content" 
                });
            }

            // Create a ticket assignment context
            var assignmentContext = new EmailTicketContext
            {
                Subject = request.Subject,
                Content = request.Content,
                SenderEmail = request.SenderEmail,
                DeterminedCategory = categoryResult.CategoryId,
                DeterminedSubCategory = categoryResult.SubCategoryId,
                MatchedKeywords = categoryResult.MatchedKeywords,
                Priority = DeterminePriority(request.Subject, request.Content)
            };

            var result = await _autoAssignmentService.AutoAssignFromEmailAsync(assignmentContext);
            
            if (result.Success)
            {
                return Ok(new { 
                    success = true, 
                    message = result.Message,
                    assignedToUserId = result.AssignedToUserId,
                    assignedToAgentId = result.AssignedToAgentId,
                    assignedToGroupId = result.AssignedToGroupId,
                    reason = result.Reason.ToString(),
                    determinedCategory = categoryResult.CategoryName,
                    determinedSubCategory = categoryResult.SubCategoryName,
                    matchedKeywords = categoryResult.MatchedKeywords
                });
            }
            
            return BadRequest(new { success = false, message = result.ErrorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error auto-assigning from email");
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get all active assignment rules
    /// </summary>
    [HttpGet("rules")]
    public async Task<IActionResult> GetRules()
    {
        try
        {
            var rules = await _autoAssignmentService.GetActiveRulesAsync();
            
            // Return clean DTOs to avoid circular references
            var response = rules.Select(rule => new
            {
                id = rule.Id,
                name = rule.Name,
                description = rule.Description,
                categoryId = rule.CategoryId,
                subCategoryId = rule.SubCategoryId,
                ticketPriority = rule.TicketPriority,
                departmentId = rule.DepartmentId,
                keywords = rule.Keywords,
                strategy = (int)rule.Strategy,
                strategyName = rule.Strategy.ToString(),
                priority = rule.Priority,
                isActive = rule.IsActive,
                createdAt = rule.CreatedAt,
                updatedAt = rule.UpdatedAt
            });
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving assignment rules");
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Create a new assignment rule
    /// </summary>
    [HttpPost("rules")]
    public async Task<IActionResult> CreateRule([FromBody] CreateAutoAssignmentRuleRequest request)
    {
        try
        {
            var rule = await _autoAssignmentService.CreateRuleAsync(request);
            return CreatedAtAction(nameof(GetRule), new { id = rule.Id }, rule);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating assignment rule");
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get a specific assignment rule by ID
    /// </summary>
    [HttpGet("rules/{id}")]
    public async Task<IActionResult> GetRule(int id)
    {
        try
        {
            var rules = await _autoAssignmentService.GetActiveRulesAsync();
            var rule = rules.FirstOrDefault(r => r.Id == id);
            
            if (rule == null)
                return NotFound();
                
            // Return clean DTO to avoid circular references
            var response = new
            {
                id = rule.Id,
                name = rule.Name,
                description = rule.Description,
                categoryId = rule.CategoryId,
                subCategoryId = rule.SubCategoryId,
                ticketPriority = rule.TicketPriority,
                departmentId = rule.DepartmentId,
                keywords = rule.Keywords,
                strategy = (int)rule.Strategy,
                strategyName = rule.Strategy.ToString(),
                priority = rule.Priority,
                isActive = rule.IsActive,
                createdAt = rule.CreatedAt,
                updatedAt = rule.UpdatedAt
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving assignment rule {RuleId}", id);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update an existing assignment rule
    /// </summary>
    [HttpPut("rules/{id}")]
    public async Task<IActionResult> UpdateRule(int id, [FromBody] UpdateAutoAssignmentRuleRequest request)
    {
        try
        {
            var rule = await _autoAssignmentService.UpdateRuleAsync(id, request);
            return Ok(rule);
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating assignment rule {RuleId}", id);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete an assignment rule
    /// </summary>
    [HttpDelete("rules/{id}")]
    public async Task<IActionResult> DeleteRule(int id)
    {
        try
        {
            await _autoAssignmentService.DeleteRuleAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting assignment rule {RuleId}", id);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get current agent workloads
    /// </summary>
    [HttpGet("workloads")]
    public async Task<IActionResult> GetAgentWorkloads()
    {
        try
        {
            var workloads = await _autoAssignmentService.GetAgentWorkloadsAsync();
            return Ok(workloads);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving agent workloads");
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Rebalance agent workloads
    /// </summary>
    [HttpPost("rebalance")]
    public async Task<IActionResult> RebalanceWorkloads()
    {
        try
        {
            var result = await _autoAssignmentService.RebalanceWorkloadsAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rebalancing workloads");
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Test keyword matching for email content
    /// </summary>
    [HttpPost("test-keywords")]
    public async Task<IActionResult> TestKeywordMatching([FromBody] KeywordTestRequest request)
    {
        try
        {
            var result = await DetermineCategory(request.Subject, request.Content);
            
            return Ok(new {
                success = result != null,
                category = result?.CategoryName,
                subcategory = result?.SubCategoryName,
                matchedKeywords = result?.MatchedKeywords ?? new List<string>(),
                confidence = result?.Confidence ?? 0
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing keyword matching");
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get keywords for a specific subcategory
    /// </summary>
    [HttpGet("keywords/subcategory/{subcategoryId}")]
    public async Task<IActionResult> GetSubcategoryKeywords(int subcategoryId)
    {
        try
        {
            var keywords = await _context.SubcategoryKeywords
                .Where(sk => sk.SubcategoryId == subcategoryId)
                .OrderByDescending(sk => sk.Weight)
                .ThenBy(sk => sk.Keyword)
                .Select(sk => new {
                    sk.Id,
                    sk.Keyword,
                    sk.Weight,
                    sk.IsActive,
                    sk.Description,
                    sk.SubcategoryId,
                    sk.CreatedAt,
                    sk.UpdatedAt
                })
                .ToListAsync();

            return Ok(keywords);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving keywords for subcategory {SubcategoryId}", subcategoryId);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Add a new keyword to a subcategory
    /// </summary>
    [HttpPost("keywords")]
    public async Task<IActionResult> AddSubcategoryKeyword([FromBody] CreateSubcategoryKeywordRequest request)
    {
        try
        {
            // Check if keyword already exists for this subcategory
            var existingKeyword = await _context.SubcategoryKeywords
                .FirstOrDefaultAsync(sk => sk.SubcategoryId == request.SubcategoryId && 
                                         sk.Keyword.ToLower() == request.Keyword.ToLower());

            if (existingKeyword != null)
            {
                return BadRequest(new { success = false, message = "Keyword already exists for this subcategory" });
            }

            var keyword = new SubcategoryKeyword
            {
                SubcategoryId = request.SubcategoryId,
                Keyword = request.Keyword.ToLower().Trim(),
                Weight = request.Weight,
                IsActive = request.IsActive,
                Description = request.Description?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.SubcategoryKeywords.Add(keyword);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSubcategoryKeywords), 
                new { subcategoryId = keyword.SubcategoryId }, 
                new {
                    keyword.Id,
                    keyword.Keyword,
                    keyword.Weight,
                    keyword.IsActive,
                    keyword.Description,
                    keyword.SubcategoryId,
                    keyword.CreatedAt,
                    keyword.UpdatedAt
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding keyword to subcategory {SubcategoryId}", request.SubcategoryId);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update an existing keyword
    /// </summary>
    [HttpPut("keywords/{id}")]
    public async Task<IActionResult> UpdateSubcategoryKeyword(int id, [FromBody] UpdateSubcategoryKeywordRequest request)
    {
        try
        {
            var keyword = await _context.SubcategoryKeywords.FindAsync(id);
            
            if (keyword == null)
            {
                return NotFound(new { success = false, message = "Keyword not found" });
            }

            // Check if new keyword conflicts with existing ones (if keyword is being changed)
            if (!string.IsNullOrEmpty(request.Keyword) && 
                request.Keyword.ToLower() != keyword.Keyword.ToLower())
            {
                var existingKeyword = await _context.SubcategoryKeywords
                    .FirstOrDefaultAsync(sk => sk.SubcategoryId == keyword.SubcategoryId && 
                                             sk.Keyword.ToLower() == request.Keyword.ToLower() &&
                                             sk.Id != id);

                if (existingKeyword != null)
                {
                    return BadRequest(new { success = false, message = "Keyword already exists for this subcategory" });
                }

                keyword.Keyword = request.Keyword.ToLower().Trim();
            }

            if (request.Weight.HasValue)
                keyword.Weight = request.Weight.Value;

            if (request.IsActive.HasValue)
                keyword.IsActive = request.IsActive.Value;

            if (request.Description != null)
                keyword.Description = request.Description.Trim();

            keyword.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new {
                keyword.Id,
                keyword.Keyword,
                keyword.Weight,
                keyword.IsActive,
                keyword.Description,
                keyword.SubcategoryId,
                keyword.CreatedAt,
                keyword.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating keyword {KeywordId}", id);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete a keyword
    /// </summary>
    [HttpDelete("keywords/{id}")]
    public async Task<IActionResult> DeleteSubcategoryKeyword(int id)
    {
        try
        {
            var keyword = await _context.SubcategoryKeywords.FindAsync(id);
            
            if (keyword == null)
            {
                return NotFound(new { success = false, message = "Keyword not found" });
            }

            _context.SubcategoryKeywords.Remove(keyword);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Keyword deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting keyword {KeywordId}", id);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    #region Private Helper Methods

    private async Task<CategoryDeterminationResult?> DetermineCategory(string subject, string content)
    {
        // Get all active keyword mappings from database
        var keywordMappings = await _context.SubcategoryKeywords
            .Include(sk => sk.Subcategory)
            .Where(sk => sk.IsActive && sk.Subcategory.IsActive)
            .ToListAsync();

        if (!keywordMappings.Any())
        {
            _logger.LogWarning("No keyword mappings found in database");
            return null;
        }

        var combinedText = $"{subject} {content}".ToLower();
        var bestMatch = new CategoryDeterminationResult();
        var maxScore = 0;
        var matchedKeywords = new List<string>();

        // Group by subcategory for scoring
        var subcategoryGroups = keywordMappings.GroupBy(km => km.Subcategory);

        foreach (var subcategoryGroup in subcategoryGroups)
        {
            var subcategory = subcategoryGroup.Key;
            var keywords = subcategoryGroup.ToList();
            var subcategoryMatchedKeywords = new List<string>();
            var score = 0;

            foreach (var keywordMapping in keywords)
            {
                var keyword = keywordMapping.Keyword.ToLower();
                if (combinedText.Contains(keyword))
                {
                    subcategoryMatchedKeywords.Add(keywordMapping.Keyword);
                    // Use keyword weight and length for scoring
                    score += (keyword.Length * keywordMapping.Weight);
                }
            }

            if (score > maxScore)
            {
                maxScore = score;
                matchedKeywords = subcategoryMatchedKeywords;
                bestMatch = new CategoryDeterminationResult
                {
                    CategoryName = GetCategoryNameById(subcategory.CategoryId),
                    CategoryId = subcategory.CategoryId,
                    SubCategoryName = subcategory.Name,
                    SubCategoryId = subcategory.Id,
                    MatchedKeywords = subcategoryMatchedKeywords,
                    Confidence = Math.Min(100, (score * 2)) // Convert to percentage, max 100%
                };
            }
        }

        return maxScore > 0 ? bestMatch : null;
    }

    private string GetCategoryNameById(int categoryId) => categoryId switch
    {
        0 => "General",
        1 => "Technical", 
        2 => "Content",
        3 => "Assessment",
        5 => "Office 365",
        _ => "Other"
    };

    private int GetCategoryId(string categoryName) => categoryName switch
    {
        "General" => 0,
        "Technical" => 1,
        "Content" => 2,
        "Assessment" => 3,
        "Office 365" => 5,
        _ => 4 // Other
    };

    private int? GetSubCategoryId(string categoryName, string subCategoryName)
    {
        // This would ideally be looked up from database
        // For now, return null and let the system handle it
        return null;
    }

    private int DeterminePriority(string subject, string content)
    {
        var combinedText = $"{subject} {content}".ToLower();
        
        // Critical keywords
        if (combinedText.Contains("urgent") || combinedText.Contains("critical") || 
            combinedText.Contains("emergency") || combinedText.Contains("asap"))
            return 3; // Critical
            
        // High priority keywords
        if (combinedText.Contains("important") || combinedText.Contains("priority") ||
            combinedText.Contains("deadline") || combinedText.Contains("broken"))
            return 2; // High
            
        // Medium priority keywords
        if (combinedText.Contains("issue") || combinedText.Contains("problem") ||
            combinedText.Contains("help") || combinedText.Contains("support"))
            return 1; // Medium
            
        return 0; // Low (default)
    }

    #endregion
}

#region Request/Response Models

public class EmailAssignmentRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string? RecipientEmail { get; set; }
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
}

public class KeywordTestRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class CreateSubcategoryKeywordRequest
{
    public int SubcategoryId { get; set; }
    public string Keyword { get; set; } = string.Empty;
    public int Weight { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }
}

public class UpdateSubcategoryKeywordRequest
{
    public string? Keyword { get; set; }
    public int? Weight { get; set; }
    public bool? IsActive { get; set; }
    public string? Description { get; set; }
}

public class CategoryDeterminationResult
{
    public string CategoryName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string SubCategoryName { get; set; } = string.Empty;
    public int? SubCategoryId { get; set; }
    public List<string> MatchedKeywords { get; set; } = new();
    public int Confidence { get; set; } // 0-100%
}

public class EmailTicketContext
{
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public int DeterminedCategory { get; set; }
    public int? DeterminedSubCategory { get; set; }
    public List<string> MatchedKeywords { get; set; } = new();
    public int Priority { get; set; }
}

#endregion
*/