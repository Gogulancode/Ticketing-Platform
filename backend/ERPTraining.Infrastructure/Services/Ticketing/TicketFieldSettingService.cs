using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class TicketFieldSettingService : ITicketFieldSettingService
{
    private readonly ApplicationDbContext _context;

    public TicketFieldSettingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TicketFieldSettingDto>> GetAllAsync()
    {
        var fieldSettings = await _context.TicketFieldSettings
            .Where(f => f.IsActive)
            .OrderBy(f => f.DisplayOrder)
            .ThenBy(f => f.FieldName)
            .ToListAsync();

        return fieldSettings.Select(MapToDto);
    }

    public async Task<IEnumerable<TicketFieldSettingDto>> GetByCategoryIdAsync(int categoryId)
    {
        var fieldSettings = await _context.TicketFieldSettings
            .Where(f => f.CategoryId == categoryId && f.IsActive)
            .OrderBy(f => f.DisplayOrder)
            .ThenBy(f => f.FieldName)
            .ToListAsync();

        return fieldSettings.Select(MapToDto);
    }

    public async Task<TicketFieldSettingDto?> GetByIdAsync(int id)
    {
        var fieldSetting = await _context.TicketFieldSettings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        return fieldSetting != null ? MapToDto(fieldSetting) : null;
    }

    public async Task<TicketFieldSettingDto> CreateAsync(CreateTicketFieldSettingDto dto)
    {
        // Check for duplicate field name
        var existingField = await _context.TicketFieldSettings
            .FirstOrDefaultAsync(f => f.FieldName == dto.FieldName && f.IsActive);

        if (existingField != null)
        {
            throw new InvalidOperationException($"Field with name '{dto.FieldName}' already exists.");
        }

        // Set display order if not provided
        if (dto.DisplayOrder == 0)
        {
            var maxOrder = await _context.TicketFieldSettings
                .Where(f => f.IsActive)
                .MaxAsync(f => (int?)f.DisplayOrder) ?? 0;
            dto.DisplayOrder = maxOrder + 1;
        }

        var fieldSetting = new TicketFieldSetting
        {
            CategoryId = dto.CategoryId,
            FieldName = dto.FieldName,
            FieldType = dto.FieldType,
            IsMandatory = dto.IsMandatory,
            Options = dto.Options,
            PlaceholderText = dto.PlaceholderText,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TicketFieldSettings.Add(fieldSetting);
        await _context.SaveChangesAsync();

        return MapToDto(fieldSetting);
    }

    public async Task<TicketFieldSettingDto> UpdateAsync(int id, UpdateTicketFieldSettingDto dto)
    {
        var fieldSetting = await _context.TicketFieldSettings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        if (fieldSetting == null)
            throw new InvalidOperationException($"Field setting with ID {id} not found");

        // Check for duplicate field name (excluding current field)
        var existingField = await _context.TicketFieldSettings
            .FirstOrDefaultAsync(f => f.FieldName == dto.FieldName && f.Id != id && f.IsActive);

        if (existingField != null)
        {
            throw new InvalidOperationException($"Field with name '{dto.FieldName}' already exists.");
        }

        fieldSetting.CategoryId = dto.CategoryId;
        fieldSetting.FieldName = dto.FieldName;
        fieldSetting.FieldType = dto.FieldType;
        fieldSetting.IsMandatory = dto.IsMandatory;
        fieldSetting.Options = dto.Options;
        fieldSetting.PlaceholderText = dto.PlaceholderText;
        fieldSetting.DisplayOrder = dto.DisplayOrder;
        fieldSetting.IsActive = dto.IsActive;
        fieldSetting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(fieldSetting);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var fieldSetting = await _context.TicketFieldSettings
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive);

        if (fieldSetting == null)
            return false;

        // Soft delete
        fieldSetting.IsActive = false;
        fieldSetting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.TicketFieldSettings
            .AnyAsync(f => f.Id == id && f.IsActive);
    }

    public async Task<bool> ReorderFieldsAsync(int categoryId, List<int> fieldIds)
    {
        // Get all field settings for the category
        var fieldSettings = await _context.TicketFieldSettings
            .Where(f => fieldIds.Contains(f.Id) && f.IsActive)
            .ToListAsync();

        if (fieldSettings.Count != fieldIds.Count)
        {
            return false; // Some field IDs were not found
        }

        // Update display order based on the provided order
        for (int i = 0; i < fieldIds.Count; i++)
        {
            var fieldSetting = fieldSettings.First(f => f.Id == fieldIds[i]);
            fieldSetting.DisplayOrder = i + 1;
            fieldSetting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static TicketFieldSettingDto MapToDto(TicketFieldSetting fieldSetting)
    {
        return new TicketFieldSettingDto
        {
            Id = fieldSetting.Id,
            CategoryId = fieldSetting.CategoryId,
            CategoryName = fieldSetting.Category != null ? "Category" : string.Empty,
            FieldName = fieldSetting.FieldName,
            FieldType = fieldSetting.FieldType,
            IsMandatory = fieldSetting.IsMandatory,
            IsActive = fieldSetting.IsActive,
            Options = fieldSetting.Options,
            PlaceholderText = fieldSetting.PlaceholderText,
            DisplayOrder = fieldSetting.DisplayOrder,
            CreatedAt = fieldSetting.CreatedAt,
            UpdatedAt = fieldSetting.UpdatedAt
        };
    }
}