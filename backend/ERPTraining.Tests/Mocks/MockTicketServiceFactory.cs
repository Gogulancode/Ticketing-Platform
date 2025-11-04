using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Services;
using Moq;

namespace ERPTraining.Tests.Mocks;

/// <summary>
/// Mock factory for creating ITicketService mocks with default behavior
/// </summary>
public static class MockTicketServiceFactory
{
    public static Mock<ITicketService> CreateMockTicketService()
    {
        var mock = new Mock<ITicketService>();

        // Setup default behaviors for common operations
        SetupGetTicketByIdAsync(mock);
        SetupCreateTicketAsync(mock);
        SetupUpdateTicketAsync(mock);
        SetupDeleteTicketAsync(mock);
        SetupGetTicketCommentsAsync(mock);
        SetupGetTicketAttachmentsAsync(mock);
        SetupAddCommentAsync(mock);
        SetupAddAttachmentAsync(mock);
        SetupGetUserAsync(mock);
        SetupIsUserAgentOrAdminAsync(mock);
        SetupGetFilteredTicketsAsync(mock);
        SetupGetTicketsByUserAsync(mock);
        SetupGetTicketStatisticsAsync(mock);
        SetupAssignTicketAsync(mock);
        SetupUnassignTicketAsync(mock);
        SetupUpdateTicketStatusAsync(mock);
        SetupCalculateOverdueTicketsAsync(mock);

        return mock;
    }

    private static void SetupGetTicketByIdAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.GetTicketByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid id) =>
            {
                if (id == Fixtures.TestDataFactory.TestTicketId)
                {
                    return Fixtures.TestDataFactory.CreateTestTicket(id);
                }
                return null;
            });
    }

    private static void SetupCreateTicketAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.CreateTicketAsync(It.IsAny<Ticket>()))
            .ReturnsAsync((Ticket ticket) =>
            {
                ticket.Id = ticket.Id == Guid.Empty ? Guid.NewGuid() : ticket.Id;
                ticket.CreatedAt = DateTime.UtcNow;
                ticket.UpdatedAt = DateTime.UtcNow;
                ticket.Status = TicketStatus.Open;
                return ticket;
            });
    }

    private static void SetupUpdateTicketAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.UpdateTicketAsync(It.IsAny<Ticket>()))
            .ReturnsAsync((Ticket ticket) =>
            {
                ticket.UpdatedAt = DateTime.UtcNow;
                return ticket;
            });
    }

    private static void SetupDeleteTicketAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.DeleteTicketAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid id) => id == Fixtures.TestDataFactory.TestTicketId);
    }

    private static void SetupGetTicketCommentsAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.GetTicketCommentsAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid ticketId) =>
            {
                if (ticketId == Fixtures.TestDataFactory.TestTicketId)
                {
                    return new List<Comment>
                    {
                        Fixtures.TestDataFactory.CreateTestComment(ticketId: ticketId, isInternal: false),
                        Fixtures.TestDataFactory.CreateTestComment(
                            id: Guid.NewGuid(),
                            ticketId: ticketId,
                            body: "Internal note",
                            isInternal: true)
                    };
                }
                return new List<Comment>();
            });
    }

    private static void SetupGetTicketAttachmentsAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.GetTicketAttachmentsAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid ticketId) =>
            {
                if (ticketId == Fixtures.TestDataFactory.TestTicketId)
                {
                    return new List<Attachment>
                    {
                        Fixtures.TestDataFactory.CreateTestAttachment(ticketId: ticketId)
                    };
                }
                return new List<Attachment>();
            });
    }

    private static void SetupAddCommentAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.AddCommentAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()))
            .ReturnsAsync((Guid ticketId, string content, string authorUserId, bool isInternal) =>
            {
                if (ticketId == Fixtures.TestDataFactory.TestTicketId)
                {
                    return Fixtures.TestDataFactory.CreateTestComment(
                        id: Guid.NewGuid(),
                        ticketId: ticketId,
                        body: content,
                        authorUserId: authorUserId,
                        isInternal: isInternal);
                }
                throw new ArgumentException("Ticket not found");
            });
    }

    private static void SetupAddAttachmentAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.AddAttachmentAsync(It.IsAny<Attachment>()))
            .ReturnsAsync((Attachment attachment) =>
            {
                attachment.Id = attachment.Id == Guid.Empty ? Guid.NewGuid() : attachment.Id;
                attachment.CreatedAt = DateTime.UtcNow;
                return attachment;
            });
    }

    private static void SetupGetUserAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.GetUserAsync(It.IsAny<string>()))
            .ReturnsAsync((string userId) =>
            {
                if (userId == Fixtures.TestDataFactory.TestUserId.ToString())
                {
                    return Fixtures.TestDataFactory.CreateTestUser();
                }
                if (userId == Fixtures.TestDataFactory.TestAgentId.ToString())
                {
                    return Fixtures.TestDataFactory.CreateTestAgent();
                }
                return null;
            });
    }

    private static void SetupIsUserAgentOrAdminAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.IsUserAgentOrAdminAsync(It.IsAny<string>()))
            .ReturnsAsync((string userId) => userId == Fixtures.TestDataFactory.TestAgentId.ToString());
    }

    private static void SetupGetFilteredTicketsAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.GetFilteredTicketsAsync(It.IsAny<TicketStatus?>(), It.IsAny<TicketPriority?>(), It.IsAny<TicketCategory?>()))
            .ReturnsAsync((TicketStatus? status, TicketPriority? priority, TicketCategory? category) =>
            {
                var tickets = new List<Ticket>
                {
                    Fixtures.TestDataFactory.CreateTestTicket(),
                    Fixtures.TestDataFactory.CreateTestTicket(
                        id: Guid.NewGuid(),
                        title: "Second Ticket",
                        status: TicketStatus.InProgress),
                    Fixtures.TestDataFactory.CreateTestTicket(
                        id: Guid.NewGuid(),
                        title: "Third Ticket",
                        priority: TicketPriority.High,
                        category: TicketCategory.Billing)
                };

                // Apply filters
                if (status.HasValue)
                    tickets = tickets.Where(t => t.Status == status.Value).ToList();
                if (priority.HasValue)
                    tickets = tickets.Where(t => t.Priority == priority.Value).ToList();
                if (category.HasValue)
                    tickets = tickets.Where(t => t.Category == category.Value).ToList();

                return tickets;
            });
    }

    private static void SetupGetTicketsByUserAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.GetTicketsByUserAsync(It.IsAny<string>()))
            .ReturnsAsync((string userId) =>
            {
                if (userId == Fixtures.TestDataFactory.TestUserId.ToString())
                {
                    return new List<Ticket>
                    {
                        Fixtures.TestDataFactory.CreateTestTicket(createdByUserId: userId)
                    };
                }
                return new List<Ticket>();
            });
    }

    private static void SetupGetTicketStatisticsAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.GetTicketStatisticsAsync())
            .ReturnsAsync(new
            {
                totalTickets = 10,
                openTickets = 5,
                inProgressTickets = 3,
                resolvedTickets = 2,
                overdueTickets = 1
            });
    }

    private static void SetupAssignTicketAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.AssignTicketAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ReturnsAsync((Guid ticketId, string agentId, string? assignedBy) =>
            {
                if (ticketId == Fixtures.TestDataFactory.TestTicketId)
                {
                    var ticket = Fixtures.TestDataFactory.CreateTestTicket(
                        id: ticketId,
                        assignedToUserId: agentId);
                    ticket.UpdatedAt = DateTime.UtcNow;
                    return ticket;
                }
                throw new ArgumentException("Ticket not found");
            });

        // Overload without assignedBy parameter
        mock.Setup(x => x.AssignTicketAsync(It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync((Guid ticketId, string agentId) =>
            {
                if (ticketId == Fixtures.TestDataFactory.TestTicketId)
                {
                    var ticket = Fixtures.TestDataFactory.CreateTestTicket(
                        id: ticketId,
                        assignedToUserId: agentId);
                    ticket.UpdatedAt = DateTime.UtcNow;
                    return ticket;
                }
                throw new ArgumentException("Ticket not found");
            });
    }

    private static void SetupUnassignTicketAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.UnassignTicketAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid ticketId) =>
            {
                if (ticketId == Fixtures.TestDataFactory.TestTicketId)
                {
                    var ticket = Fixtures.TestDataFactory.CreateTestTicket(
                        id: ticketId,
                        assignedToUserId: null);
                    ticket.UpdatedAt = DateTime.UtcNow;
                    return ticket;
                }
                throw new ArgumentException("Ticket not found");
            });
    }

    private static void SetupUpdateTicketStatusAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.UpdateTicketStatusAsync(It.IsAny<Guid>(), It.IsAny<TicketStatus>(), It.IsAny<string>()))
            .ReturnsAsync((Guid ticketId, TicketStatus status, string updatedBy) =>
            {
                if (ticketId == Fixtures.TestDataFactory.TestTicketId)
                {
                    var ticket = Fixtures.TestDataFactory.CreateTestTicket(
                        id: ticketId,
                        status: status);
                    ticket.UpdatedAt = DateTime.UtcNow;
                    if (status == TicketStatus.Resolved)
                        ticket.ResolvedAt = DateTime.UtcNow;
                    return ticket;
                }
                throw new ArgumentException("Ticket not found");
            });
    }

    private static void SetupCalculateOverdueTicketsAsync(Mock<ITicketService> mock)
    {
        mock.Setup(x => x.CalculateOverdueTicketsAsync())
            .Returns(Task.CompletedTask);
    }
}