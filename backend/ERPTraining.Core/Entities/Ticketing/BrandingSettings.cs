namespace ERPTraining.Core.Entities.Ticketing;

/// <summary>
/// Stores branding configuration for the application including logo and login page content
/// </summary>
public class BrandingSettings
{
    public int Id { get; set; }
    
    // Logo settings
    public string? LogoUrl { get; set; }
    public string? LogoFileName { get; set; }
    public string? FaviconUrl { get; set; }
    
    // Login page content
    public string LoginTitle { get; set; } = "Hello,\nI'm Business Hub";
    public string LoginSubtitle { get; set; } = "I'm here to streamline your business operations and boost productivity. Let me help you save time and enhance efficiency across your enterprise!";
    
    // Header/Navbar branding
    public string AppName { get; set; } = "Business Hub";
    public string? AppTagline { get; set; }
    
    // Color theme (for future use)
    public string PrimaryColor { get; set; } = "#3b82f6"; // Blue
    public string SecondaryColor { get; set; } = "#1e40af";
    
    // Footer
    public string FooterText { get; set; } = "© {year} Babaji Shivram. All rights reserved.";
    
    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedById { get; set; }
    
    // Navigation property
    public virtual User? UpdatedBy { get; set; }
}
