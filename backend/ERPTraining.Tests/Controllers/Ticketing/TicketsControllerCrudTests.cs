using ERPTraining.API.Controllers.Ticketing;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Services;
using ERPTraining.Tests.Fixtures;
using ERPTraining.Tests.Mocks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace ERPTraining.Tests.Controllers.Ticketing;

/// <summary>
/// Integration tests for TicketsController basic CRUD operations
/// Tests cover CreateTicket, GetTicket, UpdateTicket, DeleteTicket with positive and negative scenarios
/// </summary>
public class TicketsControllerCrudTests
{
    private readonly Mock<ITicketService> _mockTicketService;
    private readonly Mock<ILogger<TicketsController>> _mockLogger;
    private readonly TicketsController _controller;

    public TicketsControllerCrudTests()
    {
        _mockTicketService = MockTicketServiceFactory.CreateMockTicketService();
        _mockLogger = new Mock<ILogger<TicketsController>>();
        _controller = new TicketsController(_mockTicketService.Object, _mockLogger.Object);
        
        // Setup controller context with test user claims
        SetupControllerContext();
    }

    private void SetupControllerContext(string? userId = null, bool isAgent = false)
    {
        var testUserId = userId ?? TestDataFactory.TestUserId.ToString();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, testUserId),
            new("sub", testUserId),
            new("userid", testUserId)
        };

        if (isAgent)
        {
            claims.Add(new(ClaimTypes.Role, "Agent"));
        }

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }

    #region CreateTicket Tests

    [Fact]
    public async Task CreateTicket_ValidRequest_ShouldReturnCreatedResult()
    {
        // Arrange
        var request = TestDataFactory.CreateTicketRequest(
            title: "Test Ticket",
            description: "Test Description",
            category: TicketCategory.Technical,
            priority: TicketPriority.High);

        // Act
        var result = await _controller.CreateTicket(request);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);
        
        var responseValue = createdResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["title"].Should().Be("Test Ticket");
        responseDict["description"].Should().Be("Test Description");
        responseDict["category"].Should().Be((int)TicketCategory.Technical);
        responseDict["priority"].Should().Be((int)TicketPriority.High);
        
        _mockTicketService.Verify(x => x.CreateTicketAsync(It.IsAny<Ticket>()), Times.Once);
    }

    [Fact]
    public async Task CreateTicket_WithAttachments_ShouldProcessAttachmentsCorrectly()
    {
        // Arrange
        var attachments = new List<AttachmentRequest>
        {
            TestDataFactory.AttachmentRequest("file1.txt", "text/plain"),
            TestDataFactory.AttachmentRequest("file2.pdf", "application/pdf")
        };
        
        var request = TestDataFactory.CreateTicketRequest(attachments: attachments);

        // Act
        var result = await _controller.CreateTicket(request);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);
        
        // Verify attachments were processed
        _mockTicketService.Verify(x => x.AddAttachmentAsync(It.IsAny<Attachment>()), Times.Exactly(2));
    }

    [Fact]
    public async Task CreateTicket_WithAttachmentError_ShouldNotFailTicketCreation()
    {
        // Arrange
        _mockTicketService.Setup(x => x.AddAttachmentAsync(It.IsAny<Attachment>()))
            .ThrowsAsync(new InvalidOperationException("Attachment processing failed"));

        var attachments = new List<AttachmentRequest>
        {
            TestDataFactory.AttachmentRequest("file1.txt", "text/plain")
        };
        
        var request = TestDataFactory.CreateTicketRequest(attachments: attachments);

        // Act
        var result = await _controller.CreateTicket(request);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);
        
        // Ticket should still be created despite attachment error
        _mockTicketService.Verify(x => x.CreateTicketAsync(It.IsAny<Ticket>()), Times.Once);
    }

    [Fact]
    public async Task CreateTicket_InvalidModelState_ShouldReturnBadRequest()
    {
        // Arrange
        var request = TestDataFactory.CreateTicketRequest();
        _controller.ModelState.AddModelError("Title", "Title is required");

        // Act
        var result = await _controller.CreateTicket(request);

        // Assert
        result.Should().NotBeNull();
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        
        _mockTicketService.Verify(x => x.CreateTicketAsync(It.IsAny<Ticket>()), Times.Never);
    }

    [Fact]
    public async Task CreateTicket_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        var request = TestDataFactory.CreateTicketRequest();
        _mockTicketService.Setup(x => x.CreateTicketAsync(It.IsAny<Ticket>()))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.CreateTicket(request);

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetTicket Tests

    [Fact]
    public async Task GetTicket_ExistingTicket_ShouldReturnTicketWithRelatedData()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;

        // Act
        var result = await _controller.GetTicket(ticketId);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["id"].Should().Be(ticketId);
        responseDict["title"].Should().Be("Test Ticket");
        responseDict.Should().ContainKey("comments");
        responseDict.Should().ContainKey("attachments");
        responseDict.Should().ContainKey("createdByUser");
        responseDict.Should().ContainKey("subCategory");
        responseDict.Should().ContainKey("categoryId");
        responseDict.Should().ContainKey("subcategoryId");
        responseDict.Should().ContainKey("departmentId");

        _mockTicketService.Verify(x => x.GetTicketByIdAsync(ticketId), Times.Once);
        _mockTicketService.Verify(x => x.GetTicketCommentsAsync(ticketId), Times.Once);
        _mockTicketService.Verify(x => x.GetTicketAttachmentsAsync(ticketId), Times.Once);
    }

    [Fact]
    public async Task GetTicket_NonExistentTicket_ShouldReturnNotFound()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var result = await _controller.GetTicket(nonExistentId);

        // Assert
        result.Should().NotBeNull();
        var notFoundResult = result.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Ticket with ID {nonExistentId} not found");
    }

    [Fact]
    public async Task GetTicket_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        _mockTicketService.Setup(x => x.GetTicketByIdAsync(ticketId))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.GetTicket(ticketId);

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region UpdateTicket Tests

    [Fact]
    public async Task UpdateTicket_ValidGeneralUpdate_ShouldReturnUpdatedTicket()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.UpdateTicketRequest(
            title: "Updated Title",
            description: "Updated Description",
            category: TicketCategory.Billing,
            priority: TicketPriority.High,
            subcategoryId: 1,
            departmentId: 2);

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["title"].Should().Be("Updated Title");
        responseDict["description"].Should().Be("Updated Description");
        responseDict["category"].Should().Be((int)TicketCategory.Billing);
        responseDict["priority"].Should().Be((int)TicketPriority.High);
        responseDict["subcategoryId"].Should().Be(1);
        responseDict["departmentId"].Should().Be(2);
        responseDict["message"].Should().Be("Ticket updated successfully");

        _mockTicketService.Verify(x => x.GetTicketByIdAsync(ticketId), Times.Once);
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.IsAny<Ticket>()), Times.Once);
    }

    [Fact]
    public async Task UpdateTicket_StatusUpdate_ShouldUseStatusWorkflow()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.UpdateTicketRequest(status: TicketStatus.Resolved);

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["status"].Should().Be((int)TicketStatus.Resolved);
        responseDict["message"].Should().Be("Ticket status updated successfully");

        _mockTicketService.Verify(x => x.UpdateTicketStatusAsync(ticketId, TicketStatus.Resolved, It.IsAny<string>()), Times.Once);
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.IsAny<Ticket>()), Times.Never);
    }

    [Fact]
    public async Task UpdateTicket_AssignmentUpdate_ShouldUseAssignmentWorkflow()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var agentId = TestDataFactory.TestAgentId.ToString();
        var request = TestDataFactory.UpdateTicketRequest(assignedToUserId: agentId);

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["assignedToUserId"].Should().Be(agentId);
        responseDict["message"].Should().Be("Ticket assigned successfully");

        _mockTicketService.Verify(x => x.AssignTicketAsync(ticketId, agentId, It.IsAny<string>()), Times.Once);
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.IsAny<Ticket>()), Times.Never);
    }

    [Fact]
    public async Task UpdateTicket_NonExistentTicket_ShouldReturnNotFound()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();
        var request = TestDataFactory.UpdateTicketRequest(title: "Updated Title");

        // Act
        var result = await _controller.UpdateTicket(nonExistentId, request);

        // Assert
        result.Should().NotBeNull();
        var notFoundResult = result.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Ticket with ID {nonExistentId} not found");
    }

    [Fact]
    public async Task UpdateTicket_InvalidModelState_ShouldReturnBadRequest()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.UpdateTicketRequest();
        _controller.ModelState.AddModelError("Title", "Invalid title");

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.IsAny<Ticket>()), Times.Never);
    }

    #endregion

    #region DeleteTicket Tests

    [Fact]
    public async Task DeleteTicket_ExistingTicket_ShouldReturnNoContent()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;

        // Act
        var result = await _controller.DeleteTicket(ticketId);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeOfType<NoContentResult>();
        
        _mockTicketService.Verify(x => x.DeleteTicketAsync(ticketId), Times.Once);
    }

    [Fact]
    public async Task DeleteTicket_NonExistentTicket_ShouldReturnNotFound()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var result = await _controller.DeleteTicket(nonExistentId);

        // Assert
        result.Should().NotBeNull();
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Ticket with ID {nonExistentId} not found");
    }

    [Fact]
    public async Task DeleteTicket_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        _mockTicketService.Setup(x => x.DeleteTicketAsync(ticketId))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.DeleteTicket(ticketId);

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetTicket_DeletedTicket Integration Test

    [Fact]
    public async Task GetTicket_AfterDeletion_ShouldReturnNotFound()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        
        // Setup mock to return null after deletion
        _mockTicketService.Setup(x => x.GetTicketByIdAsync(ticketId))
            .ReturnsAsync((Ticket?)null);

        // Act
        var result = await _controller.GetTicket(ticketId);

        // Assert
        result.Should().NotBeNull();
        var notFoundResult = result.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Ticket with ID {ticketId} not found");
    }

    #endregion
}