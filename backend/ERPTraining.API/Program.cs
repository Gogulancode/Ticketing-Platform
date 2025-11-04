using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Http.Features;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Core.Services;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Infrastructure.Services;
using InfraServices = ERPTraining.Infrastructure.Services;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using ERPTraining.Infrastructure.Services.Ticketing.Settings;
using ERPTraining.Infrastructure.Services.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;

var builder = WebApplication.CreateBuilder(args);

// Configure IST timezone for the application
var timeZoneConfig = builder.Configuration.GetSection("TimeZone");
var useIST = timeZoneConfig.GetValue<bool>("UseIST", true);
if (useIST)
{
    // Set application timezone to IST
    TimeZoneInfo.ClearCachedData();
    var istTimeZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
    builder.Logging.AddConsole().AddConfiguration(builder.Configuration.GetSection("Logging"));
    Console.WriteLine($"Application configured for timezone: {istTimeZone.DisplayName}");
}

// Add CORS with permissive configuration for development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5178",  // Default Vite port
                "http://localhost:5179",  // Alternative frontend port
                "http://localhost:5180",  // Alternative port when 5178 is taken
                "http://localhost:5181",  // Current frontend port
                "http://localhost:5173",  // Vite default port
                "http://localhost:5182",  // Alternative frontend port
                "http://localhost:3000",  // React dev server alternative
                "http://localhost:8080",  // Generic dev server port
                "http://localhost",        // Production IIS frontend on port 80
                "http://localhost:81",     // Production IIS API on port 81
                "https://localhost",       // Production IIS on port 443
                "https://support.solutionsnextwave.com",  // Production
                "http://support.solutionsnextwave.com"    // Staging (HTTP and HTTPS)
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add database context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Identity
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

// Add Authentication and JWT Bearer
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
});

// Add controllers and configure file upload limits
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

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Add core Training services that exist
builder.Services.AddScoped<IModuleService, InfraServices.ModuleService>();
builder.Services.AddScoped<ISectionService, InfraServices.SectionService>();
builder.Services.AddScoped<IAssessmentService, InfraServices.AssessmentService>();
builder.Services.AddScoped<IQuestionService, InfraServices.QuestionService>();

// Add timezone service for IST handling
builder.Services.AddScoped<ERPTraining.Core.Services.ITimeZoneService, ERPTraining.Core.Services.TimeZoneService>();

// Add HttpClient for ERP API
builder.Services.AddHttpClient<InfraServices.ERPApiService>();
builder.Services.AddScoped<IERPApiService, InfraServices.ERPApiService>();

// Authentication Service - CLEAN & FAST
// ERP for password validation only, Platform manages all roles locally
builder.Services.AddScoped<IAuthService, ERPTraining.Infrastructure.Services.Auth.CleanERPAuthService>();

// Add Ticketing services
builder.Services.AddScoped<ITicketService, InfraServices.TicketService>();
builder.Services.AddScoped<ITicketingAclService, InfraServices.TicketingAclService>();
// Comment out the ticket settings service registration for now
// Ticket Settings (v2 minimal - categories only for now)
builder.Services.AddMemoryCache();
builder.Services.AddScoped<ERPTraining.Core.Ticketing.Settings.Interfaces.IA_TicketSettingsService, ERPTraining.Infrastructure.Services.Ticketing.Settings.TicketSettingsService>();

// Email Configuration Service
builder.Services.AddScoped<ERPTraining.Infrastructure.Services.Ticketing.IEmailConfigurationService, ERPTraining.Infrastructure.Services.Ticketing.EmailConfigurationService>();

// Microsoft Graph Email Services
builder.Services.AddScoped<ERPTraining.Infrastructure.Services.Ticketing.MicrosoftGraphEmailService>();
builder.Services.AddScoped<ERPTraining.Infrastructure.Services.Ticketing.GraphEmailToTicketProcessor>();

// Email Processing Background Service (Graph API) - Re-enabled for production
builder.Services.AddHostedService<ERPTraining.Infrastructure.Services.Ticketing.EmailProcessingBackgroundService>();

// Auto Assignment Service
builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.IAutoAssignmentService, ERPTraining.Infrastructure.Services.Ticketing.AutoAssignmentService>();

// Advanced Ticketing Settings Services
builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ITicketTagService, ERPTraining.Infrastructure.Services.Ticketing.TicketTagService>();
builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.IGraphEmailConfigService, ERPTraining.Infrastructure.Services.Ticketing.GraphEmailConfigService>();
builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ITicketFieldSettingService, ERPTraining.Infrastructure.Services.Ticketing.TicketFieldSettingService>();
builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ITicketGroupService, ERPTraining.Infrastructure.Services.Ticketing.TicketGroupService>();

// SLA Services
builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.ISlaService, ERPTraining.Infrastructure.Services.Ticketing.SimpleSlaService>();
builder.Services.AddScoped<ERPTraining.Core.Interfaces.Ticketing.INotificationService, ERPTraining.Infrastructure.Services.Ticketing.NotificationService>();

// Custom Fields Service
builder.Services.AddScoped<ERPTraining.Infrastructure.Services.Ticketing.ICustomFieldsService, ERPTraining.Infrastructure.Services.Ticketing.CustomFieldsService>();

// TODO: Fix RoleAccessService and RoleImportService compilation issues
// builder.Services.AddScoped<IRoleAccessService, InfraServices.RoleAccessService>();
// builder.Services.AddScoped<IRoleImportService, InfraServices.RoleImportService>();

// Build app
var app = builder.Build();

// Configure pipeline - Enable Swagger for all environments during development
app.UseSwagger();
app.UseSwaggerUI();

app.UseStaticFiles(); // Enable static file serving
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();