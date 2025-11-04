using ERPTraining.Core.Entities.Tickets;

namespace ERPTraining.Core.Services.Legacy;

// Deprecated: legacy contract kept only for historical reference. Do not use.
public interface ILegacyTicketSettingsService
{
    // Category management
    Task<IEnumerable<TicketCategory>> GetCategoriesAsync();
    Task<TicketCategory?> GetCategoryByIdAsync(int id);
    Task<TicketCategory> CreateCategoryAsync(TicketCategory category);
    Task<TicketCategory> UpdateCategoryAsync(TicketCategory category);
    Task<bool> DeleteCategoryAsync(int id);

    // Sub-category management
    Task<IEnumerable<TicketSubCategory>> GetSubCategoriesAsync(int? categoryId = null);
    Task<TicketSubCategory?> GetSubCategoryByIdAsync(int id);
    Task<TicketSubCategory> CreateSubCategoryAsync(TicketSubCategory subCategory);
    Task<TicketSubCategory> UpdateSubCategoryAsync(TicketSubCategory subCategory);
    Task<bool> DeleteSubCategoryAsync(int id);

    // Status management
    Task<IEnumerable<TicketStatus>> GetStatusesAsync();
    Task<TicketStatus?> GetStatusByIdAsync(int id);
    Task<TicketStatus> CreateStatusAsync(TicketStatus status);
    Task<TicketStatus> UpdateStatusAsync(TicketStatus status);
    Task<bool> DeleteStatusAsync(int id);

    // Priority management
    Task<IEnumerable<TicketPriority>> GetPrioritiesAsync();
    Task<TicketPriority?> GetPriorityByIdAsync(int id);
    Task<TicketPriority> CreatePriorityAsync(TicketPriority priority);
    Task<TicketPriority> UpdatePriorityAsync(TicketPriority priority);
    Task<bool> DeletePriorityAsync(int id);

    // Department management
    Task<IEnumerable<TicketDepartment>> GetDepartmentsAsync();
    Task<TicketDepartment?> GetDepartmentByIdAsync(int id);
    Task<TicketDepartment> CreateDepartmentAsync(TicketDepartment department);
    Task<TicketDepartment> UpdateDepartmentAsync(TicketDepartment department);
    Task<bool> DeleteDepartmentAsync(int id);
}