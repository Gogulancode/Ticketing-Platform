using ERPTraining.API.Controllers.Ticketing;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Services;
using ERPTraining.Tests.Fixtures;
using ERPTraining.Tests.Mocks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ERPTraining.Tests.Controllers.Ticketing;

/// <summary>
/// Integration tests for Email-to-Ticket conversion workflow
/// Tests simulate how EmailController would integrate with TicketsController to convert emails to tickets
/// </summary>
public class EmailToTicketIntegrationTests
{
    private readonly Mock<ITicketService> _mockTicketService;
    private readonly Mock<ILogger<TicketsController>> _mockLogger;
    private readonly TicketsController _controller;

    public EmailToTicketIntegrationTests()
    {
        _mockTicketService = MockTicketServiceFactory.CreateMockTicketService();
        _mockLogger = new Mock<ILogger<TicketsController>>();
        _controller = new TicketsController(_mockTicketService.Object, _mockLogger.Object);
    }

    #region Email Data Conversion Tests

    [Fact]
    public async Task ConvertEmailToTicket_StandardEmail_ShouldCreateTicketWithCorrectMapping()
    {
        // Arrange - Simulate email data
        var emailData = new EmailToTicketData
        {
            Subject = "Login Issue - Cannot access training portal",
            Body = "Hi Support,\n\nI'm having trouble logging into the training portal. The system keeps saying 'Invalid credentials' even though I'm using the correct password.\n\nBest regards,\nJohn Doe",
            SenderEmail = "john.doe@company.com",
            SenderName = "John Doe",
            ReceivedAt = DateTime.UtcNow,
            Priority = EmailPriority.Normal,
            HasAttachments = false
        };

        // Convert email data to CreateTicketRequest
        var createRequest = ConvertEmailToCreateTicketRequest(emailData);

        // Act
        var result = await _controller.CreateTicket(createRequest);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);

        var responseValue = createdResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));

        // Verify email subject becomes ticket title
        responseDict["title"].Should().Be("Login Issue - Cannot access training portal");
        
        // Verify email body becomes ticket description (with sender info)
        var expectedDescription = $"Email from: John Doe (john.doe@company.com)\n" +
                                $"Received: {emailData.ReceivedAt:yyyy-MM-dd HH:mm}\n\n" +
                                $"{emailData.Body}";
        responseDict["description"].Should().Be(expectedDescription);
        
        // Verify category mapping (Technical for login issues)
        responseDict["category"].Should().Be((int)TicketCategory.Technical);
        
        // Verify priority mapping
        responseDict["priority"].Should().Be((int)TicketPriority.Medium);

        _mockTicketService.Verify(x => x.CreateTicketAsync(It.IsAny<Ticket>()), Times.Once);
    }

    [Fact]
    public async Task ConvertEmailToTicket_HighPriorityEmail_ShouldMapToHighPriorityTicket()
    {
        // Arrange
        var urgentEmailData = new EmailToTicketData
        {
            Subject = "URGENT: System Down - Cannot access training modules",
            Body = "URGENT: The entire training system appears to be down. Multiple users are reporting they cannot access any modules.",
            SenderEmail = "manager@company.com",
            SenderName = "Sarah Manager",
            ReceivedAt = DateTime.UtcNow,
            Priority = EmailPriority.High,
            HasAttachments = false
        };

        var createRequest = ConvertEmailToCreateTicketRequest(urgentEmailData);

        // Act
        var result = await _controller.CreateTicket(createRequest);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        
        var responseValue = createdResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));

        responseDict["priority"].Should().Be((int)TicketPriority.High);
        responseDict["title"].Should().Contain("URGENT");
    }

    [Fact]
    public async Task ConvertEmailToTicket_BillingEmail_ShouldMapToBillingCategory()
    {
        // Arrange
        var billingEmailData = new EmailToTicketData
        {
            Subject = "Invoice Question - Training subscription charges",
            Body = "Hello,\n\nI have a question about the recent training subscription charges on my account. Can someone please review my invoice?\n\nThanks,\nAlex Smith",
            SenderEmail = "alex.smith@company.com",
            SenderName = "Alex Smith",
            ReceivedAt = DateTime.UtcNow,
            Priority = EmailPriority.Normal,
            HasAttachments = false
        };

        var createRequest = ConvertEmailToCreateTicketRequest(billingEmailData);

        // Act
        var result = await _controller.CreateTicket(createRequest);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        
        var responseValue = createdResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));

        responseDict["category"].Should().Be((int)TicketCategory.Billing);
    }

    [Fact]
    public async Task ConvertEmailToTicket_EmailWithAttachments_ShouldCreateTicketWithAttachments()
    {
        // Arrange
        var emailWithAttachmentsData = new EmailToTicketData
        {
            Subject = "Error Report - Screenshots attached",
            Body = "Hi Support,\n\nI'm experiencing an error in the training module. Please see attached screenshots for details.\n\nRegards,\nMike Johnson",
            SenderEmail = "mike.johnson@company.com",
            SenderName = "Mike Johnson",
            ReceivedAt = DateTime.UtcNow,
            Priority = EmailPriority.Normal,
            HasAttachments = true,
            Attachments = new List<EmailAttachment>
            {
                new() { FileName = "error_screenshot1.png", ContentType = "image/png", Size = 15432, Content = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("fake image data 1")) },
                new() { FileName = "error_screenshot2.png", ContentType = "image/png", Size = 18765, Content = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("fake image data 2")) }
            }
        };

        var createRequest = ConvertEmailToCreateTicketRequest(emailWithAttachmentsData);

        // Act
        var result = await _controller.CreateTicket(createRequest);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        
        var responseValue = createdResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));

        responseDict["attachmentCount"].Should().Be(2);

        // Verify attachments were processed
        _mockTicketService.Verify(x => x.AddAttachmentAsync(It.IsAny<Attachment>()), Times.Exactly(2));
    }

    #endregion

    #region Email Classification Tests

    [Theory]
    [InlineData("Login", TicketCategory.Technical)]
    [InlineData("Password", TicketCategory.Technical)]
    [InlineData("Access", TicketCategory.Technical)]
    [InlineData("Error", TicketCategory.Technical)]
    [InlineData("Bug", TicketCategory.Technical)]
    [InlineData("Invoice", TicketCategory.Billing)]
    [InlineData("Payment", TicketCategory.Billing)]
    [InlineData("Subscription", TicketCategory.Billing)]
    [InlineData("Billing", TicketCategory.Billing)]
    [InlineData("Refund", TicketCategory.Billing)]
    [InlineData("Question", TicketCategory.General)]
    [InlineData("Help", TicketCategory.General)]
    [InlineData("Support", TicketCategory.General)]
    public async Task ConvertEmailToTicket_KeywordBasedClassification_ShouldMapToCorrectCategory(string keyword, TicketCategory expectedCategory)
    {
        // Arrange
        var emailData = new EmailToTicketData
        {
            Subject = $"Need help with {keyword} issue",
            Body = $"I have a {keyword} related problem that needs assistance.",
            SenderEmail = "user@company.com",
            SenderName = "Test User",
            ReceivedAt = DateTime.UtcNow,
            Priority = EmailPriority.Normal,
            HasAttachments = false
        };

        var createRequest = ConvertEmailToCreateTicketRequest(emailData);

        // Act
        var result = await _controller.CreateTicket(createRequest);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        
        var responseValue = createdResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));

        responseDict["category"].Should().Be((int)expectedCategory);
    }

    [Theory]
    [InlineData("URGENT", TicketPriority.High)]
    [InlineData("CRITICAL", TicketPriority.Critical)]
    [InlineData("HIGH PRIORITY", TicketPriority.High)]
    [InlineData("ASAP", TicketPriority.High)]
    [InlineData("EMERGENCY", TicketPriority.Critical)]
    [InlineData("Low priority", TicketPriority.Low)]
    [InlineData("When convenient", TicketPriority.Low)]
    public async Task ConvertEmailToTicket_PriorityKeywords_ShouldMapToCorrectPriority(string priorityKeyword, TicketPriority expectedPriority)
    {
        // Arrange
        var emailData = new EmailToTicketData
        {
            Subject = $"{priorityKeyword}: Need assistance",
            Body = $"This is a {priorityKeyword} request for help.",
            SenderEmail = "user@company.com",
            SenderName = "Test User",
            ReceivedAt = DateTime.UtcNow,
            Priority = EmailPriority.Normal, // Will be overridden by keyword detection
            HasAttachments = false
        };

        var createRequest = ConvertEmailToCreateTicketRequest(emailData);

        // Act
        var result = await _controller.CreateTicket(createRequest);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        
        var responseValue = createdResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));

        responseDict["priority"].Should().Be((int)expectedPriority);
    }

    #endregion

    #region Email Processing Error Handling Tests

    [Fact]
    public async Task ConvertEmailToTicket_InvalidEmailData_ShouldHandleGracefully()
    {
        // Arrange - Email with minimal data
        var minimalEmailData = new EmailToTicketData
        {
            Subject = "", // Empty subject
            Body = "", // Empty body
            SenderEmail = "unknown@company.com",
            SenderName = "",
            ReceivedAt = DateTime.UtcNow,
            Priority = EmailPriority.Normal,
            HasAttachments = false
        };

        var createRequest = ConvertEmailToCreateTicketRequest(minimalEmailData);
        // Override empty fields with defaults
        if (string.IsNullOrEmpty(createRequest.Title))
            createRequest.Title = "Email Support Request";
        if (string.IsNullOrEmpty(createRequest.Description))
            createRequest.Description = "No content provided in email.";

        // Act
        var result = await _controller.CreateTicket(createRequest);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);

        var responseValue = createdResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));

        responseDict["title"].Should().Be("Email Support Request");
        responseDict["description"].Should().Contain("No content provided");
    }

    [Fact]
    public async Task ConvertEmailToTicket_AttachmentProcessingError_ShouldNotFailTicketCreation()
    {
        // Arrange
        var emailData = new EmailToTicketData
        {
            Subject = "Support Request with Problematic Attachment",
            Body = "Please help with my training issue. File attached.",
            SenderEmail = "user@company.com",
            SenderName = "Test User",
            ReceivedAt = DateTime.UtcNow,
            Priority = EmailPriority.Normal,
            HasAttachments = true,
            Attachments = new List<EmailAttachment>
            {
                new() { FileName = "corrupted_file.pdf", ContentType = "application/pdf", Size = 0, Content = "invalid_base64_content" }
            }
        };

        // Setup mock to throw exception for attachment processing
        _mockTicketService.Setup(x => x.AddAttachmentAsync(It.IsAny<Attachment>()))
            .ThrowsAsync(new InvalidOperationException("Attachment processing failed"));

        var createRequest = ConvertEmailToCreateTicketRequest(emailData);

        // Act
        var result = await _controller.CreateTicket(createRequest);

        // Assert - Ticket should still be created despite attachment error
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);

        // Ticket creation should succeed
        _mockTicketService.Verify(x => x.CreateTicketAsync(It.IsAny<Ticket>()), Times.Once);
        // Attachment processing should be attempted
        _mockTicketService.Verify(x => x.AddAttachmentAsync(It.IsAny<Attachment>()), Times.Once);
    }

    #endregion

    #region Email-to-Ticket Workflow Integration Tests

    [Fact]
    public async Task EmailToTicketWorkflow_CompleteProcess_ShouldWorkEndToEnd()
    {
        // Simulate complete email-to-ticket workflow
        
        // Step 1: Email received and converted to ticket
        var emailData = new EmailToTicketData
        {
            Subject = "Training Module Access Issue",
            Body = "I cannot access the advanced training modules. Please investigate.",
            SenderEmail = "employee@company.com",
            SenderName = "Jane Employee",
            ReceivedAt = DateTime.UtcNow,
            Priority = EmailPriority.Normal,
            HasAttachments = false
        };

        var createRequest = ConvertEmailToCreateTicketRequest(emailData);
        
        // Act 1: Create ticket from email
        var createResult = await _controller.CreateTicket(createRequest);
        createResult.Should().NotBeNull();
        createResult.Result.Should().BeOfType<CreatedAtActionResult>();

        var ticketId = TestDataFactory.TestTicketId; // Would be extracted from create response

        // Step 2: Add initial internal note (agent reviews email context)
        var internalNoteRequest = TestDataFactory.AddCommentRequest(
            "Email converted to ticket. Checking user permissions for advanced modules.", 
            isInternal: true);
        
        var commentResult = await _controller.AddComment(ticketId, internalNoteRequest);
        commentResult.Should().NotBeNull();
        commentResult.Result.Should().BeOfType<OkObjectResult>();

        // Step 3: Assign to technical team
        var assignRequest = TestDataFactory.AssignTicketRequest(TestDataFactory.TestAgentId.ToString());
        var assignResult = await _controller.AssignTicket(ticketId, assignRequest);
        assignResult.Should().NotBeNull();
        assignResult.Should().BeOfType<OkObjectResult>();

        // Step 4: Update status and category based on investigation
        var updateRequest = TestDataFactory.UpdateTicketRequest(
            status: TicketStatus.InProgress,
            subcategoryId: 1, // Access Control issue
            departmentId: 2); // IT Department

        var updateResult = await _controller.UpdateTicket(ticketId, updateRequest);
        updateResult.Should().NotBeNull();
        updateResult.Result.Should().BeOfType<OkObjectResult>();

        // Verify complete workflow
        _mockTicketService.Verify(x => x.CreateTicketAsync(It.IsAny<Ticket>()), Times.Once);
        _mockTicketService.Verify(x => x.AddCommentAsync(ticketId, It.IsAny<string>(), It.IsAny<string>(), true), Times.Once);
        _mockTicketService.Verify(x => x.AssignTicketAsync(ticketId, TestDataFactory.TestAgentId.ToString()), Times.Once);
        _mockTicketService.Verify(x => x.UpdateTicketStatusAsync(ticketId, TicketStatus.InProgress, It.IsAny<string>()), Times.Once);
    }

    #endregion

    #region Helper Methods for Email-to-Ticket Conversion

    private static CreateTicketRequest ConvertEmailToCreateTicketRequest(EmailToTicketData emailData)
    {
        // Simulate the logic that would be in EmailController or a service
        
        // Classify category based on keywords
        var category = ClassifyEmailCategory(emailData.Subject, emailData.Body);
        
        // Determine priority
        var priority = DeterminePriority(emailData.Subject, emailData.Body, emailData.Priority);
        
        // Format description with email metadata
        var description = FormatEmailAsTicketDescription(emailData);
        
        // Convert attachments
        var attachments = emailData.HasAttachments && emailData.Attachments?.Any() == true
            ? emailData.Attachments.Select(ConvertEmailAttachment).ToList()
            : null;

        return new CreateTicketRequest
        {
            Title = string.IsNullOrEmpty(emailData.Subject) ? "Email Support Request" : emailData.Subject,
            Description = description,
            Category = category,
            Priority = priority,
            Attachments = attachments
        };
    }

    private static TicketCategory ClassifyEmailCategory(string subject, string body)
    {
        var content = $"{subject} {body}".ToLowerInvariant();
        
        // Technical keywords
        if (content.Contains("login") || content.Contains("password") || content.Contains("access") || 
            content.Contains("error") || content.Contains("bug") || content.Contains("technical"))
            return TicketCategory.Technical;
        
        // Billing keywords
        if (content.Contains("invoice") || content.Contains("payment") || content.Contains("billing") || 
            content.Contains("subscription") || content.Contains("refund"))
            return TicketCategory.Billing;
        
        // Default to General
        return TicketCategory.General;
    }

    private static TicketPriority DeterminePriority(string subject, string body, EmailPriority emailPriority)
    {
        var content = $"{subject} {body}".ToUpperInvariant();
        
        // Critical keywords
        if (content.Contains("CRITICAL") || content.Contains("EMERGENCY") || content.Contains("SYSTEM DOWN"))
            return TicketPriority.Critical;
        
        // High priority keywords
        if (content.Contains("URGENT") || content.Contains("HIGH PRIORITY") || content.Contains("ASAP"))
            return TicketPriority.High;
        
        // Low priority keywords
        if (content.Contains("LOW PRIORITY") || content.Contains("WHEN CONVENIENT"))
            return TicketPriority.Low;
        
        // Map email priority to ticket priority
        return emailPriority switch
        {
            EmailPriority.High => TicketPriority.High,
            EmailPriority.Low => TicketPriority.Low,
            _ => TicketPriority.Medium
        };
    }

    private static string FormatEmailAsTicketDescription(EmailToTicketData emailData)
    {
        var description = $"Email from: {emailData.SenderName}";
        if (!string.IsNullOrEmpty(emailData.SenderEmail))
            description += $" ({emailData.SenderEmail})";
        
        description += $"\nReceived: {emailData.ReceivedAt:yyyy-MM-dd HH:mm}\n\n";
        
        if (!string.IsNullOrEmpty(emailData.Body))
            description += emailData.Body;
        else
            description += "No content provided in email.";
        
        return description;
    }

    private static AttachmentRequest ConvertEmailAttachment(EmailAttachment emailAttachment)
    {
        return new AttachmentRequest
        {
            FileName = emailAttachment.FileName,
            ContentType = emailAttachment.ContentType,
            Base64Content = emailAttachment.Content
        };
    }

    #endregion
}

#region Email Data Models (would normally be in separate file)

public class EmailToTicketData
{
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; }
    public EmailPriority Priority { get; set; }
    public bool HasAttachments { get; set; }
    public List<EmailAttachment>? Attachments { get; set; }
}

public class EmailAttachment
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public int Size { get; set; }
    public string Content { get; set; } = string.Empty; // Base64 encoded
}

public enum EmailPriority
{
    Low,
    Normal,
    High
}

#endregion