using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;

namespace ERPTraining.Infrastructure.Services;

public class RoleMasterService : IRoleMasterService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly RoleManager<IdentityRole> _roleManager;

    public RoleMasterService(ApplicationDbContext context, IMapper mapper, RoleManager<IdentityRole> roleManager)
    {
        _context = context;
        _mapper = mapper;
        _roleManager = roleManager;
    }

    public async Task<IEnumerable<RoleMasterDto>> GetAllAsync()
    {
        var roles = await _context.RoleMasters.OrderBy(r => r.RoleName).ToListAsync();
        // Load all identity roles once to avoid N+1
        var identityRoles = _roleManager.Roles.ToDictionary(r => r.Name!, r => r);
        return roles.Select(r =>
        {
            var dto = _mapper.Map<RoleMasterDto>(r);
            if (identityRoles.TryGetValue(r.RoleName, out var ir))
            {
                dto.IdentityRoleId = ir.Id;
            }
            return dto;
        });
    }

    public async Task<RoleMasterDto?> GetByIdAsync(int id)
    {
        var entity = await _context.RoleMasters.FindAsync(id);
    if (entity == null) return null;
    var dto = _mapper.Map<RoleMasterDto>(entity);
    var identityRole = await _roleManager.FindByNameAsync(entity.RoleName);
    dto.IdentityRoleId = identityRole?.Id;
    return dto;
    }

    public async Task<RoleMasterDto> CreateAsync(CreateRoleMasterDto dto)
    {
        var entity = new RoleMaster
        {
            RoleName = dto.Name.Trim(),
            Remarks = dto.Description,
            IsActive = dto.IsActive,
            IsERPRole = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.RoleMasters.Add(entity);
        await _context.SaveChangesAsync();

        var existingIdentityRole = await _roleManager.FindByNameAsync(entity.RoleName);
        if (existingIdentityRole == null)
        {
            await _roleManager.CreateAsync(new IdentityRole(entity.RoleName));
        }

    var resultDto = _mapper.Map<RoleMasterDto>(entity);
    var identity = await _roleManager.FindByNameAsync(entity.RoleName);
    resultDto.IdentityRoleId = identity?.Id;
    return resultDto;
    }

    public async Task<RoleMasterDto?> UpdateAsync(int id, UpdateRoleMasterDto dto)
    {
        var entity = await _context.RoleMasters.FindAsync(id);
        if (entity == null) return null;

        var oldName = entity.RoleName;
        entity.RoleName = dto.Name.Trim();
        entity.Remarks = dto.Description;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        if (!string.Equals(oldName, entity.RoleName, StringComparison.OrdinalIgnoreCase))
        {
            var identityRole = await _roleManager.FindByNameAsync(oldName);
            if (identityRole != null)
            {
                identityRole.Name = entity.RoleName;
                identityRole.NormalizedName = entity.RoleName.ToUpperInvariant();
                await _roleManager.UpdateAsync(identityRole);
            }
            else
            {
                await _roleManager.CreateAsync(new IdentityRole(entity.RoleName));
            }
        }

    var resultDto = _mapper.Map<RoleMasterDto>(entity);
    var identity = await _roleManager.FindByNameAsync(entity.RoleName);
    resultDto.IdentityRoleId = identity?.Id;
    return resultDto;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.RoleMasters.FindAsync(id);
        if (entity == null) return false;

        _context.RoleMasters.Remove(entity);
        await _context.SaveChangesAsync();

        var stillReferenced = await _context.RoleMasters.AnyAsync(r => r.RoleName == entity.RoleName);
        if (!stillReferenced)
        {
            var identityRole = await _roleManager.FindByNameAsync(entity.RoleName);
            if (identityRole != null)
            {
                await _roleManager.DeleteAsync(identityRole);
            }
        }
        return true;
    }

    public async Task<bool> ToggleStatusAsync(int id, bool isActive)
    {
        var entity = await _context.RoleMasters.FindAsync(id);
        if (entity == null) return false;
        entity.IsActive = isActive;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }
}
