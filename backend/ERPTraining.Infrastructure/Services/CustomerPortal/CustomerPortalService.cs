using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.DTOs.CustomerPortal;
using ERPTraining.Core.Entities.CustomerPortal;
using ERPTraining.Core.Interfaces.CustomerPortal;
using ERPTraining.Infrastructure.Data;

namespace ERPTraining.Infrastructure.Services.CustomerPortal
{
    public class CustomerPortalService : ICustomerPortalService
    {
        private readonly ApplicationDbContext _context;

        public CustomerPortalService(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==================== Customer Profile ====================

        public async Task<CustomerProfileDto?> GetCustomerProfileAsync(string userId)
        {
            var profile = await _context.CustomerProfiles
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return null;

            return MapToCustomerProfileDto(profile);
        }

        public async Task<CustomerProfileDto> CreateOrUpdateProfileAsync(string userId, UpdateCustomerProfileDto dto)
        {
            var profile = await _context.CustomerProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                profile = new CustomerProfile { UserId = userId };
                _context.CustomerProfiles.Add(profile);
            }

            if (dto.CompanyName != null) profile.CompanyName = dto.CompanyName;
            if (dto.JobTitle != null) profile.JobTitle = dto.JobTitle;
            if (dto.Phone != null) profile.Phone = dto.Phone;
            if (dto.Address != null) profile.Address = dto.Address;
            if (dto.PreferredLanguage != null) profile.PreferredLanguage = dto.PreferredLanguage;
            if (dto.Timezone != null) profile.Timezone = dto.Timezone;
            if (dto.EmailNotifications.HasValue) profile.EmailNotifications = dto.EmailNotifications.Value;
            if (dto.TicketUpdateNotifications.HasValue) profile.TicketUpdateNotifications = dto.TicketUpdateNotifications.Value;
            if (dto.MarketingEmails.HasValue) profile.MarketingEmails = dto.MarketingEmails.Value;
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (await GetCustomerProfileAsync(userId))!;
        }

        // ==================== Customer Dashboard ====================

        public async Task<CustomerDashboardDto> GetCustomerDashboardAsync(string userId)
        {
            var profile = await GetCustomerProfileAsync(userId);
            var ticketSummary = await GetCustomerTicketSummaryAsync(userId);
            var announcements = await GetActiveAnnouncementsAsync();
            var featuredArticles = await GetFeaturedArticlesAsync(5);
            var featuredFAQs = await GetFeaturedFAQsAsync(5);
            var systemStatus = await GetSystemStatusAsync();

            return new CustomerDashboardDto
            {
                Profile = profile,
                TicketSummary = ticketSummary,
                Announcements = announcements,
                FeaturedArticles = featuredArticles,
                FeaturedFAQs = featuredFAQs,
                SystemStatus = systemStatus
            };
        }

        // ==================== Customer Tickets ====================

        public async Task<CustomerTicketSummaryDto> GetCustomerTicketSummaryAsync(string userId)
        {
            var tickets = await _context.Tickets
                .Where(t => t.CreatedByUserId == userId)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Status,
                    t.Priority,
                    t.Category,
                    t.CreatedAt,
                    t.UpdatedAt,
                    CommentCount = t.Comments.Count()
                })
                .ToListAsync();

            // Get status names
            var statusIds = tickets.Select(t => t.Status).Distinct().ToList();
            var statuses = await _context.TicketStatuses
                .Where(s => statusIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, s => s.Name);

            var recentTickets = tickets
                .OrderByDescending(t => t.UpdatedAt)
                .Take(5)
                .Select(t => new CustomerTicketDto
                {
                    Id = 0, // Guid tickets don't have int ID
                    Title = t.Title,
                    Status = statuses.GetValueOrDefault(t.Status, "Unknown"),
                    Priority = t.Priority.ToString(),
                    Category = t.Category.ToString(),
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    CommentCount = t.CommentCount,
                    HasUnreadUpdates = false // TODO: Implement unread tracking
                })
                .ToList();

            // Count by status
            var openStatuses = new[] { "open", "new", "in progress" };
            var pendingStatuses = new[] { "pending", "waiting", "on hold" };
            var resolvedStatuses = new[] { "resolved", "closed", "completed" };

            return new CustomerTicketSummaryDto
            {
                TotalTickets = tickets.Count,
                OpenTickets = tickets.Count(t => openStatuses.Contains(statuses.GetValueOrDefault(t.Status, "").ToLower())),
                PendingTickets = tickets.Count(t => pendingStatuses.Contains(statuses.GetValueOrDefault(t.Status, "").ToLower())),
                ResolvedTickets = tickets.Count(t => resolvedStatuses.Contains(statuses.GetValueOrDefault(t.Status, "").ToLower())),
                RecentTickets = recentTickets
            };
        }

        public async Task<List<CustomerTicketDto>> GetCustomerTicketsAsync(string userId, int page = 1, int pageSize = 10, string? status = null)
        {
            var query = _context.Tickets
                .Where(t => t.CreatedByUserId == userId);

            if (!string.IsNullOrEmpty(status))
            {
                var statusEntity = await _context.TicketStatuses.FirstOrDefaultAsync(s => s.Name.ToLower() == status.ToLower());
                if (statusEntity != null)
                {
                    query = query.Where(t => t.Status == statusEntity.Id);
                }
            }

            var tickets = await query
                .OrderByDescending(t => t.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Status,
                    t.Priority,
                    t.Category,
                    t.CreatedAt,
                    t.UpdatedAt,
                    CommentCount = t.Comments.Count()
                })
                .ToListAsync();

            var statusIds = tickets.Select(t => t.Status).Distinct().ToList();
            var statuses = await _context.TicketStatuses
                .Where(s => statusIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, s => s.Name);

            return tickets.Select(t => new CustomerTicketDto
            {
                Id = 0, // Guid tickets don't have int ID
                Title = t.Title,
                Status = statuses.GetValueOrDefault(t.Status, "Unknown"),
                Priority = t.Priority.ToString(),
                Category = t.Category.ToString(),
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                CommentCount = t.CommentCount,
                HasUnreadUpdates = false
            }).ToList();
        }

        // ==================== Knowledge Base Categories ====================

        public async Task<List<KnowledgeBaseCategoryDto>> GetKnowledgeBaseCategoriesAsync()
        {
            var categories = await _context.KnowledgeBaseCategories
                .Include(c => c.SubCategories)
                .Include(c => c.Articles.Where(a => a.IsPublished))
                .Where(c => c.IsActive && c.ParentCategoryId == null)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();

            return categories.Select(MapToCategoryDto).ToList();
        }

        public async Task<KnowledgeBaseCategoryDto?> GetKnowledgeBaseCategoryAsync(int id)
        {
            var category = await _context.KnowledgeBaseCategories
                .Include(c => c.SubCategories)
                .Include(c => c.Articles.Where(a => a.IsPublished))
                .FirstOrDefaultAsync(c => c.Id == id);

            return category != null ? MapToCategoryDto(category) : null;
        }

        public async Task<KnowledgeBaseCategoryDto?> GetKnowledgeBaseCategoryBySlugAsync(string slug)
        {
            var category = await _context.KnowledgeBaseCategories
                .Include(c => c.SubCategories)
                .Include(c => c.Articles.Where(a => a.IsPublished))
                .FirstOrDefaultAsync(c => c.Slug == slug);

            return category != null ? MapToCategoryDto(category) : null;
        }

        public async Task<KnowledgeBaseCategoryDto> CreateKnowledgeBaseCategoryAsync(CreateKnowledgeBaseCategoryDto dto)
        {
            var category = new KnowledgeBaseCategory
            {
                Name = dto.Name,
                Slug = GenerateSlug(dto.Name),
                Description = dto.Description,
                IconName = dto.IconName,
                ParentCategoryId = dto.ParentCategoryId,
                SortOrder = dto.SortOrder
            };

            _context.KnowledgeBaseCategories.Add(category);
            await _context.SaveChangesAsync();

            return (await GetKnowledgeBaseCategoryAsync(category.Id))!;
        }

        public async Task<KnowledgeBaseCategoryDto?> UpdateKnowledgeBaseCategoryAsync(int id, CreateKnowledgeBaseCategoryDto dto)
        {
            var category = await _context.KnowledgeBaseCategories.FindAsync(id);
            if (category == null) return null;

            category.Name = dto.Name;
            category.Slug = GenerateSlug(dto.Name);
            category.Description = dto.Description;
            category.IconName = dto.IconName;
            category.ParentCategoryId = dto.ParentCategoryId;
            category.SortOrder = dto.SortOrder;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetKnowledgeBaseCategoryAsync(id);
        }

        public async Task<bool> DeleteKnowledgeBaseCategoryAsync(int id)
        {
            var category = await _context.KnowledgeBaseCategories.FindAsync(id);
            if (category == null) return false;

            category.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        // ==================== Knowledge Base Articles ====================

        public async Task<List<KnowledgeBaseArticleListDto>> GetPublishedArticlesAsync(int? categoryId = null, int page = 1, int pageSize = 20)
        {
            var query = _context.KnowledgeBaseArticles
                .Include(a => a.Category)
                .Where(a => a.IsPublished);

            if (categoryId.HasValue)
            {
                query = query.Where(a => a.CategoryId == categoryId.Value);
            }

            return await query
                .OrderByDescending(a => a.PublishedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new KnowledgeBaseArticleListDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Slug = a.Slug,
                    Summary = a.Summary,
                    CategoryName = a.Category != null ? a.Category.Name : null,
                    ViewCount = a.ViewCount,
                    IsFeatured = a.IsFeatured,
                    PublishedAt = a.PublishedAt
                })
                .ToListAsync();
        }

        public async Task<List<KnowledgeBaseArticleListDto>> GetFeaturedArticlesAsync(int limit = 5)
        {
            return await _context.KnowledgeBaseArticles
                .Include(a => a.Category)
                .Where(a => a.IsPublished && a.IsFeatured)
                .OrderByDescending(a => a.ViewCount)
                .Take(limit)
                .Select(a => new KnowledgeBaseArticleListDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Slug = a.Slug,
                    Summary = a.Summary,
                    CategoryName = a.Category != null ? a.Category.Name : null,
                    ViewCount = a.ViewCount,
                    IsFeatured = a.IsFeatured,
                    PublishedAt = a.PublishedAt
                })
                .ToListAsync();
        }

        public async Task<KnowledgeBaseArticleDto?> GetArticleBySlugAsync(string slug)
        {
            var article = await _context.KnowledgeBaseArticles
                .Include(a => a.Category)
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.Slug == slug && a.IsPublished);

            return article != null ? MapToArticleDto(article) : null;
        }

        public async Task<KnowledgeBaseArticleDto?> GetArticleByIdAsync(int id)
        {
            var article = await _context.KnowledgeBaseArticles
                .Include(a => a.Category)
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.Id == id);

            return article != null ? MapToArticleDto(article) : null;
        }

        public async Task<KnowledgeBaseArticleDto> CreateArticleAsync(string authorId, CreateKnowledgeBaseArticleDto dto)
        {
            var article = new KnowledgeBaseArticle
            {
                Title = dto.Title,
                Slug = GenerateSlug(dto.Title),
                Summary = dto.Summary,
                Content = dto.Content,
                CategoryId = dto.CategoryId,
                AuthorId = authorId,
                Tags = dto.Tags,
                IsPublished = dto.IsPublished,
                IsFeatured = dto.IsFeatured,
                MetaDescription = dto.MetaDescription,
                MetaKeywords = dto.MetaKeywords,
                PublishedAt = dto.IsPublished ? DateTime.UtcNow : null
            };

            _context.KnowledgeBaseArticles.Add(article);
            await _context.SaveChangesAsync();

            return (await GetArticleByIdAsync(article.Id))!;
        }

        public async Task<KnowledgeBaseArticleDto?> UpdateArticleAsync(int id, UpdateKnowledgeBaseArticleDto dto)
        {
            var article = await _context.KnowledgeBaseArticles.FindAsync(id);
            if (article == null) return null;

            var wasPublished = article.IsPublished;

            article.Title = dto.Title;
            article.Slug = GenerateSlug(dto.Title);
            article.Summary = dto.Summary;
            article.Content = dto.Content;
            article.CategoryId = dto.CategoryId;
            article.Tags = dto.Tags;
            article.IsPublished = dto.IsPublished;
            article.IsFeatured = dto.IsFeatured;
            article.MetaDescription = dto.MetaDescription;
            article.MetaKeywords = dto.MetaKeywords;
            article.UpdatedAt = DateTime.UtcNow;

            if (!wasPublished && dto.IsPublished)
            {
                article.PublishedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return await GetArticleByIdAsync(id);
        }

        public async Task<bool> DeleteArticleAsync(int id)
        {
            var article = await _context.KnowledgeBaseArticles.FindAsync(id);
            if (article == null) return false;

            _context.KnowledgeBaseArticles.Remove(article);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task RecordArticleViewAsync(int articleId)
        {
            var article = await _context.KnowledgeBaseArticles.FindAsync(articleId);
            if (article != null)
            {
                article.ViewCount++;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> SubmitArticleFeedbackAsync(string? userId, ArticleFeedbackDto dto)
        {
            var article = await _context.KnowledgeBaseArticles.FindAsync(dto.ArticleId);
            if (article == null) return false;

            var feedback = new KnowledgeBaseArticleFeedback
            {
                ArticleId = dto.ArticleId,
                UserId = userId,
                IsHelpful = dto.IsHelpful,
                Comment = dto.Comment
            };

            _context.KnowledgeBaseArticleFeedbacks.Add(feedback);

            if (dto.IsHelpful)
                article.HelpfulCount++;
            else
                article.NotHelpfulCount++;

            await _context.SaveChangesAsync();
            return true;
        }

        // ==================== FAQs ====================

        public async Task<List<FAQDto>> GetActiveFAQsAsync(int? categoryId = null)
        {
            var query = _context.FAQs
                .Include(f => f.Category)
                .Where(f => f.IsActive);

            if (categoryId.HasValue)
            {
                query = query.Where(f => f.CategoryId == categoryId.Value);
            }

            return await query
                .OrderBy(f => f.SortOrder)
                .Select(f => MapToFAQDto(f))
                .ToListAsync();
        }

        public async Task<List<FAQDto>> GetFeaturedFAQsAsync(int limit = 5)
        {
            return await _context.FAQs
                .Include(f => f.Category)
                .Where(f => f.IsActive && f.IsFeatured)
                .OrderByDescending(f => f.ViewCount)
                .Take(limit)
                .Select(f => MapToFAQDto(f))
                .ToListAsync();
        }

        public async Task<FAQDto?> GetFAQByIdAsync(int id)
        {
            var faq = await _context.FAQs
                .Include(f => f.Category)
                .FirstOrDefaultAsync(f => f.Id == id);

            return faq != null ? MapToFAQDto(faq) : null;
        }

        public async Task<FAQDto> CreateFAQAsync(CreateFAQDto dto)
        {
            var faq = new FAQ
            {
                Question = dto.Question,
                Answer = dto.Answer,
                CategoryId = dto.CategoryId,
                SortOrder = dto.SortOrder,
                IsFeatured = dto.IsFeatured
            };

            _context.FAQs.Add(faq);
            await _context.SaveChangesAsync();

            return (await GetFAQByIdAsync(faq.Id))!;
        }

        public async Task<FAQDto?> UpdateFAQAsync(int id, CreateFAQDto dto)
        {
            var faq = await _context.FAQs.FindAsync(id);
            if (faq == null) return null;

            faq.Question = dto.Question;
            faq.Answer = dto.Answer;
            faq.CategoryId = dto.CategoryId;
            faq.SortOrder = dto.SortOrder;
            faq.IsFeatured = dto.IsFeatured;
            faq.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetFAQByIdAsync(id);
        }

        public async Task<bool> DeleteFAQAsync(int id)
        {
            var faq = await _context.FAQs.FindAsync(id);
            if (faq == null) return false;

            faq.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task RecordFAQViewAsync(int faqId)
        {
            var faq = await _context.FAQs.FindAsync(faqId);
            if (faq != null)
            {
                faq.ViewCount++;
                await _context.SaveChangesAsync();
            }
        }

        // ==================== Announcements ====================

        public async Task<List<PortalAnnouncementDto>> GetActiveAnnouncementsAsync()
        {
            var now = DateTime.UtcNow;

            return await _context.PortalAnnouncements
                .Include(a => a.CreatedBy)
                .Where(a => a.IsActive &&
                    (a.StartsAt == null || a.StartsAt <= now) &&
                    (a.ExpiresAt == null || a.ExpiresAt > now))
                .OrderByDescending(a => a.IsPinned)
                .ThenByDescending(a => a.CreatedAt)
                .Select(a => MapToAnnouncementDto(a))
                .ToListAsync();
        }

        public async Task<PortalAnnouncementDto?> GetAnnouncementByIdAsync(int id)
        {
            var announcement = await _context.PortalAnnouncements
                .Include(a => a.CreatedBy)
                .FirstOrDefaultAsync(a => a.Id == id);

            return announcement != null ? MapToAnnouncementDto(announcement) : null;
        }

        public async Task<PortalAnnouncementDto> CreateAnnouncementAsync(string createdById, CreatePortalAnnouncementDto dto)
        {
            var announcement = new PortalAnnouncement
            {
                Title = dto.Title,
                Content = dto.Content,
                Type = (AnnouncementType)dto.Type,
                IsPinned = dto.IsPinned,
                StartsAt = dto.StartsAt,
                ExpiresAt = dto.ExpiresAt,
                CreatedById = createdById
            };

            _context.PortalAnnouncements.Add(announcement);
            await _context.SaveChangesAsync();

            return (await GetAnnouncementByIdAsync(announcement.Id))!;
        }

        public async Task<PortalAnnouncementDto?> UpdateAnnouncementAsync(int id, CreatePortalAnnouncementDto dto)
        {
            var announcement = await _context.PortalAnnouncements.FindAsync(id);
            if (announcement == null) return null;

            announcement.Title = dto.Title;
            announcement.Content = dto.Content;
            announcement.Type = (AnnouncementType)dto.Type;
            announcement.IsPinned = dto.IsPinned;
            announcement.StartsAt = dto.StartsAt;
            announcement.ExpiresAt = dto.ExpiresAt;
            announcement.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetAnnouncementByIdAsync(id);
        }

        public async Task<bool> DeleteAnnouncementAsync(int id)
        {
            var announcement = await _context.PortalAnnouncements.FindAsync(id);
            if (announcement == null) return false;

            announcement.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        // ==================== Service Status ====================

        public async Task<SystemStatusSummaryDto> GetSystemStatusAsync()
        {
            var services = await _context.ServiceStatuses
                .Where(s => s.IsPublic)
                .OrderBy(s => s.SortOrder)
                .ToListAsync();

            var activeIncidents = await GetActiveIncidentsAsync();
            var recentIncidents = await GetRecentIncidentsAsync(7);

            var operationalCount = services.Count(s => s.Status == ServiceHealthStatus.Operational);
            var degradedCount = services.Count(s => s.Status == ServiceHealthStatus.Degraded);
            var outageCount = services.Count(s => s.Status == ServiceHealthStatus.PartialOutage || s.Status == ServiceHealthStatus.MajorOutage);

            string overallStatus;
            if (outageCount > 0)
                overallStatus = "Major Outage";
            else if (degradedCount > 0)
                overallStatus = "Degraded Performance";
            else
                overallStatus = "All Systems Operational";

            return new SystemStatusSummaryDto
            {
                OverallStatus = overallStatus,
                OperationalCount = operationalCount,
                DegradedCount = degradedCount,
                OutageCount = outageCount,
                Services = services.Select(MapToServiceStatusDto).ToList(),
                ActiveIncidents = activeIncidents,
                RecentIncidents = recentIncidents.Where(i => i.Status == 3).ToList() // Resolved only
            };
        }

        public async Task<List<ServiceStatusDto>> GetAllServicesAsync()
        {
            return await _context.ServiceStatuses
                .OrderBy(s => s.SortOrder)
                .Select(s => MapToServiceStatusDto(s))
                .ToListAsync();
        }

        public async Task<ServiceStatusDto?> UpdateServiceStatusAsync(int id, int status, string? message)
        {
            var service = await _context.ServiceStatuses.FindAsync(id);
            if (service == null) return null;

            service.Status = (ServiceHealthStatus)status;
            service.StatusMessage = message;
            service.LastCheckedAt = DateTime.UtcNow;
            service.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToServiceStatusDto(service);
        }

        public async Task<ServiceStatusDto> CreateServiceAsync(string name, string? description)
        {
            var maxOrder = await _context.ServiceStatuses.MaxAsync(s => (int?)s.SortOrder) ?? 0;

            var service = new ServiceStatus
            {
                ServiceName = name,
                Description = description,
                SortOrder = maxOrder + 1
            };

            _context.ServiceStatuses.Add(service);
            await _context.SaveChangesAsync();

            return MapToServiceStatusDto(service);
        }

        // ==================== Service Incidents ====================

        public async Task<List<ServiceIncidentDto>> GetActiveIncidentsAsync()
        {
            return await _context.ServiceIncidents
                .Include(i => i.AffectedService)
                .Include(i => i.CreatedBy)
                .Include(i => i.Updates.OrderByDescending(u => u.CreatedAt))
                    .ThenInclude(u => u.CreatedBy)
                .Where(i => i.Status != IncidentStatus.Resolved)
                .OrderByDescending(i => i.StartedAt)
                .Select(i => MapToIncidentDto(i))
                .ToListAsync();
        }

        public async Task<List<ServiceIncidentDto>> GetRecentIncidentsAsync(int days = 7)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);

            return await _context.ServiceIncidents
                .Include(i => i.AffectedService)
                .Include(i => i.CreatedBy)
                .Include(i => i.Updates.OrderByDescending(u => u.CreatedAt))
                    .ThenInclude(u => u.CreatedBy)
                .Where(i => i.StartedAt >= cutoff)
                .OrderByDescending(i => i.StartedAt)
                .Select(i => MapToIncidentDto(i))
                .ToListAsync();
        }

        public async Task<ServiceIncidentDto?> GetIncidentByIdAsync(int id)
        {
            var incident = await _context.ServiceIncidents
                .Include(i => i.AffectedService)
                .Include(i => i.CreatedBy)
                .Include(i => i.Updates.OrderByDescending(u => u.CreatedAt))
                    .ThenInclude(u => u.CreatedBy)
                .FirstOrDefaultAsync(i => i.Id == id);

            return incident != null ? MapToIncidentDto(incident) : null;
        }

        public async Task<ServiceIncidentDto> CreateIncidentAsync(string createdById, CreateServiceIncidentDto dto)
        {
            var incident = new ServiceIncident
            {
                Title = dto.Title,
                Description = dto.Description,
                Severity = (IncidentSeverity)dto.Severity,
                AffectedServiceId = dto.AffectedServiceId,
                CreatedById = createdById
            };

            _context.ServiceIncidents.Add(incident);

            // Update service status if affected
            if (dto.AffectedServiceId.HasValue)
            {
                var service = await _context.ServiceStatuses.FindAsync(dto.AffectedServiceId.Value);
                if (service != null)
                {
                    service.Status = dto.Severity switch
                    {
                        2 => ServiceHealthStatus.MajorOutage,
                        1 => ServiceHealthStatus.PartialOutage,
                        _ => ServiceHealthStatus.Degraded
                    };
                    service.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return (await GetIncidentByIdAsync(incident.Id))!;
        }

        public async Task<ServiceIncidentDto?> AddIncidentUpdateAsync(int incidentId, string userId, AddIncidentUpdateDto dto)
        {
            var incident = await _context.ServiceIncidents.FindAsync(incidentId);
            if (incident == null) return null;

            var update = new ServiceIncidentUpdate
            {
                IncidentId = incidentId,
                Message = dto.Message,
                Status = (IncidentStatus)dto.Status,
                CreatedById = userId
            };

            _context.ServiceIncidentUpdates.Add(update);

            incident.Status = (IncidentStatus)dto.Status;
            incident.UpdatedAt = DateTime.UtcNow;

            if (dto.Status == 3) // Resolved
            {
                incident.ResolvedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return await GetIncidentByIdAsync(incidentId);
        }

        public async Task<bool> ResolveIncidentAsync(int incidentId, string userId, string? message)
        {
            var incident = await _context.ServiceIncidents
                .Include(i => i.AffectedService)
                .FirstOrDefaultAsync(i => i.Id == incidentId);

            if (incident == null) return false;

            var update = new ServiceIncidentUpdate
            {
                IncidentId = incidentId,
                Message = message ?? "Incident resolved",
                Status = IncidentStatus.Resolved,
                CreatedById = userId
            };

            _context.ServiceIncidentUpdates.Add(update);

            incident.Status = IncidentStatus.Resolved;
            incident.ResolvedAt = DateTime.UtcNow;
            incident.UpdatedAt = DateTime.UtcNow;

            // Restore service status
            if (incident.AffectedService != null)
            {
                incident.AffectedService.Status = ServiceHealthStatus.Operational;
                incident.AffectedService.StatusMessage = null;
                incident.AffectedService.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // ==================== Contact Submissions ====================

        public async Task<ContactSubmissionDto> CreateContactSubmissionAsync(CreateContactSubmissionDto dto)
        {
            var submission = new ContactSubmission
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                Subject = dto.Subject,
                Message = dto.Message,
                Type = (ContactSubmissionType)dto.Type
            };

            _context.ContactSubmissions.Add(submission);
            await _context.SaveChangesAsync();

            return MapToContactSubmissionDto(submission);
        }

        public async Task<List<ContactSubmissionDto>> GetContactSubmissionsAsync(bool? processed = null, int page = 1, int pageSize = 20)
        {
            var query = _context.ContactSubmissions.AsQueryable();

            if (processed.HasValue)
            {
                query = query.Where(s => s.IsProcessed == processed.Value);
            }

            return await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => MapToContactSubmissionDto(s))
                .ToListAsync();
        }

        public async Task<int?> ConvertContactToTicketAsync(int submissionId, string createdById)
        {
            var submission = await _context.ContactSubmissions.FindAsync(submissionId);
            if (submission == null || submission.IsProcessed) return null;

            // Find or create user for the contact
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == submission.Email);
            var createdByUser = await _context.Users.FindAsync(createdById);
            
            // Get default status
            var defaultStatus = await _context.TicketStatuses.FirstOrDefaultAsync(s => s.IsDefault);

            var ticket = new Core.Entities.Ticketing.Ticket
            {
                Title = submission.Subject,
                Description = $"Contact Form Submission from {submission.Name} ({submission.Email})\n\n{submission.Message}",
                CreatedByUserId = user?.Id ?? createdByUser?.Id ?? "",
                Status = defaultStatus?.Id ?? 1,
                Priority = Core.Entities.Ticketing.TicketPriority.Medium,
                Category = Core.Entities.Ticketing.TicketCategory.General,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);

            submission.IsProcessed = true;
            submission.ProcessedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Update with PublicId if available
            submission.ConvertedToTicketId = ticket.PublicId;
            await _context.SaveChangesAsync();

            return ticket.PublicId;
        }

        // ==================== Search ====================

        public async Task<PortalSearchResultDto> SearchAsync(string query, int maxResults = 10)
        {
            var searchTerms = query.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);

            var articles = await _context.KnowledgeBaseArticles
                .Include(a => a.Category)
                .Where(a => a.IsPublished &&
                    (a.Title.ToLower().Contains(query.ToLower()) ||
                     a.Content.ToLower().Contains(query.ToLower()) ||
                     (a.Tags != null && a.Tags.ToLower().Contains(query.ToLower()))))
                .OrderByDescending(a => a.ViewCount)
                .Take(maxResults)
                .Select(a => new KnowledgeBaseArticleListDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Slug = a.Slug,
                    Summary = a.Summary,
                    CategoryName = a.Category != null ? a.Category.Name : null,
                    ViewCount = a.ViewCount,
                    IsFeatured = a.IsFeatured,
                    PublishedAt = a.PublishedAt
                })
                .ToListAsync();

            var faqs = await _context.FAQs
                .Include(f => f.Category)
                .Where(f => f.IsActive &&
                    (f.Question.ToLower().Contains(query.ToLower()) ||
                     f.Answer.ToLower().Contains(query.ToLower())))
                .OrderByDescending(f => f.ViewCount)
                .Take(maxResults)
                .Select(f => MapToFAQDto(f))
                .ToListAsync();

            return new PortalSearchResultDto
            {
                Articles = articles,
                FAQs = faqs,
                TotalArticles = articles.Count,
                TotalFAQs = faqs.Count
            };
        }

        // ==================== Helper Methods ====================

        private static string GenerateSlug(string title)
        {
            var slug = title.ToLower();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            slug = slug.Trim('-');
            return $"{slug}-{DateTime.UtcNow.Ticks % 10000}";
        }

        private static CustomerProfileDto MapToCustomerProfileDto(CustomerProfile profile)
        {
            return new CustomerProfileDto
            {
                Id = profile.Id,
                UserId = profile.UserId,
                UserName = profile.User?.FullName,
                UserEmail = profile.User?.Email,
                CompanyName = profile.CompanyName,
                JobTitle = profile.JobTitle,
                Phone = profile.Phone,
                Address = profile.Address,
                AvatarUrl = profile.AvatarUrl,
                PreferredLanguage = profile.PreferredLanguage,
                Timezone = profile.Timezone,
                EmailNotifications = profile.EmailNotifications,
                TicketUpdateNotifications = profile.TicketUpdateNotifications,
                MarketingEmails = profile.MarketingEmails,
                CreatedAt = profile.CreatedAt
            };
        }

        private static KnowledgeBaseCategoryDto MapToCategoryDto(KnowledgeBaseCategory category)
        {
            return new KnowledgeBaseCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
                IconName = category.IconName,
                ParentCategoryId = category.ParentCategoryId,
                ParentCategoryName = category.ParentCategory?.Name,
                SortOrder = category.SortOrder,
                ArticleCount = category.Articles?.Count(a => a.IsPublished) ?? 0,
                SubCategories = category.SubCategories?
                    .Where(sc => sc.IsActive)
                    .OrderBy(sc => sc.SortOrder)
                    .Select(MapToCategoryDto)
                    .ToList() ?? new List<KnowledgeBaseCategoryDto>()
            };
        }

        private static KnowledgeBaseArticleDto MapToArticleDto(KnowledgeBaseArticle article)
        {
            return new KnowledgeBaseArticleDto
            {
                Id = article.Id,
                Title = article.Title,
                Slug = article.Slug,
                Summary = article.Summary,
                Content = article.Content,
                CategoryId = article.CategoryId,
                CategoryName = article.Category?.Name,
                AuthorId = article.AuthorId,
                AuthorName = article.Author?.FullName,
                Tags = article.Tags,
                ViewCount = article.ViewCount,
                HelpfulCount = article.HelpfulCount,
                NotHelpfulCount = article.NotHelpfulCount,
                IsPublished = article.IsPublished,
                IsFeatured = article.IsFeatured,
                PublishedAt = article.PublishedAt,
                CreatedAt = article.CreatedAt,
                UpdatedAt = article.UpdatedAt
            };
        }

        private static FAQDto MapToFAQDto(FAQ faq)
        {
            return new FAQDto
            {
                Id = faq.Id,
                Question = faq.Question,
                Answer = faq.Answer,
                CategoryId = faq.CategoryId,
                CategoryName = faq.Category?.Name,
                SortOrder = faq.SortOrder,
                IsFeatured = faq.IsFeatured,
                ViewCount = faq.ViewCount
            };
        }

        private static PortalAnnouncementDto MapToAnnouncementDto(PortalAnnouncement announcement)
        {
            var typeNames = new[] { "Info", "Warning", "Success", "Maintenance", "New Feature" };
            return new PortalAnnouncementDto
            {
                Id = announcement.Id,
                Title = announcement.Title,
                Content = announcement.Content,
                Type = (int)announcement.Type,
                TypeDisplay = typeNames[(int)announcement.Type],
                IsPinned = announcement.IsPinned,
                StartsAt = announcement.StartsAt,
                ExpiresAt = announcement.ExpiresAt,
                CreatedByName = announcement.CreatedBy?.FullName,
                CreatedAt = announcement.CreatedAt
            };
        }

        private static ServiceStatusDto MapToServiceStatusDto(ServiceStatus service)
        {
            var statusNames = new[] { "Operational", "Degraded", "Partial Outage", "Major Outage", "Maintenance" };
            return new ServiceStatusDto
            {
                Id = service.Id,
                ServiceName = service.ServiceName,
                Description = service.Description,
                Status = (int)service.Status,
                StatusDisplay = statusNames[(int)service.Status],
                StatusMessage = service.StatusMessage,
                LastCheckedAt = service.LastCheckedAt
            };
        }

        private static ServiceIncidentDto MapToIncidentDto(ServiceIncident incident)
        {
            var severityNames = new[] { "Minor", "Major", "Critical" };
            var statusNames = new[] { "Investigating", "Identified", "Monitoring", "Resolved", "Scheduled" };

            return new ServiceIncidentDto
            {
                Id = incident.Id,
                Title = incident.Title,
                Description = incident.Description,
                Severity = (int)incident.Severity,
                SeverityDisplay = severityNames[(int)incident.Severity],
                Status = (int)incident.Status,
                StatusDisplay = statusNames[(int)incident.Status],
                AffectedServiceId = incident.AffectedServiceId,
                AffectedServiceName = incident.AffectedService?.ServiceName,
                StartedAt = incident.StartedAt,
                ResolvedAt = incident.ResolvedAt,
                CreatedByName = incident.CreatedBy?.FullName,
                Updates = incident.Updates?.Select(u => new ServiceIncidentUpdateDto
                {
                    Id = u.Id,
                    Message = u.Message,
                    Status = (int)u.Status,
                    StatusDisplay = statusNames[(int)u.Status],
                    CreatedByName = u.CreatedBy?.FullName,
                    CreatedAt = u.CreatedAt
                }).ToList() ?? new List<ServiceIncidentUpdateDto>()
            };
        }

        private static ContactSubmissionDto MapToContactSubmissionDto(ContactSubmission submission)
        {
            var typeNames = new[] { "General", "Sales", "Support", "Feedback", "Partnership" };
            return new ContactSubmissionDto
            {
                Id = submission.Id,
                Name = submission.Name,
                Email = submission.Email,
                Phone = submission.Phone,
                Subject = submission.Subject,
                Message = submission.Message,
                Type = (int)submission.Type,
                TypeDisplay = typeNames[(int)submission.Type],
                IsProcessed = submission.IsProcessed,
                ConvertedToTicketId = submission.ConvertedToTicketId,
                CreatedAt = submission.CreatedAt
            };
        }
    }
}
