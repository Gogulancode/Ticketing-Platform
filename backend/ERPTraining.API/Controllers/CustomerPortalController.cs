using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ERPTraining.Core.DTOs.CustomerPortal;
using ERPTraining.Core.Interfaces.CustomerPortal;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/portal")]
    public class CustomerPortalController : ControllerBase
    {
        private readonly ICustomerPortalService _portalService;

        public CustomerPortalController(ICustomerPortalService portalService)
        {
            _portalService = portalService;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        // ==================== Customer Dashboard ====================

        /// <summary>
        /// Get customer dashboard with profile, tickets, announcements, and featured content
        /// </summary>
        [HttpGet("dashboard")]
        [Authorize]
        public async Task<ActionResult<CustomerDashboardDto>> GetDashboard()
        {
            var userId = GetUserId();
            var dashboard = await _portalService.GetCustomerDashboardAsync(userId);
            return Ok(dashboard);
        }

        // ==================== Customer Profile ====================

        /// <summary>
        /// Get current user's profile
        /// </summary>
        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<CustomerProfileDto>> GetProfile()
        {
            var userId = GetUserId();
            var profile = await _portalService.GetCustomerProfileAsync(userId);
            return Ok(profile);
        }

        /// <summary>
        /// Update current user's profile
        /// </summary>
        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<CustomerProfileDto>> UpdateProfile([FromBody] UpdateCustomerProfileDto dto)
        {
            var userId = GetUserId();
            var profile = await _portalService.CreateOrUpdateProfileAsync(userId, dto);
            return Ok(profile);
        }

        // ==================== Customer Tickets ====================

        /// <summary>
        /// Get customer's ticket summary
        /// </summary>
        [HttpGet("tickets/summary")]
        [Authorize]
        public async Task<ActionResult<CustomerTicketSummaryDto>> GetTicketSummary()
        {
            var userId = GetUserId();
            var summary = await _portalService.GetCustomerTicketSummaryAsync(userId);
            return Ok(summary);
        }

        /// <summary>
        /// Get customer's tickets with pagination
        /// </summary>
        [HttpGet("tickets")]
        [Authorize]
        public async Task<ActionResult<List<CustomerTicketDto>>> GetTickets(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null)
        {
            var userId = GetUserId();
            var tickets = await _portalService.GetCustomerTicketsAsync(userId, page, pageSize, status);
            return Ok(tickets);
        }

        // ==================== Knowledge Base - Public ====================

        /// <summary>
        /// Get all knowledge base categories
        /// </summary>
        [HttpGet("kb/categories")]
        [AllowAnonymous]
        public async Task<ActionResult<List<KnowledgeBaseCategoryDto>>> GetKnowledgeBaseCategories()
        {
            var categories = await _portalService.GetKnowledgeBaseCategoriesAsync();
            return Ok(categories);
        }

        /// <summary>
        /// Get a specific category by slug
        /// </summary>
        [HttpGet("kb/categories/{slug}")]
        [AllowAnonymous]
        public async Task<ActionResult<KnowledgeBaseCategoryDto>> GetCategoryBySlug(string slug)
        {
            var category = await _portalService.GetKnowledgeBaseCategoryBySlugAsync(slug);
            if (category == null) return NotFound();
            return Ok(category);
        }

        /// <summary>
        /// Get published articles with optional category filter
        /// </summary>
        [HttpGet("kb/articles")]
        [AllowAnonymous]
        public async Task<ActionResult<List<KnowledgeBaseArticleListDto>>> GetArticles(
            [FromQuery] int? categoryId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var articles = await _portalService.GetPublishedArticlesAsync(categoryId, page, pageSize);
            return Ok(articles);
        }

        /// <summary>
        /// Get featured articles
        /// </summary>
        [HttpGet("kb/articles/featured")]
        [AllowAnonymous]
        public async Task<ActionResult<List<KnowledgeBaseArticleListDto>>> GetFeaturedArticles([FromQuery] int limit = 5)
        {
            var articles = await _portalService.GetFeaturedArticlesAsync(limit);
            return Ok(articles);
        }

        /// <summary>
        /// Get article by slug
        /// </summary>
        [HttpGet("kb/articles/{slug}")]
        [AllowAnonymous]
        public async Task<ActionResult<KnowledgeBaseArticleDto>> GetArticleBySlug(string slug)
        {
            var article = await _portalService.GetArticleBySlugAsync(slug);
            if (article == null) return NotFound();

            // Record view
            await _portalService.RecordArticleViewAsync(article.Id);

            return Ok(article);
        }

        /// <summary>
        /// Submit feedback for an article
        /// </summary>
        [HttpPost("kb/articles/{articleId}/feedback")]
        [AllowAnonymous]
        public async Task<ActionResult> SubmitArticleFeedback(int articleId, [FromBody] ArticleFeedbackDto dto)
        {
            dto.ArticleId = articleId;
            var userId = User.Identity?.IsAuthenticated == true ? GetUserId() : null;
            var result = await _portalService.SubmitArticleFeedbackAsync(userId, dto);
            if (!result) return NotFound();
            return Ok();
        }

        // ==================== Knowledge Base - Admin ====================

        /// <summary>
        /// Create a new category (Admin only)
        /// </summary>
        [HttpPost("kb/categories")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult<KnowledgeBaseCategoryDto>> CreateCategory([FromBody] CreateKnowledgeBaseCategoryDto dto)
        {
            var category = await _portalService.CreateKnowledgeBaseCategoryAsync(dto);
            return CreatedAtAction(nameof(GetCategoryBySlug), new { slug = category.Slug }, category);
        }

        /// <summary>
        /// Update a category (Admin only)
        /// </summary>
        [HttpPut("kb/categories/{id}")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult<KnowledgeBaseCategoryDto>> UpdateCategory(int id, [FromBody] CreateKnowledgeBaseCategoryDto dto)
        {
            var category = await _portalService.UpdateKnowledgeBaseCategoryAsync(id, dto);
            if (category == null) return NotFound();
            return Ok(category);
        }

        /// <summary>
        /// Delete a category (Admin only)
        /// </summary>
        [HttpDelete("kb/categories/{id}")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult> DeleteCategory(int id)
        {
            var result = await _portalService.DeleteKnowledgeBaseCategoryAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        /// <summary>
        /// Create a new article (Admin only)
        /// </summary>
        [HttpPost("kb/articles")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult<KnowledgeBaseArticleDto>> CreateArticle([FromBody] CreateKnowledgeBaseArticleDto dto)
        {
            var userId = GetUserId();
            var article = await _portalService.CreateArticleAsync(userId, dto);
            return CreatedAtAction(nameof(GetArticleBySlug), new { slug = article.Slug }, article);
        }

        /// <summary>
        /// Update an article (Admin only)
        /// </summary>
        [HttpPut("kb/articles/{id}")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult<KnowledgeBaseArticleDto>> UpdateArticle(int id, [FromBody] UpdateKnowledgeBaseArticleDto dto)
        {
            var article = await _portalService.UpdateArticleAsync(id, dto);
            if (article == null) return NotFound();
            return Ok(article);
        }

        /// <summary>
        /// Delete an article (Admin only)
        /// </summary>
        [HttpDelete("kb/articles/{id}")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult> DeleteArticle(int id)
        {
            var result = await _portalService.DeleteArticleAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        // ==================== FAQs - Public ====================

        /// <summary>
        /// Get active FAQs
        /// </summary>
        [HttpGet("faqs")]
        [AllowAnonymous]
        public async Task<ActionResult<List<FAQDto>>> GetFAQs([FromQuery] int? categoryId = null)
        {
            var faqs = await _portalService.GetActiveFAQsAsync(categoryId);
            return Ok(faqs);
        }

        /// <summary>
        /// Get featured FAQs
        /// </summary>
        [HttpGet("faqs/featured")]
        [AllowAnonymous]
        public async Task<ActionResult<List<FAQDto>>> GetFeaturedFAQs([FromQuery] int limit = 5)
        {
            var faqs = await _portalService.GetFeaturedFAQsAsync(limit);
            return Ok(faqs);
        }

        /// <summary>
        /// Get FAQ by ID
        /// </summary>
        [HttpGet("faqs/{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<FAQDto>> GetFAQ(int id)
        {
            var faq = await _portalService.GetFAQByIdAsync(id);
            if (faq == null) return NotFound();

            await _portalService.RecordFAQViewAsync(id);
            return Ok(faq);
        }

        // ==================== FAQs - Admin ====================

        /// <summary>
        /// Create a new FAQ (Admin only)
        /// </summary>
        [HttpPost("faqs")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult<FAQDto>> CreateFAQ([FromBody] CreateFAQDto dto)
        {
            var faq = await _portalService.CreateFAQAsync(dto);
            return CreatedAtAction(nameof(GetFAQ), new { id = faq.Id }, faq);
        }

        /// <summary>
        /// Update a FAQ (Admin only)
        /// </summary>
        [HttpPut("faqs/{id}")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult<FAQDto>> UpdateFAQ(int id, [FromBody] CreateFAQDto dto)
        {
            var faq = await _portalService.UpdateFAQAsync(id, dto);
            if (faq == null) return NotFound();
            return Ok(faq);
        }

        /// <summary>
        /// Delete a FAQ (Admin only)
        /// </summary>
        [HttpDelete("faqs/{id}")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult> DeleteFAQ(int id)
        {
            var result = await _portalService.DeleteFAQAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        // ==================== Announcements ====================

        /// <summary>
        /// Get active announcements
        /// </summary>
        [HttpGet("announcements")]
        [AllowAnonymous]
        public async Task<ActionResult<List<PortalAnnouncementDto>>> GetAnnouncements()
        {
            var announcements = await _portalService.GetActiveAnnouncementsAsync();
            return Ok(announcements);
        }

        /// <summary>
        /// Create announcement (Admin only)
        /// </summary>
        [HttpPost("announcements")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PortalAnnouncementDto>> CreateAnnouncement([FromBody] CreatePortalAnnouncementDto dto)
        {
            var userId = GetUserId();
            var announcement = await _portalService.CreateAnnouncementAsync(userId, dto);
            return CreatedAtAction(nameof(GetAnnouncements), announcement);
        }

        /// <summary>
        /// Update announcement (Admin only)
        /// </summary>
        [HttpPut("announcements/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PortalAnnouncementDto>> UpdateAnnouncement(int id, [FromBody] CreatePortalAnnouncementDto dto)
        {
            var announcement = await _portalService.UpdateAnnouncementAsync(id, dto);
            if (announcement == null) return NotFound();
            return Ok(announcement);
        }

        /// <summary>
        /// Delete announcement (Admin only)
        /// </summary>
        [HttpDelete("announcements/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteAnnouncement(int id)
        {
            var result = await _portalService.DeleteAnnouncementAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        // ==================== System Status - Public ====================

        /// <summary>
        /// Get system status summary
        /// </summary>
        [HttpGet("status")]
        [AllowAnonymous]
        public async Task<ActionResult<SystemStatusSummaryDto>> GetSystemStatus()
        {
            var status = await _portalService.GetSystemStatusAsync();
            return Ok(status);
        }

        /// <summary>
        /// Get all services status
        /// </summary>
        [HttpGet("status/services")]
        [AllowAnonymous]
        public async Task<ActionResult<List<ServiceStatusDto>>> GetServices()
        {
            var services = await _portalService.GetAllServicesAsync();
            return Ok(services);
        }

        /// <summary>
        /// Get active incidents
        /// </summary>
        [HttpGet("status/incidents")]
        [AllowAnonymous]
        public async Task<ActionResult<List<ServiceIncidentDto>>> GetActiveIncidents()
        {
            var incidents = await _portalService.GetActiveIncidentsAsync();
            return Ok(incidents);
        }

        /// <summary>
        /// Get incident details
        /// </summary>
        [HttpGet("status/incidents/{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ServiceIncidentDto>> GetIncident(int id)
        {
            var incident = await _portalService.GetIncidentByIdAsync(id);
            if (incident == null) return NotFound();
            return Ok(incident);
        }

        // ==================== System Status - Admin ====================

        /// <summary>
        /// Create a new service (Admin only)
        /// </summary>
        [HttpPost("status/services")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServiceStatusDto>> CreateService([FromBody] CreateServiceRequest request)
        {
            var service = await _portalService.CreateServiceAsync(request.Name, request.Description);
            return Ok(service);
        }

        /// <summary>
        /// Update service status (Admin only)
        /// </summary>
        [HttpPut("status/services/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServiceStatusDto>> UpdateServiceStatus(
            int id,
            [FromBody] UpdateServiceStatusRequest request)
        {
            var service = await _portalService.UpdateServiceStatusAsync(id, request.Status, request.Message);
            if (service == null) return NotFound();
            return Ok(service);
        }

        /// <summary>
        /// Create a new incident (Admin only)
        /// </summary>
        [HttpPost("status/incidents")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServiceIncidentDto>> CreateIncident([FromBody] CreateServiceIncidentDto dto)
        {
            var userId = GetUserId();
            var incident = await _portalService.CreateIncidentAsync(userId, dto);
            return CreatedAtAction(nameof(GetIncident), new { id = incident.Id }, incident);
        }

        /// <summary>
        /// Add incident update (Admin only)
        /// </summary>
        [HttpPost("status/incidents/{id}/updates")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServiceIncidentDto>> AddIncidentUpdate(int id, [FromBody] AddIncidentUpdateDto dto)
        {
            var userId = GetUserId();
            var incident = await _portalService.AddIncidentUpdateAsync(id, userId, dto);
            if (incident == null) return NotFound();
            return Ok(incident);
        }

        /// <summary>
        /// Resolve an incident (Admin only)
        /// </summary>
        [HttpPost("status/incidents/{id}/resolve")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ResolveIncident(int id, [FromBody] ResolveIncidentRequest? request)
        {
            var userId = GetUserId();
            var result = await _portalService.ResolveIncidentAsync(id, userId, request?.Message);
            if (!result) return NotFound();
            return Ok();
        }

        // ==================== Contact Form ====================

        /// <summary>
        /// Submit contact form (Public)
        /// </summary>
        [HttpPost("contact")]
        [AllowAnonymous]
        public async Task<ActionResult<ContactSubmissionDto>> SubmitContactForm([FromBody] CreateContactSubmissionDto dto)
        {
            var submission = await _portalService.CreateContactSubmissionAsync(dto);
            return Ok(submission);
        }

        /// <summary>
        /// Get contact submissions (Admin only)
        /// </summary>
        [HttpGet("contact/submissions")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult<List<ContactSubmissionDto>>> GetContactSubmissions(
            [FromQuery] bool? processed = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var submissions = await _portalService.GetContactSubmissionsAsync(processed, page, pageSize);
            return Ok(submissions);
        }

        /// <summary>
        /// Convert contact submission to ticket (Admin only)
        /// </summary>
        [HttpPost("contact/submissions/{id}/convert-to-ticket")]
        [Authorize(Roles = "Admin,Support")]
        public async Task<ActionResult> ConvertToTicket(int id)
        {
            var userId = GetUserId();
            var ticketId = await _portalService.ConvertContactToTicketAsync(id, userId);
            if (ticketId == null) return BadRequest("Unable to convert submission");
            return Ok(new { ticketId });
        }

        // ==================== Search ====================

        /// <summary>
        /// Search knowledge base and FAQs
        /// </summary>
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<PortalSearchResultDto>> Search(
            [FromQuery] string q,
            [FromQuery] int maxResults = 10)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest("Search query is required");

            var results = await _portalService.SearchAsync(q, maxResults);
            return Ok(results);
        }
    }

    // Request DTOs
    public class CreateServiceRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdateServiceStatusRequest
    {
        public int Status { get; set; }
        public string? Message { get; set; }
    }

    public class ResolveIncidentRequest
    {
        public string? Message { get; set; }
    }
}
