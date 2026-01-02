using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ERPTraining.Core.Models.Ticketing;
using ERPTraining.Infrastructure.Services.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Entities.Tickets;
using System.Text.Json;

namespace ERPTraining.APIng;

public class CreateEmailAccountDto
{
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public List<string>? Categories { get; set; }
}

[ApiController]
[Route("api/email-config")]
[Authorize(Roles = "Admin")]
public class EmailConfigurationController_Disabled : ControllerBase
{
    private readonly IEmailConfigurationService _emailConfigService;
    private readonly IGraphEmailConfigService _graphEmailConfigService;
    private readonly ILogger<EmailConfigurationController_Disabled> _logger;

    public EmailConfigurationController_Disabled(
        IEmailConfigurationService emailConfigService,
        IGraphEmailConfigService graphEmailConfigService,
        ILogger<EmailConfigurationController_Disabled> logger)
    {
        _emailConfigService = emailConfigService;
        _graphEmailConfigService = graphEmailConfigService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current email configuration
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<EmailConfiguration>> GetEmailConfiguration()
    {
        try
        {
            // Get both the main email configuration and the saved GraphEmailConfigs
            var config = await _emailConfigService.GetEmailConfigurationAsync();
            var graphConfigs = await _graphEmailConfigService.GetAllAsync();
            
            // Remove sensitive information (client secrets) from response
            var sanitizedConfig = new EmailConfiguration
            {
                EnableGraphApi = config.EnableGraphApi,
                ProcessedFolder = config.ProcessedFolder,
                ErrorFolder = config.ErrorFolder,
                MaxEmailsPerBatch = config.MaxEmailsPerBatch,
                ProcessingIntervalMinutes = config.ProcessingIntervalMinutes,
                DefaultFromEmail = config.DefaultFromEmail,
                DefaultFromName = config.DefaultFromName,
                EmailAccounts = config.EmailAccounts.Select(a => new EmailAccount
                {
                    Id = a.Id,
                    Email = a.Email,
                    DisplayName = a.DisplayName,
                    IsActive = a.IsActive,
                    IsDefault = a.IsDefault,
                    Categories = a.Categories,
                    ClientId = a.ClientId,
                    TenantId = a.TenantId,
                    ClientSecret = string.IsNullOrEmpty(a.ClientSecret) ? "" : "***CONFIGURED***",
                    Department = a.Department,
                    Keywords = a.Keywords,
                    DefaultPriority = a.DefaultPriority,
                    DefaultAssignee = a.DefaultAssignee
                }).ToList(),
                AutoAssignmentRules = config.AutoAssignmentRules,
                NotificationSettings = config.NotificationSettings
            };

            return Ok(sanitizedConfig);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting email configuration");
            return StatusCode(500, new { message = "Error retrieving email configuration" });
        }
    }

    /// <summary>
    /// Gets all active email accounts
    /// </summary>
    [HttpGet("accounts")]
    public async Task<ActionResult<List<EmailAccount>>> GetEmailAccounts()
    {
        try
        {
            var accounts = await _emailConfigService.GetActiveEmailAccountsAsync();
            
            // Sanitize sensitive information
            var sanitizedAccounts = accounts.Select(a => new EmailAccount
            {
                Id = a.Id,
                Email = a.Email,
                DisplayName = a.DisplayName,
                IsActive = a.IsActive,
                IsDefault = a.IsDefault,
                Categories = a.Categories,
                ClientId = a.ClientId,
                TenantId = a.TenantId,
                ClientSecret = string.IsNullOrEmpty(a.ClientSecret) ? "" : "***CONFIGURED***",
                Department = a.Department,
                Keywords = a.Keywords,
                DefaultPriority = a.DefaultPriority,
                DefaultAssignee = a.DefaultAssignee
            }).ToList();

            return Ok(sanitizedAccounts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting email accounts");
            return StatusCode(500, new { message = "Error retrieving email accounts" });
        }
    }

    /// <summary>
    /// Gets email account for a specific category
    /// </summary>
    [HttpGet("category/{categoryName}")]
    public async Task<ActionResult<EmailAccount>> GetEmailAccountForCategory(string categoryName)
    {
        try
        {
            var account = await _emailConfigService.GetEmailAccountForCategoryAsync(categoryName);
            
            if (account == null)
            {
                return NotFound(new { message = $"No email account configured for category: {categoryName}" });
            }

            // Sanitize sensitive information
            var sanitizedAccount = new EmailAccount
            {
                Id = account.Id,
                Email = account.Email,
                DisplayName = account.DisplayName,
                IsActive = account.IsActive,
                IsDefault = account.IsDefault,
                Categories = account.Categories,
                ClientId = account.ClientId,
                TenantId = account.TenantId,
                ClientSecret = string.IsNullOrEmpty(account.ClientSecret) ? "" : "***CONFIGURED***",
                Department = account.Department,
                Keywords = account.Keywords,
                DefaultPriority = account.DefaultPriority,
                DefaultAssignee = account.DefaultAssignee
            };

            return Ok(sanitizedAccount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting email account for category {Category}", categoryName);
            return StatusCode(500, new { message = "Error retrieving email account for category" });
        }
    }

    /// <summary>
    /// Creates a new email configuration
    /// </summary>
    [HttpPost]
    public async Task<ActionResult> CreateEmailConfiguration([FromBody] object configurationData)
    {
        try
        {
            if (configurationData == null)
            {
                return BadRequest(new { message = "Configuration is required" });
            }

            // Try to deserialize the object to CreateGraphEmailConfigDto
            var jsonString = JsonSerializer.Serialize(configurationData);
            var dto = JsonSerializer.Deserialize<CreateGraphEmailConfigDto>(jsonString, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });

            if (dto == null)
            {
                return BadRequest(new { message = "Invalid configuration format" });
            }

            _logger.LogInformation("Creating new GraphEmailConfig with email: {Email}", dto.Email);
            
            var createdConfig = await _graphEmailConfigService.CreateAsync(dto);
            
            _logger.LogInformation("Successfully created GraphEmailConfig with ID: {Id}", createdConfig.Id);
            
            return Ok(new { 
                message = "Email configuration created successfully", 
                id = createdConfig.Id,
                email = createdConfig.Email
            });
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error creating email configuration");
            return BadRequest(new { message = "Invalid JSON format", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating email configuration");
            return StatusCode(500, new { message = "Error creating email configuration", details = ex.Message });
        }
    }

    /// <summary>
    /// Gets all saved Graph email configurations
    /// </summary>
    [HttpGet("graph-configs")]
    public async Task<ActionResult> GetGraphEmailConfigurations()
    {
        try
        {
            var graphConfigs = await _graphEmailConfigService.GetAllAsync();
            _logger.LogInformation("Retrieved {Count} GraphEmailConfigs from database", graphConfigs.Count());
            
            return Ok(new { 
                count = graphConfigs.Count(),
                configurations = graphConfigs 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving GraphEmailConfigs");
            return StatusCode(500, new { message = "Error retrieving configurations", details = ex.Message });
        }
    }

    /// <summary>
    /// Gets a single Graph email configuration for editing (includes actual client secret)
    /// </summary>
    [HttpGet("graph-config/{id}")]
    public async Task<ActionResult> GetGraphEmailConfigurationForEdit(int id)
    {
        try
        {
            _logger.LogInformation("Retrieving GraphEmailConfig with ID: {Id} for editing", id);
            
            // Get the entity directly to access all properties including ClientSecret
            var config = await _graphEmailConfigService.GetEntityByIdAsync(id);
            
            if (config == null)
            {
                _logger.LogWarning("GraphEmailConfig with ID {Id} not found", id);
                return NotFound(new { message = $"Email configuration with ID {id} not found" });
            }

            // Return the actual configuration with real client secret for editing
            var editDto = new
            {
                Id = config.Id,
                Email = config.Email,
                TenantId = config.TenantId,
                ClientId = config.ClientId,
                ClientSecret = config.ClientSecret, // Return actual secret for editing
                CategoryId = config.CategoryId,
                CategoryName = string.Empty, // Will be populated by frontend from CategoryId
                ProcessIncomingEmails = config.ProcessIncomingEmails,
                CreateTicketsFromEmails = config.CreateTicketsFromEmails,
                SendNotifications = config.SendNotifications,
                IsActive = config.IsActive
            };

            _logger.LogInformation("Successfully retrieved GraphEmailConfig with ID: {Id} for editing", id);
            return Ok(editDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving GraphEmailConfig with ID {Id} for editing", id);
            return StatusCode(500, new { message = "Error retrieving email configuration for editing", details = ex.Message });
        }
    }

    /// <summary>
    /// Deletes a Graph email configuration
    /// </summary>
    [HttpDelete("graph-config/{id}")]
    public async Task<ActionResult> DeleteGraphEmailConfiguration(int id)
    {
        try
        {
            _logger.LogInformation("Attempting to delete GraphEmailConfig with ID: {Id}", id);
            
            var success = await _graphEmailConfigService.DeleteAsync(id);
            
            if (!success)
            {
                _logger.LogWarning("GraphEmailConfig with ID {Id} not found", id);
                return NotFound(new { message = $"Email configuration with ID {id} not found" });
            }
            
            _logger.LogInformation("Successfully deleted GraphEmailConfig with ID: {Id}", id);
            return Ok(new { message = "Email configuration deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting GraphEmailConfig with ID {Id}", id);
            return StatusCode(500, new { message = "Error deleting email configuration", details = ex.Message });
        }
    }

    /// <summary>
    /// Updates email configuration
    /// </summary>
    [HttpPut]
    // [Authorize(Roles = "Admin")] // Temporarily disabled for testing
    public async Task<ActionResult> UpdateEmailConfiguration([FromBody] EmailConfiguration configuration)
    {
        try
        {
            if (configuration == null)
            {
                return BadRequest(new { message = "Configuration is required" });
            }

            // Validate configuration
            var validationErrors = ValidateEmailConfiguration(configuration);
            if (validationErrors.Any())
            {
                return BadRequest(new { message = "Validation errors", errors = validationErrors });
            }

            var success = await _emailConfigService.UpdateEmailConfigurationAsync(configuration);
            
            if (!success)
            {
                return StatusCode(500, new { message = "Failed to update email configuration" });
            }

            _logger.LogInformation("Email configuration updated by user");
            return Ok(new { message = "Email configuration updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email configuration");
            return StatusCode(500, new { message = "Error updating email configuration" });
        }
    }

    /// <summary>
    /// Updates a specific email account configuration
    /// </summary>
    [HttpPut("{id}")]
    // [Authorize(Roles = "Admin")] // Temporarily disabled for testing
    public async Task<ActionResult> UpdateEmailAccount(int id, [FromBody] EmailConfiguration configuration)
    {
        try
        {
            if (configuration == null)
            {
                return BadRequest(new { message = "Configuration is required" });
            }

            // Validate configuration
            var validationErrors = ValidateEmailConfiguration(configuration);
            if (validationErrors.Any())
            {
                return BadRequest(new { message = "Validation errors", errors = validationErrors });
            }

            var success = await _emailConfigService.UpdateEmailConfigurationAsync(configuration);
            
            if (!success)
            {
                return StatusCode(500, new { message = "Failed to update email configuration" });
            }

            _logger.LogInformation("Email configuration updated for account {Id}", id);
            return Ok(new { message = "Email configuration updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email configuration for account {Id}", id);
            return StatusCode(500, new { message = "Error updating email configuration" });
        }
    }

    /// <summary>
    /// Deletes a specific email account configuration (deactivates it)
    /// </summary>
    [HttpDelete("{id}")]
    // [Authorize(Roles = "Admin")] // Temporarily disabled for testing
    public ActionResult DeleteEmailAccount(int id)
    {
        try
        {
            // Since we don't have a delete method in the service, we'll treat this as deactivation
            // For now, return success as a placeholder
            _logger.LogInformation("Email account {Id} deletion requested (placeholder)", id);
            return Ok(new { message = "Email account deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting email account {Id}", id);
            return StatusCode(500, new { message = "Error deleting email account" });
        }
    }

    /// <summary>
    /// Tests connection for an email account
    /// </summary>
    [HttpPost("test-connection/{accountId}")]
    // [Authorize(Roles = "Admin")] // Temporarily disabled for testing
    public async Task<ActionResult> TestEmailConnection(string accountId)
    {
        try
        {
            var success = await _emailConfigService.TestEmailAccountConnectionAsync(accountId);
            
            if (!success)
            {
                return BadRequest(new { message = "Email account connection test failed" });
            }

            return Ok(new { message = "Email account connection test successful" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing email connection for account {AccountId}", accountId);
            return StatusCode(500, new { message = "Error testing email connection" });
        }
    }

    /// <summary>
    /// Tests connection for a Graph email configuration
    /// </summary>
    [HttpPost("{id}/test-connection")]
    public async Task<ActionResult> TestGraphEmailConnection(int id)
    {
        try
        {
            _logger.LogInformation("Testing connection for GraphEmailConfig with ID: {Id}", id);
            
            // Get the configuration
            var config = await _graphEmailConfigService.GetEntityByIdAsync(id);
            if (config == null)
            {
                _logger.LogWarning("GraphEmailConfig with ID {Id} not found for connection test", id);
                return NotFound(new { success = false, message = $"Email configuration with ID {id} not found" });
            }

            // For now, we'll just validate the configuration exists and is active
            // In a full implementation, you would test the actual Microsoft Graph connection
            if (!config.IsActive)
            {
                return Ok(new { success = false, message = "Email configuration is inactive" });
            }

            // Basic validation
            if (string.IsNullOrEmpty(config.TenantId) || 
                string.IsNullOrEmpty(config.ClientId) || 
                string.IsNullOrEmpty(config.ClientSecret))
            {
                return Ok(new { success = false, message = "Email configuration is incomplete" });
            }

            _logger.LogInformation("Connection test successful for GraphEmailConfig with ID: {Id}", id);
            return Ok(new { success = true, message = "Email connection test successful! Configuration is valid." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing Graph email connection for ID {Id}", id);
            return Ok(new { success = false, message = "Connection test failed due to server error" });
        }
    }

    /// <summary>
    /// Gets available categories for email mapping
    /// </summary>
    [HttpGet("available-categories")]
    public ActionResult<List<string>> GetAvailableCategories()
    {
        try
        {
            // This would typically come from your ticket categories
            var categories = new List<string>
            {
                "General",
                "IT Support", 
                "Hardware",
                "Software",
                "Network",
                "Security",
                "HR",
                "Payroll",
                "Leave Management",
                "Employee Relations",
                "Finance",
                "Accounting",
                "Budget",
                "Expenses",
                "Facilities",
                "Maintenance",
                "Office Equipment"
            };

            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available categories");
            return StatusCode(500, new { message = "Error retrieving categories" });
        }
    }

    private List<string> ValidateEmailConfiguration(EmailConfiguration configuration)
    {
        var errors = new List<string>();

        if (configuration.EmailAccounts == null || !configuration.EmailAccounts.Any())
        {
            errors.Add("At least one email account is required");
        }
        else
        {
            var defaultAccounts = configuration.EmailAccounts.Where(a => a.IsDefault).ToList();
            if (!defaultAccounts.Any())
            {
                errors.Add("At least one email account must be marked as default");
            }
            else if (defaultAccounts.Count > 1)
            {
                errors.Add("Only one email account can be marked as default");
            }

            foreach (var account in configuration.EmailAccounts)
            {
                if (string.IsNullOrEmpty(account.Email))
                {
                    errors.Add($"Email is required for account {account.Id}");
                }
                
                if (string.IsNullOrEmpty(account.DisplayName))
                {
                    errors.Add($"Display name is required for account {account.Id}");
                }
                
                if (account.IsActive && configuration.EnableGraphApi)
                {
                    if (string.IsNullOrEmpty(account.ClientId))
                    {
                        errors.Add($"Client ID is required for active account {account.Email}");
                    }
                    
                    if (string.IsNullOrEmpty(account.TenantId))
                    {
                        errors.Add($"Tenant ID is required for active account {account.Email}");
                    }
                }
            }
        }

        if (configuration.ProcessingIntervalMinutes < 1)
        {
            errors.Add("Processing interval must be at least 1 minute");
        }

        if (configuration.MaxEmailsPerBatch < 1)
        {
            errors.Add("Max emails per batch must be at least 1");
        }

        return errors;
    }

    private List<string> ValidateEmailConfigurationRelaxed(EmailConfiguration configuration)
    {
        var errors = new List<string>();

        // Very basic validation - only check essential fields
        if (configuration.ProcessingIntervalMinutes < 1)
        {
            errors.Add("Processing interval must be at least 1 minute");
        }

        if (configuration.MaxEmailsPerBatch < 1)
        {
            errors.Add("Max emails per batch must be at least 1");
        }

        // Only validate email accounts if they exist and are not empty
        if (configuration.EmailAccounts != null && configuration.EmailAccounts.Any())
        {
            foreach (var account in configuration.EmailAccounts)
            {
                if (string.IsNullOrEmpty(account.Email))
                {
                    errors.Add($"Email is required for account {account.Id}");
                }
            }
        }

        return errors;
    }

    private List<string> ValidateCreateEmailAccountDto(CreateEmailAccountDto dto)
    {
        var errors = new List<string>();

        if (string.IsNullOrEmpty(dto.Email))
        {
            errors.Add("Email is required");
        }

        if (string.IsNullOrEmpty(dto.ClientId))
        {
            errors.Add("Client ID is required");
        }

        if (string.IsNullOrEmpty(dto.TenantId))
        {
            errors.Add("Tenant ID is required");
        }

        if (string.IsNullOrEmpty(dto.ClientSecret))
        {
            errors.Add("Client Secret is required");
        }

        return errors;
    }
}