using System.Text.RegularExpressions;

namespace ERPTraining.API.Middleware;

/// <summary>
/// Enterprise-grade input sanitization middleware.
/// Validates and sanitizes incoming requests without changing application behavior.
/// </summary>
public class InputSanitizationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<InputSanitizationMiddleware> _logger;
    
    // Dangerous patterns that could indicate SQL injection or XSS
    private static readonly Regex SqlInjectionPattern = new Regex(
        @"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)|(-{2})|(/\*)|(\*/)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);
    
    private static readonly Regex XssPattern = new Regex(
        @"<script[^>]*>|</script>|javascript:|on\w+\s*=",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public InputSanitizationMiddleware(RequestDelegate next, ILogger<InputSanitizationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip validation for health checks and static files
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
        if (path == "/health" || path.StartsWith("/swagger") || path.StartsWith("/uploads/"))
        {
            await _next(context);
            return;
        }

        // Validate query string parameters
        foreach (var query in context.Request.Query)
        {
            if (ContainsDangerousPattern(query.Value.ToString()))
            {
                _logger.LogWarning(
                    "Potential injection attempt detected in query parameter '{Key}' from IP {IP}",
                    query.Key,
                    context.Connection.RemoteIpAddress);
                
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { error = "Invalid input detected" });
                return;
            }
        }

        // Validate route values
        foreach (var route in context.Request.RouteValues)
        {
            var value = route.Value?.ToString();
            if (!string.IsNullOrEmpty(value) && ContainsDangerousPattern(value))
            {
                _logger.LogWarning(
                    "Potential injection attempt detected in route '{Key}' from IP {IP}",
                    route.Key,
                    context.Connection.RemoteIpAddress);
                
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { error = "Invalid input detected" });
                return;
            }
        }

        await _next(context);
    }

    private static bool ContainsDangerousPattern(string input)
    {
        if (string.IsNullOrEmpty(input))
            return false;

        return SqlInjectionPattern.IsMatch(input) || XssPattern.IsMatch(input);
    }
}

/// <summary>
/// Extension method to register the input sanitization middleware.
/// </summary>
public static class InputSanitizationMiddlewareExtensions
{
    public static IApplicationBuilder UseInputSanitization(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<InputSanitizationMiddleware>();
    }
}
