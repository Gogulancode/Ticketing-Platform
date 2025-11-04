using ERPTraining.Core.Entities;
using ERPTraining.Core.DTOs;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace ERPTraining.API.Services
{
    public class ERPSyncBackgroundService : BackgroundService
    {
        private readonly ILogger<ERPSyncBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly TimeSpan _syncInterval;

        public ERPSyncBackgroundService(
            ILogger<ERPSyncBackgroundService> logger,
            IServiceProvider serviceProvider,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _configuration = configuration;
            
            // Default to sync once a day (24 hours)
            var syncHour = _configuration.GetValue<int>("ERPSync:SyncHour", 2);
            _syncInterval = TimeSpan.FromHours(24);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ERP Sync Background Service started - syncing every 24 hours");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await WaitForNextSyncTime(stoppingToken);
                    
                    if (!stoppingToken.IsCancellationRequested)
                    {
                        await PerformFullERPSync();
                    }
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("ERP Sync Background Service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during background ERP sync");
                }

                // Wait for next sync cycle (24 hours)
                await Task.Delay(_syncInterval, stoppingToken);
            }
        }

        private async Task WaitForNextSyncTime(CancellationToken cancellationToken)
        {
            var syncHour = _configuration.GetValue<int>("ERPSync:SyncHour", 2);
            var now = DateTime.Now;
            var nextSync = DateTime.Today.AddHours(syncHour);

            // If sync time has passed today, schedule for tomorrow
            if (now >= nextSync)
            {
                nextSync = nextSync.AddDays(1);
            }

            var delay = nextSync - now;
            _logger.LogInformation($"Next ERP sync scheduled for: {nextSync:yyyy-MM-dd HH:mm:ss}");

            if (delay.TotalMilliseconds > 0)
            {
                await Task.Delay(delay, cancellationToken);
            }
        }

        private async Task PerformFullERPSync()
        {
            using var scope = _serviceProvider.CreateScope();
            var erpSyncService = scope.ServiceProvider.GetRequiredService<IERPSyncService>();
            
            _logger.LogInformation("Starting automated ERP sync (modules, sections, roles, role details, and users)...");
            
            try
            {
                await erpSyncService.SyncAllDataAsync();
                _logger.LogInformation("ERP sync completed successfully - all data synced including users");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ERP sync failed during automated background sync");
            }
        }
    }
}
