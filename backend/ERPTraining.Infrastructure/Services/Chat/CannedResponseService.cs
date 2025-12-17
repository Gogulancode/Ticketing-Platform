using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.Entities.Chat;
using ERPTraining.Core.Interfaces.Chat;
using ERPTraining.Infrastructure.Data;

namespace ERPTraining.Infrastructure.Services.Chat;

/// <summary>
/// Service for managing canned responses (quick reply templates)
/// </summary>
public class CannedResponseService : ICannedResponseService
{
    private readonly ApplicationDbContext _context;

    public CannedResponseService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CannedResponseDto> CreateAsync(string userId, CreateCannedResponseDto dto)
    {
        var response = new CannedResponse
        {
            Title = dto.Title,
            Shortcut = dto.Shortcut,
            Content = dto.Content,
            Category = dto.Category,
            OwnerId = dto.IsPersonal ? userId : null,
            IsPersonal = dto.IsPersonal
        };

        _context.Set<CannedResponse>().Add(response);
        await _context.SaveChangesAsync();

        return MapToDto(response);
    }

    public async Task<CannedResponseDto> UpdateAsync(int id, string userId, CreateCannedResponseDto dto)
    {
        var response = await _context.Set<CannedResponse>().FindAsync(id);
        
        if (response == null)
            throw new InvalidOperationException("Canned response not found");

        // Check ownership for personal responses
        if (response.IsPersonal && response.OwnerId != userId)
            throw new InvalidOperationException("Cannot update another user's response");

        response.Title = dto.Title;
        response.Shortcut = dto.Shortcut;
        response.Content = dto.Content;
        response.Category = dto.Category;
        response.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(response);
    }

    public async Task DeleteAsync(int id, string userId)
    {
        var response = await _context.Set<CannedResponse>().FindAsync(id);
        
        if (response == null)
            return;

        // Check ownership for personal responses
        if (response.IsPersonal && response.OwnerId != userId)
            throw new InvalidOperationException("Cannot delete another user's response");

        _context.Set<CannedResponse>().Remove(response);
        await _context.SaveChangesAsync();
    }

    public async Task<CannedResponseDto?> GetByIdAsync(int id, string userId)
    {
        var response = await _context.Set<CannedResponse>()
            .FirstOrDefaultAsync(r => r.Id == id && r.IsActive && 
                (!r.IsPersonal || r.OwnerId == userId));

        return response == null ? null : MapToDto(response);
    }

    public async Task<List<CannedResponseDto>> GetUserResponsesAsync(string userId, string? category = null)
    {
        var query = _context.Set<CannedResponse>()
            .Where(r => r.IsActive && r.IsPersonal && r.OwnerId == userId);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(r => r.Category == category);

        var responses = await query
            .OrderByDescending(r => r.UsageCount)
            .ThenBy(r => r.Title)
            .ToListAsync();

        return responses.Select(MapToDto).ToList();
    }

    public async Task<List<CannedResponseDto>> GetSharedResponsesAsync(string? category = null)
    {
        var query = _context.Set<CannedResponse>()
            .Where(r => r.IsActive && !r.IsPersonal);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(r => r.Category == category);

        var responses = await query
            .OrderByDescending(r => r.UsageCount)
            .ThenBy(r => r.Title)
            .ToListAsync();

        return responses.Select(MapToDto).ToList();
    }

    public async Task<List<CannedResponseDto>> SearchResponsesAsync(string userId, string query)
    {
        var lowerQuery = query.ToLower();

        var responses = await _context.Set<CannedResponse>()
            .Where(r => r.IsActive && (!r.IsPersonal || r.OwnerId == userId))
            .Where(r => r.Title.ToLower().Contains(lowerQuery) || 
                        r.Content.ToLower().Contains(lowerQuery) ||
                        (r.Shortcut != null && r.Shortcut.ToLower().Contains(lowerQuery)))
            .OrderByDescending(r => r.UsageCount)
            .Take(20)
            .ToListAsync();

        return responses.Select(MapToDto).ToList();
    }

    public async Task IncrementUsageAsync(int id)
    {
        var response = await _context.Set<CannedResponse>().FindAsync(id);
        if (response != null)
        {
            response.UsageCount++;
            response.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    private static CannedResponseDto MapToDto(CannedResponse response)
    {
        return new CannedResponseDto
        {
            Id = response.Id,
            Title = response.Title,
            Shortcut = response.Shortcut,
            Content = response.Content,
            Category = response.Category,
            IsPersonal = response.IsPersonal,
            UsageCount = response.UsageCount
        };
    }
}
