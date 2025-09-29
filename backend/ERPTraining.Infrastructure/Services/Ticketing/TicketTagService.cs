using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class TicketTagService : ITicketTagService
{
    private readonly ApplicationDbContext _context;

    public TicketTagService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TicketTagDto>> GetAllAsync()
    {
        var tags = await _context.TicketTags
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .ToListAsync();

        // For now, return with placeholder subcategory names to avoid navigation issues
        return tags.Select(tag => new TicketTagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            SubCategoryId = tag.SubCategoryId,
            SubCategoryName = $"SubCategory {tag.SubCategoryId}", // Temporary placeholder
            IsActive = tag.IsActive,
            CreatedAt = tag.CreatedAt,
            UpdatedAt = tag.UpdatedAt
        });
    }

    public async Task<TicketTagDto?> GetByIdAsync(int id)
    {
        var tag = await _context.TicketTags
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

        if (tag == null) return null;

        return new TicketTagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            SubCategoryId = tag.SubCategoryId,
            SubCategoryName = $"SubCategory {tag.SubCategoryId}", // Temporary placeholder
            IsActive = tag.IsActive,
            CreatedAt = tag.CreatedAt,
            UpdatedAt = tag.UpdatedAt
        };
    }

    public async Task<TicketTagDto> CreateAsync(CreateTicketTagDto dto)
    {
        // Check for duplicate name
        var existingTag = await _context.TicketTags
            .FirstOrDefaultAsync(t => t.Name == dto.Name && t.IsActive);

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

        // Return a simple DTO without loading navigation properties for now
        return new TicketTagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            SubCategoryId = tag.SubCategoryId,
            SubCategoryName = "Unknown", // Temporary - will fix navigation later
            IsActive = tag.IsActive,
            CreatedAt = tag.CreatedAt,
            UpdatedAt = tag.UpdatedAt
        };
    }

    public async Task<TicketTagDto> UpdateAsync(int id, UpdateTicketTagDto dto)
    {
        var tag = await _context.TicketTags
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

        if (tag == null)
            throw new InvalidOperationException($"Tag with ID {id} not found");

        // Check for duplicate name (excluding current tag)
        var existingTag = await _context.TicketTags
            .FirstOrDefaultAsync(t => t.Name == dto.Name && t.Id != id && t.IsActive);

        if (existingTag != null)
        {
            throw new InvalidOperationException($"Tag with name '{dto.Name}' already exists.");
        }

        tag.Name = dto.Name;
        tag.SubCategoryId = dto.SubCategoryId;
        tag.IsActive = dto.IsActive;
        tag.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Return updated tag without navigation properties
        return new TicketTagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            SubCategoryId = tag.SubCategoryId,
            SubCategoryName = $"SubCategory {tag.SubCategoryId}", // Temporary placeholder
            IsActive = tag.IsActive,
            CreatedAt = tag.CreatedAt,
            UpdatedAt = tag.UpdatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var tag = await _context.TicketTags
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

        if (tag == null)
            return false;

        // Soft delete
        tag.IsActive = false;
        tag.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<TicketTagDto>> GetBySubCategoryIdAsync(int subCategoryId)
    {
        var tags = await _context.TicketTags
            .Where(t => t.SubCategoryId == subCategoryId && t.IsActive)
            .OrderBy(t => t.Name)
            .ToListAsync();

        return tags.Select(tag => new TicketTagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            SubCategoryId = tag.SubCategoryId,
            SubCategoryName = $"SubCategory {tag.SubCategoryId}", // Temporary placeholder
            IsActive = tag.IsActive,
            CreatedAt = tag.CreatedAt,
            UpdatedAt = tag.UpdatedAt
        });
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.TicketTags
            .AnyAsync(t => t.Id == id && t.IsActive);
    }

    // MapToDto method temporarily removed due to navigation property issues
    // TODO: Re-implement after fixing entity namespace conflicts
}