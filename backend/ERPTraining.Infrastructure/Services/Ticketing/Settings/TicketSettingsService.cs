using ERPTraining.Core.Entities.Tickets;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ERPTraining.Infrastructure.Services.Ticketing.Settings;

public class TicketSettingsService : IA_TicketSettingsService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<TicketSettingsService> _logger;
    private readonly IMemoryCache _cache;
    private static readonly string CategoriesCacheKey = "ticket_settings_categories_active";
    private static string SubCategoriesCacheKey(int categoryId) => $"ticket_settings_subcategories_active_{categoryId}";
    private static readonly string DepartmentsCacheKey = "ticket_settings_departments_active";
    private static readonly string PrioritiesCacheKey = "ticket_settings_priorities_active";
    private static readonly string StatusesCacheKey = "ticket_settings_statuses_active";
    // Groups currently have no cache (filters vary by category/subcategory)

    public TicketSettingsService(ApplicationDbContext db, ILogger<TicketSettingsService> logger, IMemoryCache cache)
    {
        _db = db;
        _logger = logger;
        _cache = cache;
    }

    public async Task<IReadOnlyList<TicketCategory>> GetCategoriesAsync(bool includeInactive = false)
    {
        if (!includeInactive)
        {
            if (_cache.TryGetValue(CategoriesCacheKey, out IReadOnlyList<TicketCategory>? cached) && cached is not null)
                return cached;
        }

        IQueryable<TicketCategory> query = _db.TicketCategories
            .AsNoTracking()
            .Where(c => !c.IsDeleted);
        if (!includeInactive)
            query = query.Where(c => c.IsActive);

        var list = await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();

        if (!includeInactive)
        {
            _cache.Set(CategoriesCacheKey, list, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });
        }

        return list;
    }

    public async Task<TicketCategory?> GetCategoryAsync(int id)
    {
        // Single lookups are cheap; no cache (avoid stale state complexity for now)
        return await _db.TicketCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
    }

    public async Task<TicketCategory> CreateCategoryAsync(TicketCategory category, CancellationToken ct = default)
    {
        _logger.LogInformation("CreateCategoryAsync called for category: {Name}", category.Name);
        
        // Check if an inactive category with the same name exists
        var existingInactive = await _db.TicketCategories
            .FirstOrDefaultAsync(c => c.Name == category.Name && !c.IsActive, ct);
        
        if (existingInactive != null)
        {
            _logger.LogInformation("Found existing inactive category with name {Name}. Reactivating it.", category.Name);
            
            // Reactivate the existing category with new properties
            existingInactive.IsActive = true;
            existingInactive.IsDeleted = false;
            existingInactive.Description = category.Description;
            existingInactive.Color = category.Color;
            existingInactive.IconName = category.IconName;
            existingInactive.UpdatedAt = DateTime.UtcNow;
            
            if (category.DisplayOrder > 0)
            {
                existingInactive.DisplayOrder = category.DisplayOrder;
            }
            
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Reactivated category {Name} with ID {Id}", existingInactive.Name, existingInactive.Id);
            
            InvalidateCache();
            return existingInactive;
        }
        
        // Create new category
        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = category.CreatedAt;
        category.IsDeleted = false;

        if (category.DisplayOrder == 0)
        {
            var maxOrder = await _db.TicketCategories.MaxAsync(c => (int?)c.DisplayOrder, ct) ?? 0;
            category.DisplayOrder = maxOrder + 1;
        }

        _db.TicketCategories.Add(category);
        
        _logger.LogInformation("About to save category {Name} with DisplayOrder {DisplayOrder}", 
            category.Name, category.DisplayOrder);
        
        var rowsAffected = await _db.SaveChangesAsync(ct);
        
        _logger.LogInformation("SaveChangesAsync completed. Rows affected: {RowsAffected}, Category ID: {Id}", 
            rowsAffected, category.Id);
        
        if (rowsAffected == 0)
        {
            _logger.LogWarning("SaveChangesAsync returned 0 rows affected for category {Name}!", category.Name);
        }
        
        InvalidateCache();
        return category;
    }

    public async Task<TicketCategory?> UpdateCategoryAsync(int id, Action<TicketCategory> mutate, CancellationToken ct = default)
    {
        var entity = await _db.TicketCategories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
        if (entity == null) return null;

        mutate(entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        return entity;
    }

    public async Task<bool> SoftDeleteCategoryAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TicketCategories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
        if (entity == null) return false;
        // Always mark the record as deleted even if it was already inactive so the
        // category disappears from "includeInactive" lists as well.
        if (entity.IsActive)
        {
            entity.IsActive = false;
        }
        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        InvalidateCache();
        return true;
    }

    private void InvalidateCache() => _cache.Remove(CategoriesCacheKey);

    // ============ SubCategories ============
    public async Task<IReadOnlyList<TicketSubCategory>> GetSubCategoriesAsync(int? categoryId = null, bool includeInactive = false)
    {
        if (!includeInactive && categoryId.HasValue)
        {
            var key = SubCategoriesCacheKey(categoryId.Value);
            if (_cache.TryGetValue(key, out IReadOnlyList<TicketSubCategory>? cached) && cached is not null)
                return cached;
        }

        IQueryable<TicketSubCategory> query = _db.TicketSubCategories
            .AsNoTracking()
            .Where(sc => !sc.IsDeleted);
        if (categoryId.HasValue)
            query = query.Where(sc => sc.CategoryId == categoryId.Value);
        if (!includeInactive)
            query = query.Where(sc => sc.IsActive);

        var list = await query
            .OrderBy(sc => sc.DisplayOrder)
            .ThenBy(sc => sc.Name)
            .ToListAsync();

        if (!includeInactive && categoryId.HasValue)
        {
            _cache.Set(SubCategoriesCacheKey(categoryId.Value), list, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });
        }

        return list;
    }

    public async Task<TicketSubCategory?> GetSubCategoryAsync(int id)
    {
        return await _db.TicketSubCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(sc => sc.Id == id && !sc.IsDeleted);
    }

    public async Task<TicketSubCategory> CreateSubCategoryAsync(TicketSubCategory subCategory, CancellationToken ct = default)
    {
        _logger.LogInformation("CreateSubCategoryAsync called for subcategory: {Name}, CategoryId: {CategoryId}", 
            subCategory.Name, subCategory.CategoryId);
        
        // Check if an inactive subcategory with the same name and category exists
        var existingInactive = await _db.TicketSubCategories
            .FirstOrDefaultAsync(sc => sc.Name == subCategory.Name && 
                                      sc.CategoryId == subCategory.CategoryId && 
                                      !sc.IsActive, ct);
        
        if (existingInactive != null)
        {
            _logger.LogInformation("Found existing inactive subcategory with name {Name} for category {CategoryId}. Reactivating it.", 
                subCategory.Name, subCategory.CategoryId);
            
            // Reactivate the existing subcategory with new properties
            existingInactive.IsActive = true;
            existingInactive.IsDeleted = false;
            existingInactive.Description = subCategory.Description;
            existingInactive.UpdatedAt = DateTime.UtcNow;
            
            if (subCategory.DisplayOrder > 0)
            {
                existingInactive.DisplayOrder = subCategory.DisplayOrder;
            }
            
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Reactivated subcategory {Name} with ID {Id}", existingInactive.Name, existingInactive.Id);
            
            // Invalidate category-specific cache
            _cache.Remove(SubCategoriesCacheKey(existingInactive.CategoryId));
            return existingInactive;
        }
        
        // Create new subcategory
        subCategory.CreatedAt = DateTime.UtcNow;
        subCategory.UpdatedAt = subCategory.CreatedAt;
        subCategory.IsDeleted = false;

        if (subCategory.DisplayOrder == 0)
        {
            var max = await _db.TicketSubCategories
                .Where(sc => sc.CategoryId == subCategory.CategoryId)
                .MaxAsync(sc => (int?)sc.DisplayOrder, ct) ?? 0;
            subCategory.DisplayOrder = max + 1;
        }

        _db.TicketSubCategories.Add(subCategory);
        
        _logger.LogInformation("About to save subcategory {Name} with DisplayOrder {DisplayOrder}", 
            subCategory.Name, subCategory.DisplayOrder);
        
        var rowsAffected = await _db.SaveChangesAsync(ct);
        
        _logger.LogInformation("SaveChangesAsync completed. Rows affected: {RowsAffected}, SubCategory ID: {Id}", 
            rowsAffected, subCategory.Id);
        
        if (rowsAffected == 0)
        {
            _logger.LogWarning("SaveChangesAsync returned 0 rows affected for subcategory {Name}!", subCategory.Name);
        }
        
        // Invalidate category-specific cache
        _cache.Remove(SubCategoriesCacheKey(subCategory.CategoryId));
        return subCategory;
    }

    public async Task<TicketSubCategory?> UpdateSubCategoryAsync(int id, Action<TicketSubCategory> mutate, CancellationToken ct = default)
    {
        var entity = await _db.TicketSubCategories.FirstOrDefaultAsync(sc => sc.Id == id && !sc.IsDeleted, ct);
        if (entity == null) return null;
        mutate(entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _cache.Remove(SubCategoriesCacheKey(entity.CategoryId));
        return entity;
    }

    public async Task<bool> SoftDeleteSubCategoryAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TicketSubCategories.FirstOrDefaultAsync(sc => sc.Id == id && !sc.IsDeleted, ct);
        if (entity == null) return false;
        entity.IsActive = false;
        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _cache.Remove(SubCategoriesCacheKey(entity.CategoryId));
        return true;
    }

    // ============ Departments ============
    public async Task<IReadOnlyList<TicketDepartment>> GetDepartmentsAsync(bool includeInactive = false)
    {
        if (!includeInactive)
        {
            if (_cache.TryGetValue(DepartmentsCacheKey, out IReadOnlyList<TicketDepartment>? cached) && cached is not null)
                return cached;
        }

        IQueryable<TicketDepartment> query = _db.TicketDepartments.AsNoTracking();
        if (!includeInactive)
            query = query.Where(d => d.IsActive);

        var list = await query
            .OrderBy(d => d.SortOrder)
            .ThenBy(d => d.Name)
            .ToListAsync();

        if (!includeInactive)
        {
            _cache.Set(DepartmentsCacheKey, list, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });
        }

        return list;
    }

    public async Task<TicketDepartment?> GetDepartmentAsync(int id)
    {
        return await _db.TicketDepartments.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<TicketDepartment> CreateDepartmentAsync(TicketDepartment department, CancellationToken ct = default)
    {
        // Check if an inactive department with the same name exists
        var existingInactive = await _db.TicketDepartments
            .FirstOrDefaultAsync(d => d.Name == department.Name && !d.IsActive, ct);
        
        if (existingInactive != null)
        {
            _logger.LogInformation("Found existing inactive department with name {Name}. Reactivating it.", department.Name);
            
            // Reactivate the existing department
            existingInactive.IsActive = true;
            existingInactive.Description = department.Description;
            existingInactive.UpdatedAt = DateTime.UtcNow;
            
            if (department.SortOrder > 0)
            {
                existingInactive.SortOrder = department.SortOrder;
            }
            
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Reactivated department {Name} with ID {Id}", existingInactive.Name, existingInactive.Id);
            
            _cache.Remove(DepartmentsCacheKey);
            return existingInactive;
        }
        
        // Create new department
        department.CreatedAt = DateTime.UtcNow;
        department.UpdatedAt = department.CreatedAt;

        if (department.SortOrder == 0)
        {
            var max = await _db.TicketDepartments.MaxAsync(d => (int?)d.SortOrder, ct) ?? 0;
            department.SortOrder = max + 1;
        }

        _db.TicketDepartments.Add(department);
        await _db.SaveChangesAsync(ct);
        _cache.Remove(DepartmentsCacheKey);
        return department;
    }

    public async Task<TicketDepartment?> UpdateDepartmentAsync(int id, Action<TicketDepartment> mutate, CancellationToken ct = default)
    {
        var entity = await _db.TicketDepartments.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (entity == null) return null;
        mutate(entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _cache.Remove(DepartmentsCacheKey);
        return entity;
    }

    public async Task<bool> SoftDeleteDepartmentAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TicketDepartments.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (entity == null) return false;
        if (!entity.IsActive) return true;
        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _cache.Remove(DepartmentsCacheKey);
        return true;
    }

    // ============ Priorities ============
    public async Task<IReadOnlyList<TicketPriority>> GetPrioritiesAsync(bool includeInactive = false)
    {
        if (!includeInactive)
        {
            if (_cache.TryGetValue(PrioritiesCacheKey, out IReadOnlyList<TicketPriority>? cached) && cached is not null)
                return cached;
        }

        IQueryable<TicketPriority> query = _db.TicketPriorities
            .AsNoTracking()
            .Where(p => !p.IsDeleted);
        if (!includeInactive)
            query = query.Where(p => p.IsActive);

        var list = await query
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Level)
            .ThenBy(p => p.Name)
            .ToListAsync();

        if (!includeInactive)
        {
            _cache.Set(PrioritiesCacheKey, list, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });
        }

        return list;
    }

    public async Task<TicketPriority?> GetPriorityAsync(int id)
    {
        return await _db.TicketPriorities
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
    }

    public async Task<TicketPriority> CreatePriorityAsync(TicketPriority priority, CancellationToken ct = default)
    {
        // Check if an inactive priority with the same name exists
        var existingInactive = await _db.TicketPriorities
            .FirstOrDefaultAsync(p => p.Name == priority.Name && (!p.IsActive || p.IsDeleted), ct);
        
        if (existingInactive != null)
        {
            _logger.LogInformation("Found existing inactive priority with name {Name}. Reactivating it.", priority.Name);
            
            // Reactivate the existing priority
            existingInactive.IsActive = true;
            existingInactive.Description = priority.Description;
            existingInactive.Color = priority.Color;
            existingInactive.Level = priority.Level;
            existingInactive.IsDeleted = false;
            existingInactive.UpdatedAt = DateTime.UtcNow;
            
            if (priority.SortOrder > 0)
            {
                existingInactive.SortOrder = priority.SortOrder;
            }
            
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Reactivated priority {Name} with ID {Id}", existingInactive.Name, existingInactive.Id);
            
            _cache.Remove(PrioritiesCacheKey);
            return existingInactive;
        }
        
        // Create new priority
        priority.CreatedAt = DateTime.UtcNow;
        priority.UpdatedAt = priority.CreatedAt;
        priority.IsDeleted = false;

        if (priority.SortOrder == 0)
        {
            var max = await _db.TicketPriorities.MaxAsync(p => (int?)p.SortOrder, ct) ?? 0;
            priority.SortOrder = max + 1;
        }

        _db.TicketPriorities.Add(priority);
        await _db.SaveChangesAsync(ct);
        _cache.Remove(PrioritiesCacheKey);
        return priority;
    }

    public async Task<TicketPriority?> UpdatePriorityAsync(int id, Action<TicketPriority> mutate, CancellationToken ct = default)
    {
        var entity = await _db.TicketPriorities.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
        if (entity == null) return null;
        mutate(entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _cache.Remove(PrioritiesCacheKey);
        return entity;
    }

    public async Task<bool> SoftDeletePriorityAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TicketPriorities.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
        if (entity == null) return false;
        entity.IsActive = false;
        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _cache.Remove(PrioritiesCacheKey);
        return true;
    }

    // ============ Statuses ============
    public async Task<IReadOnlyList<TicketStatus>> GetStatusesAsync(bool includeInactive = false)
    {
        if (!includeInactive)
        {
            if (_cache.TryGetValue(StatusesCacheKey, out IReadOnlyList<TicketStatus>? cached) && cached is not null)
                return cached;
        }

        IQueryable<TicketStatus> query = _db.TicketStatuses.AsNoTracking().Where(s => !s.IsDeleted);
        if (!includeInactive)
            query = query.Where(s => s.IsActive);

        var list = await query
            .OrderBy(s => s.WorkflowOrder)
            .ThenBy(s => s.Name)
            .ToListAsync();

        if (!includeInactive)
        {
            _cache.Set(StatusesCacheKey, list, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });
        }

        return list;
    }

    public async Task<TicketStatus?> GetStatusAsync(int id)
    {
        return await _db.TicketStatuses.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<TicketStatus> CreateStatusAsync(TicketStatus status, CancellationToken ct = default)
    {
        // If this status is being set as default, remove default from all others
        if (status.IsDefault)
        {
            var currentDefaults = await _db.TicketStatuses.Where(s => s.IsDefault).ToListAsync(ct);
            foreach (var defaultStatus in currentDefaults)
            {
                defaultStatus.IsDefault = false;
                defaultStatus.UpdatedAt = DateTime.UtcNow;
            }
        }
        
        // Check if an inactive status with the same name exists
        var existingInactive = await _db.TicketStatuses
            .FirstOrDefaultAsync(s => s.Name == status.Name && !s.IsActive, ct);
        
        if (existingInactive != null)
        {
            _logger.LogInformation("Found existing inactive status with name {Name}. Reactivating it.", status.Name);
            
            // Reactivate the existing status
            existingInactive.IsActive = true;
            existingInactive.Color = status.Color;
            existingInactive.IsClosedStatus = status.IsClosedStatus;
            existingInactive.IsDefault = status.IsDefault;
            existingInactive.AllowedTransitions = status.AllowedTransitions;
            existingInactive.UpdatedAt = DateTime.UtcNow;
            
            if (status.WorkflowOrder > 0)
            {
                existingInactive.WorkflowOrder = status.WorkflowOrder;
            }
            
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Reactivated status {Name} with ID {Id}", existingInactive.Name, existingInactive.Id);
            
            _cache.Remove(StatusesCacheKey);
            return existingInactive;
        }
        
        // Create new status
        status.CreatedAt = DateTime.UtcNow;
        status.UpdatedAt = status.CreatedAt;

        if (status.WorkflowOrder == 0)
        {
            var max = await _db.TicketStatuses.MaxAsync(s => (int?)s.WorkflowOrder, ct) ?? 0;
            status.WorkflowOrder = max + 1;
        }

        _db.TicketStatuses.Add(status);
        await _db.SaveChangesAsync(ct);
        _cache.Remove(StatusesCacheKey);
        return status;
    }

    public async Task<TicketStatus?> UpdateStatusAsync(int id, Action<TicketStatus> mutate, CancellationToken ct = default)
    {
        var entity = await _db.TicketStatuses.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (entity == null) return null;
        
        // Store the old default state
        var wasDefault = entity.IsDefault;
        
        mutate(entity);
        entity.UpdatedAt = DateTime.UtcNow;
        
        // If this status is being set as default, remove default from all others
        if (entity.IsDefault && !wasDefault)
        {
            var otherDefaults = await _db.TicketStatuses
                .Where(s => s.IsDefault && s.Id != id)
                .ToListAsync(ct);
            
            foreach (var defaultStatus in otherDefaults)
            {
                defaultStatus.IsDefault = false;
                defaultStatus.UpdatedAt = DateTime.UtcNow;
            }
        }
        
        await _db.SaveChangesAsync(ct);
        _cache.Remove(StatusesCacheKey);
        return entity;
    }

    public async Task<bool> SoftDeleteStatusAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TicketStatuses.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (entity == null) return false;
        
        // If already inactive, mark as deleted
        if (!entity.IsActive)
        {
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            _cache.Remove(StatusesCacheKey);
            return true;
        }
        
        // Otherwise, just mark as inactive (soft delete)
        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _cache.Remove(StatusesCacheKey);
        return true;
    }

    // ============ Issue Types ============
    private static readonly string IssueTypesCacheKey = "ticket_settings_issuetypes_active";

    public async Task<IReadOnlyList<IssueType>> GetIssueTypesAsync(bool includeInactive = false)
    {
        if (!includeInactive)
        {
            if (_cache.TryGetValue(IssueTypesCacheKey, out IReadOnlyList<IssueType>? cached) && cached is not null)
                return cached;
        }

        IQueryable<IssueType> query = _db.IssueTypes.AsNoTracking();
        if (!includeInactive)
            query = query.Where(it => it.IsActive);

        var list = await query
            .OrderBy(it => it.DisplayOrder)
            .ThenBy(it => it.Name)
            .ToListAsync();

        if (!includeInactive)
        {
            _cache.Set(IssueTypesCacheKey, list, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });
        }

        return list;
    }

    public async Task<IssueType?> GetIssueTypeAsync(int id)
    {
        return await _db.IssueTypes.AsNoTracking().FirstOrDefaultAsync(it => it.Id == id);
    }

    public async Task<IssueType> CreateIssueTypeAsync(IssueType issueType, CancellationToken ct = default)
    {
        issueType.CreatedAt = DateTime.UtcNow;
        issueType.UpdatedAt = issueType.CreatedAt;
        _db.IssueTypes.Add(issueType);
        await _db.SaveChangesAsync(ct);
        _cache.Remove(IssueTypesCacheKey);
        return issueType;
    }

    public async Task<IssueType?> UpdateIssueTypeAsync(int id, Action<IssueType> mutate, CancellationToken ct = default)
    {
        var entity = await _db.IssueTypes.FirstOrDefaultAsync(it => it.Id == id, ct);
        if (entity == null) return null;
        mutate(entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _cache.Remove(IssueTypesCacheKey);
        return entity;
    }

    public async Task<bool> SoftDeleteIssueTypeAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.IssueTypes.FirstOrDefaultAsync(it => it.Id == id, ct);
        if (entity == null) return false;
        if (!entity.IsActive) return true;
        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _cache.Remove(IssueTypesCacheKey);
        return true;
    }

    // ============ Groups ============
    public async Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.TicketGroup>> GetGroupsAsync(int? categoryId = null, int? subCategoryId = null, bool includeInactive = false)
    {
        IQueryable<ERPTraining.Core.Entities.Ticketing.TicketGroup> query = _db.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .AsNoTracking();

        if (categoryId.HasValue)
            query = query.Where(g => g.CategoryId == categoryId.Value);
        if (subCategoryId.HasValue)
            query = query.Where(g => g.SubCategoryId == subCategoryId.Value);
        if (!includeInactive)
            query = query.Where(g => g.IsActive);

        return await query
            .OrderBy(g => g.CategoryId)
            .ThenBy(g => g.SubCategoryId)
            .ThenBy(g => g.Name)
            .ToListAsync();
    }

    public async Task<ERPTraining.Core.Entities.Ticketing.TicketGroup?> GetGroupAsync(int id)
    {
        return await _db.TicketGroups
            .Include(g => g.Category)
            .Include(g => g.SubCategory)
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<ERPTraining.Core.Entities.Ticketing.TicketGroup> CreateGroupAsync(ERPTraining.Core.Entities.Ticketing.TicketGroup group, CancellationToken ct = default)
    {
        group.CreatedAt = DateTime.UtcNow;
        group.UpdatedAt = group.CreatedAt;
        _db.TicketGroups.Add(group);
        await _db.SaveChangesAsync(ct);
        return group;
    }

    public async Task<ERPTraining.Core.Entities.Ticketing.TicketGroup?> UpdateGroupAsync(int id, Action<ERPTraining.Core.Entities.Ticketing.TicketGroup> mutate, CancellationToken ct = default)
    {
        var entity = await _db.TicketGroups.FirstOrDefaultAsync(g => g.Id == id, ct);
        if (entity == null) return null;
        mutate(entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<bool> SoftDeleteGroupAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TicketGroups.FirstOrDefaultAsync(g => g.Id == id, ct);
        if (entity == null) return false;
        if (!entity.IsActive) return true;
        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ============ Agents ============
    public async Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.Agent>> GetAgentsAsync(bool includeInactive = false)
    {
        IQueryable<ERPTraining.Core.Entities.Ticketing.Agent> q = _db.Agents.AsNoTracking();
        if (!includeInactive) q = q.Where(a => a.IsActive);
        return await q
            .OrderBy(a => a.Name)
            .ThenBy(a => a.Email)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.Agent>> GetUnassignedAgentsAsync(bool includeInactive = false)
    {
        var query = _db.Agents.AsNoTracking()
            .Where(a => a.AgentGroupId == null);
        
        if (!includeInactive)
        {
            query = query.Where(a => a.IsActive);
        }
        
        return await query
            .OrderBy(a => a.Name)
            .ThenBy(a => a.Email)
            .ToListAsync();
    }

    public async Task<ERPTraining.Core.Entities.Ticketing.Agent?> GetAgentAsync(int id)
    {
        return await _db.Agents.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<bool> UpdateAgentStatusAsync(int agentId, bool isActive, CancellationToken ct = default)
    {
        var agent = await _db.Agents.FirstOrDefaultAsync(a => a.Id == agentId, ct);
        if (agent == null)
        {
            return false;
        }

        var now = DateTime.UtcNow;
        if (!isActive)
        {
            agent.AvailabilityStatus = "Unavailable";
        }
        else if (string.IsNullOrWhiteSpace(agent.AvailabilityStatus) || string.Equals(agent.AvailabilityStatus, "Unavailable", System.StringComparison.OrdinalIgnoreCase))
        {
            agent.AvailabilityStatus = "Available";
        }

        agent.IsActive = isActive;
        agent.UpdatedAt = now;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == agent.UserId, ct);
        if (user != null)
        {
            if (user.IsAgent != isActive)
            {
                user.IsAgent = isActive;
            }

            user.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.TicketGroup>> GetGroupsForAgentAsync(int agentId, bool includeInactive = false)
    {
        // Query memberships for the agent and include the TicketGroup with Category/SubCategory and members
        var q = _db.TicketGroupAgents
            .Include(ga => ga.TicketGroup)
                .ThenInclude(g => g.Category)
            .Include(ga => ga.TicketGroup)
                .ThenInclude(g => g.SubCategory)
            .Include(ga => ga.TicketGroup)
                .ThenInclude(g => g.GroupAgents)
            .AsNoTracking()
            .Where(ga => ga.AgentId == agentId);

        if (!includeInactive)
        {
            q = q.Where(ga => ga.IsActive && ga.TicketGroup.IsActive);
        }

        var groups = await q
            .Select(ga => ga.TicketGroup)
            .Distinct()
            .OrderBy(g => g.CategoryId)
            .ThenBy(g => g.SubCategoryId)
            .ThenBy(g => g.Name)
            .ToListAsync();

        return groups;
    }
    public async Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.TicketGroupAgent>> GetGroupMembershipsForAgentsAsync(IEnumerable<int> agentIds, bool includeInactive = false)
    {
        var ids = agentIds.Distinct().ToList();
        if (!ids.Any()) return Array.Empty<ERPTraining.Core.Entities.Ticketing.TicketGroupAgent>();

        IQueryable<ERPTraining.Core.Entities.Ticketing.TicketGroupAgent> q = _db.TicketGroupAgents
            .Include(ga => ga.TicketGroup)
                .ThenInclude(g => g.Category)
            .Include(ga => ga.TicketGroup)
                .ThenInclude(g => g.SubCategory)
            .AsNoTracking()
            .Where(ga => ids.Contains(ga.AgentId));

        if (!includeInactive)
            q = q.Where(ga => ga.IsActive && ga.TicketGroup.IsActive);

        return await q.ToListAsync();
    }
    // ============ Group Membership (TicketGroupAgents) ============
    public async Task<IReadOnlyList<ERPTraining.Core.Entities.Ticketing.TicketGroupAgent>> GetGroupMembersAsync(int groupId, bool includeInactive = false)
    {
        IQueryable<ERPTraining.Core.Entities.Ticketing.TicketGroupAgent> q = _db.TicketGroupAgents
            .Include(ga => ga.Agent)
            .AsNoTracking()
            .Where(ga => ga.TicketGroupId == groupId);
        if (!includeInactive) q = q.Where(ga => ga.IsActive);
        return await q
            .OrderBy(ga => ga.Agent.Name)
            .ToListAsync();
    }

    public async Task<ERPTraining.Core.Entities.Ticketing.TicketGroupAgent> AddAgentToGroupAsync(int groupId, int agentId, CancellationToken ct = default)
    {
        // Ensure no duplicate membership
        var exists = await _db.TicketGroupAgents.AnyAsync(x => x.TicketGroupId == groupId && x.AgentId == agentId && x.IsActive, ct);
        if (exists)
        {
            // Return existing membership (reactivate if needed)
            var existing = await _db.TicketGroupAgents.FirstAsync(x => x.TicketGroupId == groupId && x.AgentId == agentId, ct);
            if (!existing.IsActive) { existing.IsActive = true; existing.AssignedAt = DateTime.UtcNow; await _db.SaveChangesAsync(ct); }
            return existing;
        }

        var member = new ERPTraining.Core.Entities.Ticketing.TicketGroupAgent
        {
            TicketGroupId = groupId,
            AgentId = agentId,
            IsActive = true,
            AssignedAt = DateTime.UtcNow
        };
        _db.TicketGroupAgents.Add(member);
        await _db.SaveChangesAsync(ct);
        return member;
    }

    public async Task<bool> RemoveAgentFromGroupAsync(int groupMemberId, CancellationToken ct = default)
    {
        var entity = await _db.TicketGroupAgents.FirstOrDefaultAsync(x => x.Id == groupMemberId, ct);
        if (entity == null) return false;
        if (!entity.IsActive) return true;
        entity.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
