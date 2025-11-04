using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;

namespace ERPTraining.Tests.Fixtures;

/// <summary>
/// Test data factory for creating consistent test entities
/// </summary>
public static class TestDataFactory
{
    public static readonly Guid TestUserId = Guid.Parse("0016f2fc-c4da-42d7-a635-236b4b95c6f1");
    public static readonly Guid TestAgentId = Guid.Parse("d87fc841-ec2f-4613-93c8-cc5015a592a6");
    public static readonly Guid TestTicketId = Guid.Parse("c7e96f38-a331-4239-9d25-600a498dcf69");
    public static readonly Guid TestCommentId = Guid.Parse("f1e9c8d7-b6a5-4321-9876-543210fedcba");
    public static readonly Guid TestAttachmentId = Guid.Parse("a1b2c3d4-e5f6-7890-1234-567890abcdef");

    public static User CreateTestUser(Guid? id = null, string? email = null, string? firstName = null, string? lastName = null)
    {
        return new User
        {
            Id = id?.ToString() ?? TestUserId.ToString(),
            Email = email ?? "test@example.com",
            FirstName = firstName ?? "Test",
            LastName = lastName ?? "User",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };
    }

    public static User CreateTestAgent(Guid? id = null)
    {
        return new User
        {
            Id = id?.ToString() ?? TestAgentId.ToString(),
            Email = "agent@example.com",
            FirstName = "Test",
            LastName = "Agent",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };
    }

    public static Ticket CreateTestTicket(
        Guid? id = null,
        string? title = null,
        string? description = null,
        TicketCategory? category = null,
        TicketPriority? priority = null,
        TicketStatus? status = null,
        string? createdByUserId = null,
        string? assignedToUserId = null,
        int? categoryId = null,
        int? subcategoryId = null,
        int? departmentId = null)
    {
        return new Ticket
        {
            Id = id ?? TestTicketId,
            Title = title ?? "Test Ticket",
            Description = description ?? "Test ticket description",
            Category = category ?? TicketCategory.Technical,
            Priority = priority ?? TicketPriority.Medium,
            Status = status ?? TicketStatus.Open,
            Source = TicketSource.TrainingPortal,
            CreatedByUserId = createdByUserId ?? TestUserId.ToString(),
            AssignedToUserId = assignedToUserId,
            CategoryId = categoryId,
            SubcategoryId = subcategoryId,
            DepartmentId = departmentId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static Comment CreateTestComment(
        Guid? id = null,
        Guid? ticketId = null,
        string? body = null,
        string? authorUserId = null,
        bool isInternal = false)
    {
        return new Comment
        {
            Id = id ?? TestCommentId,
            TicketId = ticketId ?? TestTicketId,
            Body = body ?? "Test comment",
            AuthorUserId = authorUserId ?? TestUserId.ToString(),
            IsInternal = isInternal,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Attachment CreateTestAttachment(
        Guid? id = null,
        Guid? ticketId = null,
        string? fileName = null,
        string? contentType = null,
        int sizeBytes = 1024)
    {
        return new Attachment
        {
            Id = id ?? TestAttachmentId,
            TicketId = ticketId ?? TestTicketId,
            FileName = fileName ?? "test-file.txt",
            ContentType = contentType ?? "text/plain",
            SizeBytes = sizeBytes,
            StoragePath = "test/path",
            UploadedByUserId = TestUserId.ToString(),
            CreatedAt = DateTime.UtcNow
        };
    }

    public static CreateTicketRequest CreateTicketRequest(
        string? title = null,
        string? description = null,
        TicketCategory? category = null,
        TicketPriority? priority = null,
        int? categoryId = null,
        int? subcategoryId = null,
        int? departmentId = null,
        List<AttachmentRequest>? attachments = null)
    {
        return new CreateTicketRequest
        {
            Title = title ?? "Test Ticket",
            Description = description ?? "Test description",
            Category = category ?? TicketCategory.Technical,
            Priority = priority ?? TicketPriority.Medium,
            CategoryId = categoryId,
            SubcategoryId = subcategoryId,
            DepartmentId = departmentId,
            Attachments = attachments
        };
    }

    public static UpdateTicketRequest UpdateTicketRequest(
        string? title = null,
        string? description = null,
        TicketCategory? category = null,
        TicketPriority? priority = null,
        TicketStatus? status = null,
        string? assignedToUserId = null,
        int? subCategory = null,
        int? categoryId = null,
        int? subcategoryId = null,
        int? departmentId = null)
    {
        return new UpdateTicketRequest
        {
            Title = title,
            Description = description,
            Category = category,
            Priority = priority,
            Status = status,
            AssignedToUserId = assignedToUserId,
            SubCategory = subCategory,
            CategoryId = categoryId,
            SubcategoryId = subcategoryId,
            DepartmentId = departmentId
        };
    }

    public static AddCommentRequest AddCommentRequest(string? content = null, bool isInternal = false)
    {
        return new AddCommentRequest
        {
            Content = content ?? "Test comment content",
            IsInternal = isInternal
        };
    }

    public static AssignTicketRequest AssignTicketRequest(string? agentId = null)
    {
        return new AssignTicketRequest
        {
            AgentId = agentId ?? TestAgentId.ToString()
        };
    }

    public static AttachmentRequest AttachmentRequest(
        string? fileName = null,
        string? contentType = null,
        string? base64Content = null)
    {
        return new AttachmentRequest
        {
            FileName = fileName ?? "test.txt",
            ContentType = contentType ?? "text/plain",
            Base64Content = base64Content ?? Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("test content"))
        };
    }
}