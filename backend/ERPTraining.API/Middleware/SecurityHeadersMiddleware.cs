using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace ERPTraining.API.Middleware;

/// <summary>
/// Middleware that adds OWASP recommended security headers to all responses.
/// These headers help protect against common web vulnerabilities.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // X-Content-Type-Options: Prevents MIME type sniffing
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        
        // X-Frame-Options: Prevents clickjacking attacks
        context.Response.Headers["X-Frame-Options"] = "DENY";
        
        // X-XSS-Protection: Enables browser's XSS filter (legacy, but still useful)
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        
        // Referrer-Policy: Controls how much referrer info is sent
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        
        // Permissions-Policy: Controls browser features (replaces Feature-Policy)
        context.Response.Headers["Permissions-Policy"] = "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()";
        
        // Content-Security-Policy: Prevents XSS and data injection attacks
        // Note: This is a restrictive policy - adjust based on your needs
        context.Response.Headers["Content-Security-Policy"] = 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self' ws: wss: http: https:; " +
            "frame-ancestors 'none';";
        
        // Strict-Transport-Security: Enforces HTTPS (only in production)
        // Note: This header should only be set over HTTPS
        if (context.Request.IsHttps)
        {
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }
        
        // Cache-Control for API responses (prevent caching of sensitive data)
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
            context.Response.Headers["Pragma"] = "no-cache";
        }

        await _next(context);
    }
}

/// <summary>
/// Extension method to add SecurityHeadersMiddleware to the pipeline.
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}
