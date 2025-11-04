using ERPTraining.Core.Interfaces.Email;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using System.Text.RegularExpressions;

namespace ERPTraining.Infrastructure.Services.Email;

public class EmailProcessingService : IEmailProcessingService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EmailProcessingService> _logger;
    private readonly string _connectionString;
    private bool _isRunning = false;

    public EmailProcessingService(
        IServiceProvider serviceProvider,
        ILogger<EmailProcessingService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? 
                          throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    public Task StartAsync()
    {
        _logger.LogInformation("Starting Email Processing Service manually");
        _isRunning = true;
        return Task.CompletedTask;
    }

    public Task StopAsync()
    {
        _logger.LogInformation("Stopping Email Processing Service manually");
        _isRunning = false;
        return Task.CompletedTask;
    }

    public Task<bool> IsRunningAsync()
    {
        return Task.FromResult(_isRunning);
    }

    public async Task ProcessEmailsNowAsync()
    {
        _logger.LogInformation("Processing incoming emails...");

        using var scope = _serviceProvider.CreateScope();
        
        // Here you would typically:
        // 1. Connect to email server (IMAP/POP3/Exchange/Office365)
        // 2. Fetch new emails
        // 3. Process each email

        // For now, I'll create a method that can be called when emails are received
        // This is a placeholder for the actual email processing logic
        
        await Task.CompletedTask; // To make this method truly async
        _logger.LogInformation("Email processing cycle completed");
    }

    // This method processes an incoming email and determines if it should create a new ticket
    // or add a comment to an existing ticket based on the Public Ticket ID in the subject
    public async Task<ProcessEmailResult> ProcessIncomingEmailAsync(EmailMessage emailMessage)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Extract ticket ID from subject line using regex
            var ticketIdPattern = @"\[Ticket #(\d+)\]|#(\d+)";
            var match = Regex.Match(emailMessage.Subject, ticketIdPattern, RegexOptions.IgnoreCase);
            
            if (match.Success)
            {
                // Extract the ticket number
                var ticketNumber = match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value;
                
                if (int.TryParse(ticketNumber, out var publicId))
                {
                    // Try to find existing ticket by PublicId
                    var findTicketSql = "SELECT Id FROM Tickets WHERE PublicId = @PublicId AND Status != 99";
                    using var findCommand = new SqlCommand(findTicketSql, connection);
                    findCommand.Parameters.AddWithValue("@PublicId", publicId);
                    
                    var ticketIdObj = await findCommand.ExecuteScalarAsync();
                    
                    if (ticketIdObj != null && Guid.TryParse(ticketIdObj.ToString(), out var ticketId))
                    {
                        // Add email as comment to existing ticket
                        await AddEmailAsCommentAsync(connection, ticketId, emailMessage);
                        
                        _logger.LogInformation("Email added as comment to existing ticket #{PublicId}", publicId);
                        return new ProcessEmailResult
                        {
                            Success = true,
                            Action = "AddedComment",
                            TicketId = ticketId,
                            PublicId = publicId,
                            Message = $"Email added as comment to ticket #{publicId}"
                        };
                    }
                }
            }

            // If no ticket ID found or ticket doesn't exist, create new ticket
            var newTicketId = await CreateTicketFromEmailAsync(connection, emailMessage);
            
            _logger.LogInformation("New ticket created from email");
            return new ProcessEmailResult
            {
                Success = true,
                Action = "CreatedTicket",
                TicketId = newTicketId.ticketId,
                PublicId = newTicketId.publicId,
                Message = $"New ticket #{newTicketId.publicId} created from email"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing incoming email");
            return new ProcessEmailResult
            {
                Success = false,
                Action = "Error",
                Message = ex.Message
            };
        }
    }

    private async Task AddEmailAsCommentAsync(SqlConnection connection, Guid ticketId, EmailMessage emailMessage)
    {
        var commentId = Guid.NewGuid();
        var commentBody = $"[EMAIL RECEIVED]\n\nFrom: {emailMessage.From}\nSubject: {emailMessage.Subject}\n\n{emailMessage.Body}";
        
        // Find or create user based on email
        var userId = await FindOrCreateUserFromEmailAsync(connection, emailMessage.From);
        
        var addCommentSql = @"
            INSERT INTO TicketComments (Id, TicketId, Body, AuthorUserId, IsInternal, CreatedAt)
            VALUES (@Id, @TicketId, @Body, @AuthorUserId, @IsInternal, @CreatedAt)";
        
        using var commentCommand = new SqlCommand(addCommentSql, connection);
        commentCommand.Parameters.AddWithValue("@Id", commentId);
        commentCommand.Parameters.AddWithValue("@TicketId", ticketId);
        commentCommand.Parameters.AddWithValue("@Body", commentBody);
        commentCommand.Parameters.AddWithValue("@AuthorUserId", userId);
        commentCommand.Parameters.AddWithValue("@IsInternal", false);
        commentCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
        
        await commentCommand.ExecuteNonQueryAsync();
        
        // Update ticket's UpdatedAt timestamp
        var updateTicketSql = "UPDATE Tickets SET UpdatedAt = @UpdatedAt WHERE Id = @TicketId";
        using var updateCommand = new SqlCommand(updateTicketSql, connection);
        updateCommand.Parameters.AddWithValue("@TicketId", ticketId);
        updateCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
        
        await updateCommand.ExecuteNonQueryAsync();
    }

    private async Task<(Guid ticketId, int publicId)> CreateTicketFromEmailAsync(SqlConnection connection, EmailMessage emailMessage)
    {
        var ticketId = Guid.NewGuid();
        
        // Get next public ID
        var getMaxPublicIdSql = "SELECT ISNULL(MAX(PublicId), 0) + 1 FROM Tickets";
        using var maxIdCommand = new SqlCommand(getMaxPublicIdSql, connection);
        var publicId = (int)(await maxIdCommand.ExecuteScalarAsync() ?? 1);
        
        // Find or create user based on email
        var userId = await FindOrCreateUserFromEmailAsync(connection, emailMessage.From);
        
        // Create ticket
        var createTicketSql = @"
            INSERT INTO Tickets (Id, PublicId, Title, Description, Category, Priority, Status, Source, 
                               CreatedByUserId, CreatedAt, UpdatedAt, IsOverdue)
            VALUES (@Id, @PublicId, @Title, @Description, @Category, @Priority, @Status, @Source,
                   @CreatedByUserId, @CreatedAt, @UpdatedAt, @IsOverdue)";
        
        using var createCommand = new SqlCommand(createTicketSql, connection);
        createCommand.Parameters.AddWithValue("@Id", ticketId);
        createCommand.Parameters.AddWithValue("@PublicId", publicId);
        createCommand.Parameters.AddWithValue("@Title", emailMessage.Subject);
        createCommand.Parameters.AddWithValue("@Description", emailMessage.Body);
        createCommand.Parameters.AddWithValue("@Category", 1); // Default category
        createCommand.Parameters.AddWithValue("@Priority", 2); // Normal priority
        createCommand.Parameters.AddWithValue("@Status", 1); // Open status
        createCommand.Parameters.AddWithValue("@Source", 2); // Email source
        createCommand.Parameters.AddWithValue("@CreatedByUserId", userId);
        createCommand.Parameters.AddWithValue("@CreatedAt", emailMessage.ReceivedDate);
        createCommand.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
        createCommand.Parameters.AddWithValue("@IsOverdue", false);
        
        await createCommand.ExecuteNonQueryAsync();
        
        return (ticketId, publicId);
    }

    private async Task<string> FindOrCreateUserFromEmailAsync(SqlConnection connection, string emailAddress)
    {
        // First try to find existing user
        var findUserSql = "SELECT Id FROM AspNetUsers WHERE Email = @Email";
        using var findCommand = new SqlCommand(findUserSql, connection);
        findCommand.Parameters.AddWithValue("@Email", emailAddress);
        
        var userIdObj = await findCommand.ExecuteScalarAsync();
        if (userIdObj != null)
        {
            return userIdObj.ToString()!;
        }

        // If user doesn't exist, return a default system user ID
        // In a real implementation, you might want to create a new user account
        return "0016f2fc-c4da-42d7-a635-236b4b95c6f1"; // System user ID
    }
}

// Result class for email processing
public class ProcessEmailResult
{
    public bool Success { get; set; }
    public string Action { get; set; } = string.Empty; // "CreatedTicket", "AddedComment", "Error"
    public Guid? TicketId { get; set; }
    public int? PublicId { get; set; }
    public string Message { get; set; } = string.Empty;
}