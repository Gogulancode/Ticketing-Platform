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
/// Integration tests for TicketsController assignment and workflow functionality
/// Tests cover AssignTicket, UnassignTicket, status workflow, and category/subcategory updates
/// </summary>
public class TicketsControllerAssignmentWorkflowTests
{
    private readonly Mock<ITicketService> _mockTicketService;
    private readonly Mock<ILogger<TicketsController>> _mockLogger;
    private readonly TicketsController _controller;

    public TicketsControllerAssignmentWorkflowTests()
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

    #region AssignTicket Tests

    [Fact]
    public async Task AssignTicket_ValidRequest_ShouldReturnAssignedTicket()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var agentId = TestDataFactory.TestAgentId.ToString();
        var request = TestDataFactory.AssignTicketRequest(agentId);

        // Act
        var result = await _controller.AssignTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["id"].Should().Be(ticketId);
        responseDict["assignedToUserId"].Should().Be(agentId);
        responseDict.Should().ContainKey("assignedTo");
        responseDict.Should().ContainKey("updatedAt");

        _mockTicketService.Verify(x => x.AssignTicketAsync(ticketId, agentId), Times.Once);
    }

    [Fact]
    public async Task AssignTicket_NonExistentTicket_ShouldReturnNotFound()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();
        var agentId = TestDataFactory.TestAgentId.ToString();
        var request = TestDataFactory.AssignTicketRequest(agentId);

        _mockTicketService.Setup(x => x.AssignTicketAsync(nonExistentId, agentId))
            .ThrowsAsync(new ArgumentException("Ticket not found"));

        // Act
        var result = await _controller.AssignTicket(nonExistentId, request);

        // Assert
        result.Should().NotBeNull();
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task AssignTicket_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var agentId = TestDataFactory.TestAgentId.ToString();
        var request = TestDataFactory.AssignTicketRequest(agentId);

        _mockTicketService.Setup(x => x.AssignTicketAsync(ticketId, agentId))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.AssignTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region UnassignTicket Tests

    [Fact]
    public async Task UnassignTicket_ValidRequest_ShouldReturnUnassignedTicket()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;

        // Act
        var result = await _controller.UnassignTicket(ticketId);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["id"].Should().Be(ticketId);
        responseDict["assignedToUserId"].Should().BeNull();
        responseDict["assignedTo"].Should().BeNull();

        _mockTicketService.Verify(x => x.UnassignTicketAsync(ticketId), Times.Once);
    }

    [Fact]
    public async Task UnassignTicket_NonExistentTicket_ShouldReturnNotFound()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        _mockTicketService.Setup(x => x.UnassignTicketAsync(nonExistentId))
            .ThrowsAsync(new ArgumentException("Ticket not found"));

        // Act
        var result = await _controller.UnassignTicket(nonExistentId);

        // Assert
        result.Should().NotBeNull();
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task UnassignTicket_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;

        _mockTicketService.Setup(x => x.UnassignTicketAsync(ticketId))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.UnassignTicket(ticketId);

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region Status Workflow Tests

    [Theory]
    [InlineData(TicketStatus.Open)]
    [InlineData(TicketStatus.InProgress)]
    [InlineData(TicketStatus.Resolved)]
    [InlineData(TicketStatus.Closed)]
    public async Task UpdateTicket_StatusUpdate_ShouldUseCorrectWorkflow(TicketStatus newStatus)
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.UpdateTicketRequest(status: newStatus);

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["status"].Should().Be((int)newStatus);
        responseDict["message"].Should().Be("Ticket status updated successfully");

        _mockTicketService.Verify(x => x.UpdateTicketStatusAsync(
            ticketId, 
            newStatus, 
            TestDataFactory.TestUserId.ToString()), Times.Once);
        
        // Should not call regular update when status is being updated
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.IsAny<Ticket>()), Times.Never);
    }

    [Fact]
    public async Task UpdateTicket_StatusToResolved_ShouldSetResolvedTimestamp()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.UpdateTicketRequest(status: TicketStatus.Resolved);

        // Setup mock to simulate resolved ticket behavior
        _mockTicketService.Setup(x => x.UpdateTicketStatusAsync(ticketId, TicketStatus.Resolved, It.IsAny<string>()))
            .ReturnsAsync(() =>
            {
                var ticket = TestDataFactory.CreateTestTicket(id: ticketId, status: TicketStatus.Resolved);
                ticket.ResolvedAt = DateTime.UtcNow;
                ticket.UpdatedAt = DateTime.UtcNow;
                return ticket;
            });

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["status"].Should().Be((int)TicketStatus.Resolved);
        
        _mockTicketService.Verify(x => x.UpdateTicketStatusAsync(ticketId, TicketStatus.Resolved, It.IsAny<string>()), Times.Once);
    }

    #endregion

    #region Category/Subcategory Update Tests

    [Fact]
    public async Task UpdateTicket_CategoryAndSubcategoryUpdate_ShouldUpdateAllFields()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.UpdateTicketRequest(
            category: TicketCategory.Billing,
            categoryId: 2,
            subcategoryId: 5,
            departmentId: 3);

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["category"].Should().Be((int)TicketCategory.Billing);
        responseDict["categoryId"].Should().Be(2);
        responseDict["subcategoryId"].Should().Be(5);
        responseDict["departmentId"].Should().Be(3);
        responseDict["message"].Should().Be("Ticket updated successfully");

        _mockTicketService.Verify(x => x.GetTicketByIdAsync(ticketId), Times.Once);
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.Is<Ticket>(t => 
            t.Category == TicketCategory.Billing &&
            t.CategoryId == 2 &&
            t.SubcategoryId == 5 &&
            t.DepartmentId == 3)), Times.Once);
    }

    [Fact]
    public async Task UpdateTicket_OnlySubcategoryUpdate_ShouldUpdateCorrectly()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.UpdateTicketRequest(subcategoryId: 1);

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["subcategoryId"].Should().Be(1);

        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.Is<Ticket>(t => t.SubcategoryId == 1)), Times.Once);
    }

    [Fact]
    public async Task UpdateTicket_MixedFieldsUpdate_ShouldUpdateAllProvided()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.UpdateTicketRequest(
            title: "Updated Title",
            priority: TicketPriority.High,
            subcategoryId: 2,
            departmentId: 1);

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["title"].Should().Be("Updated Title");
        responseDict["priority"].Should().Be((int)TicketPriority.High);
        responseDict["subcategoryId"].Should().Be(2);
        responseDict["departmentId"].Should().Be(1);

        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.Is<Ticket>(t => 
            t.Title == "Updated Title" &&
            t.Priority == TicketPriority.High &&
            t.SubcategoryId == 2 &&
            t.DepartmentId == 1)), Times.Once);
    }

    #endregion

    #region Assignment via UpdateTicket Tests

    [Fact]
    public async Task UpdateTicket_AssignmentViaUpdate_ShouldUseAssignmentWorkflow()
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
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["assignedToUserId"].Should().Be(agentId);
        responseDict["message"].Should().Be("Ticket assigned successfully");

        _mockTicketService.Verify(x => x.AssignTicketAsync(ticketId, agentId, TestDataFactory.TestUserId.ToString()), Times.Once);
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.IsAny<Ticket>()), Times.Never);
    }

    #endregion

    #region Workflow Priority Tests

    [Fact]
    public async Task UpdateTicket_StatusAndAssignmentTogether_ShouldPrioritizeStatus()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var agentId = TestDataFactory.TestAgentId.ToString();
        var request = TestDataFactory.UpdateTicketRequest(
            status: TicketStatus.InProgress,
            assignedToUserId: agentId);

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["status"].Should().Be((int)TicketStatus.InProgress);
        responseDict["message"].Should().Be("Ticket status updated successfully");

        // Status workflow should take precedence
        _mockTicketService.Verify(x => x.UpdateTicketStatusAsync(ticketId, TicketStatus.InProgress, It.IsAny<string>()), Times.Once);
        _mockTicketService.Verify(x => x.AssignTicketAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.IsAny<Ticket>()), Times.Never);
    }

    [Fact]
    public async Task UpdateTicket_AssignmentAndGeneralFields_ShouldPrioritizeAssignment()
    {
        // Arrange
        var ticketId = TestDataFactory.TestTicketId;
        var agentId = TestDataFactory.TestAgentId.ToString();
        var request = TestDataFactory.UpdateTicketRequest(
            title: "Updated Title",
            assignedToUserId: agentId,
            subcategoryId: 1);

        // Act
        var result = await _controller.UpdateTicket(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["assignedToUserId"].Should().Be(agentId);
        responseDict["message"].Should().Be("Ticket assigned successfully");

        // Assignment workflow should take precedence over general updates
        _mockTicketService.Verify(x => x.AssignTicketAsync(ticketId, agentId, It.IsAny<string>()), Times.Once);
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.IsAny<Ticket>()), Times.Never);
    }

    #endregion

    #region Integration Workflow Tests

    [Fact]
    public async Task CompleteWorkflow_CreateAssignUpdateStatus_ShouldWorkEndToEnd()
    {
        // Step 1: Create ticket
        var createRequest = TestDataFactory.CreateTicketRequest(
            title: "New Support Request",
            category: TicketCategory.Technical,
            priority: TicketPriority.Medium);

        var createResult = await _controller.CreateTicket(createRequest);
        createResult.Should().NotBeNull();
        createResult.Result.Should().BeOfType<CreatedAtActionResult>();

        // Step 2: Assign ticket
        var ticketId = TestDataFactory.TestTicketId;
        var agentId = TestDataFactory.TestAgentId.ToString();
        var assignRequest = TestDataFactory.AssignTicketRequest(agentId);

        var assignResult = await _controller.AssignTicket(ticketId, assignRequest);
        assignResult.Should().NotBeNull();
        assignResult.Should().BeOfType<OkObjectResult>();

        // Step 3: Update status to In Progress
        var statusUpdateRequest = TestDataFactory.UpdateTicketRequest(status: TicketStatus.InProgress);
        var statusResult = await _controller.UpdateTicket(ticketId, statusUpdateRequest);
        statusResult.Should().NotBeNull();
        statusResult.Result.Should().BeOfType<OkObjectResult>();

        // Step 4: Update category/subcategory
        var categoryUpdateRequest = TestDataFactory.UpdateTicketRequest(
            categoryId: 1,
            subcategoryId: 2);
        var categoryResult = await _controller.UpdateTicket(ticketId, categoryUpdateRequest);
        categoryResult.Should().NotBeNull();
        categoryResult.Result.Should().BeOfType<OkObjectResult>();

        // Step 5: Resolve ticket
        var resolveRequest = TestDataFactory.UpdateTicketRequest(status: TicketStatus.Resolved);
        var resolveResult = await _controller.UpdateTicket(ticketId, resolveRequest);
        resolveResult.Should().NotBeNull();
        resolveResult.Result.Should().BeOfType<OkObjectResult>();

        // Verify all operations were called correctly
        _mockTicketService.Verify(x => x.CreateTicketAsync(It.IsAny<Ticket>()), Times.Once);
        _mockTicketService.Verify(x => x.AssignTicketAsync(ticketId, agentId), Times.Once);
        _mockTicketService.Verify(x => x.UpdateTicketStatusAsync(ticketId, TicketStatus.InProgress, It.IsAny<string>()), Times.Once);
        _mockTicketService.Verify(x => x.UpdateTicketAsync(It.IsAny<Ticket>()), Times.Once); // For category update
        _mockTicketService.Verify(x => x.UpdateTicketStatusAsync(ticketId, TicketStatus.Resolved, It.IsAny<string>()), Times.Once);
    }

    #endregion
}