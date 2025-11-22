using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Entities.Tickets;
using ERPTraining.Core.Models.Ticketing;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Linq;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class GraphEmailToTicketProcessor : IEmailToTicketProcessor
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly MicrosoftGraphEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GraphEmailToTicketProcessor> _logger;

    public GraphEmailToTicketProcessor(
        IServiceScopeFactory serviceScopeFactory,
        MicrosoftGraphEmailService emailService,
        IConfiguration configuration,
        ILogger<GraphEmailToTicketProcessor> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Processes unread emails and converts them to tickets
    /// </summary>
    public async Task ProcessEmailsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting email-to-ticket processing...");

            var emails = await _emailService.GetUnreadEmailsAsync(cancellationToken);
            
            if (!emails.Any())
            {
                _logger.LogInformation("No unread emails found");
                return;
            }

            _logger.LogInformation("Found {Count} unread emails to process", emails.Count);

            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            foreach (var email in emails)
            {
                try
                {
                    await ProcessSingleEmailAsync(email, dbContext, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing email {EmailId}: {Subject}", email.Id, email.Subject);
                    
                    // Move problematic email to error folder
                    await _emailService.MoveEmailToFolderAsync(email.Id, "Processing Errors", cancellationToken);
                }
            }

            _logger.LogInformation("Email-to-ticket processing completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in email-to-ticket processing");
            throw;
        }
    }

    /// <summary>
    /// Processes a single email and creates a ticket
    /// </summary>
    private async Task ProcessSingleEmailAsync(EmailMessage email, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        try
        {
            // Check if this is a reply to an existing ticket
            var existingTicket = await FindExistingTicketAsync(email, dbContext, cancellationToken);
            
            if (existingTicket != null)
            {
                await AddCommentToTicketAsync(existingTicket, email, dbContext, cancellationToken);
                _logger.LogInformation("Added comment to existing ticket {TicketId} from email {EmailId}", existingTicket.Id, email.Id);
            }
            else
            {
                await CreateNewTicketAsync(email, dbContext, cancellationToken);
                _logger.LogInformation("Created new ticket from email {EmailId}: {Subject}", email.Id, email.Subject);
            }

            // Mark email as processed
            await _emailService.MarkEmailAsReadAsync(email.Id, cancellationToken);
            await _emailService.MoveEmailToFolderAsync(email.Id, "Processed", cancellationToken);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing single email {EmailId}", email.Id);
            throw;
        }
    }

    /// <summary>
    /// Finds existing ticket based on email subject or conversation ID
    /// </summary>
    private async Task<Ticket?> FindExistingTicketAsync(EmailMessage email, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        // Try to find ticket number in subject line
        var ticketNumberMatch = Regex.Match(email.Subject, @"#(\d+)", RegexOptions.IgnoreCase);
        if (ticketNumberMatch.Success && int.TryParse(ticketNumberMatch.Groups[1].Value, out int ticketNumber))
        {
            var ticket = await dbContext.Tickets
                .FirstOrDefaultAsync(t => t.PublicId == ticketNumber, cancellationToken);
            
            if (ticket != null)
            {
                return ticket;
            }
        }

        // Try to find recent ticket from same sender with similar subject
        // Note: Since Ticket entity doesn't have RequesterEmail, we'll match by title similarity only
        var similarTicket = await dbContext.Tickets
            .Where(t => t.CreatedAt > DateTime.UtcNow.AddDays(-7)) // Within last 7 days
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (similarTicket != null && IsSimilarSubject(similarTicket.Title, email.Subject))
        {
            return similarTicket;
        }

        return null;
    }

    /// <summary>
    /// Creates a new ticket from an email
    /// </summary>
    private async Task CreateNewTicketAsync(EmailMessage email, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        // Get or create user
        var user = await GetOrCreateUserAsync(email.FromEmail, email.FromName, dbContext, cancellationToken);

        // Determine category and priority
        var category = await DetermineCategoryAsync(email, dbContext, cancellationToken);
        var subcategory = await DetermineSubcategoryAsync(email, dbContext, cancellationToken);
        var categoryId = category?.Id;

        if (subcategory != null)
        {
            categoryId = subcategory.CategoryId;
        }
        var priority = DeterminePriorityFromEmail(email);

        // Generate ticket number
        var ticketNumber = await GenerateTicketNumberAsync(dbContext, cancellationToken);

        // Create a well-formatted description with sender info and clean content
        var cleanBody = CleanEmailBody(email.Body);
        var formattedDescription = $"📧 Email from: {email.FromEmail}\n" +
                                 $"📅 Received: {email.ReceivedDate:yyyy-MM-dd HH:mm}\n\n" +
                                 $"--- Message Content ---\n" +
                                 $"{cleanBody}";

        var ticket = new Ticket
        {
            PublicId = ticketNumber,
            Title = CleanSubject(email.Subject),
            Description = formattedDescription,
            CreatedByUserId = user.Id,
            CategoryId = categoryId,
            SubcategoryId = subcategory?.Id,
            Priority = (ERPTraining.Core.Entities.Ticketing.TicketPriority)priority,
            Status = 1, // New status ID
            Source = TicketSource.Email,
            CreatedAt = email.ReceivedDate,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.Tickets.Add(ticket);
        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created ticket #{TicketNumber} for {Email}", ticketNumber, email.FromEmail);

        // Process attachments if any
        if (email.HasAttachments)
        {
            await ProcessEmailAttachmentsAsync(email.Id, ticket.Id, dbContext, cancellationToken);
        }

        // Auto-assign if rules exist
        await AutoAssignTicketAsync(ticket, dbContext, cancellationToken);
    }

    /// <summary>
    /// Adds a comment to an existing ticket
    /// </summary>
    private async Task AddCommentToTicketAsync(Ticket ticket, EmailMessage email, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var user = await GetOrCreateUserAsync(email.FromEmail, email.FromName, dbContext, cancellationToken);

        // Create a well-formatted comment with sender info and clean content
        var cleanBody = CleanEmailBody(email.Body);
        var attachmentNote = email.HasAttachments ? "\n📎 This email includes attachments" : "";
        var formattedComment = $"📧 Email reply from: {email.FromEmail}\n" +
                              $"📅 Received: {email.ReceivedDate:yyyy-MM-dd HH:mm}{attachmentNote}\n\n" +
                              $"{cleanBody}";

        var comment = new TicketComment
        {
            TicketId = ticket.Id,
            AuthorUserId = user.Id,
            Body = formattedComment,
            IsInternal = false,
            CreatedAt = email.ReceivedDate
        };

        dbContext.TicketComments.Add(comment);

        // Update ticket's last activity
        ticket.UpdatedAt = DateTime.UtcNow;
        
        // If ticket was resolved (not closed), reopen it when customer replies via email
        if (ticket.Status == 4) // Only Resolved tickets can be auto-reopened (not Closed)
        {
            // Look up the "Reopen" status ID dynamically (status IDs may vary across environments)
            var reopenStatus = await dbContext.TicketStatuses
                .Where(s => s.Name == "Reopen" && s.IsActive)
                .Select(s => s.Id)
                .FirstOrDefaultAsync(cancellationToken);
            
            ticket.Status = reopenStatus != 0 ? reopenStatus : 2; // Fallback to In Progress (2) if Reopen status not found
            _logger.LogInformation("Reopened ticket #{TicketNumber} due to new email with status {StatusId}", 
                ticket.PublicId?.ToString() ?? ticket.Id.ToString().Substring(0, 8), ticket.Status);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // Process attachments from email reply if any - link them to the comment
        if (email.HasAttachments)
        {
            _logger.LogInformation("Processing attachments from email reply for ticket {TicketId} and comment {CommentId}", ticket.Id, comment.Id);
            await ProcessEmailAttachmentsAsync(email.Id, ticket.Id, dbContext, cancellationToken, comment.Id);
        }
    }

    /// <summary>
    /// Processes attachments from an email and saves them to the ticket
    /// </summary>
    /// <param name="commentId">Optional comment ID to link attachments to a specific comment</param>
    private async Task ProcessEmailAttachmentsAsync(string emailId, Guid ticketId, ApplicationDbContext dbContext, CancellationToken cancellationToken, Guid? commentId = null)
    {
        try
        {
            _logger.LogInformation("Processing attachments for email {EmailId} and ticket {TicketId}", emailId, ticketId);

            var emailAttachments = await _emailService.GetEmailAttachmentsAsync(emailId, cancellationToken);

            if (!emailAttachments.Any())
            {
                _logger.LogInformation("No attachments found for email {EmailId}", emailId);
                return;
            }

            // Create attachments directory
            var attachmentDirectory = Path.Combine(Directory.GetCurrentDirectory(), "attachments", "email");
            if (!Directory.Exists(attachmentDirectory))
            {
                Directory.CreateDirectory(attachmentDirectory);
            }

            foreach (var emailAttachment in emailAttachments)
            {
                try
                {
                    // Generate unique filename to avoid conflicts
                    var fileExtension = Path.GetExtension(emailAttachment.FileName);
                    var safeFileName = Path.GetFileNameWithoutExtension(emailAttachment.FileName);
                    var uniqueFileName = $"{safeFileName}_{Guid.NewGuid()}{fileExtension}";
                    
                    var filePath = Path.Combine(attachmentDirectory, uniqueFileName);
                    
                    // Save file to disk
                    if (emailAttachment.ContentBytes != null)
                    {
                        await File.WriteAllBytesAsync(filePath, emailAttachment.ContentBytes, cancellationToken);
                        
                        // Get the ticket to find the creator for the attachment
                        var ticket = await dbContext.Tickets.FirstAsync(t => t.Id == ticketId, cancellationToken);
                        
                        // Create attachment record in database
                        var attachment = new Attachment
                        {
                            Id = Guid.NewGuid(),
                            TicketId = ticketId,
                            CommentId = commentId, // Link to comment if provided
                            FileName = emailAttachment.FileName,
                            ContentType = emailAttachment.ContentType,
                            SizeBytes = emailAttachment.Size,
                            StoragePath = $"attachments/email/{uniqueFileName}",
                            UploadedByUserId = ticket.CreatedByUserId, // Use ticket creator as uploader
                            CreatedAt = DateTime.UtcNow
                        };

                        dbContext.Attachments.Add(attachment);
                        
                        _logger.LogInformation("Processed attachment {FileName} for ticket {TicketId}{CommentInfo}", 
                            emailAttachment.FileName, ticketId, commentId.HasValue ? $" and comment {commentId.Value}" : "");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing attachment {FileName} for email {EmailId}", 
                        emailAttachment.FileName, emailId);
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Saved {Count} attachments for ticket {TicketId}", emailAttachments.Count, ticketId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing attachments for email {EmailId}", emailId);
        }
    }

    /// <summary>
    /// Gets or creates a user from email information
    /// </summary>
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

    /// <summary>
    /// Determines category based on email content and keywords
    /// </summary>
    private async Task<ERPTraining.Core.Entities.Tickets.TicketCategory?> DetermineCategoryAsync(EmailMessage email, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var categories = await dbContext.TicketCategories
            .Where(c => c.IsActive)
            .ToListAsync(cancellationToken);

        var emailContent = $"{email.Subject} {email.Body}".ToLower();

        // Find category with most matching keywords (simplified approach)
        ERPTraining.Core.Entities.Tickets.TicketCategory? bestMatch = null;
        int maxMatches = 0;

        foreach (var category in categories)
        {
            int matches = 0;
            
            // Simple keyword matching based on category name
            if (emailContent.Contains(category.Name.ToLower()))
            {
                matches = 1;
            }
            
            if (matches > maxMatches)
            {
                maxMatches = matches;
                bestMatch = category;
            }
        }

        // If no keyword match, return default category
        return bestMatch ?? await dbContext.TicketCategories
            .FirstOrDefaultAsync(c => c.IsActive && c.Name.ToLower().Contains("general"), cancellationToken);
    }

    /// <summary>
    /// Determines subcategory based on email content and configured tags
    /// </summary>
    private async Task<ERPTraining.Core.Entities.Tickets.TicketSubCategory?> DetermineSubcategoryAsync(EmailMessage email, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var content = $"{email.Subject} {email.Body}";

        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        var emailContent = content.ToLowerInvariant();

        var ticketTags = await dbContext.TicketTags
            .AsNoTracking()
            .Where(t => t.IsActive && !t.IsDeleted)
            .Select(t => new { t.Id, t.Name, t.SubCategoryId })
            .ToListAsync(cancellationToken);

        if (ticketTags.Count > 0)
        {
            var subcategoryIds = ticketTags.Select(t => t.SubCategoryId).Distinct().ToList();
            var subcategoryLookup = subcategoryIds.Count > 0
                ? await dbContext.TicketSubCategories
                    .AsNoTracking()
                    .Where(sc => subcategoryIds.Contains(sc.Id))
                    .ToDictionaryAsync(sc => sc.Id, sc => sc, cancellationToken)
                : new Dictionary<int, TicketSubCategory>();

            var matchedTag = ticketTags
                .SelectMany(tag => ExtractKeywords(tag.Name)
                    .Select(keyword => new { Tag = tag, Keyword = keyword }))
                .Where(candidate => ContainsKeyword(emailContent, candidate.Keyword))
                .OrderByDescending(candidate => candidate.Keyword.Length)
                .FirstOrDefault();

            if (matchedTag != null && subcategoryLookup.TryGetValue(matchedTag.Tag.SubCategoryId, out var matchedSubcategory))
            {
                _logger.LogInformation(
                    "Found keyword match: '{Keyword}' -> subcategory '{SubcategoryName}' (ID: {SubcategoryId}) via tag '{TagName}'",
                    matchedTag.Keyword,
                    matchedSubcategory.Name,
                    matchedSubcategory.Id,
                    matchedTag.Tag.Name);
                return matchedSubcategory;
            }
        }

        var keywordMappings = await dbContext.SubcategoryKeywords
            .AsNoTracking()
            .Where(sk => sk.IsActive)
            .OrderByDescending(sk => sk.Weight)
            .ToListAsync(cancellationToken);

        foreach (var mapping in keywordMappings)
        {
            if (!string.IsNullOrWhiteSpace(mapping.Keyword) && ContainsKeyword(emailContent, mapping.Keyword))
            {
                var keywordSubcategory = await dbContext.TicketSubCategories
                    .AsNoTracking()
                    .FirstOrDefaultAsync(sc => sc.Id == mapping.SubcategoryId, cancellationToken);

                if (keywordSubcategory != null)
                {
                    _logger.LogInformation(
                        "Matched subcategory keyword '{Keyword}' -> subcategory '{SubcategoryName}' (ID: {SubcategoryId})",
                        mapping.Keyword,
                        keywordSubcategory.Name,
                        keywordSubcategory.Id);
                    return keywordSubcategory;
                }
            }
        }

        _logger.LogInformation("No keyword matches found for email subject: '{Subject}'", email.Subject);
        return null;
    }

    /// <summary>
    /// Determines priority from email importance and content
    /// </summary>
    private int DeterminePriorityFromEmail(EmailMessage email)
    {
        var priority = email.Priority; // From Graph API importance
        var content = $"{email.Subject} {email.Body}".ToLower();

        // Check for urgent keywords
        var urgentKeywords = new[] { "urgent", "critical", "emergency", "asap", "immediately", "down", "broken", "not working" };
        var highKeywords = new[] { "important", "priority", "soon", "issue", "problem", "error" };

        if (urgentKeywords.Any(keyword => content.Contains(keyword)))
        {
            return 4; // Critical
        }
        
        if (highKeywords.Any(keyword => content.Contains(keyword)))
        {
            return Math.Max(priority, 3); // High
        }

        return priority;
    }

    /// <summary>
    /// Generates a unique ticket number
    /// </summary>
    private async Task<int> GenerateTicketNumberAsync(ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var lastTicket = await dbContext.Tickets
            .OrderByDescending(t => t.PublicId)
            .FirstOrDefaultAsync(cancellationToken);

        return (lastTicket?.PublicId ?? 1000) + 1;
    }

    /// <summary>
    /// Auto-assigns ticket based on assignment rules
    /// </summary>
    private async Task AutoAssignTicketAsync(Ticket ticket, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        try
        {
            var rules = await dbContext.AutoAssignmentRules
                .Include(r => r.RuleAgents)
                    .ThenInclude(ra => ra.Agent)
                .Where(r => r.IsActive)
                .OrderBy(r => r.Priority)
                .ToListAsync(cancellationToken);

            foreach (var rule in rules)
            {
                bool shouldAssign = true;

                // Check category match
                if (rule.CategoryId.HasValue && ticket.CategoryId != rule.CategoryId)
                    shouldAssign = false;

                // Check priority match  
                if (rule.TicketPriority.HasValue && (int)ticket.Priority != rule.TicketPriority.Value)
                    shouldAssign = false;

                // Check keyword match
                if (!string.IsNullOrEmpty(rule.Keywords))
                {
                    var ruleKeywords = rule.Keywords.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(k => k.Trim().ToLower());
                    
                    var ticketContent = $"{ticket.Title} {ticket.Description}".ToLower();
                    
                    if (!ruleKeywords.Any(keyword => ticketContent.Contains(keyword)))
                        shouldAssign = false;
                }

                if (shouldAssign && rule.RuleAgents?.Any() == true)
                {
                    var firstActiveAgent = rule.RuleAgents.FirstOrDefault(ra => ra.IsActive);
                    if (firstActiveAgent?.Agent != null)
                    {
                        ticket.AssignedToUserId = firstActiveAgent.Agent.UserId;
                        await dbContext.SaveChangesAsync(cancellationToken);
                        
                        _logger.LogInformation("Auto-assigned ticket #{TicketNumber} to agent {AgentName}", 
                            ticket.PublicId?.ToString() ?? ticket.Id.ToString().Substring(0, 8), 
                            firstActiveAgent.Agent.Name);
                        break;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in auto-assignment for ticket {TicketId}", ticket.Id);
        }
    }

    /// <summary>
    /// Cleans email subject by removing common prefixes
    /// </summary>
    private string CleanSubject(string subject)
    {
        if (string.IsNullOrEmpty(subject))
            return "No Subject";

        subject = Regex.Replace(subject, @"^(RE:\s*|FW:\s*|FWD:\s*)+", "", RegexOptions.IgnoreCase).Trim();
        return subject;
    }

    /// <summary>
    /// Cleans email body by removing signatures and HTML
    /// </summary>
    private string CleanEmailBody(string body)
    {
        if (string.IsNullOrEmpty(body))
            return string.Empty;

        // Remove HTML tags while preserving line breaks
        body = Regex.Replace(body, @"<br\s*/?>\s*", "\n", RegexOptions.IgnoreCase);
        body = Regex.Replace(body, @"<p\s*/?>\s*", "\n", RegexOptions.IgnoreCase);
        body = Regex.Replace(body, @"</p>\s*", "\n", RegexOptions.IgnoreCase);
        body = Regex.Replace(body, @"<[^>]+>", " ");
        
        // Remove common email disclaimers (like the one in your attachment)
        var disclaimerPatterns = new[]
        {
            @"DISCLAIMER[&quot;:]*.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @"The information in this email.*?is legally privileged and confidential.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @"If you are not the intended recipient.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @"Although this email.*?virus free.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @".*?subsidiaries or affiliates.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @"This email and any attachments.*?confidential.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @"This message is intended only for.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @"This communication is confidential.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @"CONFIDENTIALITY NOTICE.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @"Please consider the environment.*?(?=\r?\n\r?\n|\r?\n$|$)",
            @"Think before you print.*?(?=\r?\n\r?\n|\r?\n$|$)"
        };

        foreach (var pattern in disclaimerPatterns)
        {
            body = Regex.Replace(body, pattern, "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        }
        
        // Remove common signature indicators and boilerplate
        var signaturePatterns = new[]
        {
            @"--\s*\r?\n.*$",
            @"Best [Rr]egards.*$",
            @"Kind [Rr]egards.*$", 
            @"Warm [Rr]egards.*$",
            @"Regards.*$",
            @"Thanks?[\s\r\n]*.*$",
            @"Thank you.*$",
            @"Sent from.*$",
            @"Get Outlook for.*$",
            @"Sent via.*$",
            @"From:.*?Subject:.*?(?=\r?\n\r?\n|\r?\n$|$)", // Remove forwarded email headers
            @"-----Original Message-----.*$",
            @"________________________________.*$" // Outlook separator lines
        };

        foreach (var pattern in signaturePatterns)
        {
            body = Regex.Replace(body, pattern, "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        }

        // Remove quoted text and reply chains
        var quotedTextPatterns = new[]
        {
            @"On .* wrote:.*$", // "On [date] [person] wrote:"
            @"From:.*?(?=\r?\n\r?\n|\r?\n$|$)", // Email headers in replies
            @">.*$", // Quoted lines starting with >
            @"_{10,}.*$" // Long underscores used as separators
        };

        foreach (var pattern in quotedTextPatterns)
        {
            body = Regex.Replace(body, pattern, "", RegexOptions.IgnoreCase | RegexOptions.Multiline);
        }

        // Clean up special characters and entities
        body = body.Replace("&quot;", "\"")
                  .Replace("&amp;", "&")
                  .Replace("&lt;", "<")
                  .Replace("&gt;", ">")
                  .Replace("&nbsp;", " ");

        // Clean up whitespace and format properly
        body = Regex.Replace(body, @"\r?\n\s*\r?\n", "\n\n"); // Replace multiple newlines with double newline
        body = Regex.Replace(body, @"[ \t]+", " "); // Replace multiple spaces/tabs with single space
        body = Regex.Replace(body, @"^\s+|\s+$", "", RegexOptions.Multiline); // Trim each line
        body = body.Trim();
        
        // Remove any remaining empty lines at start/end
        while (body.StartsWith("\n"))
            body = body.Substring(1);
        while (body.EndsWith("\n\n\n"))
            body = body.Substring(0, body.Length - 1);
        
        return body.Length > 5000 ? body.Substring(0, 5000) + "..." : body;
    }

    /// <summary>
    /// Checks if two subjects are similar (for finding related tickets)
    /// </summary>
    private bool IsSimilarSubject(string subject1, string subject2)
    {
        if (string.IsNullOrEmpty(subject1) || string.IsNullOrEmpty(subject2))
            return false;

        subject1 = CleanSubject(subject1).ToLower();
        subject2 = CleanSubject(subject2).ToLower();

        // Simple similarity check - if 70% of words match
        var words1 = subject1.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var words2 = subject2.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        if (words1.Length == 0 || words2.Length == 0)
            return false;

        int matches = words1.Intersect(words2).Count();
        double similarity = (double)matches / Math.Max(words1.Length, words2.Length);

        return similarity >= 0.7;
    }

    private static IEnumerable<string> ExtractKeywords(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            yield break;
        }

        foreach (var keyword in rawValue.Split(KeywordSeparators, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                yield return keyword;
            }
        }
    }

    private static bool ContainsKeyword(string content, string keyword)
    {
        if (string.IsNullOrWhiteSpace(content) || string.IsNullOrWhiteSpace(keyword))
        {
            return false;
        }

        return content.Contains(keyword, StringComparison.OrdinalIgnoreCase);
    }

    private static readonly char[] KeywordSeparators = new[] { ',', ';', '|', '/', '\\', '\n', '\r' };
}