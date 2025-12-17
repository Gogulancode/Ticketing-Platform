namespace ERPTraining.Core.DTOs.Ticketing;

/// <summary>
/// DTO for branding settings
/// </summary>
public class BrandingSettingsDto
{
    public int Id { get; set; }
    
    // Logo
    public string? LogoUrl { get; set; }
    public string? LogoFileName { get; set; }
    public string? FaviconUrl { get; set; }
    
    // Login page content
    public string LoginTitle { get; set; } = string.Empty;
    public string LoginSubtitle { get; set; } = string.Empty;
    
    // App branding
    public string AppName { get; set; } = string.Empty;
    public string? AppTagline { get; set; }
    
    // Colors
    public string PrimaryColor { get; set; } = "#3b82f6";
    public string SecondaryColor { get; set; } = "#1e40af";
    
    // Footer
    public string FooterText { get; set; } = string.Empty;
    
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedByName { get; set; }
}

/// <summary>
/// Request to update branding settings
/// </summary>
public class UpdateBrandingSettingsRequest
{
    public string? LoginTitle { get; set; }
    public string? LoginSubtitle { get; set; }
    public string? AppName { get; set; }
    public string? AppTagline { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? FooterText { get; set; }
}

/// <summary>
/// Response after uploading a logo
/// </summary>
public class LogoUploadResponse
{
    public string LogoUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}
