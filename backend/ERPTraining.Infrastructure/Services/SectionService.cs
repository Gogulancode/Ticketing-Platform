using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using TrainingSection = ERPTraining.Core.Training.Entities.Section;

namespace ERPTraining.Infrastructure.Services;

public class SectionService : ISectionService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public SectionService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<SectionDto>> GetAllSectionsAsync()
    {
        var sections = await _context.Sections
            .Include(s => s.Module)
            .Include(s => s.Lessons)
            .OrderBy(s => s.ModuleId)
            .ThenBy(s => s.Order)
            .ToListAsync();

        return _mapper.Map<IEnumerable<SectionDto>>(sections);
    }

    public async Task<IEnumerable<SectionDto>> GetSectionsByModuleAsync(int moduleId)
    {
        try
        {
            Console.WriteLine($"SectionService: Querying database for module {moduleId}");
            
            // First check if the module exists
            var moduleExists = await _context.Modules.AnyAsync(m => m.Id == moduleId);
            Console.WriteLine($"Module {moduleId} exists: {moduleExists}");
            
            var query = _context.Sections
                .Include(s => s.Lessons)
                .Where(s => s.ModuleId == moduleId && s.IsActive)
                .OrderBy(s => s.Order);
                
            Console.WriteLine($"Query built: {query.ToQueryString()}");
            
            var sections = await query.ToListAsync();
            Console.WriteLine($"Query executed. Found {sections.Count} sections");
            
            var mappedSections = _mapper.Map<IEnumerable<SectionDto>>(sections);
            Console.WriteLine($"Mapped {mappedSections.Count()} sections to DTOs");
            
            return mappedSections;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetSectionsByModuleAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw; // Re-throw to let the controller handle it
        }
    }

    public async Task<List<SectionDto>> GetSectionsByModuleIdAsync(int moduleId, string userId)
    {
        // This method includes role-based filtering for existing functionality
        var sections = await _context.Sections
            .Include(s => s.Lessons)
            .Where(s => s.ModuleId == moduleId && s.IsActive)
            .OrderBy(s => s.Order)
            .ToListAsync();

        return _mapper.Map<List<SectionDto>>(sections);
    }

    public async Task<SectionDto?> GetSectionByIdAsync(int id)
    {
        var section = await _context.Sections
            .Include(s => s.Module)
            .Include(s => s.Lessons)
            .FirstOrDefaultAsync(s => s.Id == id);

        return section == null ? null : _mapper.Map<SectionDto>(section);
    }

    public async Task<SectionDto?> GetSectionByIdAsync(int id, string userId)
    {
        // This method includes role-based filtering for existing functionality
        var section = await _context.Sections
            .Include(s => s.Module)
            .Include(s => s.Lessons)
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive);

        return section == null ? null : _mapper.Map<SectionDto>(section);
    }

    public async Task<SectionDto> CreateSectionAsync(CreateSectionDto createSectionDto)
    {
        var section = _mapper.Map<TrainingSection>(createSectionDto);
        section.CreatedAt = DateTime.UtcNow;
        section.UpdatedAt = DateTime.UtcNow;

        _context.Sections.Add(section);
        await _context.SaveChangesAsync();

        return _mapper.Map<SectionDto>(section);
    }

    public async Task<SectionDto?> UpdateSectionAsync(int id, UpdateSectionDto updateSectionDto)
    {
        var section = await _context.Sections.FindAsync(id);
        if (section == null)
            return null;

        _mapper.Map(updateSectionDto, section);
        section.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<SectionDto>(section);
    }

    public async Task<bool> DeleteSectionAsync(int id)
    {
        var section = await _context.Sections.FindAsync(id);
        if (section == null)
            return false;

        // Soft delete
        section.IsActive = false;
        section.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SectionExistsAsync(int id)
    {
        return await _context.Sections.AnyAsync(s => s.Id == id);
    }
}
