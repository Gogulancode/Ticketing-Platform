using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities.Tickets;
using ERPTraining.Core.Services.Legacy;
using ERPTraining.Infrastructure.Data;

namespace ERPTraining.Infrastructure.Services.Legacy;

// DEPRECATED LEGACY SERVICE — renamed namespace to avoid conflicts
public class DeprecatedTicketSettingsService : ILegacyTicketSettingsService
{
    private readonly ApplicationDbContext _context;

    public DeprecatedTicketSettingsService(ApplicationDbContext context)
    {
        _context = context;
    }

    #region Category Management

    public async Task<IEnumerable<TicketCategory>> GetCategoriesAsync()
    {
        return await _context.TicketCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
    }

    public async Task<TicketCategory?> GetCategoryByIdAsync(int id)
    {
        return await _context.TicketCategories
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<TicketCategory> CreateCategoryAsync(TicketCategory category)
    {
        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = DateTime.UtcNow;
        
        // Set order if not specified
        if (category.DisplayOrder == 0)
        {
            var maxOrder = await _context.TicketCategories.MaxAsync(c => (int?)c.DisplayOrder) ?? 0;
            category.DisplayOrder = maxOrder + 1;
        }

        _context.TicketCategories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task<TicketCategory> UpdateCategoryAsync(TicketCategory category)
    {
        category.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketCategories.Update(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        var category = await _context.TicketCategories.FindAsync(id);
        if (category == null) return false;

        category.IsActive = false;
        category.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketCategories.Update(category);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Sub-Category Management

    public async Task<IEnumerable<TicketSubCategory>> GetSubCategoriesAsync(int? categoryId = null)
    {
        var query = _context.TicketSubCategories.Where(sc => sc.IsActive);
        
        if (categoryId.HasValue)
        {
            query = query.Where(sc => sc.CategoryId == categoryId.Value);
        }
        
        return await query
            .OrderBy(sc => sc.DisplayOrder)
            .ToListAsync();
    }

    public async Task<TicketSubCategory?> GetSubCategoryByIdAsync(int id)
    {
        return await _context.TicketSubCategories
            .FirstOrDefaultAsync(sc => sc.Id == id);
    }

    public async Task<TicketSubCategory> CreateSubCategoryAsync(TicketSubCategory subCategory)
    {
        subCategory.CreatedAt = DateTime.UtcNow;
        subCategory.UpdatedAt = DateTime.UtcNow;
        
        // Set order if not specified
        if (subCategory.DisplayOrder == 0)
        {
            var maxOrder = await _context.TicketSubCategories
                .Where(sc => sc.CategoryId == subCategory.CategoryId)
                .MaxAsync(sc => (int?)sc.DisplayOrder) ?? 0;
            subCategory.DisplayOrder = maxOrder + 1;
        }

        _context.TicketSubCategories.Add(subCategory);
        await _context.SaveChangesAsync();
        return subCategory;
    }

    public async Task<TicketSubCategory> UpdateSubCategoryAsync(TicketSubCategory subCategory)
    {
        subCategory.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketSubCategories.Update(subCategory);
        await _context.SaveChangesAsync();
        return subCategory;
    }

    public async Task<bool> DeleteSubCategoryAsync(int id)
    {
        var subCategory = await _context.TicketSubCategories.FindAsync(id);
        if (subCategory == null) return false;

        subCategory.IsActive = false;
        subCategory.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketSubCategories.Update(subCategory);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Status Management

    public async Task<IEnumerable<TicketStatus>> GetStatusesAsync()
    {
        return await _context.TicketStatuses
            .Where(s => s.IsActive)
            .OrderBy(s => s.WorkflowOrder)
            .ToListAsync();
    }

    public async Task<TicketStatus?> GetStatusByIdAsync(int id)
    {
        return await _context.TicketStatuses
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<TicketStatus> CreateStatusAsync(TicketStatus status)
    {
        status.CreatedAt = DateTime.UtcNow;
        status.UpdatedAt = DateTime.UtcNow;
        
        // Set sort order if not specified
        if (status.WorkflowOrder == 0)
        {
            var maxOrder = await _context.TicketStatuses.MaxAsync(s => (int?)s.WorkflowOrder) ?? 0;
            status.WorkflowOrder = maxOrder + 1;
        }

        _context.TicketStatuses.Add(status);
        await _context.SaveChangesAsync();
        return status;
    }

    public async Task<TicketStatus> UpdateStatusAsync(TicketStatus status)
    {
        status.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketStatuses.Update(status);
        await _context.SaveChangesAsync();
        return status;
    }

    public async Task<bool> DeleteStatusAsync(int id)
    {
        var status = await _context.TicketStatuses.FindAsync(id);
        if (status == null) return false;

        status.IsActive = false;
        status.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketStatuses.Update(status);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Priority Management

    public async Task<IEnumerable<TicketPriority>> GetPrioritiesAsync()
    {
        return await _context.TicketPriorities
            .Where(p => p.IsActive && !p.IsDeleted)
            .OrderBy(p => p.SortOrder)
            .ToListAsync();
    }

    public async Task<TicketPriority?> GetPriorityByIdAsync(int id)
    {
        return await _context.TicketPriorities
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
    }

    public async Task<TicketPriority> CreatePriorityAsync(TicketPriority priority)
    {
        priority.CreatedAt = DateTime.UtcNow;
        priority.UpdatedAt = DateTime.UtcNow;
        priority.IsDeleted = false;
        
        _context.TicketPriorities.Add(priority);
        await _context.SaveChangesAsync();
        return priority;
    }

    public async Task<TicketPriority> UpdatePriorityAsync(TicketPriority priority)
    {
        priority.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketPriorities.Update(priority);
        await _context.SaveChangesAsync();
        return priority;
    }

    public async Task<bool> DeletePriorityAsync(int id)
    {
        var priority = await _context.TicketPriorities.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (priority == null) return false;

        priority.IsActive = false;
        priority.IsDeleted = true;
        priority.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketPriorities.Update(priority);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Department Management

    public async Task<IEnumerable<TicketDepartment>> GetDepartmentsAsync()
    {
        return await _context.TicketDepartments
            .Where(d => d.IsActive)
            .OrderBy(d => d.SortOrder)
            .ToListAsync();
    }

    public async Task<TicketDepartment?> GetDepartmentByIdAsync(int id)
    {
        return await _context.TicketDepartments
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<TicketDepartment> CreateDepartmentAsync(TicketDepartment department)
    {
        department.CreatedAt = DateTime.UtcNow;
        department.UpdatedAt = DateTime.UtcNow;
        
        // Set order if not specified
        if (department.SortOrder == 0)
        {
            var maxOrder = await _context.TicketDepartments.MaxAsync(d => (int?)d.SortOrder) ?? 0;
            department.SortOrder = maxOrder + 1;
        }

        _context.TicketDepartments.Add(department);
        await _context.SaveChangesAsync();
        return department;
    }

    public async Task<TicketDepartment> UpdateDepartmentAsync(TicketDepartment department)
    {
        department.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketDepartments.Update(department);
        await _context.SaveChangesAsync();
        return department;
    }

    public async Task<bool> DeleteDepartmentAsync(int id)
    {
        var department = await _context.TicketDepartments.FindAsync(id);
        if (department == null) return false;

        department.IsActive = false;
        department.UpdatedAt = DateTime.UtcNow;
        
        _context.TicketDepartments.Update(department);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion
}