using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("branding")]
public class BrandingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<BrandingController> _logger;

    public BrandingController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        ILogger<BrandingController> logger)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
    }

    /// <summary>
    /// Get branding settings (public - no auth required for login page)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<BrandingSettingsDto>> GetBrandingSettings()
    {
        var settings = await _context.BrandingSettings
            .Include(b => b.UpdatedBy)
            .FirstOrDefaultAsync();

        if (settings == null)
        {
            // Return default settings if none exist
            return Ok(new BrandingSettingsDto
            {
                Id = 0,
                LoginTitle = "Hello,\nI'm Nivo",
                LoginSubtitle = "I'm here to streamline your business operations and boost productivity. Let me help you save time and enhance efficiency across your enterprise!",
                AppName = "Nivo",
                PrimaryColor = "#18181B",
                SecondaryColor = "#DC2626",
                FooterText = $"© {DateTime.Now.Year} Nivo. All rights reserved.",
                UpdatedAt = DateTime.UtcNow
            });
        }

        return Ok(MapToDto(settings));
    }

    /// <summary>
    /// Update branding settings (admin only)
    /// </summary>
    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BrandingSettingsDto>> UpdateBrandingSettings([FromBody] UpdateBrandingSettingsRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var settings = await _context.BrandingSettings.FirstOrDefaultAsync();

        if (settings == null)
        {
            // Create new settings
            settings = new BrandingSettings
            {
                LoginTitle = request.LoginTitle ?? "Hello,\nI'm Nivo",
                LoginSubtitle = request.LoginSubtitle ?? "I'm here to streamline your business operations and boost productivity.",
                AppName = request.AppName ?? "Nivo",
                AppTagline = request.AppTagline,
                PrimaryColor = request.PrimaryColor ?? "#18181B",
                SecondaryColor = request.SecondaryColor ?? "#DC2626",
                FooterText = request.FooterText ?? "© {year} Nivo. All rights reserved.",
                UpdatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.BrandingSettings.Add(settings);
        }
        else
        {
            // Update existing settings
            if (request.LoginTitle != null) settings.LoginTitle = request.LoginTitle;
            if (request.LoginSubtitle != null) settings.LoginSubtitle = request.LoginSubtitle;
            if (request.AppName != null) settings.AppName = request.AppName;
            if (request.AppTagline != null) settings.AppTagline = request.AppTagline;
            if (request.PrimaryColor != null) settings.PrimaryColor = request.PrimaryColor;
            if (request.SecondaryColor != null) settings.SecondaryColor = request.SecondaryColor;
            if (request.FooterText != null) settings.FooterText = request.FooterText;
            settings.UpdatedById = userId;
            settings.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        
        // Reload with navigation property
        await _context.Entry(settings).Reference(s => s.UpdatedBy).LoadAsync();

        _logger.LogInformation("Branding settings updated by user {UserId}", userId);
        
        return Ok(MapToDto(settings));
    }

    /// <summary>
    /// Upload logo image (admin only)
    /// </summary>
    [HttpPost("logo")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LogoUploadResponse>> UploadLogo(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded");
        }

        // Validate file type
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest($"Invalid file type. Allowed types: {string.Join(", ", allowedExtensions)}");
        }

        // Validate file size (max 5MB)
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest("File size exceeds 5MB limit");
        }

        try
        {
            // Create uploads directory if it doesn't exist
            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", "branding");
            Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var fileName = $"logo_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Delete old logo if exists
            var settings = await _context.BrandingSettings.FirstOrDefaultAsync();
            if (settings?.LogoFileName != null)
            {
                var oldFilePath = Path.Combine(uploadsFolder, settings.LogoFileName);
                if (System.IO.File.Exists(oldFilePath))
                {
                    System.IO.File.Delete(oldFilePath);
                }
            }

            // Process and save new file
            // For PNG files, convert transparent areas to white background
            if (extension == ".png")
            {
                using var inputStream = file.OpenReadStream();
                using var image = await Image.LoadAsync<Rgba32>(inputStream);
                
                // Create a new image with white background
                using var whiteBackground = new Image<Rgba32>(image.Width, image.Height, new Rgba32(255, 255, 255, 255));
                
                // Draw the original image on top of white background
                whiteBackground.Mutate(ctx => ctx.DrawImage(image, new Point(0, 0), 1f));
                
                // Save as PNG (now with white background instead of transparency)
                await whiteBackground.SaveAsPngAsync(filePath);
                
                _logger.LogInformation("PNG image processed: transparency converted to white background");
            }
            else
            {
                // For non-PNG files, save as-is
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
            }

            // Update branding settings
            var logoUrl = $"/uploads/branding/{fileName}";
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (settings == null)
            {
                settings = new BrandingSettings
                {
                    LogoUrl = logoUrl,
                    LogoFileName = fileName,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.BrandingSettings.Add(settings);
            }
            else
            {
                settings.LogoUrl = logoUrl;
                settings.LogoFileName = fileName;
                settings.UpdatedById = userId;
                settings.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Logo uploaded: {FileName} by user {UserId}", fileName, userId);

            return Ok(new LogoUploadResponse
            {
                LogoUrl = logoUrl,
                FileName = fileName,
                FileSizeBytes = file.Length
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading logo");
            return StatusCode(500, "Error uploading logo");
        }
    }

    /// <summary>
    /// Delete logo (admin only)
    /// </summary>
    [HttpDelete("logo")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteLogo()
    {
        var settings = await _context.BrandingSettings.FirstOrDefaultAsync();
        
        if (settings?.LogoFileName == null)
        {
            return NotFound("No logo to delete");
        }

        try
        {
            // Delete file
            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", "branding");
            var filePath = Path.Combine(uploadsFolder, settings.LogoFileName);
            
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            // Update settings
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            settings.LogoUrl = null;
            settings.LogoFileName = null;
            settings.UpdatedById = userId;
            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Logo deleted by user {UserId}", userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting logo");
            return StatusCode(500, "Error deleting logo");
        }
    }

    /// <summary>
    /// Upload favicon (admin only)
    /// </summary>
    [HttpPost("favicon")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LogoUploadResponse>> UploadFavicon(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded");
        }

        var allowedExtensions = new[] { ".ico", ".png", ".svg" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest($"Invalid file type. Allowed types: {string.Join(", ", allowedExtensions)}");
        }

        if (file.Length > 1 * 1024 * 1024) // 1MB limit for favicon
        {
            return BadRequest("File size exceeds 1MB limit");
        }

        try
        {
            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", "branding");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"favicon_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var faviconUrl = $"/uploads/branding/{fileName}";
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var settings = await _context.BrandingSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new BrandingSettings
                {
                    FaviconUrl = faviconUrl,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.BrandingSettings.Add(settings);
            }
            else
            {
                settings.FaviconUrl = faviconUrl;
                settings.UpdatedById = userId;
                settings.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new LogoUploadResponse
            {
                LogoUrl = faviconUrl,
                FileName = fileName,
                FileSizeBytes = file.Length
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading favicon");
            return StatusCode(500, "Error uploading favicon");
        }
    }

    private static BrandingSettingsDto MapToDto(BrandingSettings settings)
    {
        var footerText = settings.FooterText.Replace("{year}", DateTime.Now.Year.ToString());
        
        return new BrandingSettingsDto
        {
            Id = settings.Id,
            LogoUrl = settings.LogoUrl,
            LogoFileName = settings.LogoFileName,
            FaviconUrl = settings.FaviconUrl,
            LoginTitle = settings.LoginTitle,
            LoginSubtitle = settings.LoginSubtitle,
            AppName = settings.AppName,
            AppTagline = settings.AppTagline,
            PrimaryColor = settings.PrimaryColor,
            SecondaryColor = settings.SecondaryColor,
            FooterText = footerText,
            UpdatedAt = settings.UpdatedAt,
            UpdatedByName = settings.UpdatedBy?.UserName
        };
    }
}
