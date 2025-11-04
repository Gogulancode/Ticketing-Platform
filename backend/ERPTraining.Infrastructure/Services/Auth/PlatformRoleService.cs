using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERPTraining.Infrastructure.Services
{
    public class PlatformRoleService : IPlatformRoleService
    {
        private readonly ApplicationDbContext _context;

        public PlatformRoleService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PlatformRoleDto>> GetAllRolesAsync()
        {
            var roles = await _context.PlatformRoles
                .Include(r => r.Permissions)
                    .ThenInclude(rp => rp.PlatformPermission)
                .Where(r => r.IsActive)
                .OrderBy(r => r.RoleName)
                .ToListAsync();

            return roles.Select(r => new PlatformRoleDto
            {
                Id = r.Id,
                RoleName = r.RoleName,
                Description = r.Description,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                Permissions = r.Permissions
                    .Where(rp => rp.IsActive && rp.PlatformPermission.IsActive)
                    .Select(rp => new PlatformPermissionDto
                    {
                        Id = rp.PlatformPermission.Id,
                        PermissionName = rp.PlatformPermission.PermissionName,
                        Feature = rp.PlatformPermission.Feature,
                        Action = rp.PlatformPermission.Action,
                        Description = rp.PlatformPermission.Description,
                        IsActive = rp.PlatformPermission.IsActive
                    }).ToList()
            });
        }

        public async Task<PlatformRoleDto?> GetRoleByIdAsync(int id)
        {
            var role = await _context.PlatformRoles
                .Include(r => r.Permissions)
                    .ThenInclude(rp => rp.PlatformPermission)
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

            if (role == null) return null;

            return new PlatformRoleDto
            {
                Id = role.Id,
                RoleName = role.RoleName,
                Description = role.Description,
                IsActive = role.IsActive,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt,
                Permissions = role.Permissions
                    .Where(rp => rp.IsActive && rp.PlatformPermission.IsActive)
                    .Select(rp => new PlatformPermissionDto
                    {
                        Id = rp.PlatformPermission.Id,
                        PermissionName = rp.PlatformPermission.PermissionName,
                        Feature = rp.PlatformPermission.Feature,
                        Action = rp.PlatformPermission.Action,
                        Description = rp.PlatformPermission.Description,
                        IsActive = rp.PlatformPermission.IsActive
                    }).ToList()
            };
        }

        public async Task<PlatformRoleDto> CreateRoleAsync(CreatePlatformRoleDto createDto)
        {
            var role = new PlatformRole
            {
                RoleName = createDto.RoleName,
                Description = createDto.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.PlatformRoles.Add(role);
            await _context.SaveChangesAsync();

            // Add permissions
            foreach (var permissionId in createDto.PermissionIds)
            {
                var rolePermission = new RolePermission
                {
                    PlatformRoleId = role.Id,
                    PlatformPermissionId = permissionId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.RolePermissions.Add(rolePermission);
            }

            await _context.SaveChangesAsync();

            // Return the created role with permissions
            return await GetRoleByIdAsync(role.Id) ?? throw new InvalidOperationException("Failed to retrieve created role");
        }

        public async Task<PlatformRoleDto?> UpdateRoleAsync(int id, UpdatePlatformRoleDto updateDto)
        {
            var role = await _context.PlatformRoles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return null;

            role.RoleName = updateDto.RoleName;
            role.Description = updateDto.Description;
            role.IsActive = updateDto.IsActive;
            role.UpdatedAt = DateTime.UtcNow;

            // Remove existing permissions
            var existingPermissions = role.Permissions.ToList();
            _context.RolePermissions.RemoveRange(existingPermissions);

            // Add new permissions
            foreach (var permissionId in updateDto.PermissionIds)
            {
                var rolePermission = new RolePermission
                {
                    PlatformRoleId = role.Id,
                    PlatformPermissionId = permissionId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.RolePermissions.Add(rolePermission);
            }

            await _context.SaveChangesAsync();

            return await GetRoleByIdAsync(id);
        }

        public async Task<bool> DeleteRoleAsync(int id)
        {
            var role = await _context.PlatformRoles
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return false;

            role.IsActive = false;
            role.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AssignRoleToUserAsync(string userId, int roleId)
        {
            var existingAssignment = await _context.UserPlatformRoles
                .FirstOrDefaultAsync(upr => upr.UserId == userId && upr.PlatformRoleId == roleId);

            if (existingAssignment != null)
            {
                if (!existingAssignment.IsActive)
                {
                    existingAssignment.IsActive = true;
                    existingAssignment.AssignedAt = DateTime.UtcNow;
                    existingAssignment.RevokedAt = null;
                    await _context.SaveChangesAsync();
                }
                return true;
            }

            var userRole = new UserPlatformRole
            {
                UserId = userId,
                PlatformRoleId = roleId,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            };

            _context.UserPlatformRoles.Add(userRole);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RemoveRoleFromUserAsync(string userId, int roleId)
        {
            var userRole = await _context.UserPlatformRoles
                .FirstOrDefaultAsync(upr => upr.UserId == userId && upr.PlatformRoleId == roleId && upr.IsActive);

            if (userRole == null) return false;

            userRole.IsActive = false;
            userRole.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserPermissionDto?> GetUserPermissionsAsync(string userId)
        {
            var user = await _context.Users
                .Include(u => u.PlatformRoles)
                    .ThenInclude(upr => upr.PlatformRole)
                        .ThenInclude(pr => pr.Permissions)
                            .ThenInclude(rp => rp.PlatformPermission)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            if (user == null) return null;

            var platformPermissions = user.PlatformRoles
                .Where(upr => upr.IsActive && upr.PlatformRole.IsActive)
                .SelectMany(upr => upr.PlatformRole.Permissions)
                .Where(rp => rp.IsActive && rp.PlatformPermission.IsActive)
                .Select(rp => new PlatformPermissionDto
                {
                    Id = rp.PlatformPermission.Id,
                    PermissionName = rp.PlatformPermission.PermissionName,
                    Feature = rp.PlatformPermission.Feature,
                    Action = rp.PlatformPermission.Action,
                    Description = rp.PlatformPermission.Description,
                    IsActive = rp.PlatformPermission.IsActive
                })
                .Distinct()
                .ToList();

            return new UserPermissionDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? "",
                Email = user.Email ?? "",
                PlatformRoles = user.PlatformRoles
                    .Where(upr => upr.IsActive && upr.PlatformRole.IsActive)
                    .Select(upr => upr.PlatformRole.RoleName)
                    .ToList(),
                ERPRoles = new List<string>(), // TODO: Get from UserManager if needed
                Permissions = platformPermissions
            };
        }

        public async Task<bool> UserHasPermissionAsync(string userId, string feature, string action)
        {
            var hasPermission = await _context.UserPlatformRoles
                .Where(upr => upr.UserId == userId && upr.IsActive)
                .Join(_context.RolePermissions,
                    upr => upr.PlatformRoleId,
                    rp => rp.PlatformRoleId,
                    (upr, rp) => rp)
                .Where(rp => rp.IsActive)
                .Join(_context.PlatformPermissions,
                    rp => rp.PlatformPermissionId,
                    pp => pp.Id,
                    (rp, pp) => pp)
                .AnyAsync(pp => pp.Feature == feature && pp.Action == action && pp.IsActive);

            return hasPermission;
        }
    }
}
