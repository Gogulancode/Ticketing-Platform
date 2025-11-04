using Microsoft.Extensions.Configuration;

namespace ERPTraining.Core.Services;

/// <summary>
/// Service for handling timezone conversions and date formatting
/// </summary>
public interface ITimeZoneService
{
    /// <summary>
    /// Convert UTC DateTime to IST
    /// </summary>
    DateTime ConvertToIST(DateTime utcDateTime);
    
    /// <summary>
    /// Convert IST DateTime to UTC
    /// </summary>
    DateTime ConvertToUTC(DateTime istDateTime);
    
    /// <summary>
    /// Get current IST time
    /// </summary>
    DateTime GetCurrentIST();
    
    /// <summary>
    /// Format DateTime in IST for display
    /// </summary>
    string FormatForDisplay(DateTime utcDateTime, string format = "yyyy-MM-dd HH:mm:ss");
    
    /// <summary>
    /// Get timezone info for IST
    /// </summary>
    TimeZoneInfo GetISTTimeZone();
}

public class TimeZoneService : ITimeZoneService
{
    private readonly TimeZoneInfo _istTimeZone;
    private readonly IConfiguration _configuration;

    public TimeZoneService(IConfiguration configuration)
    {
        _configuration = configuration;
        
        // Try to get IST timezone - handle both Windows and Linux
        try
        {
            _istTimeZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            // Fallback for Linux systems
            try
            {
                _istTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            }
            catch (TimeZoneNotFoundException)
            {
                // Final fallback - create custom IST timezone
                _istTimeZone = TimeZoneInfo.CreateCustomTimeZone(
                    "IST", 
                    TimeSpan.FromHours(5).Add(TimeSpan.FromMinutes(30)), 
                    "India Standard Time", 
                    "IST"
                );
            }
        }
    }

    public DateTime ConvertToIST(DateTime utcDateTime)
    {
        if (utcDateTime.Kind != DateTimeKind.Utc)
        {
            utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        }
        
        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, _istTimeZone);
    }

    public DateTime ConvertToUTC(DateTime istDateTime)
    {
        if (istDateTime.Kind == DateTimeKind.Utc)
        {
            return istDateTime;
        }
        
        return TimeZoneInfo.ConvertTimeToUtc(istDateTime, _istTimeZone);
    }

    public DateTime GetCurrentIST()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _istTimeZone);
    }

    public string FormatForDisplay(DateTime utcDateTime, string format = "yyyy-MM-dd HH:mm:ss")
    {
        var istTime = ConvertToIST(utcDateTime);
        return istTime.ToString(format);
    }

    public TimeZoneInfo GetISTTimeZone()
    {
        return _istTimeZone;
    }
}

/// <summary>
/// Extension methods for DateTime timezone conversions
/// </summary>
public static class DateTimeExtensions
{
    /// <summary>
    /// Convert UTC DateTime to IST with proper timezone handling
    /// </summary>
    public static DateTime ToIST(this DateTime utcDateTime)
    {
        var istTimeZone = GetISTTimeZone();
        if (utcDateTime.Kind != DateTimeKind.Utc)
        {
            utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        }
        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, istTimeZone);
    }
    
    /// <summary>
    /// Format DateTime as IST string
    /// </summary>
    public static string ToISTString(this DateTime utcDateTime, string format = "yyyy-MM-dd HH:mm:ss IST")
    {
        return utcDateTime.ToIST().ToString(format);
    }
    
    /// <summary>
    /// Get IST timezone info with fallback handling
    /// </summary>
    private static TimeZoneInfo GetISTTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.CreateCustomTimeZone(
                    "IST", 
                    TimeSpan.FromHours(5).Add(TimeSpan.FromMinutes(30)), 
                    "India Standard Time", 
                    "IST"
                );
            }
        }
    }
}