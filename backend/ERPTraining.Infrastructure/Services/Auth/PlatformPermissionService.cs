using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERPTraining.Infrastructure.Services
{
    public class PlatformPermissionService : IPlatformPermissionService
    {
        private readonly ApplicationDbContext _context;

        public PlatformPermissionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PlatformPermissionDto>> GetAllPermissionsAsync()
        {
            var permissions = await _context.PlatformPermissions
                .Where(p => p.IsActive)
                .OrderBy(p => p.Feature)
                .ThenBy(p => p.Action)
                .ToListAsync();

            return permissions.Select(p => new PlatformPermissionDto
            {
                Id = p.Id,
                PermissionName = p.PermissionName,
                Feature = p.Feature,
                Action = p.Action,
                Description = p.Description,
                IsActive = p.IsActive
            });
        }

        public async Task<PlatformPermissionDto?> GetPermissionByIdAsync(int id)
        {
            var permission = await _context.PlatformPermissions
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

            if (permission == null) return null;

            return new PlatformPermissionDto
            {
                Id = permission.Id,
                PermissionName = permission.PermissionName,
                Feature = permission.Feature,
                Action = permission.Action,
                Description = permission.Description,
                IsActive = permission.IsActive
            };
        }

        public async Task<PlatformPermissionDto> CreatePermissionAsync(CreatePlatformPermissionDto createDto)
        {
            var permission = new PlatformPermission
            {
                PermissionName = createDto.PermissionName,
                Feature = createDto.Feature,
                Action = createDto.Action,
                Description = createDto.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.PlatformPermissions.Add(permission);
            await _context.SaveChangesAsync();

            return new PlatformPermissionDto
            {
                Id = permission.Id,
                PermissionName = permission.PermissionName,
                Feature = permission.Feature,
                Action = permission.Action,
                Description = permission.Description,
                IsActive = permission.IsActive
            };
        }

        public async Task<PlatformPermissionDto?> UpdatePermissionAsync(int id, CreatePlatformPermissionDto updateDto)
        {
            var permission = await _context.PlatformPermissions
                .FirstOrDefaultAsync(p => p.Id == id);

            if (permission == null) return null;

            permission.PermissionName = updateDto.PermissionName;
            permission.Feature = updateDto.Feature;
            permission.Action = updateDto.Action;
            permission.Description = updateDto.Description;
            permission.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new PlatformPermissionDto
            {
                Id = permission.Id,
                PermissionName = permission.PermissionName,
                Feature = permission.Feature,
                Action = permission.Action,
                Description = permission.Description,
                IsActive = permission.IsActive
            };
        }

        public async Task<bool> DeletePermissionAsync(int id)
        {
            var permission = await _context.PlatformPermissions
                .FirstOrDefaultAsync(p => p.Id == id);

            if (permission == null) return false;

            permission.IsActive = false;
            permission.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<PlatformPermissionDto>> GetPermissionsByFeatureAsync(string feature)
        {
            var permissions = await _context.PlatformPermissions
                .Where(p => p.Feature == feature && p.IsActive)
                .OrderBy(p => p.Action)
                .ToListAsync();

            return permissions.Select(p => new PlatformPermissionDto
            {
                Id = p.Id,
                PermissionName = p.PermissionName,
                Feature = p.Feature,
                Action = p.Action,
                Description = p.Description,
                IsActive = p.IsActive
            });
        }

        public async Task InitializeDefaultPermissionsAsync()
        {
            var features = new[]
            {
                new { Feature = "Dashboard", Actions = new[] { "View" } },
                new { Feature = "LearningAnalytics", Actions = new[] { "View" } },
                new { Feature = "Modules", Actions = new[] { "View", "Create", "Edit", "Delete" } },
                new { Feature = "Announcements", Actions = new[] { "View", "Create", "Edit", "Delete" } },
                new { Feature = "ContentManagement", Actions = new[] { "View", "Create", "Edit", "Delete" } },
                new { Feature = "Search", Actions = new[] { "View" } },
                new { Feature = "MyProgress", Actions = new[] { "View" } },
                new { Feature = "MistakeAnalysis", Actions = new[] { "View" } },
                new { Feature = "Assessments", Actions = new[] { "View", "Create", "Edit", "Delete", "Take" } },
                new { Feature = "UserManagement", Actions = new[] { "View", "Create", "Edit", "Delete" } },
                new { Feature = "Settings", Actions = new[] { "View", "Edit" } },
                new { Feature = "Notifications", Actions = new[] { "View" } },
                new { Feature = "ProfileSettings", Actions = new[] { "View", "Edit" } }
            };

            foreach (var feature in features)
            {
                foreach (var action in feature.Actions)
                {
                    var existingPermission = await _context.PlatformPermissions
                        .FirstOrDefaultAsync(p => p.Feature == feature.Feature && p.Action == action);

                    if (existingPermission == null)
                    {
                        var permission = new PlatformPermission
                        {
                            PermissionName = $"{feature.Feature}.{action}",
                            Feature = feature.Feature,
                            Action = action,
                            Description = $"Permission to {action.ToLower()} {feature.Feature.ToLower()}",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.PlatformPermissions.Add(permission);
                    }
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
