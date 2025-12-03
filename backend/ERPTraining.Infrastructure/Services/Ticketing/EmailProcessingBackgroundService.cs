using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class EmailProcessingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailProcessingBackgroundService> _logger;
    private readonly TimeSpan _processingInterval;

    public EmailProcessingBackgroundService(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<EmailProcessingBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
        
        // Get processing interval from configuration (default: 5 minutes)
        var intervalMinutes = configuration.GetValue<int>("EmailSettings:ProcessingIntervalMinutes", 5);
        _processingInterval = TimeSpan.FromMinutes(intervalMinutes);
        
        _logger.LogInformation("Email Processing Background Service initialized with {Interval} minute interval", intervalMinutes);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email Processing Background Service started");

        // Wait a bit before starting to ensure services are fully initialized
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Check if Graph API is enabled
                var isGraphApiEnabled = _configuration.GetValue<bool>("EmailSettings:EnableGraphApi", false);
                
                if (!isGraphApiEnabled)
                {
                    _logger.LogInformation("Graph API email processing is disabled");
                    await Task.Delay(_processingInterval, stoppingToken);
                    continue;
                }

                _logger.LogInformation("🔄 Starting email processing cycle...");

                using var scope = _serviceProvider.CreateScope();
                var emailProcessor = scope.ServiceProvider.GetRequiredService<GraphEmailToTicketProcessor>();
                
                await emailProcessor.ProcessEmailsAsync(stoppingToken);

                _logger.LogInformation("✅ Email processing cycle completed");
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Email processing cancelled");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in email processing cycle");
            }

            // Wait for next processing cycle
            try
            {
                await Task.Delay(_processingInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Email processing delay cancelled");
                break;
            }
        }

        _logger.LogInformation("Email Processing Background Service stopped");
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping Email Processing Background Service...");
        await base.StopAsync(cancellationToken);
    }
}