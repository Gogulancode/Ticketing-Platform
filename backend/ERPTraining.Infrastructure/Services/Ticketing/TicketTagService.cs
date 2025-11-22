using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;
using System.Collections.Generic;
using System.Linq;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class TicketTagService : ITicketTagService
{
    private readonly ApplicationDbContext _context;

    public TicketTagService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TicketTagDto>> GetAllAsync(bool includeInactive = false)
    {
        var tags = await _context.TicketTags
            .AsNoTracking()
            .Where(t => !t.IsDeleted && (includeInactive || t.IsActive))
            .OrderBy(t => t.Name)
            .ToListAsync();

        var subcategoryIds = tags.Select(t => t.SubCategoryId).Distinct().ToList();
        var lookups = await BuildLookupDictionariesAsync(subcategoryIds);

        return tags.Select(tag => MapToDto(tag, lookups.Subcategories, lookups.Categories));
    }

    public async Task<TicketTagDto?> GetByIdAsync(int id)
    {
        var tag = await _context.TicketTags
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (tag == null) return null;

        var lookups = await BuildLookupDictionariesAsync(new[] { tag.SubCategoryId });
        return MapToDto(tag, lookups.Subcategories, lookups.Categories);
    }

    public async Task<TicketTagDto> CreateAsync(CreateTicketTagDto dto)
    {
        // Check for duplicate name
        var existingTag = await _context.TicketTags
            .FirstOrDefaultAsync(t => t.Name == dto.Name && t.IsActive && !t.IsDeleted);

        if (existingTag != null)
        {
            throw new InvalidOperationException($"Tag with name '{dto.Name}' already exists.");
        }

        var tag = new TicketTag
        {
            Name = dto.Name,
            SubCategoryId = dto.SubCategoryId,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TicketTags.Add(tag);
        await _context.SaveChangesAsync();

        var lookups = await BuildLookupDictionariesAsync(new[] { tag.SubCategoryId });
        return MapToDto(tag, lookups.Subcategories, lookups.Categories);
    }

    public async Task<TicketTagDto> UpdateAsync(int id, UpdateTicketTagDto dto)
    {
        var tag = await _context.TicketTags
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (tag == null)
            throw new InvalidOperationException($"Tag with ID {id} not found");

        // Only check for duplicate if name is being changed
        if (!string.IsNullOrWhiteSpace(dto.Name) && !tag.Name.Equals(dto.Name, StringComparison.OrdinalIgnoreCase))
        {
            var existingTag = await _context.TicketTags
                .FirstOrDefaultAsync(t => t.Name == dto.Name && t.Id != id && t.IsActive && !t.IsDeleted);

            if (existingTag != null)
            {
                throw new InvalidOperationException($"An active tag with the name '{dto.Name}' already exists.");
            }
        }

        // Update properties
        tag.Name = dto.Name;
        tag.SubCategoryId = dto.SubCategoryId;
        tag.IsActive = dto.IsActive;
        tag.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var lookups = await BuildLookupDictionariesAsync(new[] { tag.SubCategoryId });
        return MapToDto(tag, lookups.Subcategories, lookups.Categories);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var tag = await _context.TicketTags
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (tag == null)
            return false;

        tag.IsActive = false;
        tag.IsDeleted = true;
        tag.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<TicketTagDto>> GetBySubCategoryIdAsync(int subCategoryId)
    {
        var tags = await _context.TicketTags
            .AsNoTracking()
            .Where(t => t.SubCategoryId == subCategoryId && t.IsActive && !t.IsDeleted)
            .OrderBy(t => t.Name)
            .ToListAsync();

        var lookups = await BuildLookupDictionariesAsync(new[] { subCategoryId });
        return tags.Select(tag => MapToDto(tag, lookups.Subcategories, lookups.Categories));
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.TicketTags
            .AnyAsync(t => t.Id == id && t.IsActive && !t.IsDeleted);
    }

    private async Task<(Dictionary<int, SubcategoryLookup> Subcategories, Dictionary<int, string> Categories)> BuildLookupDictionariesAsync(IEnumerable<int> subcategoryIds)
    {
        var ids = subcategoryIds?.Distinct().Where(id => id > 0).ToList() ?? new List<int>();
        if (ids.Count == 0)
        {
            return (new Dictionary<int, SubcategoryLookup>(), new Dictionary<int, string>());
        }

        var subcategoryRecords = await _context.TicketSubCategories
            .AsNoTracking()
            .Where(sc => ids.Contains(sc.Id))
            .Select(sc => new { sc.Id, sc.Name, sc.CategoryId })
            .ToListAsync();

        var subcategoryLookup = subcategoryRecords.ToDictionary(
            sc => sc.Id,
            sc => new SubcategoryLookup(sc.Name, sc.CategoryId));

        var categoryIds = subcategoryRecords.Select(sc => sc.CategoryId).Distinct().ToList();
        Dictionary<int, string> categoryLookup = new();

        if (categoryIds.Count > 0)
        {
            var categoryRecords = await _context.TicketCategories
                .AsNoTracking()
                .Where(cat => categoryIds.Contains(cat.Id))
                .Select(cat => new { cat.Id, cat.Name })
                .ToListAsync();

            categoryLookup = categoryRecords.ToDictionary(cat => cat.Id, cat => cat.Name);
        }

        return (subcategoryLookup, categoryLookup);
    }

    private static TicketTagDto MapToDto(
        TicketTag tag,
        IReadOnlyDictionary<int, SubcategoryLookup> subcategories,
        IReadOnlyDictionary<int, string> categories)
    {
        subcategories.TryGetValue(tag.SubCategoryId, out var subcategoryInfo);
        var categoryName = subcategoryInfo != null && categories.TryGetValue(subcategoryInfo.CategoryId, out var mappedCategory)
            ? mappedCategory
            : string.Empty;

        return new TicketTagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            SubCategoryId = tag.SubCategoryId,
            SubCategoryName = subcategoryInfo?.Name ?? string.Empty,
            CategoryName = categoryName,
            IsActive = tag.IsActive,
            IsDeleted = tag.IsDeleted,
            CreatedAt = tag.CreatedAt,
            UpdatedAt = tag.UpdatedAt
        };
    }

    private sealed record SubcategoryLookup(string Name, int CategoryId);
}