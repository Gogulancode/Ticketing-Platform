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
            // Skip system/automated emails that should not create tickets
            if (IsSystemOrAutomatedEmail(email))
            {
                _logger.LogInformation("Skipping system/automated email from {FromEmail}: {Subject}", email.FromEmail, email.Subject);
                
                // Mark as read so it doesn't get processed again
                await _emailService.MarkEmailAsReadAsync(email.Id, cancellationToken);
                return;
            }

            // Check if this is a reply to an existing ticket
            var existingTicket = await FindExistingTicketAsync(email, dbContext, cancellationToken);
            
            if (existingTicket != null)
            {
                await AddCommentToTicketAsync(existingTicket, email, dbContext, cancellationToken);
                _logger.LogInformation("Added comment to existing ticket {TicketId} from email {EmailId}", existingTicket.Id, email.Id);
            }
            else
            {
                // Check if auto-create tickets is enabled in the email configuration
                var emailConfig = await dbContext.Set<GraphEmailConfig>()
                    .FirstOrDefaultAsync(c => c.IsActive && c.ProcessIncomingEmails, cancellationToken);
                
                if (emailConfig != null && !emailConfig.CreateTicketsFromEmails)
                {
                    // Auto-create is disabled - mark email as read but don't create ticket
                    _logger.LogInformation("Skipping ticket creation for email {EmailId} - CreateTicketsFromEmails is disabled", email.Id);
                    await _emailService.MarkEmailAsReadAsync(email.Id, cancellationToken);
                    await _emailService.MoveEmailToFolderAsync(email.Id, "Skipped", cancellationToken);
                    return;
                }
                
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
        // Try multiple patterns to find ticket number in subject line
        // Updated to support 1-8 digit ticket numbers (was only 5-6 before)
        // Pattern 1: #15 or #101925 (with hash, 1-8 digits)
        // Pattern 2: Ticket #15 or Ticket 101925
        // Pattern 3: [Ticket #15] or [#101925]
        // Pattern 4: Re: ... #15 or standalone number
        var patterns = new[]
        {
            @"#(\d{1,8})",                    // #15, #123, #101925, etc.
            @"\[Ticket\s*#?(\d{1,8})\]",      // [Ticket #15] or [Ticket 101925]
            @"Ticket\s*#?(\d{1,8})",          // Ticket #15 or Ticket 101925
            @"(?:^|[\s:])(\d{4,8})(?:[\s\].\-]|$)" // Standalone 4-8 digit number (like 101925), at least 4 to avoid false matches
        };

        foreach (var pattern in patterns)
        {
            var ticketNumberMatch = Regex.Match(email.Subject, pattern, RegexOptions.IgnoreCase);
            if (ticketNumberMatch.Success && int.TryParse(ticketNumberMatch.Groups[1].Value, out int ticketNumber))
            {
                _logger.LogInformation("Found potential ticket number {TicketNumber} in subject using pattern {Pattern}", ticketNumber, pattern);
                
                var ticket = await dbContext.Tickets
                    .FirstOrDefaultAsync(t => t.PublicId == ticketNumber, cancellationToken);
                
                if (ticket != null)
                {
                    _logger.LogInformation("Matched email to existing ticket #{TicketNumber} (ID: {TicketId})", ticketNumber, ticket.Id);
                    return ticket;
                }
            }
        }

        // Try to find ticket by sender email in TicketParticipants (for CC'd and forwarded recipients)
        var senderEmail = email.FromEmail?.ToLowerInvariant();
        if (!string.IsNullOrEmpty(senderEmail))
        {
            var participantMatch = await dbContext.Set<TicketParticipant>()
                .Where(tp => tp.Email.ToLower() == senderEmail && tp.IsActive)
                .OrderByDescending(tp => tp.AddedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (participantMatch != null)
            {
                var ticket = await dbContext.Tickets
                    .FirstOrDefaultAsync(t => t.Id == participantMatch.TicketId, cancellationToken);
                
                if (ticket != null)
                {
                    _logger.LogInformation("Matched email from {Email} to ticket {TicketId} via TicketParticipants", 
                        senderEmail, ticket.Id);
                    return ticket;
                }
            }
        }

        // Try to find ticket where sender is the creator
        if (!string.IsNullOrEmpty(senderEmail))
        {
            var creatorTicket = await dbContext.Tickets
                .Include(t => t.CreatedByUser)
                .Where(t => t.CreatedByUser != null && t.CreatedByUser.Email!.ToLower() == senderEmail)
                .Where(t => t.CreatedAt > DateTime.UtcNow.AddDays(-30)) // Within last 30 days
                .OrderByDescending(t => t.UpdatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (creatorTicket != null && IsSimilarSubject(creatorTicket.Title, email.Subject))
            {
                _logger.LogInformation("Matched email from creator {Email} to recent ticket {TicketId} by similar subject", 
                    senderEmail, creatorTicket.Id);
                return creatorTicket;
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

        // Map category name to Category enum for consistency
        // This ensures both CategoryId (relational) and Category (enum) are in sync
        var categoryEnum = ERPTraining.Core.Entities.Ticketing.TicketCategory.General; // Default
        if (category != null)
        {
            var categoryName = category.Name.ToLowerInvariant();
            if (categoryName.Contains("technical") || categoryName.Contains("it"))
                categoryEnum = ERPTraining.Core.Entities.Ticketing.TicketCategory.Technical;
            else if (categoryName.Contains("content"))
                categoryEnum = ERPTraining.Core.Entities.Ticketing.TicketCategory.Content;
            else if (categoryName.Contains("assessment"))
                categoryEnum = ERPTraining.Core.Entities.Ticketing.TicketCategory.Assessment;
            else if (!categoryName.Contains("general"))
                categoryEnum = ERPTraining.Core.Entities.Ticketing.TicketCategory.Other;
        }

        // Generate ticket number
        var ticketNumber = await GenerateTicketNumberAsync(dbContext, cancellationToken);

        // Check if email body might contain inline images (cid: references or base64 data:image)
        var mightHaveInlineImages = email.Body.Contains("cid:", StringComparison.OrdinalIgnoreCase) || 
                                    email.Body.Contains("data:image", StringComparison.OrdinalIgnoreCase) ||
                                    email.HasAttachments;

        // Process inline images first (if email has attachments or inline image references)
        var processedBody = email.Body;
        var inlineImageInfo = "";
        if (mightHaveInlineImages)
        {
            _logger.LogInformation("Email might have inline images. HasAttachments={HasAttachments}, Contains cid:={ContainsCid}", 
                email.HasAttachments, email.Body.Contains("cid:"));
            
            var (updatedBody, savedImages) = await ProcessInlineImagesAsync(email.Id, email.Body, cancellationToken);
            processedBody = updatedBody;
            
            // Add info about inline images
            if (savedImages.Any())
            {
                // Create markdown-style image links that can be rendered in the frontend
                var imageLinks = string.Join("\n", savedImages.Select((img, idx) => $"[Image {idx + 1}]({img.savedPath})"));
                inlineImageInfo = $"\n\n📎 Inline images ({savedImages.Count}):\n{imageLinks}";
            }
        }

        // Create a well-formatted description with sender info and clean content
        var cleanBody = CleanEmailBody(processedBody);
        var formattedDescription = $"📧 Email from: {email.FromEmail}\n" +
                                 $"📅 Received: {email.ReceivedDate:yyyy-MM-dd HH:mm}\n\n" +
                                 $"--- Message Content ---\n" +
                                 $"{cleanBody}" +
                                 inlineImageInfo;

        // Auto-assign SLA policy based on ticket priority
        Guid? slaPolicyId = null;
        var matchingSlaPolicy = await dbContext.Set<SlaPolicy>()
            .Where(p => p.Priority == priority && p.IsActive && !p.IsDeleted)
            .OrderBy(p => p.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        
        if (matchingSlaPolicy != null)
        {
            slaPolicyId = matchingSlaPolicy.Id;
            _logger.LogInformation("Auto-assigned SLA policy '{PolicyName}' to email ticket based on priority {Priority}",
                matchingSlaPolicy.Name, priority);
        }

        var ticket = new Ticket
        {
            PublicId = ticketNumber,
            Title = CleanSubject(email.Subject),
            Description = formattedDescription,
            CreatedByUserId = user.Id,
            Category = categoryEnum, // Set both Category enum and CategoryId for consistency
            CategoryId = categoryId,
            SubcategoryId = subcategory?.Id,
            Priority = (ERPTraining.Core.Entities.Ticketing.TicketPriority)priority,
            Status = 1, // New status ID
            Source = TicketSource.Email,
            SlaPolicyId = slaPolicyId,
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

        // Send ticket creation notification email to the user
        try
        {
            await _emailService.SendTicketCreatedNotificationAsync(ticket, user, cancellationToken);
            _logger.LogInformation("Sent ticket creation notification for ticket #{TicketNumber} to {Email}", ticketNumber, email.FromEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send ticket creation notification for ticket #{TicketNumber}", ticketNumber);
            // Don't throw - ticket was created successfully, email is secondary
        }
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
        
        // If ticket was resolved or closed, reopen it when customer replies via email
        if (ticket.Status == 4 || ticket.Status == 5) // Resolved (4) or Closed (5)
        {
            // Look up the "Reopened" status ID dynamically
            var reopenStatus = await dbContext.TicketStatuses
                .Where(s => (s.Name == "Reopened" || s.Name == "Reopen") && s.IsActive)
                .Select(s => s.Id)
                .FirstOrDefaultAsync(cancellationToken);
            
            ticket.Status = reopenStatus != 0 ? reopenStatus : 2; // Fallback to In Progress (2) if Reopened status not found
            _logger.LogInformation("Reopened ticket #{TicketNumber} due to new email reply, new status: {StatusId}", 
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
    /// Processes inline images from email HTML body and returns updated body with proper image URLs
    /// </summary>
    private async Task<(string updatedBody, List<(string contentId, string savedPath, byte[] bytes)> savedImages)> ProcessInlineImagesAsync(
        string emailId, 
        string htmlBody, 
        CancellationToken cancellationToken)
    {
        var savedImages = new List<(string contentId, string savedPath, byte[] bytes)>();
        var updatedBody = htmlBody;
        
        // Create attachments directory for inline images
        var attachmentDirectory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "email-images");
        if (!Directory.Exists(attachmentDirectory))
        {
            Directory.CreateDirectory(attachmentDirectory);
        }
        
        try
        {
            // First, try to get inline attachments from Graph API (for cid: references)
            var emailAttachments = await _emailService.GetEmailAttachmentsAsync(emailId, cancellationToken);
            var inlineAttachments = emailAttachments.Where(a => a.IsInline && !string.IsNullOrEmpty(a.ContentId)).ToList();
            
            _logger.LogInformation("Found {Total} attachments, {Inline} are inline for email {EmailId}", 
                emailAttachments.Count, inlineAttachments.Count, emailId);
            
            // Process CID-referenced inline attachments
            foreach (var inlineAttachment in inlineAttachments)
            {
                if (inlineAttachment.ContentBytes == null || string.IsNullOrEmpty(inlineAttachment.ContentId))
                    continue;
                    
                try
                {
                    // Generate unique filename
                    var fileExtension = Path.GetExtension(inlineAttachment.FileName);
                    if (string.IsNullOrEmpty(fileExtension))
                    {
                        // Determine extension from content type
                        fileExtension = inlineAttachment.ContentType switch
                        {
                            "image/png" => ".png",
                            "image/jpeg" => ".jpg",
                            "image/gif" => ".gif",
                            "image/webp" => ".webp",
                            _ => ".png"
                        };
                    }
                    var uniqueFileName = $"inline_{Guid.NewGuid()}{fileExtension}";
                    var filePath = Path.Combine(attachmentDirectory, uniqueFileName);
                    
                    // Save file
                    await File.WriteAllBytesAsync(filePath, inlineAttachment.ContentBytes, cancellationToken);
                    
                    // Create URL for the image (relative to wwwroot)
                    var imageUrl = $"/uploads/email-images/{uniqueFileName}";
                    
                    // Replace cid: references in HTML body
                    // Content-ID can be with or without angle brackets
                    var contentId = inlineAttachment.ContentId.Trim('<', '>');
                    updatedBody = updatedBody.Replace($"cid:{contentId}", imageUrl, StringComparison.OrdinalIgnoreCase);
                    updatedBody = updatedBody.Replace($"cid:{inlineAttachment.ContentId}", imageUrl, StringComparison.OrdinalIgnoreCase);
                    
                    savedImages.Add((contentId, imageUrl, inlineAttachment.ContentBytes));
                    
                    _logger.LogInformation("Saved inline CID image {FileName} as {SavedPath}", inlineAttachment.FileName, imageUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing inline image {FileName}", inlineAttachment.FileName);
                }
            }
            
            // Also extract and save base64 encoded images (data:image/xxx;base64,...)
            var base64Pattern = new System.Text.RegularExpressions.Regex(
                @"src=[""']data:image/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)[""']",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            var matches = base64Pattern.Matches(updatedBody);
            _logger.LogInformation("Found {Count} base64 encoded images in email body", matches.Count);
            
            foreach (System.Text.RegularExpressions.Match match in matches)
            {
                try
                {
                    var imageType = match.Groups[1].Value.ToLower();
                    var base64Data = match.Groups[2].Value;
                    var imageBytes = Convert.FromBase64String(base64Data);
                    
                    var fileExtension = imageType == "jpeg" ? ".jpg" : $".{imageType}";
                    var uniqueFileName = $"inline_{Guid.NewGuid()}{fileExtension}";
                    var filePath = Path.Combine(attachmentDirectory, uniqueFileName);
                    
                    await File.WriteAllBytesAsync(filePath, imageBytes, cancellationToken);
                    
                    var imageUrl = $"/uploads/email-images/{uniqueFileName}";
                    
                    // Replace the base64 data with the saved image URL
                    updatedBody = updatedBody.Replace(match.Value, $"src=\"{imageUrl}\"");
                    
                    savedImages.Add(($"base64_{uniqueFileName}", imageUrl, imageBytes));
                    
                    _logger.LogInformation("Saved base64 inline image as {SavedPath}", imageUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing base64 inline image");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing inline images for email {EmailId}", emailId);
        }
        
        return (updatedBody, savedImages);
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

            // Filter out inline attachments (already processed as inline images)
            var regularAttachments = emailAttachments.Where(a => !a.IsInline).ToList();

            if (!regularAttachments.Any())
            {
                _logger.LogInformation("No regular attachments found for email {EmailId} (inline images already processed)", emailId);
                return;
            }

            // Create attachments directory
            var attachmentDirectory = Path.Combine(Directory.GetCurrentDirectory(), "attachments", "email");
            if (!Directory.Exists(attachmentDirectory))
            {
                Directory.CreateDirectory(attachmentDirectory);
            }

            foreach (var emailAttachment in regularAttachments)
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
    /// Returns Low (0) by default - agents/users can adjust priority in ticket details
    /// </summary>
    private int DeterminePriorityFromEmail(EmailMessage email)
    {
        // Default to Low priority for all email-created tickets
        // Agents or users can change priority from the ticket detail page
        return 0; // Low (TicketPriority enum: Low=0, Medium=1, High=2, Critical=3)
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
    /// Checks if an email is from a system/automated sender that should not create tickets
    /// This prevents loops from bounce-back emails, delivery failure notifications, etc.
    /// </summary>
    private bool IsSystemOrAutomatedEmail(EmailMessage email)
    {
        var fromEmail = email.FromEmail?.ToLowerInvariant() ?? "";
        var subject = email.Subject?.ToLowerInvariant() ?? "";

        // List of email address patterns that indicate automated/system emails
        var systemEmailPatterns = new[]
        {
            "postmaster@",
            "mailer-daemon@",
            "noreply@",
            "no-reply@",
            "no_reply@",
            "donotreply@",
            "do-not-reply@",
            "do_not_reply@",
            "bounce@",
            "bounces@",
            "notifications@",
            "notification@",
            "alert@",
            "alerts@",
            "system@",
            "automail@",
            "auto-mail@",
            "quarantine@",
            "@messaging.microsoft.com",  // Microsoft system notifications
            "@notification.microsoft.com",
            "@mail.protection.outlook.com"
        };

        // Check if from address matches any system pattern
        foreach (var pattern in systemEmailPatterns)
        {
            if (fromEmail.Contains(pattern))
            {
                _logger.LogDebug("Email from {FromEmail} matches system pattern: {Pattern}", email.FromEmail, pattern);
                return true;
            }
        }

        // List of subject patterns that indicate automated/system emails
        var systemSubjectPatterns = new[]
        {
            "undeliverable:",
            "delivery status notification",
            "delivery failure",
            "mail delivery failed",
            "returned mail:",
            "failure notice",
            "automatic reply:",
            "out of office:",
            "out-of-office:",
            "auto-reply:",
            "autoreply:",
            "action required:",
            "couldn't be delivered",
            "could not be delivered",
            "message blocked",
            "delivery has failed"
        };

        // Check if subject matches any system pattern
        foreach (var pattern in systemSubjectPatterns)
        {
            if (subject.Contains(pattern))
            {
                _logger.LogDebug("Email subject '{Subject}' matches system pattern: {Pattern}", email.Subject, pattern);
                return true;
            }
        }

        // Check for typical NDR (Non-Delivery Report) indicators in body
        var body = email.Body?.ToLowerInvariant() ?? "";
        var ndrBodyIndicators = new[]
        {
            "550 5.1.10",  // Recipient not found
            "550 5.1.1",   // Mailbox not found
            "smtp address lookup",
            "resolver.adr.recipientnotfound",
            "this is an automatically generated delivery status notification"
        };

        foreach (var indicator in ndrBodyIndicators)
        {
            if (body.Contains(indicator))
            {
                _logger.LogDebug("Email body contains NDR indicator: {Indicator}", indicator);
                return true;
            }
        }

        return false;
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
        
        // Clean up special characters and entities FIRST (before regex matching)
        body = body.Replace("&quot;", "\"")
                  .Replace("&amp;", "&")
                  .Replace("&lt;", "<")
                  .Replace("&gt;", ">")
                  .Replace("&nbsp;", " ");

        // IMPORTANT: Remove the External Email warning - this appears at the START of emails
        // Full pattern: "External Email: This email has not been originated from [your-domain].com. 
        //               Do not click on attachments or links/URLs unless the sender is reliable or trustworthy. 
        //               You could be a victim of phishing, malware, or viruses. Ok"
        var externalEmailPatterns = new[]
        {
            // Microsoft/Outlook safety tip: "You don't often get email from xxx@email.com. Learn why this is important"
            @"You\s+don'?t\s+often\s+get\s+email\s+from\s+[\w.@+-]+\.?\s*Learn\s+why\s+this\s+is\s+important\.?",
            @"You\s+don'?t\s+often\s+get\s+email\s+from\s+[\w.@+-]+",
            @"Learn\s+why\s+this\s+is\s+important\.?",
            // Full external email warning (may span multiple lines after HTML conversion)
            @"External\s*Email\s*:?\s*This\s+email\s+has\s+not\s+been\s+originated\s+from\s+[\w.-]+\.com\.?[\s\S]*?(?:phishing|malware|viruses)[\s\S]*?(?:Ok\.?)?",
            // Catch just the "External Email:" header
            @"External\s*Email\s*:[\s\S]*?(?=Attn|Dear|Hi|Hello|Subject|\w+\s+Sir|\w+\s+Ma'am|$)",
            // Specific fragments that might remain after partial HTML parsing - very specific patterns first
            @"[,\s]*malware[,\s]*or\s*viruses\.?\s*(?:Ok\.?)?\s*",  // ", malware, or viruses." - the most common remaining fragment
            @"[,\s]*phishing[,\s]*malware[,\s]*or\s*viruses\.?\s*", // "phishing, malware, or viruses."
            @"You\s+could\s+be\s+a\s+victim\s+of\s+phishing[\s\S]*?(?:Ok\.?)?",
            @"Do\s+not\s+click\s+on\s+attachments\s+or\s+links[\s\S]*?trustworthy\.?",
            @"This\s+email\s+has\s+not\s+been\s+originated\s+from[\s\S]*?\.com\.?",
            // Simple string-based cleanup for any remaining fragments
            @"^\s*,\s*malware.*?viruses\.?\s*",  // Start of content - ", malware, or viruses."
        };

        foreach (var pattern in externalEmailPatterns)
        {
            body = Regex.Replace(body, pattern, "", RegexOptions.IgnoreCase);
        }
        
        // Direct string cleanup for any stubborn fragments that regex might miss
        var fragmentsToRemove = new[]
        {
            // Microsoft Outlook safety tip
            "You don't often get email from",
            "Learn why this is important",
            // Other fragments
            ", malware, or viruses.",
            ",malware,or viruses.",
            ", malware, or viruses",
            "malware, or viruses.",
            ", malware, or viruses. Ok",
            "phishing, malware, or viruses.",
            "You could be a victim of phishing",
            "External Email:",
            "External Email :",
        };
        foreach (var fragment in fragmentsToRemove)
        {
            body = body.Replace(fragment, "", StringComparison.OrdinalIgnoreCase);
        }
        
        // Remove common email disclaimers (at the END of emails)
        var disclaimerPatterns = new[]
        {
            // Full Babaji Shivram disclaimer
            @"DISCLAIMER[:\s""]*The\s+information\s+in\s+this\s+email[\s\S]*?receipt["".]?\s*$",
            @"DISCLAIMER[\s\S]*$",
            @"The\s+information\s+in\s+this\s+email.*?legally\s+privileged[\s\S]*$",
            @"If\s+you\s+are\s+not\s+the\s+intended\s+recipient[\s\S]*$",
            @"Although\s+this\s+email.*?virus\s+free[\s\S]*$",
            @"no\s+responsibility\s+is\s+accepted\s+by\s+Babaji\s+Shivram[\s\S]*$",
            @"Babaji\s+Shivram\s+Clearing\s+&\s+Carriers[\s\S]*$",
            @"subsidiaries\s+or\s+affiliates[\s\S]*$",
            // Generic patterns
            @"CAUTION:?\s*This\s+email\s+originated[\s\S]*?(?:\r?\n\r?\n|\r?\n$|$)",
            @"WARNING:?\s*This\s+email\s+originated[\s\S]*?(?:\r?\n\r?\n|\r?\n$|$)",
            @"\[?External\]?\s*:?\s*This\s+email.*?(?:originated|outside)[\s\S]*?(?:\r?\n|$)",
            @"This\s+email\s+and\s+any\s+attachments.*?confidential[\s\S]*$",
            @"This\s+message\s+is\s+intended\s+only\s+for[\s\S]*$",
            @"This\s+communication\s+is\s+confidential[\s\S]*$",
            @"CONFIDENTIALITY\s+NOTICE[\s\S]*$",
            @"Please\s+consider\s+the\s+environment[\s\S]*$",
            @"Think\s+before\s+you\s+print[\s\S]*$"
        };

        foreach (var pattern in disclaimerPatterns)
        {
            body = Regex.Replace(body, pattern, "", RegexOptions.IgnoreCase);
        }
        
        // Remove common signature indicators and boilerplate
        // Note: Don't remove "Best regards" etc. as they're part of valid content
        // Only remove obvious email client additions and forwarded headers
        var signaturePatterns = new[]
        {
            @"--\s*\r?\n.*$",
            @"Sent\s+from.*$",
            @"Get\s+Outlook\s+for.*$",
            @"Sent\s+via.*$",
            @"From:.*?Subject:.*?(?=\r?\n\r?\n|\r?\n$|$)", // Remove forwarded email headers
            @"-----Original\s+Message-----.*$",
            @"________________________________.*$" // Outlook separator lines
        };

        foreach (var pattern in signaturePatterns)
        {
            body = Regex.Replace(body, pattern, "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        }

        // Remove quoted text and reply chains - these patterns catch the original message being replied to
        var quotedTextPatterns = new[]
        {
            // Outlook-style reply headers (most common) - match from "From:" onwards when it's a reply
            @"From:\s*[^\r\n]+\r?\nSent:\s*[^\r\n]+\r?\nTo:\s*[^\r\n]+[\s\S]*$",
            @"From:\s*[^\r\n]+<[^>]+>\r?\nSent:\s*[^\r\n]+[\s\S]*$",
            // Gmail-style "On [date] [person] wrote:"
            @"On\s+\w+,?\s+\w+\s+\d+,?\s+\d+.*?wrote:[\s\S]*$",
            @"On\s+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}.*?wrote:[\s\S]*$",
            // Generic reply indicators
            @"-{3,}\s*Original\s+Message\s*-{3,}[\s\S]*$",
            @"_{3,}\s*Original\s+Message\s*_{3,}[\s\S]*$",
            @"-----Original\s+Message-----[\s\S]*$",
            @"________________________________[\s\S]*$",
            // Quoted lines starting with > (each line)
            @"^>+\s*.*$",
            // Long underscores used as separators followed by content
            @"_{10,}[\s\S]*$"
        };

        foreach (var pattern in quotedTextPatterns)
        {
            body = Regex.Replace(body, pattern, "", RegexOptions.IgnoreCase | RegexOptions.Multiline);
        }

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