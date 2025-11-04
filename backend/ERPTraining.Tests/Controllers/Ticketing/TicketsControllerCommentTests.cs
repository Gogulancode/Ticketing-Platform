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
/// Integration tests for TicketsController comment functionality
/// Tests cover AddComment, GetComments with internal note filtering and role-based access control
/// </summary>
public class TicketsControllerCommentTests
{
    private readonly Mock<ITicketService> _mockTicketService;
    private readonly Mock<ILogger<TicketsController>> _mockLogger;
    private readonly TicketsController _controller;

    public TicketsControllerCommentTests()
    {
        _mockTicketService = MockTicketServiceFactory.CreateMockTicketService();
        _mockLogger = new Mock<ILogger<TicketsController>>();
        _controller = new TicketsController(_mockTicketService.Object, _mockLogger.Object);
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

    #region AddComment Tests

    [Fact]
    public async Task AddComment_ValidPublicComment_ShouldReturnCreatedComment()
    {
        // Arrange
        SetupControllerContext();
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.AddCommentRequest("This is a public comment", isInternal: false);

        // Act
        var result = await _controller.AddComment(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["ticketId"].Should().Be(ticketId);
        responseDict["body"].Should().Be("This is a public comment");
        responseDict["authorUserId"].Should().Be(TestDataFactory.TestUserId.ToString());
        responseDict["isInternal"].Should().Be(false);
        responseDict["message"].Should().Be("Comment added successfully");

        _mockTicketService.Verify(x => x.GetTicketByIdAsync(ticketId), Times.Once);
        _mockTicketService.Verify(x => x.AddCommentAsync(
            ticketId, 
            "This is a public comment", 
            TestDataFactory.TestUserId.ToString(), 
            false), Times.Once);
    }

    [Fact]
    public async Task AddComment_ValidInternalNote_ShouldReturnCreatedComment()
    {
        // Arrange
        SetupControllerContext(TestDataFactory.TestAgentId.ToString(), isAgent: true);
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.AddCommentRequest("This is an internal note", isInternal: true);

        // Act
        var result = await _controller.AddComment(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseValue = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = responseValue.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(responseValue));
        
        responseDict["ticketId"].Should().Be(ticketId);
        responseDict["body"].Should().Be("This is an internal note");
        responseDict["authorUserId"].Should().Be(TestDataFactory.TestAgentId.ToString());
        responseDict["isInternal"].Should().Be(true);
        responseDict["message"].Should().Be("Comment added successfully");

        _mockTicketService.Verify(x => x.AddCommentAsync(
            ticketId, 
            "This is an internal note", 
            TestDataFactory.TestAgentId.ToString(), 
            true), Times.Once);
    }

    [Fact]
    public async Task AddComment_NonExistentTicket_ShouldReturnNotFound()
    {
        // Arrange
        SetupControllerContext();
        var nonExistentId = Guid.NewGuid();
        var request = TestDataFactory.AddCommentRequest("Comment on non-existent ticket");

        // Setup mock to return null for non-existent ticket
        _mockTicketService.Setup(x => x.GetTicketByIdAsync(nonExistentId))
            .ReturnsAsync((Ticket?)null);

        // Act
        var result = await _controller.AddComment(nonExistentId, request);

        // Assert
        result.Should().NotBeNull();
        var notFoundResult = result.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().Be($"Ticket with ID {nonExistentId} not found");

        _mockTicketService.Verify(x => x.GetTicketByIdAsync(nonExistentId), Times.Once);
        _mockTicketService.Verify(x => x.AddCommentAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
    }

    [Fact]
    public async Task AddComment_InvalidModelState_ShouldReturnBadRequest()
    {
        // Arrange
        SetupControllerContext();
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.AddCommentRequest("");
        _controller.ModelState.AddModelError("Content", "Content is required");

        // Act
        var result = await _controller.AddComment(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        
        _mockTicketService.Verify(x => x.AddCommentAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
    }

    [Fact]
    public async Task AddComment_ServiceThrowsArgumentException_ShouldReturnNotFound()
    {
        // Arrange
        SetupControllerContext();
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.AddCommentRequest("Comment content");

        _mockTicketService.Setup(x => x.AddCommentAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()))
            .ThrowsAsync(new ArgumentException("Ticket not found"));

        // Act
        var result = await _controller.AddComment(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task AddComment_ServiceThrowsGeneralException_ShouldReturnInternalServerError()
    {
        // Arrange
        SetupControllerContext();
        var ticketId = TestDataFactory.TestTicketId;
        var request = TestDataFactory.AddCommentRequest("Comment content");

        _mockTicketService.Setup(x => x.AddCommentAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.AddComment(ticketId, request);

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetComments Tests

    [Fact]
    public async Task GetComments_AsRegularUser_ShouldReturnOnlyPublicComments()
    {
        // Arrange
        SetupControllerContext(TestDataFactory.TestUserId.ToString(), isAgent: false);
        var ticketId = TestDataFactory.TestTicketId;

        // Setup service to return both public and internal comments
        var comments = new List<Comment>
        {
            TestDataFactory.CreateTestComment(
                id: Guid.NewGuid(),
                ticketId: ticketId,
                body: "Public comment",
                isInternal: false),
            TestDataFactory.CreateTestComment(
                id: Guid.NewGuid(),
                ticketId: ticketId,
                body: "Internal note",
                isInternal: true),
            TestDataFactory.CreateTestComment(
                id: Guid.NewGuid(),
                ticketId: ticketId,
                body: "Another public comment",
                isInternal: false)
        };

        _mockTicketService.Setup(x => x.GetTicketCommentsAsync(ticketId))
            .ReturnsAsync(comments);

        // Act
        var result = await _controller.GetComments(ticketId);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseComments = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        responseComments.Should().HaveCount(2); // Only public comments should be returned
        
        foreach (var comment in responseComments)
        {
            var commentDict = comment.GetType().GetProperties()
                .ToDictionary(p => p.Name, p => p.GetValue(comment));
            commentDict["isInternal"].Should().Be(false);
        }

        _mockTicketService.Verify(x => x.GetTicketCommentsAsync(ticketId), Times.Once);
        _mockTicketService.Verify(x => x.IsUserAgentOrAdminAsync(TestDataFactory.TestUserId.ToString()), Times.Once);
    }

    [Fact]
    public async Task GetComments_AsAgent_ShouldReturnAllComments()
    {
        // Arrange
        SetupControllerContext(TestDataFactory.TestAgentId.ToString(), isAgent: true);
        var ticketId = TestDataFactory.TestTicketId;

        // Setup service to return both public and internal comments
        var comments = new List<Comment>
        {
            TestDataFactory.CreateTestComment(
                id: Guid.NewGuid(),
                ticketId: ticketId,
                body: "Public comment",
                isInternal: false),
            TestDataFactory.CreateTestComment(
                id: Guid.NewGuid(),
                ticketId: ticketId,
                body: "Internal note",
                isInternal: true),
            TestDataFactory.CreateTestComment(
                id: Guid.NewGuid(),
                ticketId: ticketId,
                body: "Another internal note",
                isInternal: true)
        };

        _mockTicketService.Setup(x => x.GetTicketCommentsAsync(ticketId))
            .ReturnsAsync(comments);

        // Act
        var result = await _controller.GetComments(ticketId);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseComments = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        responseComments.Should().HaveCount(3); // All comments should be returned for agents
        
        // Verify that internal comments are included
        var internalCommentsCount = 0;
        foreach (var comment in responseComments)
        {
            var commentDict = comment.GetType().GetProperties()
                .ToDictionary(p => p.Name, p => p.GetValue(comment));
            if ((bool)commentDict["isInternal"]!)
                internalCommentsCount++;
        }
        internalCommentsCount.Should().Be(2);

        _mockTicketService.Verify(x => x.GetTicketCommentsAsync(ticketId), Times.Once);
        _mockTicketService.Verify(x => x.IsUserAgentOrAdminAsync(TestDataFactory.TestAgentId.ToString()), Times.Once);
    }

    [Fact]
    public async Task GetComments_NoComments_ShouldReturnEmptyList()
    {
        // Arrange
        SetupControllerContext();
        var ticketId = TestDataFactory.TestTicketId;

        _mockTicketService.Setup(x => x.GetTicketCommentsAsync(ticketId))
            .ReturnsAsync(new List<Comment>());

        // Act
        var result = await _controller.GetComments(ticketId);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var responseComments = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        responseComments.Should().BeEmpty();

        _mockTicketService.Verify(x => x.GetTicketCommentsAsync(ticketId), Times.Once);
    }

    [Fact]
    public async Task GetComments_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        SetupControllerContext();
        var ticketId = TestDataFactory.TestTicketId;

        _mockTicketService.Setup(x => x.GetTicketCommentsAsync(ticketId))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.GetComments(ticketId);

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region Internal Note Visibility Integration Tests

    [Theory]
    [InlineData(false, 1)] // Regular user should see 1 public comment
    [InlineData(true, 3)]  // Agent should see all 3 comments (1 public + 2 internal)
    public async Task CommentVisibility_BasedOnUserRole_ShouldFilterCorrectly(bool isAgent, int expectedCommentCount)
    {
        // Arrange
        var userId = isAgent ? TestDataFactory.TestAgentId.ToString() : TestDataFactory.TestUserId.ToString();
        SetupControllerContext(userId, isAgent);
        var ticketId = TestDataFactory.TestTicketId;

        // Create mixed comments
        var mixedComments = new List<Comment>
        {
            TestDataFactory.CreateTestComment(
                id: Guid.NewGuid(),
                ticketId: ticketId,
                body: "Public comment visible to all",
                isInternal: false),
            TestDataFactory.CreateTestComment(
                id: Guid.NewGuid(),
                ticketId: ticketId,
                body: "Internal note - agents only",
                isInternal: true),
            TestDataFactory.CreateTestComment(
                id: Guid.NewGuid(),
                ticketId: ticketId,
                body: "Another internal note - agents only",
                isInternal: true)
        };

        _mockTicketService.Setup(x => x.GetTicketCommentsAsync(ticketId))
            .ReturnsAsync(mixedComments);

        // Act
        var result = await _controller.GetComments(ticketId);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var responseComments = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        responseComments.Should().HaveCount(expectedCommentCount);

        _mockTicketService.Verify(x => x.IsUserAgentOrAdminAsync(userId), Times.Once);
    }

    [Fact]
    public async Task AddComment_ThenGetComments_ShouldMaintainInternalNoteVisibility()
    {
        // Arrange - Setup as agent
        SetupControllerContext(TestDataFactory.TestAgentId.ToString(), isAgent: true);
        var ticketId = TestDataFactory.TestTicketId;

        // Step 1: Add an internal note
        var addRequest = TestDataFactory.AddCommentRequest("Confidential internal note", isInternal: true);
        
        // Act 1: Add the internal comment
        var addResult = await _controller.AddComment(ticketId, addRequest);

        // Assert 1: Comment added successfully
        addResult.Should().NotBeNull();
        var addOkResult = addResult.Result.Should().BeOfType<OkObjectResult>().Subject;
        addOkResult.StatusCode.Should().Be(200);

        // Step 2: Switch to regular user context
        SetupControllerContext(TestDataFactory.TestUserId.ToString(), isAgent: false);

        // Act 2: Get comments as regular user
        var getResult = await _controller.GetComments(ticketId);

        // Assert 2: Internal note should not be visible to regular user
        getResult.Should().NotBeNull();
        var getOkResult = getResult.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var responseComments = getOkResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        
        // Should only see public comments (the mock returns 1 public + 1 internal, but internal should be filtered out)
        var publicCommentsOnly = responseComments.Where(comment =>
        {
            var commentDict = comment.GetType().GetProperties()
                .ToDictionary(p => p.Name, p => p.GetValue(comment));
            return !(bool)commentDict["isInternal"]!;
        }).ToList();
        
        publicCommentsOnly.Should().HaveCount(responseComments.Count); // All visible comments should be public
    }

    #endregion
}