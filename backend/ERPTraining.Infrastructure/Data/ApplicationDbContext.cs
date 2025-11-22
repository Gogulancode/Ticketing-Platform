using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Entities.Email;
using System.Text.Json;
using TrainingModule = ERPTraining.Core.Training.Entities.Module;
using TrainingSection = ERPTraining.Core.Training.Entities.Section;
using TrainingLesson = ERPTraining.Core.Training.Entities.Lesson;
using TrainingAssessment = ERPTraining.Core.Training.Entities.Assessment;
using TrainingQuestion = ERPTraining.Core.Training.Entities.Question;
using TrainingAssessmentAttempt = ERPTraining.Core.Training.Entities.AssessmentAttempt;
using TrainingUserAnswer = ERPTraining.Core.Training.Entities.UserAnswer;
using TrainingUserModuleProgress = ERPTraining.Core.Training.Entities.UserModuleProgress;
using TrainingUserLessonProgress = ERPTraining.Core.Training.Entities.UserLessonProgress;
using TrainingUploadedContent = ERPTraining.Core.Training.Entities.UploadedContent;
using TrainingUserContentProgress = ERPTraining.Core.Training.Entities.UserContentProgress;
using TrainingTrainingAnnouncement = ERPTraining.Core.Training.Entities.TrainingAnnouncement;
using TrainingUserAnnouncementRead = ERPTraining.Core.Training.Entities.UserAnnouncementRead;
using TrainingLearningRecommendation = ERPTraining.Core.Training.Entities.LearningRecommendation;
using TrainingContentFeedback = ERPTraining.Core.Training.Entities.ContentFeedback;

namespace ERPTraining.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        
        // Suppress the value comparer warnings for collection properties with value converters
        optionsBuilder.ConfigureWarnings(warnings =>
        {
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning);
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.CollectionWithoutComparer);
        });
    }

    public DbSet<TrainingModule> Modules { get; set; }
    public DbSet<TrainingSection> Sections { get; set; }
    public DbSet<TrainingLesson> Lessons { get; set; }
    public DbSet<TrainingAssessment> Assessments { get; set; }
    public DbSet<TrainingQuestion> Questions { get; set; }
    public DbSet<TrainingAssessmentAttempt> AssessmentAttempts { get; set; }
    public DbSet<TrainingUserAnswer> UserAnswers { get; set; }
    public DbSet<TrainingUserModuleProgress> UserModuleProgress { get; set; }
    public DbSet<TrainingUserLessonProgress> UserLessonProgress { get; set; }
    public DbSet<TrainingUploadedContent> UploadedContents { get; set; }
    public DbSet<RoleModuleAccess> RoleModuleAccess { get; set; }
    public DbSet<RoleMaster> RoleMasters { get; set; }
    public DbSet<RoleSyncLog> RoleSyncLogs { get; set; }
    
    // ERP Integration entities
    public DbSet<ERPRoleDetail> ERPRoleDetails { get; set; }
    public DbSet<RoleModuleSection> RoleModuleSections { get; set; }
    public new DbSet<Core.Entities.UserRole> UserRoles { get; set; }
    
    // Enhanced Training Platform entities
    public DbSet<TrainingUserContentProgress> UserContentProgress { get; set; }
    public DbSet<TrainingTrainingAnnouncement> TrainingAnnouncements { get; set; }
    public DbSet<TrainingUserAnnouncementRead> UserAnnouncementReads { get; set; }
    public DbSet<TrainingLearningRecommendation> LearningRecommendations { get; set; }
    public DbSet<TrainingContentFeedback> ContentFeedbacks { get; set; }
    
    // Platform Role Management entities
    public DbSet<PlatformRole> PlatformRoles { get; set; }
    public DbSet<PlatformPermission> PlatformPermissions { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<UserPlatformRole> UserPlatformRoles { get; set; }

    // Ticketing entities
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<TicketLink> TicketLinks { get; set; }
    public DbSet<TicketComment> TicketComments { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    // Commented out old SLA entity to avoid table conflict with SlaPolicy
    // public DbSet<SLA> SLAs { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<TicketCollaborator> TicketCollaborators { get; set; }
    public DbSet<Core.Entities.Tickets.TicketConfiguration> TicketConfigurations { get; set; }

    // Ticket Settings entities using existing tables
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketCategory> TicketCategories { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketSubCategory> TicketSubCategories { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketStatus> TicketStatuses { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketPriority> TicketPriorities { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.TicketDepartment> TicketDepartments { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.IssueType> IssueTypes { get; set; }

    // New Ticketing Settings entities
    public DbSet<ERPTraining.Core.Entities.Ticketing.TicketTag> TicketTags { get; set; }
    public DbSet<ERPTraining.Core.Entities.Ticketing.GraphEmailConfig> GraphEmailConfigs { get; set; }
    public DbSet<ERPTraining.Core.Entities.Ticketing.TicketFieldSetting> TicketFieldSettings { get; set; }

    // Agent management
    public DbSet<ERPTraining.Core.Entities.Ticketing.Agent> Agents { get; set; }
    public DbSet<TicketAssignment> TicketAssignments { get; set; }
    public DbSet<TicketGroup> TicketGroups { get; set; }
    public DbSet<TicketGroupAgent> TicketGroupAgents { get; set; }

    // Auto Assignment entities
    public DbSet<AutoAssignmentRule> AutoAssignmentRules { get; set; }
    public DbSet<AutoAssignmentRuleAgent> AutoAssignmentRuleAgents { get; set; }
    public DbSet<AutoAssignmentRuleGroup> AutoAssignmentRuleGroups { get; set; }
    public DbSet<AssignmentHistory> AssignmentHistories { get; set; }
    public DbSet<SubcategoryKeyword> SubcategoryKeywords { get; set; }

    // Custom Fields entities
    public DbSet<CustomField> CustomFields { get; set; }
    public DbSet<TicketFieldValue> TicketFieldValues { get; set; }

    // Email Integration entities
    public DbSet<ERPTraining.Core.Entities.Email.EmailSettings> EmailSettings { get; set; }
    public DbSet<EmailMailbox> EmailMailboxes { get; set; }
    public DbSet<EmailProcessingRule> EmailProcessingRules { get; set; }
    
    // Email Configuration entities
    public DbSet<ERPTraining.Core.Entities.Tickets.CategoryEmailMapping> CategoryEmailMappings { get; set; }
    public DbSet<ERPTraining.Core.Entities.Tickets.EmailMonitoringStatus> EmailMonitoringStatuses { get; set; }
    public DbSet<EmailProcessingLog> EmailProcessingLogs { get; set; }
    public DbSet<EmailAttachment> EmailAttachments { get; set; }
    
    // SLA entities
    public DbSet<SlaPolicy> SlaPolicies { get; set; }
    public DbSet<SlaEscalationContact> SlaEscalationContacts { get; set; }
    public DbSet<SlaEscalationLevel> SlaEscalationLevels { get; set; }

    // Notification entities
    public DbSet<UserNotification> UserNotifications { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure array properties to be stored as JSON
        builder.Entity<TrainingModule>()
            .Property(e => e.Prerequisites)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<string>());

        builder.Entity<TrainingModule>()
            .Property(e => e.LearningObjectives)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<string>());

        builder.Entity<TrainingLesson>()
            .Property(e => e.InteractiveSteps)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<string>());

        builder.Entity<TrainingQuestion>()
            .Property(e => e.Options)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<string>());

        builder.Entity<TrainingQuestion>()
            .Property(e => e.CorrectAnswers)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<string>());

        builder.Entity<TrainingUserAnswer>()
            .Property(e => e.SelectedAnswers)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<string>());

        builder.Entity<TrainingUploadedContent>()
            .Property(e => e.Tags)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<string>());

        builder.Entity<TrainingUploadedContent>()
            .Property(e => e.AccessRoles)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions)null!) ?? Array.Empty<string>());

        // Configure relationships
        builder.Entity<TrainingSection>()
            .HasOne(s => s.Module)
            .WithMany(m => m.Sections)
            .HasForeignKey(s => s.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingLesson>()
            .HasOne(l => l.Section)
            .WithMany(s => s.Lessons)
            .HasForeignKey(l => l.SectionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingAssessment>()
            .HasOne(a => a.Module)
            .WithMany(m => m.Assessments)
            .HasForeignKey(a => a.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingAssessment>()
            .HasOne(a => a.Section)
            .WithMany(s => s.Assessments)
            .HasForeignKey(a => a.SectionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TrainingQuestion>()
            .HasOne(q => q.Assessment)
            .WithMany(a => a.Questions)
            .HasForeignKey(q => q.AssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingAssessmentAttempt>()
            .HasOne(aa => aa.User)
            .WithMany(u => u.AssessmentAttempts)
            .HasForeignKey(aa => aa.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingAssessmentAttempt>()
            .HasOne(aa => aa.Assessment)
            .WithMany(a => a.Attempts)
            .HasForeignKey(aa => aa.AssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUserAnswer>()
            .HasOne(ua => ua.AssessmentAttempt)
            .WithMany(aa => aa.UserAnswers)
            .HasForeignKey(ua => ua.AssessmentAttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUserAnswer>()
            .HasOne(ua => ua.Question)
            .WithMany(q => q.UserAnswers)
            .HasForeignKey(ua => ua.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TrainingUserModuleProgress>()
            .HasOne(ump => ump.User)
            .WithMany(u => u.ModuleProgress)
            .HasForeignKey(ump => ump.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUserModuleProgress>()
            .HasOne(ump => ump.Module)
            .WithMany(m => m.UserProgress)
            .HasForeignKey(ump => ump.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUserLessonProgress>()
            .HasOne(ulp => ulp.User)
            .WithMany()
            .HasForeignKey(ulp => ulp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUserLessonProgress>()
            .HasOne(ulp => ulp.Lesson)
            .WithMany(l => l.UserProgress)
            .HasForeignKey(ulp => ulp.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUploadedContent>()
            .HasOne(uc => uc.Module)
            .WithMany()
            .HasForeignKey(uc => uc.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUploadedContent>()
            .HasOne(uc => uc.Section)
            .WithMany()
            .HasForeignKey(uc => uc.SectionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TrainingUploadedContent>()
            .HasOne(uc => uc.UploadedBy)
            .WithMany(u => u.UploadedContents)
            .HasForeignKey(uc => uc.UploadedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure RoleModuleAccess relationships
        builder.Entity<RoleModuleAccess>()
            .HasOne(rma => rma.Module)
            .WithMany()
            .HasForeignKey(rma => rma.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RoleModuleAccess>()
            .HasOne(rma => rma.Section)
            .WithMany()
            .HasForeignKey(rma => rma.SectionId)
            .OnDelete(DeleteBehavior.NoAction);

        // Configure indexes
        builder.Entity<TrainingModule>()
            .HasIndex(m => m.Order);

        builder.Entity<TrainingSection>()
            .HasIndex(s => new { s.ModuleId, s.Order });

        builder.Entity<TrainingLesson>()
            .HasIndex(l => new { l.SectionId, l.Order });

        builder.Entity<TrainingQuestion>()
            .HasIndex(q => new { q.AssessmentId, q.Order });

        builder.Entity<TrainingUserModuleProgress>()
            .HasIndex(ump => new { ump.UserId, ump.ModuleId })
            .IsUnique();

        builder.Entity<TrainingUserLessonProgress>()
            .HasIndex(ulp => new { ulp.UserId, ulp.LessonId })
            .IsUnique();

        builder.Entity<RoleModuleAccess>()
            .HasIndex(rma => new { rma.RoleId, rma.ModuleId, rma.SectionId });

        builder.Entity<RoleModuleAccess>()
            .HasIndex(rma => rma.ErpRoleId);

        // Configure RoleMaster
        builder.Entity<RoleMaster>()
            .ToTable("RoleMasters") // Map to the existing plural table name
            .HasKey(rm => rm.RoleId); // Use RoleId as primary key to match existing database
            
        builder.Entity<RoleMaster>()
            .Property(rm => rm.RoleId)
            .ValueGeneratedOnAdd(); // Auto-increment RoleId
            
        builder.Entity<RoleMaster>()
            .HasIndex(rm => rm.ERPRoleId)
            .IsUnique()
            .HasFilter("[ERPRoleId] IS NOT NULL"); // Unique constraint on ERP Role ID when not null
            
        builder.Entity<RoleMaster>()
            .HasIndex(rm => rm.RoleName);

        // Configure Role entity for LMS/Training module (separate from RoleMaster)
        builder.Entity<Role>()
            .ToTable("Roles"); // LMS Roles table (different from ticketing RoleMasters)

        // Configure ERPRoleDetail
        builder.Entity<ERPRoleDetail>()
            .HasOne(erd => erd.Role)
            .WithMany()
            .HasForeignKey(erd => erd.RoleId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ERPRoleDetail>()
            .HasOne(erd => erd.Module)
            .WithMany()
            .HasForeignKey(erd => erd.ModuleId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ERPRoleDetail>()
            .HasOne(erd => erd.Section)
            .WithMany()
            .HasForeignKey(erd => erd.SectionId)
            .OnDelete(DeleteBehavior.SetNull);

        // Configure indexes for ERPRoleDetail
        builder.Entity<ERPRoleDetail>()
            .HasIndex(erd => new { erd.ERPRoleId, erd.ERPModuleId, erd.ERPTaskId })
            .IsUnique();

        builder.Entity<ERPRoleDetail>()
            .HasIndex(erd => erd.ERPRoleId);

        builder.Entity<ERPRoleDetail>()
            .HasIndex(erd => new { erd.RoleId, erd.ModuleId, erd.SectionId });

        // Configure ERP Integration entities
        builder.Entity<RoleModuleSection>()
            .HasOne(rms => rms.Role)
            .WithMany(r => r.RoleModuleSections)
            .HasForeignKey(rms => rms.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RoleModuleSection>()
            .HasOne(rms => rms.Module)
            .WithMany(m => m.RoleModuleSections)
            .HasForeignKey(rms => rms.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RoleModuleSection>()
            .HasOne(rms => rms.Section)
            .WithMany(s => s.RoleModuleSections)
            .HasForeignKey(rms => rms.SectionId)
            .OnDelete(DeleteBehavior.NoAction);

        // Configure UserRole relationships
        builder.Entity<Core.Entities.UserRole>()
            .HasOne(ur => ur.Role)
            .WithMany()
            .HasForeignKey(ur => ur.RoleId)
            .HasPrincipalKey(r => r.Id)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Core.Entities.UserRole>()
            .HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure indexes for ERP entities
        builder.Entity<RoleModuleSection>()
            .HasIndex(rms => new { rms.RoleId, rms.ModuleId, rms.SectionId })
            .IsUnique();

        builder.Entity<Core.Entities.UserRole>()
            .HasIndex(ur => new { ur.UserId, ur.RoleId })
            .IsUnique();

        // Configure Enhanced Training Platform entities
        // UserContentProgress
        builder.Entity<TrainingUserContentProgress>()
            .HasOne(ucp => ucp.User)
            .WithMany()
            .HasForeignKey(ucp => ucp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUserContentProgress>()
            .HasIndex(ucp => new { ucp.UserId, ucp.ContentId })
            .IsUnique();

        builder.Entity<TrainingUserContentProgress>()
            .HasIndex(ucp => ucp.Status);

        // UserMistakePattern - Entity not found, commenting out
        /*
        builder.Entity<UserMistakePattern>()
            .HasOne(ump => ump.User)
            .WithMany()
            .HasForeignKey(ump => ump.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserMistakePattern>()
            .HasOne(ump => ump.Question)
            .WithMany()
            .HasForeignKey(ump => ump.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<UserMistakePattern>()
            .HasOne(ump => ump.Module)
            .WithMany()
            .HasForeignKey(ump => ump.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserMistakePattern>()
            .HasOne(ump => ump.Section)
            .WithMany()
            .HasForeignKey(ump => ump.SectionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<UserMistakePattern>()
            .HasIndex(ump => new { ump.UserId, ump.QuestionId });

        builder.Entity<UserMistakePattern>()
            .HasIndex(ump => ump.MistakeCategory);
        */

        // TrainingAnnouncement
        builder.Entity<TrainingTrainingAnnouncement>()
            .HasOne(ta => ta.Creator)
            .WithMany()
            .HasForeignKey(ta => ta.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TrainingTrainingAnnouncement>()
            .Property(ta => ta.TargetRoles)
            .HasMaxLength(4000); // Store as JSON string

        builder.Entity<TrainingTrainingAnnouncement>()
            .HasIndex(ta => ta.Priority);

        builder.Entity<TrainingTrainingAnnouncement>()
            .HasIndex(ta => ta.ExpiryDate);

        // UserAnnouncementRead
        builder.Entity<TrainingUserAnnouncementRead>()
            .HasOne(uar => uar.User)
            .WithMany()
            .HasForeignKey(uar => uar.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUserAnnouncementRead>()
            .HasOne(uar => uar.Announcement)
            .WithMany(ta => ta.UserReads)
            .HasForeignKey(uar => uar.AnnouncementId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingUserAnnouncementRead>()
            .HasIndex(uar => new { uar.UserId, uar.AnnouncementId })
            .IsUnique();

        // LearningRecommendation
        builder.Entity<TrainingLearningRecommendation>()
            .HasOne(lr => lr.User)
            .WithMany()
            .HasForeignKey(lr => lr.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingLearningRecommendation>()
            .HasOne(lr => lr.Module)
            .WithMany()
            .HasForeignKey(lr => lr.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingLearningRecommendation>()
            .HasOne(lr => lr.Section)
            .WithMany()
            .HasForeignKey(lr => lr.SectionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TrainingLearningRecommendation>()
            .HasIndex(lr => new { lr.UserId, lr.ModuleId, lr.SectionId });

        builder.Entity<TrainingLearningRecommendation>()
            .HasIndex(lr => lr.RecommendationType);

        builder.Entity<TrainingLearningRecommendation>()
            .HasIndex(lr => lr.Priority);

        // ContentFeedback
        builder.Entity<TrainingContentFeedback>()
            .HasOne(cf => cf.User)
            .WithMany()
            .HasForeignKey(cf => cf.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingContentFeedback>()
            .HasOne(cf => cf.Content)
            .WithMany()
            .HasForeignKey(cf => cf.ContentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TrainingContentFeedback>()
            .HasOne(cf => cf.Assessment)
            .WithMany()
            .HasForeignKey(cf => cf.AssessmentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TrainingContentFeedback>()
            .HasIndex(cf => new { cf.UserId, cf.ContentId, cf.AssessmentId });

        builder.Entity<TrainingContentFeedback>()
            .HasIndex(cf => cf.Rating);

        // Configure Platform Role Management entities
        // PlatformRole
        builder.Entity<PlatformRole>()
            .HasIndex(pr => pr.RoleName)
            .IsUnique();

        // PlatformPermission
        builder.Entity<PlatformPermission>()
            .HasIndex(pp => new { pp.Feature, pp.Action })
            .IsUnique();

        // RolePermission
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

        // UserPlatformRole
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

        // Configure Ticketing entities
        // Ticket
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
            .OnDelete(DeleteBehavior.NoAction); // NoAction to avoid multiple cascade paths

        builder.Entity<Attachment>()
            .HasOne(a => a.UploadedByUser)
            .WithMany()
            .HasForeignKey(a => a.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Attachment>()
            .HasIndex(a => a.TicketId);

        builder.Entity<Attachment>()
            .HasIndex(a => a.CommentId);

        // SLA - Commented out to avoid table conflict with SlaPolicy
        // builder.Entity<SLA>()
        //     .HasIndex(s => new { s.Category, s.Priority })
        //     .IsUnique();

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

        // CategoryEmailMapping
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

        // EmailMonitoringStatus
        builder.Entity<ERPTraining.Core.Entities.Tickets.EmailMonitoringStatus>()
            .HasIndex(ems => ems.Id)
            .IsUnique();

        // AutoAssignmentRule configuration - ignore navigation properties that don't have corresponding columns
        builder.Entity<AutoAssignmentRule>()
            .Ignore(r => r.Category)
            .Ignore(r => r.SubCategory);

        // SLA Policy configuration  
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

        // SLA Escalation Contact configuration
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

        // SLA Escalation Level configuration
        builder.Entity<SlaEscalationLevel>()
            .HasIndex(el => new { el.SlaPolicyId, el.Level })
            .IsUnique();
    }
}
