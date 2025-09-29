using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Interfaces.Ticketing;

namespace ERPTraining.Infrastructure.Services.Ticketing;

public class GraphEmailConfigService : IGraphEmailConfigService
{
    private readonly ApplicationDbContext _context;

    public GraphEmailConfigService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<GraphEmailConfigDto>> GetAllAsync()
    {
        var configs = await _context.GraphEmailConfigs
            .Where(g => g.IsActive)
            .OrderBy(g => g.Email)
            .ToListAsync();

        return configs.Select(MapToDto);
    }

    public async Task<GraphEmailConfigDto?> GetByIdAsync(int id)
    {
        var config = await _context.GraphEmailConfigs
            .Include(g => g.Category)
            .FirstOrDefaultAsync(g => g.Id == id && g.IsActive);

        return config != null ? MapToDto(config) : null;
    }

    public async Task<GraphEmailConfig?> GetEntityByIdAsync(int id)
    {
        return await _context.GraphEmailConfigs
            .FirstOrDefaultAsync(g => g.Id == id && g.IsActive);
    }

    public async Task<GraphEmailConfigDto?> GetActiveByCategoryIdAsync(int? categoryId)
    {
        var config = await _context.GraphEmailConfigs
            .Include(g => g.Category)
            .FirstOrDefaultAsync(g => g.CategoryId == categoryId && g.IsActive && g.ProcessIncomingEmails);

        return config != null ? MapToDto(config) : null;
    }

    public async Task<GraphEmailConfigDto> CreateAsync(CreateGraphEmailConfigDto dto)
    {
        // Check for duplicate email address
        var existingConfig = await _context.GraphEmailConfigs
            .FirstOrDefaultAsync(g => g.Email == dto.Email && g.IsActive);

        if (existingConfig != null)
        {
            throw new InvalidOperationException($"Email configuration for '{dto.Email}' already exists.");
        }

        var config = new GraphEmailConfig
        {
            TenantId = dto.TenantId,
            ClientId = dto.ClientId,
            ClientSecret = dto.ClientSecret,
            Email = dto.Email,
            CategoryId = dto.CategoryId,
            ProcessIncomingEmails = dto.ProcessIncomingEmails,
            CreateTicketsFromEmails = dto.CreateTicketsFromEmails,
            SendNotifications = dto.SendNotifications,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.GraphEmailConfigs.Add(config);
        await _context.SaveChangesAsync();

        return MapToDto(config);
    }

    public async Task<GraphEmailConfigDto> UpdateAsync(int id, UpdateGraphEmailConfigDto dto)
    {
        var config = await _context.GraphEmailConfigs
            .FirstOrDefaultAsync(g => g.Id == id && g.IsActive);

        if (config == null)
            throw new InvalidOperationException($"Email configuration with ID {id} not found");

        // Check for duplicate email address (excluding current config)
        var existingConfig = await _context.GraphEmailConfigs
            .FirstOrDefaultAsync(g => g.Email == dto.Email && g.Id != id && g.IsActive);

        if (existingConfig != null)
        {
            throw new InvalidOperationException($"Email configuration for '{dto.Email}' already exists.");
        }

        config.TenantId = dto.TenantId;
        config.ClientId = dto.ClientId;
        config.ClientSecret = dto.ClientSecret;
        config.Email = dto.Email;
        config.CategoryId = dto.CategoryId;
        config.ProcessIncomingEmails = dto.ProcessIncomingEmails;
        config.CreateTicketsFromEmails = dto.CreateTicketsFromEmails;
        config.SendNotifications = dto.SendNotifications;
        config.IsActive = dto.IsActive;
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(config);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var config = await _context.GraphEmailConfigs
            .FirstOrDefaultAsync(g => g.Id == id && g.IsActive);

        if (config == null)
            return false;

        // Soft delete
        config.IsActive = false;
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> TestConnectionAsync(int id)
    {
        var config = await _context.GraphEmailConfigs
            .FirstOrDefaultAsync(g => g.Id == id && g.IsActive);

        if (config == null)
            return false;

        // TODO: Implement actual connection test logic
        // For now, just return true if config exists
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.GraphEmailConfigs
            .AnyAsync(g => g.Id == id && g.IsActive);
    }

    private static GraphEmailConfigDto MapToDto(GraphEmailConfig config)
    {
        return new GraphEmailConfigDto
        {
            Id = config.Id,
            TenantId = config.TenantId,
            ClientId = config.ClientId,
            Email = config.Email,
            IsActive = config.IsActive,
            CategoryId = config.CategoryId,
            CategoryName = config.Category != null ? "Category" : string.Empty,
            ProcessIncomingEmails = config.ProcessIncomingEmails,
            CreateTicketsFromEmails = config.CreateTicketsFromEmails,
            SendNotifications = config.SendNotifications,
            CreatedAt = config.CreatedAt,
            UpdatedAt = config.UpdatedAt
        };
    }
}