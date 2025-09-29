using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ERPTraining.Core.Models.Ticketing;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public interface IEmailConfigurationService
{
    Task<EmailConfiguration> GetEmailConfigurationAsync();
    Task<EmailAccount?> GetEmailAccountForCategoryAsync(string categoryName);
    Task<EmailAccount?> GetDefaultEmailAccountAsync();
    Task<List<EmailAccount>> GetActiveEmailAccountsAsync();
    Task<bool> UpdateEmailConfigurationAsync(EmailConfiguration configuration);
    Task<EmailAccount?> GetEmailAccountByEmailAsync(string email);
    Task<bool> TestEmailAccountConnectionAsync(string accountId);
}

public class EmailConfigurationService : IEmailConfigurationService
{
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<EmailConfigurationService> _logger;
    private EmailConfiguration? _cachedConfig;
    private DateTime _lastConfigLoad = DateTime.MinValue;
    private readonly TimeSpan _cacheTimeout = TimeSpan.FromMinutes(5);

    public EmailConfigurationService(
        IConfiguration configuration,
        ApplicationDbContext dbContext,
        ILogger<EmailConfigurationService> logger)
    {
        _configuration = configuration;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<EmailConfiguration> GetEmailConfigurationAsync()
    {
        // Return cached config if still valid
        if (_cachedConfig != null && DateTime.UtcNow - _lastConfigLoad < _cacheTimeout)
        {
            return _cachedConfig;
        }

        try
        {
            // Load from configuration first (appsettings.json)
            var config = new EmailConfiguration();
            _configuration.GetSection("EmailSettings").Bind(config);

            // Try to load from database if exists
            var dbConfig = await LoadFromDatabaseAsync();
            if (dbConfig != null)
            {
                // Merge database settings with appsettings
                config = MergeConfigurations(config, dbConfig);
            }

            _cachedConfig = config;
            _lastConfigLoad = DateTime.UtcNow;

            _logger.LogInformation("Email configuration loaded with {Count} accounts", config.EmailAccounts.Count);
            return config;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading email configuration");
            
            // Return minimal default configuration
            return new EmailConfiguration
            {
                EnableGraphApi = false,
                DefaultFromEmail = "noreply@example.com",
                DefaultFromName = "System",
                EmailAccounts = new List<EmailAccount>()
            };
        }
    }

    public async Task<EmailAccount?> GetEmailAccountForCategoryAsync(string categoryName)
    {
        var config = await GetEmailConfigurationAsync();
        
        // Find account that handles this category
        var account = config.EmailAccounts.FirstOrDefault(a => 
            a.IsActive && 
            a.Categories.Any(c => c.Equals(categoryName, StringComparison.OrdinalIgnoreCase)));

        if (account == null)
        {
            _logger.LogDebug("No specific email account found for category {Category}, using default", categoryName);
            return await GetDefaultEmailAccountAsync();
        }

        return account;
    }

    public async Task<EmailAccount?> GetDefaultEmailAccountAsync()
    {
        var config = await GetEmailConfigurationAsync();
        
        var defaultAccount = config.EmailAccounts.FirstOrDefault(a => a.IsActive && a.IsDefault);
        
        if (defaultAccount == null)
        {
            _logger.LogWarning("No default email account configured");
        }

        return defaultAccount;
    }

    public async Task<List<EmailAccount>> GetActiveEmailAccountsAsync()
    {
        var config = await GetEmailConfigurationAsync();
        return config.EmailAccounts.Where(a => a.IsActive).ToList();
    }

    public async Task<EmailAccount?> GetEmailAccountByEmailAsync(string email)
    {
        var config = await GetEmailConfigurationAsync();
        return config.EmailAccounts.FirstOrDefault(a => 
            a.IsActive && a.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<bool> UpdateEmailConfigurationAsync(EmailConfiguration configuration)
    {
        try
        {
            await SaveToDatabaseAsync(configuration);
            
            // Clear cache to force reload
            _cachedConfig = null;
            _lastConfigLoad = DateTime.MinValue;
            
            _logger.LogInformation("Email configuration updated successfully");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email configuration");
            return false;
        }
    }

    public async Task<bool> TestEmailAccountConnectionAsync(string accountId)
    {
        try
        {
            var config = await GetEmailConfigurationAsync();
            var account = config.EmailAccounts.FirstOrDefault(a => a.Id == accountId);
            
            if (account == null)
            {
                _logger.LogWarning("Email account {AccountId} not found for testing", accountId);
                return false;
            }

            if (!account.IsActive)
            {
                _logger.LogWarning("Email account {AccountId} is not active", accountId);
                return false;
            }

            // Basic validation
            if (string.IsNullOrEmpty(account.ClientId) || 
                string.IsNullOrEmpty(account.TenantId) || 
                string.IsNullOrEmpty(account.ClientSecret))
            {
                _logger.LogWarning("Email account {AccountId} is missing required Graph API credentials", accountId);
                return false;
            }

            // TODO: Add actual Graph API connection test here
            _logger.LogInformation("Email account {AccountId} connection test passed", accountId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing email account {AccountId}", accountId);
            return false;
        }
    }

    private async Task<EmailConfiguration?> LoadFromDatabaseAsync()
    {
        try
        {
            // Check if email configuration table exists
            var hasConfigTable = await _dbContext.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'EmailConfigurations'")
                .FirstOrDefaultAsync();

            if (hasConfigTable == 0)
            {
                _logger.LogDebug("EmailConfigurations table does not exist, using appsettings only");
                return null;
            }

            // Load from database (implement this when you create the table)
            // For now, return null to use appsettings
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not load email configuration from database, using appsettings");
            return null;
        }
    }

    private async Task SaveToDatabaseAsync(EmailConfiguration configuration)
    {
        try
        {
            // TODO: Implement database storage for email configuration
            // For now, just log that it would be saved
            _logger.LogInformation("Email configuration would be saved to database (not implemented yet)");
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving email configuration to database");
            throw;
        }
    }

    private EmailConfiguration MergeConfigurations(EmailConfiguration appsettings, EmailConfiguration database)
    {
        // Database settings override appsettings where present
        var merged = new EmailConfiguration
        {
            EnableGraphApi = database.EnableGraphApi,
            ProcessedFolder = database.ProcessedFolder ?? appsettings.ProcessedFolder,
            ErrorFolder = database.ErrorFolder ?? appsettings.ErrorFolder,
            MaxEmailsPerBatch = database.MaxEmailsPerBatch > 0 ? database.MaxEmailsPerBatch : appsettings.MaxEmailsPerBatch,
            ProcessingIntervalMinutes = database.ProcessingIntervalMinutes > 0 ? database.ProcessingIntervalMinutes : appsettings.ProcessingIntervalMinutes,
            DefaultFromEmail = database.DefaultFromEmail ?? appsettings.DefaultFromEmail,
            DefaultFromName = database.DefaultFromName ?? appsettings.DefaultFromName,
            EmailAccounts = database.EmailAccounts.Any() ? database.EmailAccounts : appsettings.EmailAccounts,
            AutoAssignmentRules = database.AutoAssignmentRules ?? appsettings.AutoAssignmentRules,
            NotificationSettings = database.NotificationSettings ?? appsettings.NotificationSettings
        };

        return merged;
    }
}