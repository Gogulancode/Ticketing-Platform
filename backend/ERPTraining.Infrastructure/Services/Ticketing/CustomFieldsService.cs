using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERPTraining.Infrastructure.Services.Ticketing
{
    public interface ICustomFieldsService
    {
        Task<IEnumerable<CustomField>> GetAllAsync();
        Task<IEnumerable<CustomField>> GetByCategoryAsync(int categoryId);
        Task<IEnumerable<CustomField>> GetBySubCategoryAsync(int subCategoryId);
        Task<IEnumerable<CustomField>> GetByCategoryAndSubCategoryAsync(int categoryId, int subCategoryId);
        Task<CustomField?> GetByIdAsync(int id);
        Task<CustomField> CreateAsync(CustomField customField);
        Task<CustomField?> UpdateAsync(int id, CustomField customField);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<TicketFieldValue>> GetTicketFieldValuesAsync(Guid ticketId);
        Task SaveTicketFieldValuesAsync(Guid ticketId, Dictionary<int, string> fieldValues);
    }

    public class CustomFieldsService : ICustomFieldsService
    {
        private readonly ApplicationDbContext _context;

        public CustomFieldsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CustomField>> GetAllAsync()
        {
            return await _context.CustomFields
                .Where(cf => cf.IsActive)
                .Include(cf => cf.Category)
                .Include(cf => cf.SubCategory)
                .OrderBy(cf => cf.DisplayOrder)
                .ThenBy(cf => cf.Label)
                .ToListAsync();
        }

        public async Task<IEnumerable<CustomField>> GetByCategoryAsync(int categoryId)
        {
            return await _context.CustomFields
                .Where(cf => cf.IsActive && (cf.CategoryId == categoryId || cf.CategoryId == null))
                .Include(cf => cf.Category)
                .Include(cf => cf.SubCategory)
                .OrderBy(cf => cf.DisplayOrder)
                .ThenBy(cf => cf.Label)
                .ToListAsync();
        }

        public async Task<IEnumerable<CustomField>> GetBySubCategoryAsync(int subCategoryId)
        {
            return await _context.CustomFields
                .Where(cf => cf.IsActive && (cf.SubCategoryId == subCategoryId || cf.SubCategoryId == null))
                .Include(cf => cf.Category)
                .Include(cf => cf.SubCategory)
                .OrderBy(cf => cf.DisplayOrder)
                .ThenBy(cf => cf.Label)
                .ToListAsync();
        }

        public async Task<IEnumerable<CustomField>> GetByCategoryAndSubCategoryAsync(int categoryId, int subCategoryId)
        {
            return await _context.CustomFields
                .Where(cf => cf.IsActive && 
                            ((cf.CategoryId == categoryId && cf.SubCategoryId == subCategoryId) ||
                             (cf.CategoryId == categoryId && cf.SubCategoryId == null) ||
                             (cf.CategoryId == null && cf.SubCategoryId == subCategoryId) ||
                             (cf.CategoryId == null && cf.SubCategoryId == null)))
                .Include(cf => cf.Category)
                .Include(cf => cf.SubCategory)
                .OrderBy(cf => cf.DisplayOrder)
                .ThenBy(cf => cf.Label)
                .ToListAsync();
        }

        public async Task<CustomField?> GetByIdAsync(int id)
        {
            return await _context.CustomFields
                .Include(cf => cf.Category)
                .Include(cf => cf.SubCategory)
                .FirstOrDefaultAsync(cf => cf.Id == id);
        }

        public async Task<CustomField> CreateAsync(CustomField customField)
        {
            customField.CreatedAt = DateTime.UtcNow;
            customField.UpdatedAt = DateTime.UtcNow;

            _context.CustomFields.Add(customField);
            await _context.SaveChangesAsync();
            return customField;
        }

        public async Task<CustomField?> UpdateAsync(int id, CustomField customField)
        {
            var existing = await _context.CustomFields.FindAsync(id);
            if (existing == null) return null;

            existing.Name = customField.Name;
            existing.Label = customField.Label;
            existing.Type = customField.Type;
            existing.CategoryId = customField.CategoryId;
            existing.SubCategoryId = customField.SubCategoryId;
            existing.Options = customField.Options;
            existing.Placeholder = customField.Placeholder;
            existing.IsRequired = customField.IsRequired;
            existing.IsActive = customField.IsActive;
            existing.DisplayOrder = customField.DisplayOrder;
            existing.ValidationRules = customField.ValidationRules;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var customField = await _context.CustomFields.FindAsync(id);
            if (customField == null) return false;

            // Soft delete by setting IsActive to false
            customField.IsActive = false;
            customField.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<TicketFieldValue>> GetTicketFieldValuesAsync(Guid ticketId)
        {
            return await _context.TicketFieldValues
                .Include(tfv => tfv.CustomField)
                .Where(tfv => tfv.TicketId == ticketId)
                .ToListAsync();
        }

        public async Task SaveTicketFieldValuesAsync(Guid ticketId, Dictionary<int, string> fieldValues)
        {
            // Get existing field values for this ticket
            var existingValues = await _context.TicketFieldValues
                .Where(tfv => tfv.TicketId == ticketId)
                .ToListAsync();

            foreach (var fieldValue in fieldValues)
            {
                var existing = existingValues.FirstOrDefault(ev => ev.CustomFieldId == fieldValue.Key);
                
                if (existing != null)
                {
                    // Update existing value
                    existing.Value = fieldValue.Value;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Create new value
                    _context.TicketFieldValues.Add(new TicketFieldValue
                    {
                        TicketId = ticketId,
                        CustomFieldId = fieldValue.Key,
                        Value = fieldValue.Value,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            // Remove values that are no longer provided
            var fieldsToRemove = existingValues
                .Where(ev => !fieldValues.ContainsKey(ev.CustomFieldId))
                .ToList();

            _context.TicketFieldValues.RemoveRange(fieldsToRemove);

            await _context.SaveChangesAsync();
        }
    }
}