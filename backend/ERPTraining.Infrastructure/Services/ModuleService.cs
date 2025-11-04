using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using TrainingModule = ERPTraining.Core.Training.Entities.Module;

namespace ERPTraining.Infrastructure.Services;

public class ModuleService : IModuleService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ModuleService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ModuleDto>> GetAllModulesAsync(string userId)
    {
        var modules = await _context.Modules
            .Include(m => m.Sections)
                .ThenInclude(s => s.Lessons)
            .Where(m => m.IsActive)
            .OrderBy(m => m.Order)
            .ToListAsync();

        var moduleDtos = _mapper.Map<List<ModuleDto>>(modules);

        // Get user progress for each module
        var userProgress = await _context.UserModuleProgress
            .Where(ump => ump.UserId == userId)
            .ToListAsync();

        foreach (var moduleDto in moduleDtos)
        {
            var progress = userProgress.FirstOrDefault(up => up.ModuleId == moduleDto.Id);
            moduleDto.Progress = (int)(progress?.CompletionPercentage ?? 0);
            
            // Check if module is locked based on prerequisites
            moduleDto.IsLocked = await IsModuleLockedAsync(moduleDto.Id, userId);
        }

        return moduleDtos;
    }

    public async Task<ModuleDto?> GetModuleByIdAsync(int id, string userId)
    {
        var module = await _context.Modules
            .Include(m => m.Sections)
                .ThenInclude(s => s.Lessons)
            .FirstOrDefaultAsync(m => m.Id == id && m.IsActive);

        if (module == null) return null;

        var moduleDto = _mapper.Map<ModuleDto>(module);

        // Get user progress
        var progress = await _context.UserModuleProgress
            .FirstOrDefaultAsync(ump => ump.UserId == userId && ump.ModuleId == id);

        moduleDto.Progress = (int)(progress?.CompletionPercentage ?? 0);
        moduleDto.IsLocked = await IsModuleLockedAsync(id, userId);

        return moduleDto;
    }

    public async Task<ModuleDto> CreateModuleAsync(CreateModuleDto createModuleDto)
    {
        var module = _mapper.Map<TrainingModule>(createModuleDto);
        module.CreatedAt = DateTime.UtcNow;
        module.UpdatedAt = DateTime.UtcNow;

        _context.Modules.Add(module);
        await _context.SaveChangesAsync();

        return _mapper.Map<ModuleDto>(module);
    }

    public async Task<ModuleDto?> UpdateModuleAsync(int id, UpdateModuleDto updateModuleDto)
    {
        var module = await _context.Modules.FindAsync(id);
        if (module == null) return null;

        _mapper.Map(updateModuleDto, module);
        module.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return _mapper.Map<ModuleDto>(module);
    }

    public async Task<bool> DeleteModuleAsync(int id)
    {
        var module = await _context.Modules.FindAsync(id);
        if (module == null) return false;

        _context.Modules.Remove(module);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ModuleDto>> GetUserModulesWithProgressAsync(string userId)
    {
        return await GetAllModulesAsync(userId);
    }

    private async Task<bool> IsModuleLockedAsync(int moduleId, string userId)
    {
        var module = await _context.Modules.FindAsync(moduleId);
        if (module == null || module.Prerequisites.Length == 0) return false;

        var completedModules = await _context.UserModuleProgress
            .Where(ump => ump.UserId == userId && ump.IsCompleted)
            .Select(ump => ump.ModuleId.ToString())
            .ToListAsync();

        return !module.Prerequisites.All(prereq => completedModules.Contains(prereq));
    }
}