using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.Services;
using ERPTraining.Core.Models;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Infrastructure.Services;
using ERPTraining.Infrastructure.Services.AI;
using InfraServices = ERPTraining.Infrastructure.Services;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using ERPTraining.Infrastructure.Services.Ticketing.Settings;
using ERPTraining.Infrastructure.Services.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.API.Services;
using ERPTraining.API.Hubs;
using ERPTraining.API.Middleware;
using ERPTraining.Core.Interfaces.Chat;
using ERPTraining.Infrastructure.Services.Chat;
using Serilog;
using Serilog.Events;
using AspNetCoreRateLimit;
using HealthChecks.UI.Client;

// Configure Serilog early for bootstrap logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting Ticketing Platform API");
    
    var builder = WebApplication.CreateBuilder(args);

    // Configure Serilog from appsettings
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithThreadId());

    // Configure IST timezone for the application
    var timeZoneConfig = builder.Configuration.GetSection("TimeZone");
    var useIST = timeZoneConfig.GetValue<bool>("UseIST", true);
    if (useIST)
    {
        TimeZoneInfo.ClearCachedData();
        var istTimeZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        Log.Information("Application configured for timezone: {TimeZone}", istTimeZone.DisplayName);
    }

    // ========================================
    // RATE LIMITING CONFIGURATION
    // ========================================
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("RateLimiting:IpRateLimiting"));
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
    builder.Services.AddInMemoryRateLimiting();

    // ========================================
    // HEALTH CHECKS CONFIGURATION
    // ========================================
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddHealthChecks()
        .AddSqlServer(
            connectionString ?? "",
            healthQuery: "SELECT 1",
            name: "sql-server",
            failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy,
            tags: new[] { "db", "sql", "ready" })
        .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(), 
            tags: new[] { "live" });

    // ========================================
    // FORWARDED HEADERS (Load Balancing Support)
    // ========================================
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
        // In production, add known proxy IPs for security
        // options.KnownProxies.Add(IPAddress.Parse("10.0.0.1"));
    });

    // ========================================
    // CORS CONFIGURATION
    // ========================================
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(
                    "http://localhost:5175",  // Primary frontend port
                    "http://localhost:5176",  // Alternative frontend port
                    "http://localhost:5177",  // Alternative frontend port
                    "http://localhost:5178",  // Default Vite port
                    "http://localhost:5179",  // Alternative frontend port
                    "http://localhost:5180",  // Alternative port when 5178 is taken
                    "http://localhost:5181",  // Alternative frontend port
                    "http://localhost:5173",  // Vite default port
                    "http://localhost:5182",  // Alternative frontend port
                    "http://localhost:3000",  // React dev server alternative
                    "http://localhost:8080",  // Generic dev server port
                    "https://businesshub.babajishivram.com",  // Production domain (HTTPS)
                    "http://businesshub.babajishivram.com",   // Production domain (HTTP)
                    "http://businesshub.babajishivram.com:81", // Production API over HTTP port 81
                    "https://businesshub.babajishivram.com:449", // Production API over HTTPS port 449
                    "http://support.solutionsnextwave.com"    // Staging
                  )
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // ========================================
    // DATABASE CONFIGURATION
    // ========================================
    Log.Information("Using connection string: {ConnectionString}", connectionString?.Substring(0, Math.Min(50, connectionString?.Length ?? 0)) + "...");
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString)
               .EnableDetailedErrors());

    // ========================================
    // IDENTITY CONFIGURATION
    // ========================================
    builder.Services.AddIdentity<User, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

    // ========================================
    // JWT AUTHENTICATION CONFIGURATION
    // ========================================
    builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? ""))
    };

    // Configure JWT for SignalR
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

    // ========================================
    // CONTROLLERS & API CONFIGURATION
    // ========================================
    builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization for DateTime to use ISO 8601 format
        // System.Text.Json automatically serializes DateTime with Kind=UTC to ISO 8601 with 'Z' suffix
        // No custom converter needed - just ensure DateTimes have DateTimeKind.Utc
    });
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 31457280; // 30MB in bytes
});
builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 31457280; // 30MB in bytes
});
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 31457280; // 30MB in bytes
    options.MultipartHeadersLengthLimit = int.MaxValue;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
});

    // ========================================
    // APPLICATION SERVICES REGISTRATION
    // ========================================
    
    // AutoMapper
    builder.Services.AddAutoMapper(typeof(Program));

    // Timezone service for IST handling
    builder.Services.AddScoped<ERPTraining.Core.Services.ITimeZoneService, ERPTraining.Core.Services.TimeZoneService>();

    // Authentication Service - Database-backed with ASP.NET Identity
    builder.Services.AddScoped<IAuthService, InfraServices.DatabaseAuthService>();

    // ========================================
    // TICKETING SERVICES
    // ========================================
    builder.Services.AddScoped<ITicketService, InfraServices.TicketService>();
    builder.Services.AddScoped<ITicketingAclService, InfraServices.TicketingAclService>();
    builder.Services.AddScoped<ERPTraining.Core.Ticketing.Settings.Interfaces.IA_TicketSettingsService, ERPTraining.Infrastructure.Services.Ticketing.Settings.TicketSettingsService>();

    // Email Configuration Service
    builder.Services.AddScoped<ERPTraining.Infrastructure.Services.Ticketing.IEmailConfigurationService, ERPTraining.Infrastructure.Services.Ticketing.EmailConfigurationService>();

    // Microsoft Graph Email Services
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.IEmailService, ERPTraining.Infrastructure.Services.Ticketing.MicrosoftGraphEmailService>();
    builder.Services.AddScoped<ERPTraining.Infrastructure.Services.Ticketing.MicrosoftGraphEmailService>();
    builder.Services.AddScoped<ERPTraining.Infrastructure.Services.Ticketing.GraphEmailToTicketProcessor>();

    // Email Processing Background Service (Graph API)
    builder.Services.AddHostedService<ERPTraining.Infrastructure.Services.Ticketing.EmailProcessingBackgroundService>();

    // Auto Assignment Service
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.IAutoAssignmentService, ERPTraining.Infrastructure.Services.Ticketing.AutoAssignmentService>();

    // Category Admin Service
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ICategoryAdminService, ERPTraining.Infrastructure.Services.Ticketing.CategoryAdminService>();

    // Advanced Ticketing Settings Services
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ITicketTagService, ERPTraining.Infrastructure.Services.Ticketing.TicketTagService>();
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.IGraphEmailConfigService, ERPTraining.Infrastructure.Services.Ticketing.GraphEmailConfigService>();
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ITicketFieldSettingService, ERPTraining.Infrastructure.Services.Ticketing.TicketFieldSettingService>();
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ITicketGroupService, ERPTraining.Infrastructure.Services.Ticketing.TicketGroupService>();

    // SLA Services
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ISlaService, ERPTraining.Infrastructure.Services.Ticketing.SimpleSlaService>();
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.INotificationService, ERPTraining.Infrastructure.Services.Ticketing.NotificationService>();

    // SLA Monitoring Background Service
    builder.Services.AddHostedService<ERPTraining.Infrastructure.Services.Ticketing.SlaMonitoringBackgroundService>();

    // Ticket Auto-Close Background Service (closes resolved tickets after 48 hours)
    builder.Services.AddHostedService<ERPTraining.API.Services.TicketAutoCloseService>();

    // Custom Fields Service
    builder.Services.AddScoped<ERPTraining.Infrastructure.Services.Ticketing.ICustomFieldsService, ERPTraining.Infrastructure.Services.Ticketing.CustomFieldsService>();

    // ========================================
    // AI & ANALYTICS SERVICES
    // ========================================
    builder.Services.Configure<AISettings>(builder.Configuration.GetSection(AISettings.SectionName));
    builder.Services.AddHttpClient<IAIService, OpenAICompatibleService>();
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.IBranchAnalyticsService, ERPTraining.Infrastructure.Services.Analytics.BranchAnalyticsService>();

    // ========================================
    // TICKET ENHANCEMENT SERVICES
    // ========================================
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ITicketEnhancementService, ERPTraining.Infrastructure.Services.Ticketing.TicketEnhancementService>();

    // ========================================
    // CUSTOMER PORTAL SERVICES
    // ========================================
    builder.Services.AddScoped<ERPTraining.Core.Interfaces.CustomerPortal.ICustomerPortalService, ERPTraining.Infrastructure.Services.CustomerPortal.CustomerPortalService>();

    // ========================================
    // CHAT SERVICES (SignalR)
    // ========================================
    builder.Services.AddSignalR();
    builder.Services.AddScoped<IChatService, ChatService>();
    builder.Services.AddScoped<IPresenceService, PresenceService>();
    builder.Services.AddScoped<ICannedResponseService, CannedResponseService>();

    // ========================================
    // BUILD APPLICATION
    // ========================================
    var app = builder.Build();

    // Seed database with initial data (roles, admin user)
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            await ERPTraining.Infrastructure.Data.DatabaseSeeder.SeedAsync(services);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "An error occurred while seeding the database");
        }
    }

    // ========================================
    // CONFIGURE REQUEST PIPELINE
    // ========================================
    
    // Enable forwarded headers (must be first for load balancing)
    app.UseForwardedHeaders();
    
    // Add Serilog request logging
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].FirstOrDefault());
            diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString());
        };
    });
    
    // Security Headers (OWASP)
    app.UseSecurityHeaders();
    
    // Rate Limiting
    app.UseIpRateLimiting();
    
    // Swagger (enabled for all environments)
    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseStaticFiles();
    app.UseCors("AllowFrontend");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    // ========================================
    // HEALTH CHECK ENDPOINTS
    // ========================================
    app.MapHealthChecks("/health", new HealthCheckOptions
    {
        ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
    });
    
    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready"),
        ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
    });
    
    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("live"),
        ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
    });

    // Map SignalR Hubs
    app.MapHub<ChatHub>("/hubs/chat");

    Log.Information("Application started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}