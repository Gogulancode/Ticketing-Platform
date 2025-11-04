using ERPTraining.Core.Entities.Tickets;
using ERPTraining.Core.Ticketing.Settings.DTOs;

namespace ERPTraining.Core.Ticketing.Settings.Interfaces;

public interface IEmailConfigurationService
{
    // CategoryEmailMapping operations
    Task<IEnumerable<CategoryEmailMapping>> GetCategoryEmailMappingsAsync(bool includeInactive = false);
    Task<CategoryEmailMapping?> GetCategoryEmailMappingAsync(int id);
    Task<CategoryEmailMapping> CreateCategoryEmailMappingAsync(CategoryEmailMapping mapping, CancellationToken ct = default);
    Task<CategoryEmailMapping?> UpdateCategoryEmailMappingAsync(int id, Action<CategoryEmailMapping> updateAction, CancellationToken ct = default);
    Task<bool> DeleteCategoryEmailMappingAsync(int id, CancellationToken ct = default);
    
    // Email monitoring operations
    Task<EmailMonitoringStatus?> GetEmailMonitoringStatusAsync();
    Task<bool> StartEmailMonitoringAsync();
    Task<bool> StopEmailMonitoringAsync();
    Task<EmailMonitoringStatus> UpdateEmailMonitoringStatusAsync(Action<EmailMonitoringStatus> updateAction);
    
    // Email configuration testing
    Task<EmailConfigurationTestResult> TestEmailConfigurationAsync(EmailConfigurationTestRequest request);
    
    // Email to ticket conversion
    Task<bool> ProcessEmailToTicketAsync(string emailAddress, string subject, string content);
}