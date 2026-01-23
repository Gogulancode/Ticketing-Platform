using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Entities.Email;
using ERPTraining.Core.Entities.CustomerPortal;
using ERPTraining.Core.Entities.Chat;
using TicketCategory = ERPTraining.Core.Entities.Tickets.TicketCategory;

namespace ERPTraining.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        
        optionsBuilder.ConfigureWarnings(warnings =>
        {
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning);
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.CollectionWithoutComparer);
        });
    }

    // ========================================
    // TICKETING ENTITIES
    // ========================================
    
    // Core Ticketing
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<TicketLink> TicketLinks { get; set; }
    public DbSet<TicketComment> TicketComments { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<TicketCollaborator> TicketCollaborators { get; set; }
    public DbSet<Core.Entities.Tickets.TicketConfiguration> TicketConfigurations { get; set; }
    public DbSet<TicketParticipant> TicketParticipants { get; set; }

    // Ticket Settings
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketCategory> TicketCategories { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketSubCategory> TicketSubCategories { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketStatus> TicketStatuses { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketPriority> TicketPriorities { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketDepartment> TicketDepartments { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.IssueType> IssueTypes { get; set; }

    // Ticket Tags & Custom Fields
    public DbSet<ERPTraining.Core.Entities.Ticketing.TicketTag> TicketTags { get; set; }
    public DbSet<ERPTraining.Core.Entities.Ticketing.TicketFieldSetting> TicketFieldSettings { get; set; }
    public DbSet<CustomField> CustomFields { get; set; }
    public DbSet<TicketFieldValue> TicketFieldValues { get; set; }

    // Agent & Group Management
    public DbSet<ERPTraining.Core.Entities.Ticketing.Agent> Agents { get; set; }
    public DbSet<TicketAssignment> TicketAssignments { get; set; }
    public DbSet<TicketGroup> TicketGroups { get; set; }
    public DbSet<TicketGroupAgent> TicketGroupAgents { get; set; }
    public DbSet<CategoryAdmin> CategoryAdmins { get; set; }

    // Auto Assignment
    public DbSet<AutoAssignmentRule> AutoAssignmentRules { get; set; }
    public DbSet<AutoAssignmentRuleAgent> AutoAssignmentRuleAgents { get; set; }
    public DbSet<AutoAssignmentRuleGroup> AutoAssignmentRuleGroups { get; set; }
    public DbSet<AssignmentHistory> AssignmentHistories { get; set; }
    public DbSet<SubcategoryKeyword> SubcategoryKeywords { get; set; }

    // SLA Entities
    public DbSet<SlaPolicy> SlaPolicies { get; set; }
    public DbSet<SlaEscalationContact> SlaEscalationContacts { get; set; }
    public DbSet<SlaEscalationLevel> SlaEscalationLevels { get; set; }

    // Quick Templates
    public DbSet<QuickTemplate> QuickTemplates { get; set; }

    // ========================================
    // ENHANCED TICKET FEATURES
    // ========================================
    public DbSet<TicketWatcher> TicketWatchers { get; set; }
    public DbSet<TicketTemplate> TicketTemplates { get; set; }
    public DbSet<TicketTimeEntry> TicketTimeEntries { get; set; }
    public DbSet<TicketSatisfaction> TicketSatisfactions { get; set; }
    public DbSet<TicketRelation> TicketRelations { get; set; }
    public DbSet<ERPTraining.Core.Entities.Ticketing.CannedResponse> CannedResponses { get; set; }

    // ========================================
    // EMAIL INTEGRATION ENTITIES
    // ========================================
    public DbSet<ERPTraining.Core.Entities.Email.EmailSettings> EmailSettings { get; set; }
    public DbSet<EmailMailbox> EmailMailboxes { get; set; }
    public DbSet<EmailProcessingRule> EmailProcessingRules { get; set; }
    public DbSet<ERPTraining.Core.Entities.Ticketing.GraphEmailConfig> GraphEmailConfigs { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.CategoryEmailMapping> CategoryEmailMappings { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.EmailMonitoringStatus> EmailMonitoringStatuses { get; set; }
    public DbSet<EmailProcessingLog> EmailProcessingLogs { get; set; }
    public DbSet<EmailAttachment> EmailAttachments { get; set; }

    // ========================================
    // USER & NOTIFICATION ENTITIES
    // ========================================
    public DbSet<UserNotification> UserNotifications { get; set; }
    public DbSet<UserPushToken> UserPushTokens { get; set; }

    // Branch Management for multi-branch analytics
    public DbSet<Branch> Branches { get; set; }

    // Platform Role Management
    public DbSet<PlatformRole> PlatformRoles { get; set; }
    public DbSet<PlatformPermission> PlatformPermissions { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<UserPlatformRole> UserPlatformRoles { get; set; }

    // ========================================
    // CUSTOMER PORTAL ENTITIES
    // ========================================
    public DbSet<CustomerProfile> CustomerProfiles { get; set; }
    public DbSet<KnowledgeBaseArticle> KnowledgeBaseArticles { get; set; }
    public DbSet<KnowledgeBaseCategory> KnowledgeBaseCategories { get; set; }
    public DbSet<KnowledgeBaseArticleFeedback> KnowledgeBaseArticleFeedbacks { get; set; }
    public DbSet<PortalAnnouncement> PortalAnnouncements { get; set; }
    public DbSet<FAQ> FAQs { get; set; }
    public DbSet<ServiceStatus> ServiceStatuses { get; set; }
    public DbSet<ServiceIncident> ServiceIncidents { get; set; }
    public DbSet<ServiceIncidentUpdate> ServiceIncidentUpdates { get; set; }
    public DbSet<ContactSubmission> ContactSubmissions { get; set; }

    // ========================================
    // BRANDING & CUSTOMIZATION
    // ========================================
    public DbSet<BrandingSettings> BrandingSettings { get; set; }

    // ========================================
    // CHAT ENTITIES
    // ========================================
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<ConversationParticipant> ConversationParticipants { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<MessageAttachment> MessageAttachments { get; set; }
    public DbSet<MessageReaction> MessageReactions { get; set; }
    public DbSet<MessageReadReceipt> MessageReadReceipts { get; set; }
    public DbSet<UserPresence> UserPresences { get; set; }
    public DbSet<ERPTraining.Core.Entities.Chat.CannedResponse> ChatCannedResponses { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ========================================
        // BRANCH CONFIGURATION
        // ========================================
        
        builder.Entity<Branch>()
            .HasIndex(b => b.Code)
            .IsUnique();

        builder.Entity<Branch>()
            .HasIndex(b => b.Name);

        builder.Entity<User>()
            .HasOne(u => u.Branch)
            .WithMany(b => b.Users)
            .HasForeignKey(u => u.BranchId)
            .OnDelete(DeleteBehavior.SetNull);

        // ========================================
        // PLATFORM ROLE CONFIGURATION
        // ========================================
        
        builder.Entity<PlatformRole>()
            .HasIndex(pr => pr.RoleName)
            .IsUnique();

        builder.Entity<PlatformPermission>()
            .HasIndex(pp => new { pp.Feature, pp.Action })
            .IsUnique();

        builder.Entity<RolePermission>()
            .HasOne(rp => rp.PlatformRole)
            .WithMany(pr => pr.Permissions)
            .HasForeignKey(rp => rp.PlatformRoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RolePermission>()
            .HasOne(rp => rp.PlatformPermission)
            .WithMany(pp => pp.RolePermissions)
            .HasForeignKey(rp => rp.PlatformPermissionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RolePermission>()
            .HasIndex(rp => new { rp.PlatformRoleId, rp.PlatformPermissionId })
            .IsUnique();

        builder.Entity<UserPlatformRole>()
            .HasOne(upr => upr.User)
            .WithMany(u => u.PlatformRoles)
            .HasForeignKey(upr => upr.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserPlatformRole>()
            .HasOne(upr => upr.PlatformRole)
            .WithMany(pr => pr.UserRoles)
            .HasForeignKey(upr => upr.PlatformRoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserPlatformRole>()
            .HasIndex(upr => new { upr.UserId, upr.PlatformRoleId })
            .IsUnique();

        // ========================================
        // TICKET CONFIGURATION
        // ========================================
        
        builder.Entity<Ticket>()
            .HasOne(t => t.CreatedByUser)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(t => t.AssignedToUser)
            .WithMany()
            .HasForeignKey(t => t.AssignedToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Ticket>()
            .HasIndex(t => t.Status);

        builder.Entity<Ticket>()
            .HasIndex(t => t.Priority);

        builder.Entity<Ticket>()
            .HasIndex(t => t.CreatedAt);

        builder.Entity<Ticket>()
            .HasIndex(t => t.CreatedByUserId);

        builder.Entity<Ticket>()
            .HasIndex(t => t.AssignedToUserId);

        // TicketLink
        builder.Entity<TicketLink>()
            .HasOne(tl => tl.Ticket)
            .WithMany(t => t.Links)
            .HasForeignKey(tl => tl.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TicketLink>()
            .HasIndex(tl => new { tl.TicketId, tl.ObjectType, tl.ObjectId })
            .IsUnique();

        // TicketComment
        builder.Entity<TicketComment>()
            .HasOne(tc => tc.Ticket)
            .WithMany(t => t.Comments)
            .HasForeignKey(tc => tc.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TicketComment>()
            .HasOne(tc => tc.AuthorUser)
            .WithMany()
            .HasForeignKey(tc => tc.AuthorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TicketComment>()
            .HasIndex(tc => tc.TicketId);

        builder.Entity<TicketComment>()
            .HasIndex(tc => tc.CreatedAt);

        // Attachment
        builder.Entity<Attachment>()
            .HasOne(a => a.Ticket)
            .WithMany(t => t.Attachments)
            .HasForeignKey(a => a.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Attachment>()
            .HasOne(a => a.Comment)
            .WithMany(c => c.Attachments)
            .HasForeignKey(a => a.CommentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Attachment>()
            .HasOne(a => a.UploadedByUser)
            .WithMany()
            .HasForeignKey(a => a.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Attachment>()
            .HasIndex(a => a.TicketId);

        builder.Entity<Attachment>()
            .HasIndex(a => a.CommentId);

        // AuditLog
        builder.Entity<AuditLog>()
            .HasOne(al => al.Ticket)
            .WithMany(t => t.AuditLogs)
            .HasForeignKey(al => al.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<AuditLog>()
            .Property(al => al.ChangedByUserId)
            .HasColumnName("ChangedBy");

        builder.Entity<AuditLog>()
            .HasOne(al => al.ChangedByUser)
            .WithMany()
            .HasForeignKey(al => al.ChangedByUserId)
            .HasConstraintName("FK_AuditLogs_AspNetUsers_ChangedBy")
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AuditLog>()
            .HasIndex(al => al.TicketId);

        builder.Entity<AuditLog>()
            .HasIndex(al => al.ChangedAt);

        // TicketCollaborator
        builder.Entity<TicketCollaborator>()
            .HasOne(tc => tc.Ticket)
            .WithMany(t => t.Collaborators)
            .HasForeignKey(tc => tc.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TicketCollaborator>()
            .HasOne(tc => tc.User)
            .WithMany()
            .HasForeignKey(tc => tc.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TicketCollaborator>()
            .HasOne(tc => tc.AddedByUser)
            .WithMany()
            .HasForeignKey(tc => tc.AddedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TicketCollaborator>()
            .HasIndex(tc => new { tc.TicketId, tc.UserId })
            .IsUnique();

        builder.Entity<TicketCollaborator>()
            .HasIndex(tc => tc.UserId);

        // TicketParticipant (tracks CC'd and forwarded email recipients)
        builder.Entity<TicketParticipant>()
            .HasOne(tp => tp.Ticket)
            .WithMany()
            .HasForeignKey(tp => tp.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TicketParticipant>()
            .HasIndex(tp => tp.TicketId);

        builder.Entity<TicketParticipant>()
            .HasIndex(tp => tp.Email);

        builder.Entity<TicketParticipant>()
            .HasIndex(tp => new { tp.TicketId, tp.Email })
            .IsUnique();

        // ========================================
        // EMAIL CONFIGURATION
        // ========================================
        
        builder.Entity<ERPTraining.Core.Entities.Tickets.CategoryEmailMapping>()
            .HasOne(cem => cem.Category)
            .WithMany()
            .HasForeignKey(cem => cem.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ERPTraining.Core.Entities.Tickets.CategoryEmailMapping>()
            .HasIndex(cem => new { cem.CategoryId, cem.EmailAddress })
            .IsUnique();

        builder.Entity<ERPTraining.Core.Entities.Tickets.CategoryEmailMapping>()
            .Property(cem => cem.EmailAddress)
            .HasMaxLength(255)
            .IsRequired();

        builder.Entity<ERPTraining.Core.Entities.Tickets.CategoryEmailMapping>()
            .Property(cem => cem.DisplayName)
            .HasMaxLength(100);

        builder.Entity<ERPTraining.Core.Entities.Tickets.EmailMonitoringStatus>()
            .HasIndex(ems => ems.Id)
            .IsUnique();

        // ========================================
        // AUTO ASSIGNMENT CONFIGURATION
        // ========================================
        
        builder.Entity<AutoAssignmentRule>()
            .Ignore(r => r.Category)
            .Ignore(r => r.SubCategory);

        // ========================================
        // CATEGORY ADMIN CONFIGURATION
        // ========================================
        
        builder.Entity<CategoryAdmin>()
            .ToTable("CategoryAdmins");

        builder.Entity<CategoryAdmin>()
            .HasIndex(ca => new { ca.UserId, ca.CategoryId })
            .IsUnique();

        builder.Entity<CategoryAdmin>()
            .HasOne(ca => ca.User)
            .WithMany()
            .HasForeignKey(ca => ca.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CategoryAdmin>()
            .HasOne(ca => ca.Category)
            .WithMany(c => c.CategoryAdmins)
            .HasForeignKey(ca => ca.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // ========================================
        // SLA CONFIGURATION
        // ========================================
        
        builder.Entity<SlaPolicy>()
            .ToTable("SLAs");

        builder.Entity<SlaPolicy>()
            .HasMany(sp => sp.EscalationContacts)
            .WithOne(ec => ec.SlaPolicy)
            .HasForeignKey(ec => ec.SlaPolicyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<SlaPolicy>()
            .HasMany(sp => sp.EscalationLevels)
            .WithOne(el => el.SlaPolicy)
            .HasForeignKey(el => el.SlaPolicyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<SlaEscalationContact>()
            .HasIndex(ec => new { ec.SlaPolicyId, ec.Level, ec.Email })
            .IsUnique();

        builder.Entity<SlaEscalationContact>()
            .Property(ec => ec.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Entity<SlaEscalationContact>()
            .Property(ec => ec.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Entity<SlaEscalationLevel>()
            .HasIndex(el => new { el.SlaPolicyId, el.Level })
            .IsUnique();

        // ========================================
        // TICKET ENHANCEMENT CONFIGURATION
        // ========================================

        // TicketRelation - Fix cascade delete issue
        builder.Entity<TicketRelation>()
            .HasOne(tr => tr.SourceTicket)
            .WithMany()
            .HasForeignKey(tr => tr.SourceTicketId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TicketRelation>()
            .HasOne(tr => tr.RelatedTicket)
            .WithMany()
            .HasForeignKey(tr => tr.RelatedTicketId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TicketRelation>()
            .HasOne(tr => tr.CreatedByUser)
            .WithMany()
            .HasForeignKey(tr => tr.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // TicketWatcher
        builder.Entity<TicketWatcher>()
            .HasOne(tw => tw.Ticket)
            .WithMany()
            .HasForeignKey(tw => tw.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TicketWatcher>()
            .HasOne(tw => tw.User)
            .WithMany()
            .HasForeignKey(tw => tw.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TicketWatcher>()
            .HasIndex(tw => new { tw.TicketId, tw.UserId })
            .IsUnique();

        // TicketTimeEntry
        builder.Entity<TicketTimeEntry>()
            .HasOne(te => te.Ticket)
            .WithMany()
            .HasForeignKey(te => te.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TicketTimeEntry>()
            .HasOne(te => te.User)
            .WithMany()
            .HasForeignKey(te => te.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // TicketSatisfaction
        builder.Entity<TicketSatisfaction>()
            .HasOne(ts => ts.Ticket)
            .WithMany()
            .HasForeignKey(ts => ts.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TicketSatisfaction>()
            .HasOne(ts => ts.User)
            .WithMany()
            .HasForeignKey(ts => ts.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TicketSatisfaction>()
            .HasIndex(ts => ts.TicketId)
            .IsUnique();

        // CannedResponse (Ticketing)
        builder.Entity<ERPTraining.Core.Entities.Ticketing.CannedResponse>()
            .HasOne(cr => cr.OwnerUser)
            .WithMany()
            .HasForeignKey(cr => cr.OwnerUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // TicketTemplate
        builder.Entity<TicketTemplate>()
            .HasOne(tt => tt.CreatedByUser)
            .WithMany()
            .HasForeignKey(tt => tt.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ========================================
        // CUSTOMER PORTAL CONFIGURATION
        // ========================================

        // CustomerProfile
        builder.Entity<CustomerProfile>()
            .HasOne(cp => cp.User)
            .WithMany()
            .HasForeignKey(cp => cp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CustomerProfile>()
            .HasIndex(cp => cp.UserId)
            .IsUnique();

        // KnowledgeBaseArticle
        builder.Entity<KnowledgeBaseArticle>()
            .HasOne(a => a.Category)
            .WithMany(c => c.Articles)
            .HasForeignKey(a => a.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<KnowledgeBaseArticle>()
            .HasOne(a => a.Author)
            .WithMany()
            .HasForeignKey(a => a.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<KnowledgeBaseArticle>()
            .HasIndex(a => a.Slug)
            .IsUnique();

        // KnowledgeBaseArticleFeedback
        builder.Entity<KnowledgeBaseArticleFeedback>()
            .HasOne(f => f.Article)
            .WithMany(a => a.Feedbacks)
            .HasForeignKey(f => f.ArticleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<KnowledgeBaseArticleFeedback>()
            .HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // PortalAnnouncement
        builder.Entity<PortalAnnouncement>()
            .HasOne(a => a.CreatedBy)
            .WithMany()
            .HasForeignKey(a => a.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        // ServiceIncident
        builder.Entity<ServiceIncident>()
            .HasOne(i => i.AffectedService)
            .WithMany()
            .HasForeignKey(i => i.AffectedServiceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ServiceIncident>()
            .HasOne(i => i.CreatedBy)
            .WithMany()
            .HasForeignKey(i => i.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        // ServiceIncidentUpdate
        builder.Entity<ServiceIncidentUpdate>()
            .HasOne(u => u.Incident)
            .WithMany(i => i.Updates)
            .HasForeignKey(u => u.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ServiceIncidentUpdate>()
            .HasOne(u => u.CreatedBy)
            .WithMany()
            .HasForeignKey(u => u.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        // ========================================
        // CHAT ENTITY CONFIGURATIONS
        // ========================================

        // Conversation
        builder.Entity<Conversation>()
            .HasOne(c => c.CreatedBy)
            .WithMany()
            .HasForeignKey(c => c.CreatedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Conversation>()
            .HasIndex(c => c.LastMessageAt);

        // ConversationParticipant
        builder.Entity<ConversationParticipant>()
            .HasOne(p => p.Conversation)
            .WithMany(c => c.Participants)
            .HasForeignKey(p => p.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ConversationParticipant>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ConversationParticipant>()
            .HasIndex(p => new { p.ConversationId, p.UserId })
            .IsUnique();

        // ChatMessage
        builder.Entity<ChatMessage>()
            .HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ChatMessage>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ChatMessage>()
            .HasOne(m => m.ParentMessage)
            .WithMany(m => m.Replies)
            .HasForeignKey(m => m.ParentMessageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ChatMessage>()
            .HasIndex(m => m.ConversationId);

        builder.Entity<ChatMessage>()
            .HasIndex(m => m.CreatedAt);

        // MessageAttachment
        builder.Entity<MessageAttachment>()
            .HasOne(a => a.Message)
            .WithMany(m => m.Attachments)
            .HasForeignKey(a => a.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        // MessageReaction
        builder.Entity<MessageReaction>()
            .HasOne(r => r.Message)
            .WithMany(m => m.Reactions)
            .HasForeignKey(r => r.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<MessageReaction>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<MessageReaction>()
            .HasIndex(r => new { r.MessageId, r.UserId, r.Emoji })
            .IsUnique();

        // MessageReadReceipt
        builder.Entity<MessageReadReceipt>()
            .HasOne(r => r.Message)
            .WithMany(m => m.ReadReceipts)
            .HasForeignKey(r => r.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<MessageReadReceipt>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<MessageReadReceipt>()
            .HasIndex(r => new { r.MessageId, r.UserId })
            .IsUnique();

        // UserPresence
        builder.Entity<UserPresence>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Chat CannedResponse
        builder.Entity<ERPTraining.Core.Entities.Chat.CannedResponse>()
            .ToTable("ChatCannedResponses");

        builder.Entity<ERPTraining.Core.Entities.Chat.CannedResponse>()
            .HasOne(r => r.Owner)
            .WithMany()
            .HasForeignKey(r => r.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ERPTraining.Core.Entities.Chat.CannedResponse>()
            .HasIndex(r => r.Shortcut);
    }
}
