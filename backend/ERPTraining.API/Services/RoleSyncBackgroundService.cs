using ERPTraining.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System;

namespace ERPTraining.API.Services
{
    public class ERPSyncBackgroundService : BackgroundService
    {
        private readonly ILogger<ERPSyncBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly TimeSpan _syncInterval;
        private readonly TimeZoneInfo _syncTimeZone;

        public ERPSyncBackgroundService(
            ILogger<ERPSyncBackgroundService> logger,
            IServiceProvider serviceProvider,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _configuration = configuration;
            
            // Default to sync once a day (24 hours)
            _syncInterval = TimeSpan.FromHours(24);

            var timeZoneId = _configuration.GetValue<string>("ERPSync:TimeZoneId", "India Standard Time");
            try
            {
                _syncTimeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
                _logger.LogWarning("Configured ERP sync timezone '{TimeZoneId}' not found. Falling back to local timezone {LocalZone}.", timeZoneId, TimeZoneInfo.Local.Id);
                _syncTimeZone = TimeZoneInfo.Local;
            }
            catch (InvalidTimeZoneException)
            {
                _logger.LogWarning("Configured ERP sync timezone '{TimeZoneId}' is invalid. Falling back to local timezone {LocalZone}.", timeZoneId, TimeZoneInfo.Local.Id);
                _syncTimeZone = TimeZoneInfo.Local;
            }
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
            var syncMinute = _configuration.GetValue<int>("ERPSync:SyncMinute", 0);
            var utcNow = DateTime.UtcNow;
            var targetZoneNow = TimeZoneInfo.ConvertTimeFromUtc(utcNow, _syncTimeZone);

            var nextSyncLocal = new DateTime(
                targetZoneNow.Year,
                targetZoneNow.Month,
                targetZoneNow.Day,
                syncHour,
                syncMinute,
                0,
                DateTimeKind.Unspecified);

            if (targetZoneNow >= nextSyncLocal)
            {
                nextSyncLocal = nextSyncLocal.AddDays(1);
            }

            var nextSyncUtc = TimeZoneInfo.ConvertTimeToUtc(nextSyncLocal, _syncTimeZone);
            var delay = nextSyncUtc - utcNow;
            if (delay < TimeSpan.Zero)
            {
                delay = TimeSpan.Zero;
            }

            var nextSyncDisplay = TimeZoneInfo.ConvertTimeFromUtc(nextSyncUtc, _syncTimeZone);
            _logger.LogInformation(
                "Next ERP sync scheduled for {LocalTime} ({TimeZoneId})",
                nextSyncDisplay.ToString("yyyy-MM-dd HH:mm:ss"),
                _syncTimeZone.Id);

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
