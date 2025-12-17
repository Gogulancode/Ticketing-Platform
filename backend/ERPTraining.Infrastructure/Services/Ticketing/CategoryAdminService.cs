using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;
using ERPTraining.Infrastructure.Data;
using TicketCategory = ERPTraining.Core.Entities.Tickets.TicketCategory;

namespace ERPTraining.Infrastructure.Services.Ticketing;

/// <summary>
/// Service for managing Category Admins
/// </summary>
public class CategoryAdminService : ICategoryAdminService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CategoryAdminService> _logger;

    public CategoryAdminService(ApplicationDbContext context, ILogger<CategoryAdminService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<CategoryAdmin>> GetAllAsync()
    {
        return await _context.CategoryAdmins
            .Include(ca => ca.User)
            .Include(ca => ca.Category)
            .Where(ca => ca.IsActive)
            .OrderBy(ca => ca.Category!.Name)
            .ThenBy(ca => ca.User!.FirstName)
            .ToListAsync();
    }

    public async Task<CategoryAdmin?> GetByIdAsync(int id)
    {
        return await _context.CategoryAdmins
            .Include(ca => ca.User)
            .Include(ca => ca.Category)
            .FirstOrDefaultAsync(ca => ca.Id == id);
    }

    public async Task<IEnumerable<CategoryAdmin>> GetByUserIdAsync(string userId)
    {
        return await _context.CategoryAdmins
            .Include(ca => ca.Category)
            .Where(ca => ca.UserId == userId && ca.IsActive)
            .OrderBy(ca => ca.Category!.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<CategoryAdmin>> GetByCategoryIdAsync(int categoryId)
    {
        return await _context.CategoryAdmins
            .Include(ca => ca.User)
            .Where(ca => ca.CategoryId == categoryId && ca.IsActive)
            .OrderBy(ca => ca.User!.FirstName)
            .ToListAsync();
    }

    public async Task<bool> IsCategoryAdminAsync(string userId)
    {
        return await _context.CategoryAdmins
            .AnyAsync(ca => ca.UserId == userId && ca.IsActive);
    }

    public async Task<bool> IsCategoryAdminForCategoryAsync(string userId, int categoryId)
    {
        return await _context.CategoryAdmins
            .AnyAsync(ca => ca.UserId == userId && ca.CategoryId == categoryId && ca.IsActive);
    }

    public async Task<IEnumerable<int>> GetAdminCategoryIdsAsync(string userId)
    {
        return await _context.CategoryAdmins
            .Where(ca => ca.UserId == userId && ca.IsActive)
            .Select(ca => ca.CategoryId)
            .ToListAsync();
    }

    public async Task<CategoryAdmin> CreateAsync(CategoryAdminCreateRequest request)
    {
        // Check if already exists
        var existing = await _context.CategoryAdmins
            .FirstOrDefaultAsync(ca => ca.UserId == request.UserId && ca.CategoryId == request.CategoryId);

        if (existing != null)
        {
            if (!existing.IsActive)
            {
                // Reactivate existing record
                existing.IsActive = true;
                existing.CanViewTickets = request.CanViewTickets;
                existing.CanManageAgents = request.CanManageAgents;
                existing.CanViewReports = request.CanViewReports;
                existing.CanManageSubcategories = request.CanManageSubcategories;
                existing.CanConfigureSettings = request.CanConfigureSettings;
                existing.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return existing;
            }
            throw new InvalidOperationException("User is already a category admin for this category");
        }

        var categoryAdmin = new CategoryAdmin
        {
            UserId = request.UserId,
            CategoryId = request.CategoryId,
            CanViewTickets = request.CanViewTickets,
            CanManageAgents = request.CanManageAgents,
            CanViewReports = request.CanViewReports,
            CanManageSubcategories = request.CanManageSubcategories,
            CanConfigureSettings = request.CanConfigureSettings,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CategoryAdmins.Add(categoryAdmin);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created category admin: User {UserId} for Category {CategoryId}", 
            request.UserId, request.CategoryId);

        return categoryAdmin;
    }

    public async Task<CategoryAdmin?> UpdateAsync(int id, CategoryAdminUpdateRequest request)
    {
        var categoryAdmin = await _context.CategoryAdmins.FindAsync(id);
        if (categoryAdmin == null)
            return null;

        if (request.CanViewTickets.HasValue)
            categoryAdmin.CanViewTickets = request.CanViewTickets.Value;
        if (request.CanManageAgents.HasValue)
            categoryAdmin.CanManageAgents = request.CanManageAgents.Value;
        if (request.CanViewReports.HasValue)
            categoryAdmin.CanViewReports = request.CanViewReports.Value;
        if (request.CanManageSubcategories.HasValue)
            categoryAdmin.CanManageSubcategories = request.CanManageSubcategories.Value;
        if (request.CanConfigureSettings.HasValue)
            categoryAdmin.CanConfigureSettings = request.CanConfigureSettings.Value;
        if (request.IsActive.HasValue)
            categoryAdmin.IsActive = request.IsActive.Value;

        categoryAdmin.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated category admin {Id}", id);

        return categoryAdmin;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var categoryAdmin = await _context.CategoryAdmins.FindAsync(id);
        if (categoryAdmin == null)
            return false;

        // Soft delete by deactivating
        categoryAdmin.IsActive = false;
        categoryAdmin.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted (deactivated) category admin {Id}", id);

        return true;
    }

    public async Task<CategoryAdminPermissions> GetPermissionsAsync(string userId)
    {
        var categoryAdmins = await _context.CategoryAdmins
            .Include(ca => ca.Category)
            .Where(ca => ca.UserId == userId && ca.IsActive)
            .ToListAsync();

        return new CategoryAdminPermissions
        {
            UserId = userId,
            IsCategoryAdmin = categoryAdmins.Any(),
            CategoryIds = categoryAdmins.Select(ca => ca.CategoryId).ToList(),
            Categories = categoryAdmins.Select(ca => new CategoryPermission
            {
                CategoryId = ca.CategoryId,
                CategoryName = ca.Category?.Name ?? "",
                CanViewTickets = ca.CanViewTickets,
                CanManageAgents = ca.CanManageAgents,
                CanViewReports = ca.CanViewReports,
                CanManageSubcategories = ca.CanManageSubcategories,
                CanConfigureSettings = ca.CanConfigureSettings
            }).ToList()
        };
    }
}
