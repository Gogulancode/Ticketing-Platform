using System.Collections.Generic;
using ERPTraining.Core.Entities.Tickets;
using ERPTraining.Core.Entities.Ticketing;
using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Ticketing.Settings.DTOs;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Infrastructure.Services.Ticketing;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TicketDeptDto = ERPTraining.Core.Ticketing.Settings.DTOs.TicketDepartmentDto;
using CreateDeptReq = ERPTraining.Core.Ticketing.Settings.DTOs.CreateTicketDepartmentRequest;
using UpdateDeptReq = ERPTraining.Core.Ticketing.Settings.DTOs.UpdateTicketDepartmentRequest;
using TicketPriorityDto = ERPTraining.Core.Ticketing.Settings.DTOs.TicketPriorityDto;
using CreatePriorityReq = ERPTraining.Core.Ticketing.Settings.DTOs.CreateTicketPriorityRequest;
using UpdatePriorityReq = ERPTraining.Core.Ticketing.Settings.DTOs.UpdateTicketPriorityRequest;
using TicketStatusDto = ERPTraining.Core.Ticketing.Settings.DTOs.TicketStatusDto;
using CreateStatusReq = ERPTraining.Core.Ticketing.Settings.DTOs.CreateTicketStatusRequest;
using UpdateStatusReq = ERPTraining.Core.Ticketing.Settings.DTOs.UpdateTicketStatusRequest;
using CustomField = ERPTraining.Core.Entities.Ticketing.CustomField;
using TicketCategoryEntity = ERPTraining.Core.Entities.Tickets.TicketCategory;
using TicketPriorityEntity = ERPTraining.Core.Entities.Tickets.TicketPriority;
using TicketStatusEntity = ERPTraining.Core.Entities.Tickets.TicketStatus;
using Microsoft.AspNetCore.Authorization;
// Groups endpoints moved to dedicated TicketGroupsController

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("tickets/settings")] // Keep original path so frontend stays untouched
[Authorize]
public class TicketSettingsController : ControllerBase
{
    private readonly IA_TicketSettingsService _service;
    private readonly ApplicationDbContext _context;
    private readonly ERPTraining.Infrastructure.Services.Ticketing.ICustomFieldsService _customFieldsService;
    // private readonly IEmailConfigurationService _emailConfigService;
    private readonly ILogger<TicketSettingsController> _logger;

    public TicketSettingsController(
        IA_TicketSettingsService service, 
        ApplicationDbContext context,
        ERPTraining.Infrastructure.Services.Ticketing.ICustomFieldsService customFieldsService,
        // IEmailConfigurationService emailConfigService,
        ILogger<TicketSettingsController> logger)
    {
        _service = service;
        _context = context;
        _customFieldsService = customFieldsService;
        // _emailConfigService = emailConfigService;
        _logger = logger;
    }

    // GET: api/tickets/settings/categories
    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<TicketCategoryDto>>> GetCategories([FromQuery] bool includeInactive = false)
    {
        var list = await _service.GetCategoriesAsync(includeInactive);
        return Ok(list.Select(Map));
    }

    // GET: api/tickets/settings/categories/{id}
    [HttpGet("categories/{id:int}")]
    public async Task<ActionResult<TicketCategoryDto>> GetCategory(int id)
    {
        var entity = await _service.GetCategoryAsync(id);
        if (entity == null) return NotFound();
        return Ok(Map(entity));
    }

    // POST: api/tickets/settings/categories
    [HttpPost("categories")]
    public async Task<ActionResult<TicketCategoryDto>> CreateCategory([FromBody] CreateTicketCategoryRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Name is required");

        // Check if an active category with the same name already exists
        var existingActiveCategory = (await _service.GetCategoriesAsync(includeInactive: false))
            .FirstOrDefault(c => c.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase));
        
        if (existingActiveCategory != null)
        {
            _logger.LogWarning("Attempt to create duplicate active category: {Name}", request.Name);
            return Conflict($"An active category with the name '{request.Name}' already exists. If you want to recreate this category, please delete the existing one first.");
        }

        var entity = new TicketCategoryEntity
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            DisplayOrder = request.DisplayOrder ?? 0,
            Color = request.Color,
            IconName = request.IconName,
            IsActive = true
        };

        try
        {
            var created = await _service.CreateCategoryAsync(entity, ct);
            return CreatedAtAction(nameof(GetCategory), new { id = created.Id }, Map(created));
        }
        catch (DbUpdateException dbEx) when (dbEx.InnerException is SqlException sqlEx && (sqlEx.Number == 2627 || sqlEx.Number == 2601))
        {
            // Unique constraint violation (duplicate category name)
            _logger.LogWarning(dbEx, "Duplicate ticket category name detected: {Name}", request.Name);
            return Conflict($"A category with the name '{request.Name}' already exists.");
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error while creating ticket category");
            return Problem("Failed to create the category due to a database error.", statusCode: StatusCodes.Status500InternalServerError);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while creating ticket category");
            return Problem("Unexpected error while creating the category.", statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    // PUT: api/tickets/settings/categories/{id}
    [HttpPut("categories/{id:int}")]
    public async Task<ActionResult<TicketCategoryDto>> UpdateCategory(int id, [FromBody] UpdateTicketCategoryRequest request, CancellationToken ct)
    {
        var updated = await _service.UpdateCategoryAsync(id, entity =>
        {
            entity.Name = request.Name?.Trim() ?? entity.Name;
            entity.Description = request.Description?.Trim();
            if (request.DisplayOrder.HasValue) entity.DisplayOrder = request.DisplayOrder.Value;
            entity.IsActive = request.IsActive;
            entity.Color = request.Color;
            entity.IconName = request.IconName;
        }, ct);

        if (updated == null) return NotFound();
        return Ok(Map(updated));
    }

    // DELETE: api/tickets/settings/categories/{id}
    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id, CancellationToken ct)
    {
        try
        {
            var deleted = await _service.SoftDeleteCategoryAsync(id, ct);
            if (!deleted)
            {
                _logger.LogWarning("Attempted to delete missing category {CategoryId}", id);
                return NotFound(new { message = "Category not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ticket category {CategoryId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to delete category" });
        }
    }

    private static TicketCategoryDto Map(TicketCategoryEntity category) =>
        new(category.Id, category.Name, category.Description, category.IsActive, category.DisplayOrder, category.Color, category.IconName);

    [HttpGet("subcategories")]
    public async Task<ActionResult<IEnumerable<TicketSubCategory>>> GetSubCategories([FromQuery] int? categoryId, [FromQuery] bool includeInactive = false)
    {
        var list = await _service.GetSubCategoriesAsync(categoryId, includeInactive);
        return Ok(list);
    }

    // GET: api/tickets/settings/subcategories/{id}
    [HttpGet("subcategories/{id:int}")]
    public async Task<ActionResult<TicketSubCategory>> GetSubCategory(int id)
    {
        var entity = await _service.GetSubCategoryAsync(id);
        if (entity == null) return NotFound();
        return Ok(entity);
    }

    // POST: api/tickets/settings/subcategories
    [HttpPost("subcategories")]
    public async Task<ActionResult<TicketSubCategory>> CreateSubCategory([FromBody] CreateTicketSubCategoryRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Name is required");
        if (request.CategoryId <= 0)
            return BadRequest("CategoryId is required");

        // Check if an active subcategory with the same name in the same category already exists
        var existingActiveSubCategory = (await _service.GetSubCategoriesAsync(request.CategoryId, includeInactive: false))
            .FirstOrDefault(sc => sc.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase));
        
        if (existingActiveSubCategory != null)
        {
            _logger.LogWarning("Attempt to create duplicate active subcategory: {Name} in category {CategoryId}", request.Name, request.CategoryId);
            return Conflict($"An active sub-category with the name '{request.Name}' already exists in this category. If you want to recreate this sub-category, please delete the existing one first.");
        }

        var entity = new TicketSubCategory
        {
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            DisplayOrder = request.DisplayOrder ?? 0,
            IsActive = true
        };

        try
        {
            var created = await _service.CreateSubCategoryAsync(entity, ct);
            return CreatedAtAction(nameof(GetSubCategory), new { id = created.Id }, created);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx && sqlEx.Number == 2627)
        {
            // Handle unique constraint violation
            if (sqlEx.Message.Contains("UK_TicketSubCategories_CategoryName"))
            {
                return Conflict($"A sub-category with the name '{request.Name}' already exists in this category.");
            }
            return Conflict("A sub-category with this name already exists.");
        }
    }

    // PUT: api/tickets/settings/subcategories/{id}
    [HttpPut("subcategories/{id:int}")]
    public async Task<ActionResult<TicketSubCategory>> UpdateSubCategory(int id, [FromBody] UpdateTicketSubCategoryRequest request, CancellationToken ct)
    {
        var updated = await _service.UpdateSubCategoryAsync(id, entity =>
        {
            entity.Name = request.Name?.Trim() ?? entity.Name;
            entity.Description = request.Description?.Trim();
            if (request.DisplayOrder.HasValue) entity.DisplayOrder = request.DisplayOrder.Value;
            entity.IsActive = request.IsActive;
        }, ct);

        if (updated == null) return NotFound();
        return Ok(updated);
    }

    // DELETE: api/tickets/settings/subcategories/{id}
    [HttpDelete("subcategories/{id:int}")]
    public async Task<IActionResult> DeleteSubCategory(int id, CancellationToken ct)
    {
        var result = await _service.SoftDeleteSubCategoryAsync(id, ct);
        if (!result) return NotFound();
        return NoContent();
    }

    // ================= Departments =================

    private static TicketDeptDto Map(TicketDepartment d) => new(d.Id, d.Name, d.Description, d.IsActive, d.SortOrder);

    // GET: api/tickets/settings/departments
    [HttpGet("departments")]
    public async Task<ActionResult<IEnumerable<TicketDeptDto>>> GetDepartments([FromQuery] bool includeInactive = false)
    {
        var list = await _service.GetDepartmentsAsync(includeInactive);
        return Ok(list.Select(Map));
    }

    // GET: api/tickets/settings/departments/{id}
    [HttpGet("departments/{id:int}")]
    public async Task<ActionResult<TicketDeptDto>> GetDepartment(int id)
    {
        var entity = await _service.GetDepartmentAsync(id);
        if (entity == null) return NotFound();
        return Ok(Map(entity));
    }

    // POST: api/tickets/settings/departments
    [HttpPost("departments")]
    public async Task<ActionResult<TicketDeptDto>> CreateDepartment([FromBody] CreateDeptReq request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Name is required");

        var entity = new TicketDepartment
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            SortOrder = request.DisplayOrder ?? 0,
            IsActive = true
        };

        var created = await _service.CreateDepartmentAsync(entity, ct);
    return CreatedAtAction(nameof(GetDepartment), new { id = created.Id }, Map(created));
    }

    // PUT: api/tickets/settings/departments/{id}
    [HttpPut("departments/{id:int}")]
    public async Task<ActionResult<TicketDeptDto>> UpdateDepartment(int id, [FromBody] UpdateDeptReq request, CancellationToken ct)
    {
        var updated = await _service.UpdateDepartmentAsync(id, entity =>
        {
            entity.Name = request.Name?.Trim() ?? entity.Name;
            entity.Description = request.Description?.Trim();
            if (request.DisplayOrder.HasValue) entity.SortOrder = request.DisplayOrder.Value;
            entity.IsActive = request.IsActive;
        }, ct);

        if (updated == null) return NotFound();
        return Ok(Map(updated));
    }

    // DELETE (soft): api/tickets/settings/departments/{id}
    [HttpDelete("departments/{id:int}")]
    public async Task<IActionResult> DeleteDepartment(int id, CancellationToken ct)
    {
        var result = await _service.SoftDeleteDepartmentAsync(id, ct);
        if (!result) return NotFound();
        return NoContent();
    }

    // ================= Priorities =================

    private static TicketPriorityDto Map(TicketPriorityEntity p) => new(p.Id, p.Name, p.Description, p.Level, p.Color, p.IsActive, p.IsDeleted, p.SortOrder);

    // GET: api/tickets/settings/priorities
    [HttpGet("priorities")]
    public async Task<ActionResult<IEnumerable<TicketPriorityDto>>> GetPriorities([FromQuery] bool includeInactive = false)
    {
        var list = await _service.GetPrioritiesAsync(includeInactive);
        return Ok(list.Select(Map));
    }

    // GET: api/tickets/settings/priorities/{id}
    [HttpGet("priorities/{id:int}")]
    public async Task<ActionResult<TicketPriorityDto>> GetPriority(int id)
    {
        var entity = await _service.GetPriorityAsync(id);
        if (entity == null) return NotFound();
        return Ok(Map(entity));
    }

    // POST: api/tickets/settings/priorities
    [HttpPost("priorities")]
    public async Task<ActionResult<TicketPriorityDto>> CreatePriority([FromBody] CreatePriorityReq request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Name is required");
        if (request.Level <= 0)
            return BadRequest("Level must be greater than zero");

        // Check if an active priority with the same name already exists
        var existingActivePriority = (await _service.GetPrioritiesAsync(includeInactive: false))
            .FirstOrDefault(p => p.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase));

        if (existingActivePriority != null)
        {
            _logger.LogWarning("Attempt to create duplicate active priority: {PriorityName}", request.Name);
            return Conflict($"An active priority with the name '{request.Name}' already exists. If you want to recreate this priority, please delete the existing one first.");
        }

        var entity = new TicketPriorityEntity
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Level = request.Level,
            Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color,
            SortOrder = request.DisplayOrder ?? 0,
            IsActive = true
        };

        var created = await _service.CreatePriorityAsync(entity, ct);
        return CreatedAtAction(nameof(GetPriority), new { id = created.Id }, Map(created));
    }

    // PUT: api/tickets/settings/priorities/{id}
    [HttpPut("priorities/{id:int}")]
    public async Task<ActionResult<TicketPriorityDto>> UpdatePriority(int id, [FromBody] UpdatePriorityReq request, CancellationToken ct)
    {
        var updated = await _service.UpdatePriorityAsync(id, entity =>
        {
            entity.Name = request.Name?.Trim() ?? entity.Name;
            entity.Description = request.Description?.Trim();
            if (request.Level.HasValue) entity.Level = request.Level.Value;
            entity.Color = request.Color ?? entity.Color;
            if (request.DisplayOrder.HasValue) entity.SortOrder = request.DisplayOrder.Value;
            entity.IsActive = request.IsActive;
        }, ct);

        if (updated == null) return NotFound();
        return Ok(Map(updated));
    }

    // DELETE (soft): api/tickets/settings/priorities/{id}
    [HttpDelete("priorities/{id:int}")]
    public async Task<IActionResult> DeletePriority(int id, CancellationToken ct)
    {
        var result = await _service.SoftDeletePriorityAsync(id, ct);
        if (!result) return NotFound();
        return NoContent();
    }

    // ================= Statuses =================

    private static TicketStatusDto Map(TicketStatusEntity s)
    {
        var allowed = Array.Empty<int>();
        if (!string.IsNullOrWhiteSpace(s.AllowedTransitions))
        {
            allowed = s.AllowedTransitions
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(x => int.TryParse(x, out var v) ? v : (int?)null)
                .Where(v => v.HasValue)
                .Select(v => v!.Value)
                .ToArray();
        }
        return new TicketStatusDto(s.Id, s.Name, s.WorkflowOrder, s.IsActive, s.Color, s.IsDefault, s.IsClosedStatus, allowed);
    }

    // GET: api/tickets/settings/statuses
    [HttpGet("statuses")]
    public async Task<ActionResult<IEnumerable<TicketStatusDto>>> GetStatuses([FromQuery] bool includeInactive = false)
    {
        var list = await _service.GetStatusesAsync(includeInactive);
        return Ok(list.Select(Map));
    }

    // GET: api/tickets/settings/statuses/{id}
    [HttpGet("statuses/{id:int}")]
    public async Task<ActionResult<TicketStatusDto>> GetStatus(int id)
    {
        var entity = await _service.GetStatusAsync(id);
        if (entity == null) return NotFound();
        return Ok(Map(entity));
    }

    // POST: api/tickets/settings/statuses
    [HttpPost("statuses")]
    public async Task<ActionResult<TicketStatusDto>> CreateStatus([FromBody] CreateStatusReq request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Name is required");

        // Check if an active status with the same name already exists
        var existingActiveStatus = (await _service.GetStatusesAsync(includeInactive: false))
            .FirstOrDefault(s => s.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase));

        if (existingActiveStatus != null)
        {
            _logger.LogWarning("Attempt to create duplicate active status: {StatusName}", request.Name);
            return Conflict($"An active status with the name '{request.Name}' already exists. If you want to recreate this status, please delete the existing one first.");
        }

        var entity = new TicketStatusEntity
        {
            Name = request.Name.Trim(),
            WorkflowOrder = request.WorkflowOrder ?? 0,
            IsActive = request.IsActive ?? true,
            Color = request.Color ?? string.Empty,
            IsDefault = request.IsDefault ?? false,
            IsClosedStatus = request.IsClosedStatus ?? false,
            AllowedTransitions = request.AllowedTransitions is { Length: > 0 }
                ? string.Join(',', request.AllowedTransitions)
                : null
        };

        var created = await _service.CreateStatusAsync(entity, ct);
        return CreatedAtAction(nameof(GetStatus), new { id = created.Id }, Map(created));
    }

    // PUT: api/tickets/settings/statuses/{id}
    [HttpPut("statuses/{id:int}")]
    public async Task<ActionResult<TicketStatusDto>> UpdateStatus(int id, [FromBody] UpdateStatusReq request, CancellationToken ct)
    {
        var updated = await _service.UpdateStatusAsync(id, entity =>
        {
            entity.Name = request.Name?.Trim() ?? entity.Name;
            if (request.WorkflowOrder.HasValue) entity.WorkflowOrder = request.WorkflowOrder.Value;
            entity.IsActive = request.IsActive;
            entity.Color = request.Color ?? entity.Color;
            if (request.IsDefault.HasValue) entity.IsDefault = request.IsDefault.Value;
            if (request.IsClosedStatus.HasValue) entity.IsClosedStatus = request.IsClosedStatus.Value;
            if (request.AllowedTransitions != null)
            {
                entity.AllowedTransitions = request.AllowedTransitions.Length > 0
                    ? string.Join(',', request.AllowedTransitions)
                    : null;
            }
        }, ct);

        if (updated == null) return NotFound();
        return Ok(Map(updated));
    }

    // DELETE (soft): api/tickets/settings/statuses/{id}
    [HttpDelete("statuses/{id:int}")]
    public async Task<IActionResult> DeleteStatus(int id, CancellationToken ct)
    {
        var result = await _service.SoftDeleteStatusAsync(id, ct);
        if (!result) return NotFound();
        return NoContent();
    }

    // ================= Issue Types =================

    // GET: api/tickets/settings/issuetypes
    [HttpGet("issuetypes")]
    public async Task<ActionResult<IEnumerable<object>>> GetIssueTypes([FromQuery] bool includeInactive = false)
    {
        var list = await _service.GetIssueTypesAsync(includeInactive);
        var result = list.Select(it => new
        {
            id = it.Id,
            name = it.Name,
            description = it.Description,
            isActive = it.IsActive,
            displayOrder = it.DisplayOrder,
            color = it.Color
        });
        return Ok(result);
    }

    // ================= Custom Fields =================
    
    // GET: api/tickets/settings/custom-fields
    [HttpGet("custom-fields")]
    public async Task<ActionResult<IEnumerable<object>>> GetCustomFields([FromQuery] int? categoryId = null, [FromQuery] int? subCategoryId = null, [FromQuery] bool includeInactive = false)
    {
        IEnumerable<ERPTraining.Core.Entities.Ticketing.CustomField> fields;
        
        if (categoryId.HasValue && subCategoryId.HasValue)
        {
            // Filter by both category and subcategory for precise matching
            fields = await _customFieldsService.GetByCategoryAndSubCategoryAsync(categoryId.Value, subCategoryId.Value, includeInactive);
        }
        else if (categoryId.HasValue)
        {
            fields = await _customFieldsService.GetByCategoryAsync(categoryId.Value, includeInactive);
        }
        else if (subCategoryId.HasValue)
        {
            fields = await _customFieldsService.GetBySubCategoryAsync(subCategoryId.Value, includeInactive);
        }
        else
        {
            fields = await _customFieldsService.GetAllAsync(includeInactive);
        }

        var result = fields.Select(cf => new
        {
            id = cf.Id,
            name = cf.Name,
            label = cf.Label,
            type = cf.Type,
            categoryId = cf.CategoryId,
            subCategoryId = cf.SubCategoryId,
            options = cf.Options != null ? System.Text.Json.JsonSerializer.Deserialize<string[]>(cf.Options) : null,
            placeholder = cf.Placeholder,
            isRequired = cf.IsRequired,
            isActive = cf.IsActive,
            displayOrder = cf.DisplayOrder,
            validationRules = cf.ValidationRules != null ? System.Text.Json.JsonSerializer.Deserialize<object>(cf.ValidationRules) : null
        });

        return Ok(result);
    }

    // GET: api/tickets/settings/custom-fields/{id}
    [HttpGet("custom-fields/{id:int}")]
    public async Task<ActionResult<object>> GetCustomField(int id)
    {
        var field = await _customFieldsService.GetByIdAsync(id);
        if (field == null) return NotFound();

        return Ok(ProjectCustomField(field));
    }

    // POST: api/tickets/settings/custom-fields
    [HttpPost("custom-fields")]
    public async Task<ActionResult<object>> CreateCustomField([FromBody] object request)
    {
        try
        {
            var data = DeserializePayload(request);
            var customField = BuildCustomField(data);

            var created = await _customFieldsService.CreateAsync(customField);
            return CreatedAtAction(nameof(GetCustomField), new { id = created.Id }, ProjectCustomField(created));
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid custom field payload: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Duplicate custom field: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating custom field");
            return BadRequest("Failed to create custom field");
        }
    }

    // PUT: api/tickets/settings/custom-fields/{id}
    [HttpPut("custom-fields/{id:int}")]
    public async Task<ActionResult<object>> UpdateCustomField(int id, [FromBody] object request)
    {
        try
        {
            var data = DeserializePayload(request);
            var customField = BuildCustomField(data, id);

            var updated = await _customFieldsService.UpdateAsync(id, customField);
            if (updated == null) return NotFound();

            return Ok(ProjectCustomField(updated));
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid custom field payload: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Duplicate custom field: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating custom field {Id}", id);
            return BadRequest("Failed to update custom field");
        }
    }

    private static Dictionary<string, object?> DeserializePayload(object? request)
    {
        if (request is null)
        {
            return new();
        }

        var json = System.Text.Json.JsonSerializer.Serialize(request);
        return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(json) ?? new();
    }

    private static CustomField BuildCustomField(IDictionary<string, object?> data, int? id = null)
    {
        var field = new CustomField
        {
            Name = GetRequiredString(data, "name"),
            Label = GetRequiredString(data, "label"),
            Type = GetRequiredString(data, "type"),
            CategoryId = GetOptionalInt(data, "categoryId"),
            SubCategoryId = GetOptionalInt(data, "subCategoryId"),
            Options = SerializeIfPresent(data, "options"),
            Placeholder = GetOptionalString(data, "placeholder"),
            IsRequired = GetOptionalBool(data, "isRequired", defaultValue: false),
            IsActive = GetOptionalBool(data, "isActive", defaultValue: true),
            DisplayOrder = GetOptionalInt(data, "displayOrder") ?? 0,
            ValidationRules = SerializeIfPresent(data, "validationRules")
        };

        if (id.HasValue)
        {
            field.Id = id.Value;
        }

        return field;
    }

    private static object ProjectCustomField(CustomField field)
    {
        return new
        {
            id = field.Id,
            name = field.Name,
            label = field.Label,
            type = field.Type,
            categoryId = field.CategoryId,
            subCategoryId = field.SubCategoryId,
            options = field.Options != null ? System.Text.Json.JsonSerializer.Deserialize<string[]>(field.Options) : null,
            placeholder = field.Placeholder,
            isRequired = field.IsRequired,
            isActive = field.IsActive,
            displayOrder = field.DisplayOrder,
            validationRules = field.ValidationRules != null ? System.Text.Json.JsonSerializer.Deserialize<object>(field.ValidationRules) : null
        };
    }

    private static string GetRequiredString(IDictionary<string, object?> data, string key)
    {
        if (data.TryGetValue(key, out var value) && value != null)
        {
            var text = value.ToString();
            if (!string.IsNullOrWhiteSpace(text))
            {
                return text.Trim();
            }
        }

        throw new ArgumentException($"Field '{key}' is required.");
    }

    private static string? GetOptionalString(IDictionary<string, object?> data, string key)
    {
        if (data.TryGetValue(key, out var value) && value != null)
        {
            var text = value.ToString();
            return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
        }

        return null;
    }

    private static int? GetOptionalInt(IDictionary<string, object?> data, string key)
    {
        if (data.TryGetValue(key, out var value) && value != null && int.TryParse(value.ToString(), out var parsed))
        {
            return parsed;
        }

        return null;
    }

    private static bool GetOptionalBool(IDictionary<string, object?> data, string key, bool defaultValue)
    {
        if (data.TryGetValue(key, out var value) && value != null && bool.TryParse(value.ToString(), out var parsed))
        {
            return parsed;
        }

        return defaultValue;
    }

    private static string? SerializeIfPresent(IDictionary<string, object?> data, string key)
    {
        return data.TryGetValue(key, out var value) && value != null
            ? System.Text.Json.JsonSerializer.Serialize(value)
            : null;
    }

    // DELETE: api/tickets/settings/custom-fields/{id}
    [HttpDelete("custom-fields/{id:int}")]
    public async Task<ActionResult> DeleteCustomField(int id)
    {
        var deleted = await _customFieldsService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    // ================= Email Configuration =================
    
    // GET: api/tickets/settings/category-email-mappings
    [HttpGet("category-email-mappings")]
    public async Task<ActionResult<IEnumerable<object>>> GetCategoryEmailMappings([FromQuery] bool includeInactive = false)
    {
        try 
        {
            var mappings = await _context.CategoryEmailMappings
                .Where(m => includeInactive || m.IsActive)
                .Select(m => new 
                {
                    Id = m.Id,
                    CategoryId = m.CategoryId,
                    EmailAddress = m.EmailAddress,
                    DisplayName = m.DisplayName,
                    IsActive = m.IsActive,
                    KeywordMappings = m.KeywordMappings ?? ""
                })
                .ToListAsync();
            
            return Ok(mappings);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error loading email mappings: {ex.Message}");
        }
    }

    // GET: api/tickets/settings/email-configuration
    [HttpGet("email-configuration")]
    public async Task<ActionResult<object>> GetPublicEmailConfiguration()
    {
        try 
        {
            // Return basic email configuration without sensitive data
            var result = new 
            {
                enabled = true,
                processingEnabled = true,
                supportedDomains = new[] { "example.com" }, // TODO: Replace with your domain
                categories = await _context.TicketCategories
                    .Where(c => c.IsActive)
                    .Select(c => new { id = c.Id, name = c.Name })
                    .ToListAsync()
            };
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error loading email configuration: {ex.Message}");
        }
    }

    // GET: api/tickets/settings/email-accounts
    [HttpGet("email-accounts")]
    public async Task<ActionResult<object[]>> GetPublicEmailAccounts()
    {
        try 
        {
            // Return basic email account info without sensitive data
            var accounts = await _context.CategoryEmailMappings
                .Where(m => m.IsActive)
                .Select(m => new 
                {
                    id = m.Id,
                    email = m.EmailAddress,
                    displayName = m.DisplayName,
                    categoryId = m.CategoryId,
                    isActive = m.IsActive,
                    department = "IT Support", // Default for now
                    keywords = m.KeywordMappings ?? ""
                })
                .ToArrayAsync();
            
            return Ok(accounts);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error loading email accounts: {ex.Message}");
        }
    }

    // GET: api/tickets/settings/email-accounts/{id}
    [HttpGet("email-accounts/{id:int}")]
    public async Task<ActionResult<object>> GetPublicEmailAccount(int id)
    {
        try 
        {
            var account = await _context.CategoryEmailMappings
                .Where(m => m.Id == id && m.IsActive)
                .Select(m => new 
                {
                    id = m.Id,
                    email = m.EmailAddress,
                    displayName = m.DisplayName,
                    categoryId = m.CategoryId,
                    isActive = m.IsActive,
                    department = "IT Support", // Default for now
                    keywords = m.KeywordMappings ?? "",
                    configuration = new 
                    {
                        autoProcess = true,
                        priority = 2,
                        assignToGroup = "IT Support"
                    }
                })
                .FirstOrDefaultAsync();
            
            if (account == null)
                return NotFound();
                
            return Ok(account);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error loading email account: {ex.Message}");
        }
    }

    // POST: api/tickets/settings/email-accounts
    [HttpPost("email-accounts")]
    public async Task<ActionResult<object>> CreateEmailAccount([FromBody] CreateEmailAccountRequest request, CancellationToken ct)
    {
        try 
        {
            if (string.IsNullOrWhiteSpace(request.EmailAddress))
                return BadRequest("Email address is required");
            
            if (string.IsNullOrWhiteSpace(request.DisplayName))
                return BadRequest("Display name is required");

            if (request.CategoryId <= 0)
                return BadRequest("Category ID is required");

            var mapping = new CategoryEmailMapping
            {
                EmailAddress = request.EmailAddress.Trim(),
                DisplayName = request.DisplayName.Trim(),
                CategoryId = request.CategoryId,
                IsActive = request.IsActive ?? true,
                KeywordMappings = request.Keywords?.Trim() ?? ""
            };

            _context.CategoryEmailMappings.Add(mapping);
            await _context.SaveChangesAsync(ct);

            var result = new 
            {
                id = mapping.Id,
                email = mapping.EmailAddress,
                displayName = mapping.DisplayName,
                categoryId = mapping.CategoryId,
                isActive = mapping.IsActive,
                department = "IT Support",
                keywords = mapping.KeywordMappings ?? ""
            };

            return CreatedAtAction(nameof(GetPublicEmailAccount), new { id = mapping.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error creating email account: {ex.Message}");
        }
    }

    // PUT: api/tickets/settings/email-accounts/{id}
    [HttpPut("email-accounts/{id:int}")]
    public async Task<ActionResult<object>> UpdateEmailAccount(int id, [FromBody] UpdateEmailAccountRequest request, CancellationToken ct)
    {
        try 
        {
            var mapping = await _context.CategoryEmailMappings.FindAsync(id);
            if (mapping == null)
                return NotFound();

            if (!string.IsNullOrWhiteSpace(request.EmailAddress))
                mapping.EmailAddress = request.EmailAddress.Trim();
            
            if (!string.IsNullOrWhiteSpace(request.DisplayName))
                mapping.DisplayName = request.DisplayName.Trim();

            if (request.CategoryId.HasValue && request.CategoryId.Value > 0)
                mapping.CategoryId = request.CategoryId.Value;

            if (request.IsActive.HasValue)
                mapping.IsActive = request.IsActive.Value;

            if (request.Keywords != null)
                mapping.KeywordMappings = request.Keywords.Trim();

            await _context.SaveChangesAsync(ct);

            var result = new 
            {
                id = mapping.Id,
                email = mapping.EmailAddress,
                displayName = mapping.DisplayName,
                categoryId = mapping.CategoryId,
                isActive = mapping.IsActive,
                department = "IT Support",
                keywords = mapping.KeywordMappings ?? ""
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error updating email account: {ex.Message}");
        }
    }

    // DELETE: api/tickets/settings/email-accounts/{id}
    [HttpDelete("email-accounts/{id:int}")]
    public async Task<IActionResult> DeleteEmailAccount(int id, CancellationToken ct)
    {
        try 
        {
            var mapping = await _context.CategoryEmailMappings.FindAsync(id);
            if (mapping == null)
                return NotFound();

            // Soft delete by setting IsActive to false
            mapping.IsActive = false;
            await _context.SaveChangesAsync(ct);

            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest($"Error deleting email account: {ex.Message}");
        }
    }

    // ================= Tags =================
    // Tags endpoints moved to TicketTagController.cs
    /*
    // GET: api/tickets/settings/tags
    [HttpGet("tags")]
    public async Task<ActionResult<IEnumerable<object>>> GetTags([FromQuery] bool includeInactive = false)
    {
        try
        {
            var tags = await _context.TicketTags
                .Where(t => includeInactive || t.IsActive)
                .Select(t => new
                {
                    Id = t.Id,
                    Name = t.Name,
                    SubCategoryId = t.SubCategoryId,
                    SubCategoryName = (string?)null,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .OrderBy(t => t.Name)
                .ToListAsync();

            return Ok(tags);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading tags");
            return BadRequest($"Error loading tags: {ex.Message}");
        }
    }
    */

    // ================= Groups =================
    // Moved to TicketGroupsController to simplify routing and avoid ambiguity.

    // ================= Email Processing Debug =================
    /// <summary>
    /// Manually trigger email processing for debugging purposes
    /// </summary>
    [HttpPost("trigger-email-processing")]
    public async Task<ActionResult> TriggerEmailProcessing(CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("🔧 Manual email processing triggered");
            
            // Get the GraphEmailToTicketProcessor service
            var emailProcessor = HttpContext.RequestServices.GetRequiredService<GraphEmailToTicketProcessor>();
            
            await emailProcessor.ProcessEmailsAsync(ct);
            
            _logger.LogInformation("✅ Manual email processing completed");
            return Ok(new { message = "Email processing triggered successfully. Check server logs for details." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during manual email processing");
            return StatusCode(500, new { message = "Error processing emails", error = ex.Message });
        }
    }

    // ================= Quick Templates =================
    
    /// <summary>
    /// Get all quick templates
    /// </summary>
    [HttpGet("quick-templates")]
    public async Task<ActionResult<IEnumerable<QuickTemplateDto>>> GetQuickTemplates([FromQuery] bool includeInactive = false)
    {
        try
        {
            var query = _context.QuickTemplates
                .Where(t => !t.IsDeleted);

            if (!includeInactive)
            {
                query = query.Where(t => t.IsActive);
            }

            var templates = await query
                .OrderBy(t => t.DisplayOrder)
                .ThenBy(t => t.Label)
                .Select(t => new QuickTemplateDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Label = t.Label,
                    TitleTemplate = t.TitleTemplate,
                    DescriptionTemplate = t.DescriptionTemplate,
                    IconName = t.IconName,
                    Category = t.Category,
                    Priority = t.Priority,
                    CategoryId = t.CategoryId,
                    SubcategoryId = t.SubcategoryId,
                    DepartmentId = t.DepartmentId,
                    DisplayOrder = t.DisplayOrder,
                    IsActive = t.IsActive
                })
                .ToListAsync();

            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching quick templates");
            return StatusCode(500, new { message = "Error fetching quick templates", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a single quick template by ID
    /// </summary>
    [HttpGet("quick-templates/{id:int}")]
    public async Task<ActionResult<QuickTemplateDto>> GetQuickTemplate(int id)
    {
        var template = await _context.QuickTemplates
            .Where(t => t.Id == id && !t.IsDeleted)
            .Select(t => new QuickTemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Label = t.Label,
                TitleTemplate = t.TitleTemplate,
                DescriptionTemplate = t.DescriptionTemplate,
                IconName = t.IconName,
                Category = t.Category,
                Priority = t.Priority,
                CategoryId = t.CategoryId,
                SubcategoryId = t.SubcategoryId,
                DepartmentId = t.DepartmentId,
                DisplayOrder = t.DisplayOrder,
                IsActive = t.IsActive
            })
            .FirstOrDefaultAsync();

        if (template == null)
            return NotFound();

        return Ok(template);
    }

    /// <summary>
    /// Create a new quick template
    /// </summary>
    [HttpPost("quick-templates")]
    public async Task<ActionResult<QuickTemplateDto>> CreateQuickTemplate([FromBody] CreateQuickTemplateRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Label))
            return BadRequest("Label is required");

        var template = new QuickTemplate
        {
            Name = request.Name?.Trim() ?? request.Label.Trim(),
            Label = request.Label.Trim(),
            TitleTemplate = request.TitleTemplate?.Trim() ?? string.Empty,
            DescriptionTemplate = request.DescriptionTemplate?.Trim() ?? string.Empty,
            IconName = request.IconName ?? "FileText",
            Category = request.Category ?? "general-inquiry",
            Priority = request.Priority ?? 1,
            CategoryId = request.CategoryId,
            SubcategoryId = request.SubcategoryId,
            DepartmentId = request.DepartmentId,
            DisplayOrder = request.DisplayOrder ?? 0,
            IsActive = request.IsActive ?? true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.QuickTemplates.Add(template);
        await _context.SaveChangesAsync(ct);

        var dto = new QuickTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Label = template.Label,
            TitleTemplate = template.TitleTemplate,
            DescriptionTemplate = template.DescriptionTemplate,
            IconName = template.IconName,
            Category = template.Category,
            Priority = template.Priority,
            CategoryId = template.CategoryId,
            SubcategoryId = template.SubcategoryId,
            DepartmentId = template.DepartmentId,
            DisplayOrder = template.DisplayOrder,
            IsActive = template.IsActive
        };

        return CreatedAtAction(nameof(GetQuickTemplate), new { id = template.Id }, dto);
    }

    /// <summary>
    /// Update an existing quick template
    /// </summary>
    [HttpPut("quick-templates/{id:int}")]
    public async Task<ActionResult<QuickTemplateDto>> UpdateQuickTemplate(int id, [FromBody] UpdateQuickTemplateRequest request, CancellationToken ct)
    {
        var template = await _context.QuickTemplates
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (template == null)
            return NotFound();

        if (request.Name != null) template.Name = request.Name.Trim();
        if (request.Label != null) template.Label = request.Label.Trim();
        if (request.TitleTemplate != null) template.TitleTemplate = request.TitleTemplate.Trim();
        if (request.DescriptionTemplate != null) template.DescriptionTemplate = request.DescriptionTemplate.Trim();
        if (request.IconName != null) template.IconName = request.IconName;
        if (request.Category != null) template.Category = request.Category;
        if (request.Priority.HasValue) template.Priority = request.Priority.Value;
        if (request.CategoryId.HasValue) template.CategoryId = request.CategoryId.Value == 0 ? null : request.CategoryId;
        if (request.SubcategoryId.HasValue) template.SubcategoryId = request.SubcategoryId.Value == 0 ? null : request.SubcategoryId;
        if (request.DepartmentId.HasValue) template.DepartmentId = request.DepartmentId.Value == 0 ? null : request.DepartmentId;
        if (request.DisplayOrder.HasValue) template.DisplayOrder = request.DisplayOrder.Value;
        if (request.IsActive.HasValue) template.IsActive = request.IsActive.Value;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        var dto = new QuickTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Label = template.Label,
            TitleTemplate = template.TitleTemplate,
            DescriptionTemplate = template.DescriptionTemplate,
            IconName = template.IconName,
            Category = template.Category,
            Priority = template.Priority,
            CategoryId = template.CategoryId,
            SubcategoryId = template.SubcategoryId,
            DepartmentId = template.DepartmentId,
            DisplayOrder = template.DisplayOrder,
            IsActive = template.IsActive
        };

        return Ok(dto);
    }

    /// <summary>
    /// Delete a quick template (soft delete)
    /// </summary>
    [HttpDelete("quick-templates/{id:int}")]
    public async Task<IActionResult> DeleteQuickTemplate(int id, CancellationToken ct)
    {
        var template = await _context.QuickTemplates.FindAsync(id);

        if (template == null || template.IsDeleted)
            return NotFound();

        template.IsDeleted = true;
        template.IsActive = false;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return NoContent();
    }

    /// <summary>
    /// Reorder quick templates
    /// </summary>
    [HttpPut("quick-templates/reorder")]
    public async Task<IActionResult> ReorderQuickTemplates([FromBody] List<ReorderQuickTemplateRequest> reorderList, CancellationToken ct)
    {
        var ids = reorderList.Select(r => r.Id).ToList();
        var templates = await _context.QuickTemplates
            .Where(t => ids.Contains(t.Id) && !t.IsDeleted)
            .ToListAsync();

        foreach (var template in templates)
        {
            var order = reorderList.FirstOrDefault(r => r.Id == template.Id);
            if (order != null)
            {
                template.DisplayOrder = order.DisplayOrder;
                template.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(ct);

        return Ok();
    }
}

// Quick Template DTOs
public class QuickTemplateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string TitleTemplate { get; set; } = string.Empty;
    public string DescriptionTemplate { get; set; } = string.Empty;
    public string IconName { get; set; } = "FileText";
    public string Category { get; set; } = "general-inquiry";
    public int Priority { get; set; } = 1;
    public int? CategoryId { get; set; }
    public int? SubcategoryId { get; set; }
    public int? DepartmentId { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public record CreateQuickTemplateRequest(
    string? Name,
    string Label,
    string? TitleTemplate,
    string? DescriptionTemplate,
    string? IconName,
    string? Category,
    int? Priority,
    int? CategoryId,
    int? SubcategoryId,
    int? DepartmentId,
    int? DisplayOrder,
    bool? IsActive
);

public record UpdateQuickTemplateRequest(
    string? Name,
    string? Label,
    string? TitleTemplate,
    string? DescriptionTemplate,
    string? IconName,
    string? Category,
    int? Priority,
    int? CategoryId,
    int? SubcategoryId,
    int? DepartmentId,
    int? DisplayOrder,
    bool? IsActive
);

public record ReorderQuickTemplateRequest(int Id, int DisplayOrder);

public record CreateEmailAccountRequest(string EmailAddress, string DisplayName, int CategoryId, bool? IsActive, string? Keywords);
public record UpdateEmailAccountRequest(string? EmailAddress, string? DisplayName, int? CategoryId, bool? IsActive, string? Keywords);
public record CreateTagRequest(string Name, int SubCategoryId, bool? IsActive);
public record UpdateTagRequest(string? Name, int? SubCategoryId, bool? IsActive);

public record ProcessEmailToTicketRequest(string EmailAddress, string Subject, string? Content);
