using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Infrastructure.Data;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api")]
public class PublicEmailConfigController_Disabled : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PublicEmailConfigController_Disabled> _logger;

    public PublicEmailConfigController_Disabled(
        ApplicationDbContext context,
        ILogger<PublicEmailConfigController_Disabled> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Public endpoint for basic email configuration (no auth required)
    /// </summary>
    [HttpGet("public/email-config")]
    public async Task<ActionResult<object>> GetEmailConfiguration()
    {
        try
        {
            // Return basic email configuration without sensitive data
            var result = new 
            {
                enabled = true,
                processingEnabled = true,
                supportedDomains = new[] { "example.com" }, // TODO: Replace with your domain
                defaultFromEmail = "noreply@example.com", // TODO: Replace with your email
                defaultFromName = "Support Team",
                maxEmailsPerBatch = 50,
                processingIntervalMinutes = 5,
                categories = await _context.TicketCategories
                    .Where(c => c.IsActive)
                    .Select(c => new { id = c.Id, name = c.Name })
                    .ToListAsync()
            };
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading public email configuration");
            return StatusCode(500, new { message = "Error loading email configuration" });
        }
    }

    /// <summary>
    /// Public endpoint for email accounts (no auth required)
    /// </summary>
    [HttpGet("public/email-config/accounts")]
    public async Task<ActionResult<object[]>> GetEmailAccounts()
    {
        try
        {
            // Return basic email account info without sensitive data
            var accounts = await _context.CategoryEmailMappings
                .Where(m => m.IsActive)
                .Select(m => new 
                {
                    id = m.Id,
                    email = m.EmailAddress,
                    displayName = m.DisplayName,
                    categoryId = m.CategoryId,
                    isActive = m.IsActive,
                    isDefault = m.Id == 4, // TODO: Configure default email mailbox ID
                    department = "IT Support",
                    keywords = m.KeywordMappings ?? "",
                    defaultPriority = 2,
                    categories = new[] { "IT Support", "MIS & Technology" }
                })
                .ToArrayAsync();
            
            return Ok(accounts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading public email accounts");
            return StatusCode(500, new { message = "Error loading email accounts" });
        }
    }

    /// <summary>
    /// Public endpoint for specific email account (no auth required)
    /// </summary>
    [HttpGet("public/email-config/accounts/{id:int}")]
    public async Task<ActionResult<object>> GetEmailAccount(int id)
    {
        try
        {
            var account = await _context.CategoryEmailMappings
                .Where(m => m.Id == id)
                .Select(m => new 
                {
                    id = m.Id,
                    email = m.EmailAddress,
                    displayName = m.DisplayName,
                    categoryId = m.CategoryId,
                    isActive = m.IsActive,
                    isDefault = m.Id == 4, // Hardcode for now
                    department = "IT Support",
                    keywords = m.KeywordMappings ?? "",
                    defaultPriority = 2,
                    categories = new[] { "IT Support", "MIS & Technology" },
                    configuration = new 
                    {
                        autoProcess = true,
                        priority = 2,
                        assignToGroup = "IT Support",
                        processingEnabled = true,
                        notificationEnabled = true
                    }
                })
                .FirstOrDefaultAsync();
            
            if (account == null)
                return NotFound(new { message = $"Email account {id} not found" });
                
            return Ok(account);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading email account {Id}", id);
            return StatusCode(500, new { message = "Error loading email account" });
        }
    }

    /// <summary>
    /// Get available categories for email configuration
    /// </summary>
    [HttpGet("public/email-config/categories")]
    public async Task<ActionResult<object[]>> GetAvailableCategories()
    {
        try
        {
            var categories = await _context.TicketCategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new 
                {
                    id = c.Id,
                    name = c.Name,
                    description = c.Description,
                    color = c.Color,
                    iconName = c.IconName
                })
                .ToArrayAsync();
            
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading categories for email configuration");
            return StatusCode(500, new { message = "Error loading categories" });
        }
    }
}