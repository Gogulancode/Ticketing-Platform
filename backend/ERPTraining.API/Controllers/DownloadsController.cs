using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;

namespace ERPTraining.API.Controllers
{
    [Route("downloads")]
    [ApiController]
    public class DownloadsController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<DownloadsController> _logger;
        private readonly IConfiguration _configuration;

        public DownloadsController(
            IWebHostEnvironment environment,
            ILogger<DownloadsController> logger,
            IConfiguration configuration)
        {
            _environment = environment;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Get available downloads metadata
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public IActionResult GetAvailableDownloads()
        {
            var downloads = new[]
            {
                new
                {
                    id = "desktop-windows",
                    name = "Nivo Chat for Windows",
                    platform = "windows",
                    version = "1.0.0",
                    downloadUrl = "/api/downloads/desktop/windows",
                    isAvailable = CheckDesktopAppExists()
                },
                new
                {
                    id = "desktop-macos",
                    name = "Nivo Chat for macOS",
                    platform = "macos",
                    version = "1.0.0",
                    downloadUrl = "/api/downloads/desktop/macos",
                    isAvailable = false
                }
            };

            return Ok(downloads);
        }

        /// <summary>
        /// Download the Windows desktop application
        /// </summary>
        [HttpGet("desktop/windows")]
        [AllowAnonymous]
        public async Task<IActionResult> DownloadWindowsDesktopApp()
        {
            try
            {
                // Check if a pre-built installer (.exe) exists first (preferred for staging/production)
                var exePath = Path.Combine(_environment.WebRootPath, "downloads", "NivoChat-Setup.exe");
                
                if (System.IO.File.Exists(exePath))
                {
                    _logger.LogInformation("Serving pre-built desktop app installer: {ExePath}", exePath);
                    var fileBytes = await System.IO.File.ReadAllBytesAsync(exePath);
                    return File(fileBytes, "application/octet-stream", "NivoChat-Setup-1.0.0.exe");
                }

                // Fallback: Check for zip file (legacy)
                var zipPath = Path.Combine(_environment.WebRootPath, "downloads", "NivoChat-Setup.zip");
                
                if (System.IO.File.Exists(zipPath))
                {
                    _logger.LogInformation("Serving pre-built desktop app zip: {ZipPath}", zipPath);
                    var fileBytes = await System.IO.File.ReadAllBytesAsync(zipPath);
                    return File(fileBytes, "application/zip", "NivoChat-Windows-1.0.0.zip");
                }

                // Fallback: Path to the source desktop app folder (for development)
                var desktopAppPath = _configuration["DesktopApp:WindowsPath"] 
                    ?? Path.Combine(_environment.ContentRootPath, "..", "..", "desktop-app", "release", "win-unpacked");
                
                if (!Directory.Exists(desktopAppPath))
                {
                    _logger.LogWarning("Desktop app not found. Zip path: {ZipPath}, Source path: {SourcePath}", zipPath, desktopAppPath);
                    return NotFound(new { message = "Desktop application is not available for download at this time." });
                }

                // Create the zip file from the win-unpacked folder
                _logger.LogInformation("Creating desktop app zip from: {SourcePath}", desktopAppPath);
                
                var downloadsDir = Path.Combine(_environment.WebRootPath, "downloads");
                if (!Directory.Exists(downloadsDir))
                {
                    Directory.CreateDirectory(downloadsDir);
                }

                // Create zip archive
                ZipFile.CreateFromDirectory(desktopAppPath, zipPath, CompressionLevel.Optimal, false);
                _logger.LogInformation("Desktop app zip created: {ZipPath}", zipPath);

                // Return the zip file
                var zipBytes = await System.IO.File.ReadAllBytesAsync(zipPath);
                return File(zipBytes, "application/zip", "NivoChat-Windows-1.0.0.zip");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading Windows desktop app");
                return StatusCode(500, new { message = "An error occurred while preparing the download." });
            }
        }

        /// <summary>
        /// Get latest version info for auto-updater
        /// </summary>
        [HttpGet("desktop/version")]
        [AllowAnonymous]
        public IActionResult GetLatestVersion()
        {
            return Ok(new
            {
                version = "1.0.0",
                releaseDate = "2024-12-23",
                releaseNotes = new[]
                {
                    "Initial release",
                    "Real-time messaging with SignalR",
                    "Desktop notifications",
                    "Ticket integration"
                },
                downloadUrl = "/api/downloads/desktop/windows",
                mandatory = false
            });
        }

        private bool CheckDesktopAppExists()
        {
            // Check for pre-built zip first (staging/production)
            var zipPath = Path.Combine(_environment.WebRootPath, "downloads", "NivoChat-Setup.zip");
            if (System.IO.File.Exists(zipPath))
            {
                return true;
            }
            
            // Check for source folder (development)
            var desktopAppPath = _configuration["DesktopApp:WindowsPath"]
                ?? Path.Combine(_environment.ContentRootPath, "..", "..", "desktop-app", "release", "win-unpacked");
            
            return Directory.Exists(desktopAppPath) && 
                   System.IO.File.Exists(Path.Combine(desktopAppPath, "Nivo Chat.exe"));
        }
    }
}
