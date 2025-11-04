using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.DTOs.Ticketing.Sla;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/sla")]
public class SlaPublicController : ControllerBase
{
    private readonly ILogger<SlaPublicController> _logger;
    private readonly ApplicationDbContext _context;

    public SlaPublicController(ILogger<SlaPublicController> logger, ApplicationDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    // GET: api/sla/policies  
    [HttpGet("policies")]
    public async Task<ActionResult> GetSlaPolicies()
    {
        _logger.LogInformation("SLA policies requested");
        
        try
        {
            // Get policies from database
            var policiesFromDb = await _context.SlaPolicies
                .Include(sp => sp.EscalationContacts)
                .ToListAsync();
            
            // Map to response with fallback names if needed
            var policies = policiesFromDb.Select(sp => new
            {
                id = sp.Id,
                name = sp.Name ?? GetPolicyName(sp.Category, sp.Priority),
                description = sp.Description ?? GetPolicyDescription(sp.Category, sp.Priority),
                isActive = sp.IsActive,
                category = sp.Category,
                priority = sp.Priority,
                firstResponseTime = sp.FirstResponseMins,
                resolutionTime = sp.ResolutionMins,
                escalationTime = sp.FirstResponseMins / 2,
                businessHoursOnly = sp.Priority < 3,
                createdAt = sp.CreatedAt,
                updatedAt = sp.UpdatedAt,
                escalationContactsCount = sp.EscalationContacts.Count(ec => ec.IsActive)
            }).ToList();

            return Ok(policies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching SLA policies");
            return StatusCode(500, "Error fetching SLA policies");
        }
    }

    // GET: api/sla/policies/{id}
    [HttpGet("policies/{id:guid}")]
    public async Task<ActionResult> GetSlaPolicy(Guid id)
    {
        _logger.LogInformation("SLA policy {PolicyId} requested", id);
        
        try
        {
            var policy = await _context.SlaPolicies
                .Include(sp => sp.EscalationContacts.Where(ec => ec.IsActive))
                .Where(sp => sp.Id == id)
                .Select(sp => new
                {
                    id = sp.Id,
                    name = sp.Name ?? GetPolicyName(sp.Category, sp.Priority),
                    description = sp.Description ?? GetPolicyDescription(sp.Category, sp.Priority),
                    isActive = sp.IsActive,
                    category = sp.Category,
                    priority = sp.Priority,
                    firstResponseTime = sp.FirstResponseMins,
                    resolutionTime = sp.ResolutionMins,
                    escalationTime = sp.FirstResponseMins / 2,
                    businessHoursOnly = sp.Priority < 3,
                    createdAt = sp.CreatedAt,
                    updatedAt = sp.UpdatedAt,
                    escalationContacts = sp.EscalationContacts.Select(ec => new
                    {
                        id = ec.Id,
                        name = ec.Name,
                        email = ec.Email,
                        level = ec.Level,
                        notifyByEmail = ec.NotifyByEmail,
                        notifyBySystem = ec.NotifyBySystem
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (policy == null)
            {
                return NotFound($"SLA policy with ID {id} not found");
            }

            return Ok(policy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching SLA policy {PolicyId}", id);
            return StatusCode(500, "Error fetching SLA policy");
        }
    }

    // PUT: api/sla/policies/{id}
    [HttpPut("policies/{id:guid}")]
    public async Task<ActionResult> UpdateSlaPolicy(Guid id, [FromBody] UpdateSlaPolicyRequest request)
    {
        _logger.LogInformation("Updating SLA policy {PolicyId}", id);
        
        try
        {
            var policy = await _context.SlaPolicies.FindAsync(id);
            if (policy == null)
            {
                return NotFound($"SLA policy with ID {id} not found");
            }

            // Update all fields
            policy.Name = request.Name;
            policy.Description = request.Description;
            policy.IsActive = request.IsActive;
            policy.Category = request.Category;
            policy.Priority = request.Priority;
            policy.FirstResponseMins = request.FirstResponseMins;
            policy.ResolutionMins = request.ResolutionMins;
            policy.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("SLA policy {PolicyId} updated successfully", id);

            var response = new
            {
                id = policy.Id,
                name = policy.Name,
                description = policy.Description,
                isActive = policy.IsActive,
                category = policy.Category,
                priority = policy.Priority,
                firstResponseTime = policy.FirstResponseMins,
                resolutionTime = policy.ResolutionMins,
                escalationTime = policy.FirstResponseMins / 2,
                businessHoursOnly = policy.Priority < 3,
                createdAt = policy.CreatedAt,
                updatedAt = policy.UpdatedAt
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating SLA policy {PolicyId}", id);
            return BadRequest($"Error updating SLA policy: {ex.Message}");
        }
    }

    // POST: api/sla/policies
    [HttpPost("policies")]
    public async Task<ActionResult> CreateSlaPolicy([FromBody] CreateSlaPolicyRequest request)
    {
        _logger.LogInformation("Creating new SLA policy");
        
        try
        {
            var slaPolicy = new SlaPolicy
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description ?? GetPolicyDescription(request.Category, request.Priority),
                IsActive = true,
                Category = request.Category,
                Priority = request.Priority,
                FirstResponseMins = request.FirstResponseMins,
                ResolutionMins = request.ResolutionMins,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.SlaPolicies.Add(slaPolicy);
            await _context.SaveChangesAsync();

            var response = new
            {
                id = slaPolicy.Id,
                name = slaPolicy.Name,
                description = slaPolicy.Description,
                isActive = slaPolicy.IsActive,
                category = slaPolicy.Category,
                priority = slaPolicy.Priority,
                firstResponseTime = slaPolicy.FirstResponseMins,
                resolutionTime = slaPolicy.ResolutionMins,
                escalationTime = slaPolicy.FirstResponseMins / 2,
                businessHoursOnly = slaPolicy.Priority < 3,
                createdAt = slaPolicy.CreatedAt,
                updatedAt = slaPolicy.UpdatedAt
            };

            return CreatedAtAction(nameof(GetSlaPolicy), new { id = slaPolicy.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating SLA policy");
            return BadRequest($"Error creating SLA policy: {ex.Message}");
        }
    }

    // DELETE: api/sla/policies/{id}
    [HttpDelete("policies/{id:guid}")]
    public async Task<ActionResult> DeleteSlaPolicy(Guid id)
    {
        _logger.LogInformation("Deleting SLA policy {PolicyId}", id);
        
        try
        {
            var policy = await _context.SlaPolicies.FindAsync(id);
            if (policy == null)
            {
                return NotFound($"SLA policy with ID {id} not found");
            }

            // First delete all escalation contacts for this policy
            var escalationContacts = await _context.SlaEscalationContacts
                .Where(ec => ec.SlaPolicyId == id)
                .ToListAsync();
            
            _context.SlaEscalationContacts.RemoveRange(escalationContacts);

            // Then delete the policy
            _context.SlaPolicies.Remove(policy);
            await _context.SaveChangesAsync();

            _logger.LogInformation("SLA policy {PolicyId} deleted successfully", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting SLA policy {PolicyId}", id);
            return BadRequest($"Error deleting SLA policy: {ex.Message}");
        }
    }

    // GET: api/sla/escalation-contacts
    [HttpGet("escalation-contacts")]
    public async Task<ActionResult> GetEscalationContacts()
    {
        _logger.LogInformation("SLA escalation contacts requested");
        
        try
        {
            var contactsFromDb = await _context.SlaEscalationContacts
                .Include(ec => ec.SlaPolicy)
                .Where(ec => ec.IsActive)
                .OrderBy(ec => ec.Level)
                .ThenBy(ec => ec.Name)
                .ToListAsync();

            // Map after retrieval to avoid EF translation issues
            var contacts = contactsFromDb.Select(ec => new
            {
                id = ec.Id,
                name = ec.Name,
                email = ec.Email,
                department = "IT Support", // Could be enhanced with actual department field
                level = ec.Level,
                isActive = ec.IsActive,
                slaPolicyId = ec.SlaPolicyId,
                slaPolicyName = ec.SlaPolicy?.Name ?? (ec.SlaPolicy != null ? GetPolicyName(ec.SlaPolicy.Category, ec.SlaPolicy.Priority) : "Unknown"),
                notificationPreferences = new {
                    email = ec.NotifyByEmail,
                    sms = ec.Level <= 2, // Lower levels get SMS
                    slack = ec.NotifyBySystem
                },
                createdAt = ec.CreatedAt,
                updatedAt = ec.UpdatedAt
            }).ToList();

            return Ok(contacts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching escalation contacts");
            return StatusCode(500, $"Error fetching escalation contacts: {ex.Message}");
        }
    }

    // POST: api/sla/policies/{policyId}/escalation-contacts
    [HttpPost("policies/{policyId:guid}/escalation-contacts")]
    public async Task<ActionResult> CreateEscalationContact(Guid policyId, [FromBody] CreateSlaEscalationContactRequest request)
    {
        _logger.LogInformation("Creating new escalation contact for policy {PolicyId}", policyId);
        
        try
        {
            // Verify the SLA policy exists
            var policyExists = await _context.SlaPolicies.AnyAsync(sp => sp.Id == policyId);
            if (!policyExists)
            {
                return BadRequest("Invalid SLA Policy ID");
            }

            var contact = new SlaEscalationContact
            {
                SlaPolicyId = policyId,
                Level = request.Level,
                Name = request.Name,
                Email = request.Email,
                NotifyByEmail = request.NotifyByEmail ?? true,
                NotifyBySystem = request.NotifyBySystem ?? false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.SlaEscalationContacts.Add(contact);
            await _context.SaveChangesAsync();

            var response = new
            {
                id = contact.Id,
                name = contact.Name,
                email = contact.Email,
                department = "IT Support",
                level = contact.Level,
                isActive = contact.IsActive,
                slaPolicyId = contact.SlaPolicyId,
                notificationPreferences = new {
                    email = contact.NotifyByEmail,
                    sms = contact.Level <= 2,
                    slack = contact.NotifyBySystem
                },
                createdAt = contact.CreatedAt,
                updatedAt = contact.UpdatedAt
            };

            return CreatedAtAction(nameof(GetEscalationContacts), response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating escalation contact");
            return BadRequest($"Error creating escalation contact: {ex.Message}");
        }
    }

    private string GetPolicyName(int category, int priority)
    {
        var categoryName = category switch
        {
            0 => "General",
            1 => "Hardware",
            2 => "Software",
            3 => "Network",
            _ => "Unknown"
        };

        var priorityName = priority switch
        {
            0 => "Low",
            1 => "Medium", 
            2 => "High",
            3 => "Critical",
            _ => "Unknown"
        };

        return $"{categoryName} - {priorityName} Priority";
    }

    private string GetPolicyDescription(int category, int priority)
    {
        var categoryName = category switch
        {
            0 => "general inquiries",
            1 => "hardware issues",
            2 => "software problems",
            3 => "network connectivity",
            _ => "unknown issues"
        };

        var priorityName = priority switch
        {
            0 => "low priority",
            1 => "medium priority",
            2 => "high priority", 
            3 => "critical",
            _ => "unknown priority"
        };

        return $"SLA policy for {categoryName} with {priorityName} level";
    }
}