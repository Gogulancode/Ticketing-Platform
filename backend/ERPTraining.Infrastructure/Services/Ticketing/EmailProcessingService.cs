using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using ERPTraining.Core.Entities.Tickets;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using MailKit.Net.Imap;
using MailKit.Search;
using MailKit.Security;
using MailKit;
using MimeKit;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class EmailProcessingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EmailProcessingService> _logger;
    private readonly TimeSpan _processingInterval = TimeSpan.FromMinutes(1); // Check every minute

    public EmailProcessingService(IServiceProvider serviceProvider, ILogger<EmailProcessingService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email Processing Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessEmailsAsync(stoppingToken);
                await Task.Delay(_processingInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Email Processing Service is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing emails");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Wait 5 minutes before retrying on error
            }
        }

        _logger.LogInformation("Email Processing Service stopped");
    }

    private async Task ProcessEmailsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var emailConfigService = scope.ServiceProvider.GetRequiredService<IEmailConfigurationService>();

        // Get all active email configurations
        var emailConfigs = await context.CategoryEmailMappings
            .Include(cem => cem.Category)
            .Where(cem => cem.IsActive && 
                         !string.IsNullOrEmpty(cem.ImapServer) && 
                         !string.IsNullOrEmpty(cem.ImapUsername) && 
                         !string.IsNullOrEmpty(cem.ImapPassword))
            .ToListAsync(cancellationToken);

        if (!emailConfigs.Any())
        {
            _logger.LogDebug("No active email configurations found with complete IMAP settings");
            return;
        }

        _logger.LogDebug("Processing {Count} email configurations", emailConfigs.Count);

        foreach (var config in emailConfigs)
        {
            try
            {
                await ProcessEmailConfigAsync(config, emailConfigService, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process emails for configuration {EmailAddress}", config.EmailAddress);
            }
        }
    }

    private async Task ProcessEmailConfigAsync(
        CategoryEmailMapping config, 
        IEmailConfigurationService emailConfigService, 
        CancellationToken cancellationToken)
    {
        using var client = new ImapClient();
        
        try
        {
            _logger.LogDebug("Connecting to IMAP server {Server}:{Port} for {Email}", 
                config.ImapServer, config.ImapPort, config.EmailAddress);

            // Connect to IMAP server
            await client.ConnectAsync(config.ImapServer, config.ImapPort ?? 993, 
                config.ImapUseSsl, cancellationToken);

            // Authenticate
            try
            {
                await client.AuthenticateAsync(config.ImapUsername, config.ImapPassword, cancellationToken);
            }
            catch (MailKit.Security.AuthenticationException ex) when (ex.Message.Contains("LOGIN"))
            {
                _logger.LogWarning("LOGIN authentication failed for {Email}, trying alternative methods: {Error}", 
                    config.EmailAddress, ex.Message);
                
                // Try PLAIN mechanism as fallback
                var credential = new System.Net.NetworkCredential(config.ImapUsername, config.ImapPassword);
                await client.AuthenticateAsync(credential, cancellationToken);
            }

            // Select INBOX folder
            var inbox = client.Inbox;
            await inbox.OpenAsync(MailKit.FolderAccess.ReadWrite, cancellationToken);

            // Search for unread emails
            var uids = await inbox.SearchAsync(SearchQuery.NotSeen, cancellationToken);
            
            if (!uids.Any())
            {
                _logger.LogDebug("No unread emails found for {Email}", config.EmailAddress);
                return;
            }

            _logger.LogInformation("Found {Count} unread emails for {Email}", uids.Count, config.EmailAddress);

            // Process each unread email
            foreach (var uid in uids.Take(10)) // Limit to 10 emails per batch to avoid overwhelming
            {
                try
                {
                    var message = await inbox.GetMessageAsync(uid, cancellationToken);
                    
                    // Extract email details
                    var subject = message.Subject ?? "No Subject";
                    var body = message.TextBody ?? message.HtmlBody ?? string.Empty;
                    var fromAddress = message.From.Mailboxes.FirstOrDefault()?.Address ?? "unknown@sender.com";
                    var fromName = message.From.Mailboxes.FirstOrDefault()?.Name ?? fromAddress;

                    _logger.LogDebug("Processing email from {From}: {Subject}", fromAddress, subject);

                    // Create ticket from email
                    var success = await CreateTicketFromEmailAsync(
                        subject, body, fromAddress, fromName, config, cancellationToken);
                        
                    if (!success)
                    {
                        _logger.LogWarning("Failed to create ticket from email, but marking as processed to avoid reprocessing");
                        success = true; // Mark as processed to avoid infinite loop
                    }

                    if (success)
                    {
                        // Mark email as read
                        await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true, cancellationToken);
                        _logger.LogInformation("Successfully processed email from {From} and marked as read", fromAddress);
                    }
                    else
                    {
                        _logger.LogWarning("Failed to process email from {From}: {Subject}", fromAddress, subject);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing individual email for {Email}", config.EmailAddress);
                }
            }

            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect or process emails for {Email}", config.EmailAddress);
            
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, cancellationToken);
            }
        }
    }

    /// <summary>
    /// Creates a ticket from email content
    /// </summary>
    private async Task<bool> CreateTicketFromEmailAsync(
        string subject, 
        string body, 
        string fromAddress, 
        string fromName, 
        CategoryEmailMapping config,
        CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Get or create user
            var user = await GetOrCreateUserAsync(fromAddress, fromName, dbContext, cancellationToken);

            // Generate ticket number
            var ticketNumber = await GenerateTicketNumberAsync(dbContext, cancellationToken);

            // Clean subject
            var cleanSubject = CleanSubject(subject);
            var cleanBody = CleanEmailBody(body);

            var ticket = new Ticket
            {
                PublicId = ticketNumber,
                Title = cleanSubject,
                Description = cleanBody,
                CreatedByUserId = user.Id,
                CategoryId = config.Category?.Id, // Use the mapped category
                Priority = DeterminePriorityFromContent(cleanSubject + " " + cleanBody),
                Status = ERPTraining.Core.Entities.Ticketing.TicketStatus.New,
                Source = TicketSource.Email,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            dbContext.Tickets.Add(ticket);
            await dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created ticket #{TicketNumber} from email {FromEmail} for category {CategoryName}", 
                ticketNumber, fromAddress, config.Category?.Name ?? "Unknown");

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create ticket from email {FromEmail}: {Subject}", fromAddress, subject);
            return false;
        }
    }

    private async Task<User> GetOrCreateUserAsync(string email, string name, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        
        if (user == null)
        {
            user = new User
            {
                Email = email,
                UserName = email,
                FirstName = name.Split(' ').FirstOrDefault() ?? "",
                LastName = string.Join(" ", name.Split(' ').Skip(1)),
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                EmailConfirmed = true
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync(cancellationToken);
            
            _logger.LogInformation("Created new user from email: {Email}", email);
        }

        return user;
    }

    private async Task<int> GenerateTicketNumberAsync(ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var lastTicket = await dbContext.Tickets
            .OrderByDescending(t => t.PublicId)
            .FirstOrDefaultAsync(cancellationToken);

        return (lastTicket?.PublicId ?? 1000) + 1;
    }

    private ERPTraining.Core.Entities.Ticketing.TicketPriority DeterminePriorityFromContent(string content)
    {
        content = content.ToLower();

        // Check for urgent keywords
        var urgentKeywords = new[] { "urgent", "critical", "emergency", "asap", "immediately", "down", "broken", "not working" };
        var highKeywords = new[] { "important", "priority", "soon", "issue", "problem", "error" };

        if (urgentKeywords.Any(keyword => content.Contains(keyword)))
        {
            return ERPTraining.Core.Entities.Ticketing.TicketPriority.Critical;
        }
        
        if (highKeywords.Any(keyword => content.Contains(keyword)))
        {
            return ERPTraining.Core.Entities.Ticketing.TicketPriority.High;
        }

        return ERPTraining.Core.Entities.Ticketing.TicketPriority.Medium;
    }

    private string CleanSubject(string subject)
    {
        if (string.IsNullOrEmpty(subject))
            return "No Subject";

        subject = System.Text.RegularExpressions.Regex.Replace(subject, @"^(RE:\s*|FW:\s*|FWD:\s*)+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
        return subject;
    }

    private string CleanEmailBody(string body)
    {
        if (string.IsNullOrEmpty(body))
            return string.Empty;

        // Remove HTML tags
        body = System.Text.RegularExpressions.Regex.Replace(body, @"<[^>]+>", " ");
        
        // Clean up whitespace
        body = System.Text.RegularExpressions.Regex.Replace(body, @"\s+", " ").Trim();
        
        return body.Length > 5000 ? body.Substring(0, 5000) + "..." : body;
    }
}