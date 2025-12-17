using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.CustomerPortal;
using ERPTraining.Core.Entities.Ticketing;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Data;

/// <summary>
/// Seeds the database with initial data including roles and admin user
/// </summary>
public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var logger = serviceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        try
        {
            // Ensure database is created and migrations are applied
            logger.LogInformation("Ensuring database is created...");
            await context.Database.MigrateAsync();
            logger.LogInformation("Database migration completed.");

            // Seed roles
            await SeedRolesAsync(roleManager, logger);

            // Seed default branches
            await SeedBranchesAsync(context, logger);

            // Seed admin user
            await SeedAdminUserAsync(userManager, context, logger);

            // Seed default ticket statuses, priorities if needed
            await SeedTicketSettingsAsync(context, logger);

            // Seed Customer Portal data (KB categories, articles, FAQs, etc.)
            await SeedCustomerPortalDataAsync(context, logger);

            // Seed default branding settings
            await SeedBrandingSettingsAsync(context, logger);

            logger.LogInformation("Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while seeding database");
            throw;
        }
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager, ILogger logger)
    {
        var roles = new[] { "Admin", "Agent", "Manager", "User" };

        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(roleName));
                if (result.Succeeded)
                {
                    logger.LogInformation("Created role: {Role}", roleName);
                }
                else
                {
                    logger.LogWarning("Failed to create role {Role}: {Errors}", 
                        roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }
    }

    private static async Task SeedBranchesAsync(ApplicationDbContext context, ILogger logger)
    {
        // Seed default branch (headquarters) if none exist
        if (!await context.Branches.AnyAsync())
        {
            var headquarters = new Core.Entities.Branch
            {
                Name = "Headquarters",
                Code = "HQ",
                Address = "Main Office",
                City = "Default City",
                State = "Default State",
                Country = "Default Country",
                IsActive = true,
                IsHeadquarters = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Branches.Add(headquarters);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded default headquarters branch");
        }
    }

    private static async Task SeedAdminUserAsync(UserManager<User> userManager, ApplicationDbContext context, ILogger logger)
    {
        const string adminEmail = "admin@ticketing.local";
        const string adminPassword = "Admin@123";

        // Get the headquarters branch for admin user
        var hqBranch = await context.Branches.FirstOrDefaultAsync(b => b.IsHeadquarters);

        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new User
            {
                UserName = "admin",
                Email = adminEmail,
                EmailConfirmed = true,
                FirstName = "System",
                LastName = "Administrator",
                Department = "IT",
                IsActive = true,
                IsAgent = true,
                BranchId = hqBranch?.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                JoinDate = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(adminUser, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
                await userManager.AddToRoleAsync(adminUser, "Agent");
                logger.LogInformation("Created admin user: {Email} with password: {Password}", adminEmail, adminPassword);
            }
            else
            {
                logger.LogWarning("Failed to create admin user: {Errors}", 
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            logger.LogInformation("Admin user already exists: {Email}", adminEmail);
        }
    }

    private static async Task SeedTicketSettingsAsync(ApplicationDbContext context, ILogger logger)
    {
        // Seed default ticket statuses if table is empty
        if (!await context.TicketStatuses.AnyAsync())
        {
            var statuses = new[]
            {
                new Core.Entities.Tickets.TicketStatus { Name = "Open", Color = "#3B82F6", WorkflowOrder = 1, IsDefault = true, IsActive = true },
                new Core.Entities.Tickets.TicketStatus { Name = "In Progress", Color = "#F59E0B", WorkflowOrder = 2, IsDefault = false, IsActive = true },
                new Core.Entities.Tickets.TicketStatus { Name = "Pending", Color = "#8B5CF6", WorkflowOrder = 3, IsDefault = false, IsActive = true },
                new Core.Entities.Tickets.TicketStatus { Name = "Resolved", Color = "#10B981", WorkflowOrder = 4, IsDefault = false, IsActive = true },
                new Core.Entities.Tickets.TicketStatus { Name = "Closed", Color = "#6B7280", WorkflowOrder = 5, IsDefault = false, IsActive = true, IsClosedStatus = true }
            };
            context.TicketStatuses.AddRange(statuses);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} ticket statuses", statuses.Length);
        }

        // Seed default ticket priorities if table is empty
        if (!await context.TicketPriorities.AnyAsync())
        {
            var priorities = new[]
            {
                new Core.Entities.Tickets.TicketPriority { Name = "Low", Description = "Low priority", Color = "#6B7280", Level = 1, SortOrder = 1, IsActive = true },
                new Core.Entities.Tickets.TicketPriority { Name = "Medium", Description = "Medium priority", Color = "#3B82F6", Level = 2, SortOrder = 2, IsActive = true },
                new Core.Entities.Tickets.TicketPriority { Name = "High", Description = "High priority", Color = "#F59E0B", Level = 3, SortOrder = 3, IsActive = true },
                new Core.Entities.Tickets.TicketPriority { Name = "Urgent", Description = "Urgent - requires immediate attention", Color = "#EF4444", Level = 4, SortOrder = 4, IsActive = true }
            };
            context.TicketPriorities.AddRange(priorities);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} ticket priorities", priorities.Length);
        }

        // Seed default category if none exist
        if (!await context.TicketCategories.AnyAsync())
        {
            var category = new Core.Entities.Tickets.TicketCategory
            {
                Name = "General",
                Description = "General support requests",
                IsActive = true,
                DisplayOrder = 1,
                Color = "#3B82F6",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.TicketCategories.Add(category);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded default ticket category");
        }
    }

    private static async Task SeedCustomerPortalDataAsync(ApplicationDbContext context, ILogger logger)
    {
        // Get admin user for author references
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@ticketing.local");
        var adminId = adminUser?.Id ?? "";

        // Seed Knowledge Base Categories
        if (!await context.KnowledgeBaseCategories.AnyAsync())
        {
            var categories = new[]
            {
                new KnowledgeBaseCategory
                {
                    Name = "Getting Started",
                    Slug = "getting-started",
                    Description = "New to our platform? Start here to learn the basics.",
                    IconName = "Rocket",
                    SortOrder = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new KnowledgeBaseCategory
                {
                    Name = "Ticketing System",
                    Slug = "ticketing-system",
                    Description = "Learn how to create, manage, and track support tickets.",
                    IconName = "Ticket",
                    SortOrder = 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new KnowledgeBaseCategory
                {
                    Name = "Account & Billing",
                    Slug = "account-billing",
                    Description = "Manage your account settings, subscriptions, and billing information.",
                    IconName = "CreditCard",
                    SortOrder = 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new KnowledgeBaseCategory
                {
                    Name = "Troubleshooting",
                    Slug = "troubleshooting",
                    Description = "Solutions to common issues and problems.",
                    IconName = "Wrench",
                    SortOrder = 4,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };
            context.KnowledgeBaseCategories.AddRange(categories);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} knowledge base categories", categories.Length);
        }

        // Seed Knowledge Base Articles
        if (!await context.KnowledgeBaseArticles.AnyAsync() && !string.IsNullOrEmpty(adminId))
        {
            var gettingStartedCategory = await context.KnowledgeBaseCategories.FirstOrDefaultAsync(c => c.Slug == "getting-started");
            var ticketingCategory = await context.KnowledgeBaseCategories.FirstOrDefaultAsync(c => c.Slug == "ticketing-system");

            var articles = new List<KnowledgeBaseArticle>();

            if (gettingStartedCategory != null)
            {
                articles.Add(new KnowledgeBaseArticle
                {
                    Title = "Welcome to the Support Portal",
                    Slug = "welcome-to-support-portal",
                    Summary = "An introduction to our customer support portal and its features.",
                    Content = @"# Welcome to Our Support Portal

Welcome to our customer support portal! This guide will help you get started with our platform.

## What You Can Do Here

- **Submit Support Tickets**: Create and track support requests
- **Browse Knowledge Base**: Find answers to common questions
- **View System Status**: Check the current status of our services
- **Manage Your Profile**: Update your account information

## Getting Help

If you can't find what you're looking for, don't hesitate to:
1. Search our knowledge base
2. Check our FAQ section
3. Submit a support ticket

Our team is here to help you succeed!",
                    CategoryId = gettingStartedCategory.Id,
                    AuthorId = adminId,
                    Tags = "welcome,getting started,introduction",
                    IsPublished = true,
                    IsFeatured = true,
                    PublishedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                articles.Add(new KnowledgeBaseArticle
                {
                    Title = "Creating Your First Support Ticket",
                    Slug = "creating-first-ticket",
                    Summary = "Step-by-step guide to creating and submitting a support ticket.",
                    Content = @"# Creating Your First Support Ticket

Follow these simple steps to create a support ticket:

## Step 1: Navigate to Tickets

Click on 'My Tickets' in the navigation menu.

## Step 2: Click New Ticket

Look for the 'New Ticket' button and click it.

## Step 3: Fill in the Details

- **Title**: A brief summary of your issue
- **Description**: Detailed explanation of the problem
- **Priority**: Select the urgency level
- **Category**: Choose the appropriate category

## Step 4: Submit

Click 'Submit' to create your ticket. You'll receive a confirmation and can track its progress.

## Tips for Faster Resolution

1. Be specific about the problem
2. Include any error messages
3. List steps to reproduce the issue
4. Attach relevant screenshots",
                    CategoryId = gettingStartedCategory.Id,
                    AuthorId = adminId,
                    Tags = "tickets,create,submit,guide",
                    IsPublished = true,
                    IsFeatured = true,
                    PublishedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            if (ticketingCategory != null)
            {
                articles.Add(new KnowledgeBaseArticle
                {
                    Title = "Understanding Ticket Priorities",
                    Slug = "ticket-priorities-explained",
                    Summary = "Learn about different priority levels and when to use them.",
                    Content = @"# Understanding Ticket Priorities

Choosing the right priority helps us serve you better.

## Priority Levels

### 🟢 Low
- General questions
- Feature requests
- Non-urgent issues

### 🔵 Medium
- Standard support requests
- Issues affecting productivity
- Most common priority

### 🟠 High
- Significant issues
- Affecting multiple users
- Time-sensitive matters

### 🔴 Urgent
- Critical system failures
- Security incidents
- Business-stopping issues

## Response Times

| Priority | First Response | Resolution Target |
|----------|---------------|-------------------|
| Low | 24 hours | 5 business days |
| Medium | 8 hours | 2 business days |
| High | 4 hours | 1 business day |
| Urgent | 1 hour | 4 hours |

*Note: Response times may vary based on your service level agreement.*",
                    CategoryId = ticketingCategory.Id,
                    AuthorId = adminId,
                    Tags = "priority,sla,response time",
                    IsPublished = true,
                    IsFeatured = false,
                    PublishedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            if (articles.Any())
            {
                context.KnowledgeBaseArticles.AddRange(articles);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded {Count} knowledge base articles", articles.Count);
            }
        }

        // Seed FAQs
        if (!await context.FAQs.AnyAsync())
        {
            var faqs = new[]
            {
                new FAQ
                {
                    Question = "How do I reset my password?",
                    Answer = "You can reset your password by clicking 'Forgot Password' on the login page. Enter your email address and we'll send you a password reset link.",
                    SortOrder = 1,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new FAQ
                {
                    Question = "How long does it take to get a response to my ticket?",
                    Answer = "Response times vary based on ticket priority. Urgent tickets receive a response within 1 hour, while standard tickets are typically addressed within 8 hours during business hours.",
                    SortOrder = 2,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new FAQ
                {
                    Question = "Can I update my ticket after submitting it?",
                    Answer = "Yes! You can add comments and additional information to your ticket at any time. Simply navigate to your ticket and use the comment section to provide updates.",
                    SortOrder = 3,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new FAQ
                {
                    Question = "How do I check the status of my ticket?",
                    Answer = "Go to 'My Tickets' in the portal menu to see all your tickets and their current status. You can click on any ticket to view its full details and history.",
                    SortOrder = 4,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new FAQ
                {
                    Question = "What should I include in my support ticket?",
                    Answer = "Include a clear description of the issue, any error messages you've received, steps to reproduce the problem, and relevant screenshots if applicable. The more detail you provide, the faster we can help.",
                    SortOrder = 5,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };
            context.FAQs.AddRange(faqs);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} FAQs", faqs.Length);
        }

        // Seed Service Statuses
        if (!await context.ServiceStatuses.AnyAsync())
        {
            var services = new[]
            {
                new ServiceStatus
                {
                    ServiceName = "Support Portal",
                    Description = "Customer support portal and ticketing system",
                    Status = ServiceHealthStatus.Operational,
                    IsPublic = true,
                    SortOrder = 1,
                    LastCheckedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new ServiceStatus
                {
                    ServiceName = "API Services",
                    Description = "Backend API and integration services",
                    Status = ServiceHealthStatus.Operational,
                    IsPublic = true,
                    SortOrder = 2,
                    LastCheckedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new ServiceStatus
                {
                    ServiceName = "Email Notifications",
                    Description = "Email delivery and notification system",
                    Status = ServiceHealthStatus.Operational,
                    IsPublic = true,
                    SortOrder = 3,
                    LastCheckedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new ServiceStatus
                {
                    ServiceName = "Database",
                    Description = "Primary database and data storage",
                    Status = ServiceHealthStatus.Operational,
                    IsPublic = true,
                    SortOrder = 4,
                    LastCheckedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };
            context.ServiceStatuses.AddRange(services);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} service statuses", services.Length);
        }

        // Seed a sample announcement
        if (!await context.PortalAnnouncements.AnyAsync() && !string.IsNullOrEmpty(adminId))
        {
            var announcement = new PortalAnnouncement
            {
                Title = "Welcome to Our New Customer Portal!",
                Content = "We're excited to launch our new customer portal with improved features including a knowledge base, FAQ section, and real-time system status updates. Explore all the new features and let us know what you think!",
                Type = AnnouncementType.NewFeature,
                IsActive = true,
                IsPinned = true,
                CreatedById = adminId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.PortalAnnouncements.Add(announcement);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded sample portal announcement");
        }
    }

    private static async Task SeedBrandingSettingsAsync(ApplicationDbContext context, ILogger logger)
    {
        // Check if branding settings already exist
        if (await context.BrandingSettings.AnyAsync())
        {
            logger.LogInformation("Branding settings already exist, skipping seed");
            return;
        }

        var brandingSettings = new BrandingSettings
        {
            LoginTitle = "Hello,\nI'm Nivo",
            LoginSubtitle = "I'm here to streamline your business operations and boost productivity. Let me help you save time and enhance efficiency across your enterprise!",
            AppName = "Nivo",
            AppTagline = "Enterprise Ticketing Platform",
            PrimaryColor = "#18181B",
            SecondaryColor = "#DC2626",
            FooterText = "© {year} Nivo. All rights reserved.",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.BrandingSettings.Add(brandingSettings);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded default branding settings");
    }
}
