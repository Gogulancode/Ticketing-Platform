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
/// Integration tests for TicketsController filtering and statistics functionality
/// Tests cover GetMyTickets, GetTickets filtering, GetStatistics, and CalculateOverdueTickets
/// </summary>
public class TicketsControllerFilteringStatisticsTests
{
    private readonly Mock<ITicketService> _mockTicketService;
    private readonly Mock<ILogger<TicketsController>> _mockLogger;
    private readonly TicketsController _controller;

    public TicketsControllerFilteringStatisticsTests()
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

    #region GetTickets Filtering Tests

    [Fact]
    public async Task GetTickets_NoFilters_ShouldReturnAllTickets()
    {
        // Arrange
        // Mock returns 3 tickets by default

        // Act
        var result = await _controller.GetTickets();

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        tickets.Should().HaveCount(3);

        _mockTicketService.Verify(x => x.GetFilteredTicketsAsync(null, null, null), Times.Once);
    }

    [Theory]
    [InlineData(TicketStatus.Open)]
    [InlineData(TicketStatus.InProgress)]
    [InlineData(TicketStatus.Resolved)]
    [InlineData(TicketStatus.Closed)]
    public async Task GetTickets_FilterByStatus_ShouldReturnFilteredTickets(TicketStatus status)
    {
        // Arrange
        // Setup mock to return filtered results based on status
        var filteredTickets = new List<Ticket>
        {
            TestDataFactory.CreateTestTicket(id: Guid.NewGuid(), status: status)
        };
        
        _mockTicketService.Setup(x => x.GetFilteredTicketsAsync(status, null, null))
            .ReturnsAsync(filteredTickets);

        // Act
        var result = await _controller.GetTickets(status: status);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        tickets.Should().HaveCount(1);
        
        var ticketDict = tickets[0].GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(tickets[0]));
        ticketDict["status"].Should().Be((int)status);

        _mockTicketService.Verify(x => x.GetFilteredTicketsAsync(status, null, null), Times.Once);
    }

    [Theory]
    [InlineData(TicketPriority.Low)]
    [InlineData(TicketPriority.Medium)]
    [InlineData(TicketPriority.High)]
    [InlineData(TicketPriority.Critical)]
    public async Task GetTickets_FilterByPriority_ShouldReturnFilteredTickets(TicketPriority priority)
    {
        // Arrange
        var filteredTickets = new List<Ticket>
        {
            TestDataFactory.CreateTestTicket(id: Guid.NewGuid(), priority: priority)
        };
        
        _mockTicketService.Setup(x => x.GetFilteredTicketsAsync(null, priority, null))
            .ReturnsAsync(filteredTickets);

        // Act
        var result = await _controller.GetTickets(priority: priority);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        tickets.Should().HaveCount(1);
        
        var ticketDict = tickets[0].GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(tickets[0]));
        ticketDict["priority"].Should().Be((int)priority);

        _mockTicketService.Verify(x => x.GetFilteredTicketsAsync(null, priority, null), Times.Once);
    }

    [Theory]
    [InlineData(TicketCategory.Technical)]
    [InlineData(TicketCategory.Billing)]
    [InlineData(TicketCategory.General)]
    public async Task GetTickets_FilterByCategory_ShouldReturnFilteredTickets(TicketCategory category)
    {
        // Arrange
        var filteredTickets = new List<Ticket>
        {
            TestDataFactory.CreateTestTicket(id: Guid.NewGuid(), category: category)
        };
        
        _mockTicketService.Setup(x => x.GetFilteredTicketsAsync(null, null, category))
            .ReturnsAsync(filteredTickets);

        // Act
        var result = await _controller.GetTickets(category: category);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        tickets.Should().HaveCount(1);
        
        var ticketDict = tickets[0].GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(tickets[0]));
        ticketDict["category"].Should().Be((int)category);

        _mockTicketService.Verify(x => x.GetFilteredTicketsAsync(null, null, category), Times.Once);
    }

    [Fact]
    public async Task GetTickets_CombinedFilters_ShouldReturnCorrectlyFilteredTickets()
    {
        // Arrange
        var status = TicketStatus.InProgress;
        var priority = TicketPriority.High;
        var category = TicketCategory.Technical;
        
        var filteredTickets = new List<Ticket>
        {
            TestDataFactory.CreateTestTicket(
                id: Guid.NewGuid(), 
                status: status,
                priority: priority,
                category: category)
        };
        
        _mockTicketService.Setup(x => x.GetFilteredTicketsAsync(status, priority, category))
            .ReturnsAsync(filteredTickets);

        // Act
        var result = await _controller.GetTickets(status: status, priority: priority, category: category);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        tickets.Should().HaveCount(1);
        
        var ticketDict = tickets[0].GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(tickets[0]));
        ticketDict["status"].Should().Be((int)status);
        ticketDict["priority"].Should().Be((int)priority);
        ticketDict["category"].Should().Be((int)category);

        _mockTicketService.Verify(x => x.GetFilteredTicketsAsync(status, priority, category), Times.Once);
    }

    [Fact]
    public async Task GetTickets_NoMatchingTickets_ShouldReturnEmptyList()
    {
        // Arrange
        _mockTicketService.Setup(x => x.GetFilteredTicketsAsync(It.IsAny<TicketStatus?>(), It.IsAny<TicketPriority?>(), It.IsAny<TicketCategory?>()))
            .ReturnsAsync(new List<Ticket>());

        // Act
        var result = await _controller.GetTickets(status: TicketStatus.Closed);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        tickets.Should().BeEmpty();
    }

    [Fact]
    public async Task GetTickets_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        _mockTicketService.Setup(x => x.GetFilteredTicketsAsync(It.IsAny<TicketStatus?>(), It.IsAny<TicketPriority?>(), It.IsAny<TicketCategory?>()))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.GetTickets();

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetMyTickets Tests

    [Fact]
    public async Task GetMyTickets_ValidUser_ShouldReturnUserTickets()
    {
        // Arrange
        SetupControllerContext(TestDataFactory.TestUserId.ToString());
        
        // Act
        var result = await _controller.GetMyTickets();

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        tickets.Should().HaveCount(1); // Mock returns 1 ticket for test user
        
        var ticketDict = tickets[0].GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(tickets[0]));
        ticketDict["createdByUserId"].Should().Be(TestDataFactory.TestUserId.ToString());

        _mockTicketService.Verify(x => x.GetTicketsByUserAsync(TestDataFactory.TestUserId.ToString()), Times.Once);
    }

    [Fact]
    public async Task GetMyTickets_UserWithNoTickets_ShouldReturnEmptyList()
    {
        // Arrange
        var userWithNoTickets = Guid.NewGuid().ToString();
        SetupControllerContext(userWithNoTickets);
        
        _mockTicketService.Setup(x => x.GetTicketsByUserAsync(userWithNoTickets))
            .ReturnsAsync(new List<Ticket>());

        // Act
        var result = await _controller.GetMyTickets();

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        tickets.Should().BeEmpty();

        _mockTicketService.Verify(x => x.GetTicketsByUserAsync(userWithNoTickets), Times.Once);
    }

    [Fact]
    public async Task GetMyTickets_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        _mockTicketService.Setup(x => x.GetTicketsByUserAsync(It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.GetMyTickets();

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetStatistics Tests

    [Fact]
    public async Task GetStatistics_ValidRequest_ShouldReturnStatistics()
    {
        // Arrange
        var expectedStats = new
        {
            totalTickets = 10,
            openTickets = 5,
            inProgressTickets = 3,
            resolvedTickets = 2,
            overdueTickets = 1
        };

        _mockTicketService.Setup(x => x.GetTicketStatisticsAsync())
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetStatistics();

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var stats = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var statsDict = stats.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(stats));
        
        statsDict["totalTickets"].Should().Be(10);
        statsDict["openTickets"].Should().Be(5);
        statsDict["inProgressTickets"].Should().Be(3);
        statsDict["resolvedTickets"].Should().Be(2);
        statsDict["overdueTickets"].Should().Be(1);

        _mockTicketService.Verify(x => x.GetTicketStatisticsAsync(), Times.Once);
    }

    [Fact]
    public async Task GetStatistics_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        _mockTicketService.Setup(x => x.GetTicketStatisticsAsync())
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.GetStatistics();

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region CalculateOverdueTickets Tests

    [Fact]
    public async Task CalculateOverdueTickets_ValidRequest_ShouldReturnSuccessMessage()
    {
        // Arrange
        // Mock is already set up to return Task.CompletedTask

        // Act
        var result = await _controller.CalculateOverdueTickets();

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        
        var response = okResult.Value.Should().BeAssignableTo<object>().Subject;
        var responseDict = response.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(response));
        
        responseDict["message"].Should().Be("Overdue tickets calculated successfully");

        _mockTicketService.Verify(x => x.CalculateOverdueTicketsAsync(), Times.Once);
    }

    [Fact]
    public async Task CalculateOverdueTickets_ServiceThrowsException_ShouldReturnInternalServerError()
    {
        // Arrange
        _mockTicketService.Setup(x => x.CalculateOverdueTicketsAsync())
            .ThrowsAsync(new InvalidOperationException("Service error"));

        // Act
        var result = await _controller.CalculateOverdueTickets();

        // Assert
        result.Should().NotBeNull();
        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region Response DTO Structure Tests

    [Fact]
    public async Task GetTickets_ResponseStructure_ShouldIncludeAllRequiredFields()
    {
        // Arrange
        // Mock returns default tickets

        // Act
        var result = await _controller.GetTickets();

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        tickets.Should().NotBeEmpty();
        
        var ticketDict = tickets[0].GetType().GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(tickets[0]));
        
        // Verify required fields are present
        ticketDict.Should().ContainKey("id");
        ticketDict.Should().ContainKey("title");
        ticketDict.Should().ContainKey("description");
        ticketDict.Should().ContainKey("category");
        ticketDict.Should().ContainKey("priority");
        ticketDict.Should().ContainKey("status");
        ticketDict.Should().ContainKey("source");
        ticketDict.Should().ContainKey("createdByUserId");
        ticketDict.Should().ContainKey("assignedToUserId");
        ticketDict.Should().ContainKey("createdAt");
        ticketDict.Should().ContainKey("updatedAt");
        ticketDict.Should().ContainKey("isOverdue");
        ticketDict.Should().ContainKey("commentCount");
        ticketDict.Should().ContainKey("attachmentCount");
    }

    [Fact]
    public async Task GetMyTickets_ResponseStructure_ShouldMatchGetTicketsStructure()
    {
        // Arrange
        SetupControllerContext(TestDataFactory.TestUserId.ToString());

        // Act
        var result = await _controller.GetMyTickets();

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        
        var tickets = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject.ToList();
        
        if (tickets.Any())
        {
            var ticketDict = tickets[0].GetType().GetProperties()
                .ToDictionary(p => p.Name, p => p.GetValue(tickets[0]));
            
            // Should have same structure as GetTickets
            ticketDict.Should().ContainKey("id");
            ticketDict.Should().ContainKey("title");
            ticketDict.Should().ContainKey("description");
            ticketDict.Should().ContainKey("category");
            ticketDict.Should().ContainKey("priority");
            ticketDict.Should().ContainKey("status");
            ticketDict.Should().ContainKey("createdByUserId");
            ticketDict.Should().ContainKey("assignedToUserId");
            ticketDict.Should().ContainKey("commentCount");
            ticketDict.Should().ContainKey("attachmentCount");
        }
    }

    #endregion

    #region Filtering Integration Tests

    [Fact]
    public async Task FilteringWorkflow_MultipleFiltersAndUserTickets_ShouldWorkIndependently()
    {
        // Test that filtering all tickets and getting user tickets work independently
        
        // Step 1: Get all tickets with filters
        var allTicketsResult = await _controller.GetTickets(
            status: TicketStatus.Open,
            priority: TicketPriority.High);
        
        allTicketsResult.Should().NotBeNull();
        allTicketsResult.Result.Should().BeOfType<OkObjectResult>();

        // Step 2: Get user-specific tickets
        var userTicketsResult = await _controller.GetMyTickets();
        
        userTicketsResult.Should().NotBeNull();
        userTicketsResult.Result.Should().BeOfType<OkObjectResult>();

        // Step 3: Get statistics
        var statsResult = await _controller.GetStatistics();
        
        statsResult.Should().NotBeNull();
        statsResult.Should().BeOfType<OkObjectResult>();

        // Verify all service methods were called correctly
        _mockTicketService.Verify(x => x.GetFilteredTicketsAsync(TicketStatus.Open, TicketPriority.High, null), Times.Once);
        _mockTicketService.Verify(x => x.GetTicketsByUserAsync(It.IsAny<string>()), Times.Once);
        _mockTicketService.Verify(x => x.GetTicketStatisticsAsync(), Times.Once);
    }

    #endregion
}