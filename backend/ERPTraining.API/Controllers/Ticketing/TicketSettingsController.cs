using ERPTraining.Core.Entities.Tickets;
using ERPTraining.Core.DTOs.Ticketing;
using ERPTraining.Core.Ticketing.Settings.DTOs;
using ERPTraining.Core.Ticketing.Settings.Interfaces;
using ERPTraining.Infrastructure.Data;
using ERPTraining.Infrastructure.Services.Ticketing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
// Groups endpoints moved to dedicated TicketGroupsController

namespace ERPTraining.API.Controllers.Ticketing;

[ApiController]
[Route("api/tickets/settings")] // Keep original path so frontend stays untouched
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

        var entity = new TicketCategory
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            DisplayOrder = request.DisplayOrder ?? 0,
            Color = request.Color,
            IconName = request.IconName,
            IsActive = true
        };

        var created = await _service.CreateCategoryAsync(entity, ct);
        return CreatedAtAction(nameof(GetCategory), new { id = created.Id }, Map(created));
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

    // DELETE (soft): api/tickets/settings/categories/{id}
    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id, CancellationToken ct)
    {
        var result = await _service.SoftDeleteCategoryAsync(id, ct);
        if (!result) return NotFound();
        return NoContent();
    }

    private static TicketCategoryDto Map(TicketCategory c) => new(c.Id, c.Name, c.Description, c.IsActive, c.DisplayOrder, c.Color, c.IconName);

    // ================= SubCategories =================

    // GET: api/tickets/settings/subcategories
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

        var entity = new TicketSubCategory
        {
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            DisplayOrder = request.DisplayOrder ?? 0,
            IsActive = true
        };

        var created = await _service.CreateSubCategoryAsync(entity, ct);
        return CreatedAtAction(nameof(GetSubCategory), new { id = created.Id }, created);
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

    private static TicketPriorityDto Map(TicketPriority p) => new(p.Id, p.Name, p.Description, p.Level, p.Color, p.IsActive, p.SortOrder);

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

        var entity = new TicketPriority
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

    private static TicketStatusDto Map(TicketStatus s)
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

        var entity = new TicketStatus
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
    public async Task<ActionResult<IEnumerable<object>>> GetCustomFields([FromQuery] int? categoryId = null, [FromQuery] int? subCategoryId = null)
    {
        IEnumerable<ERPTraining.Core.Entities.Ticketing.CustomField> fields;
        
        if (categoryId.HasValue && subCategoryId.HasValue)
        {
            // Filter by both category and subcategory for precise matching
            fields = await _customFieldsService.GetByCategoryAndSubCategoryAsync(categoryId.Value, subCategoryId.Value);
        }
        else if (categoryId.HasValue)
        {
            fields = await _customFieldsService.GetByCategoryAsync(categoryId.Value);
        }
        else if (subCategoryId.HasValue)
        {
            fields = await _customFieldsService.GetBySubCategoryAsync(subCategoryId.Value);
        }
        else
        {
            fields = await _customFieldsService.GetAllAsync();
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

        var result = new
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

        return Ok(result);
    }

    // POST: api/tickets/settings/custom-fields
    [HttpPost("custom-fields")]
    public async Task<ActionResult<object>> CreateCustomField([FromBody] object request)
    {
        try
        {
            var json = System.Text.Json.JsonSerializer.Serialize(request);
            var data = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(json);

            var customField = new ERPTraining.Core.Entities.Ticketing.CustomField
            {
                Name = data["name"].ToString()!,
                Label = data["label"].ToString()!,
                Type = data["type"].ToString()!,
                CategoryId = data.ContainsKey("categoryId") && data["categoryId"] != null ? int.Parse(data["categoryId"].ToString()!) : null,
                SubCategoryId = data.ContainsKey("subCategoryId") && data["subCategoryId"] != null ? int.Parse(data["subCategoryId"].ToString()!) : null,
                Options = data.ContainsKey("options") && data["options"] != null ? System.Text.Json.JsonSerializer.Serialize(data["options"]) : null,
                Placeholder = data.ContainsKey("placeholder") ? data["placeholder"]?.ToString() : null,
                IsRequired = data.ContainsKey("isRequired") && bool.Parse(data["isRequired"].ToString()!),
                IsActive = !data.ContainsKey("isActive") || bool.Parse(data["isActive"].ToString()!),
                DisplayOrder = data.ContainsKey("displayOrder") ? int.Parse(data["displayOrder"].ToString()!) : 0,
                ValidationRules = data.ContainsKey("validationRules") && data["validationRules"] != null ? System.Text.Json.JsonSerializer.Serialize(data["validationRules"]) : null
            };

            var created = await _customFieldsService.CreateAsync(customField);
            
            var result = new
            {
                id = created.Id,
                name = created.Name,
                label = created.Label,
                type = created.Type,
                categoryId = created.CategoryId,
                subCategoryId = created.SubCategoryId,
                options = created.Options != null ? System.Text.Json.JsonSerializer.Deserialize<string[]>(created.Options) : null,
                placeholder = created.Placeholder,
                isRequired = created.IsRequired,
                isActive = created.IsActive,
                displayOrder = created.DisplayOrder,
                validationRules = created.ValidationRules != null ? System.Text.Json.JsonSerializer.Deserialize<object>(created.ValidationRules) : null
            };

            return CreatedAtAction(nameof(GetCustomField), new { id = created.Id }, result);
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
            var json = System.Text.Json.JsonSerializer.Serialize(request);
            var data = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(json);

            var customField = new ERPTraining.Core.Entities.Ticketing.CustomField
            {
                Id = id,
                Name = data["name"].ToString()!,
                Label = data["label"].ToString()!,
                Type = data["type"].ToString()!,
                CategoryId = data.ContainsKey("categoryId") && data["categoryId"] != null ? int.Parse(data["categoryId"].ToString()!) : null,
                SubCategoryId = data.ContainsKey("subCategoryId") && data["subCategoryId"] != null ? int.Parse(data["subCategoryId"].ToString()!) : null,
                Options = data.ContainsKey("options") && data["options"] != null ? System.Text.Json.JsonSerializer.Serialize(data["options"]) : null,
                Placeholder = data.ContainsKey("placeholder") ? data["placeholder"]?.ToString() : null,
                IsRequired = data.ContainsKey("isRequired") && bool.Parse(data["isRequired"].ToString()!),
                IsActive = !data.ContainsKey("isActive") || bool.Parse(data["isActive"].ToString()!),
                DisplayOrder = data.ContainsKey("displayOrder") ? int.Parse(data["displayOrder"].ToString()!) : 0,
                ValidationRules = data.ContainsKey("validationRules") && data["validationRules"] != null ? System.Text.Json.JsonSerializer.Serialize(data["validationRules"]) : null
            };

            var updated = await _customFieldsService.UpdateAsync(id, customField);
            if (updated == null) return NotFound();

            var result = new
            {
                id = updated.Id,
                name = updated.Name,
                label = updated.Label,
                type = updated.Type,
                categoryId = updated.CategoryId,
                subCategoryId = updated.SubCategoryId,
                options = updated.Options != null ? System.Text.Json.JsonSerializer.Deserialize<string[]>(updated.Options) : null,
                placeholder = updated.Placeholder,
                isRequired = updated.IsRequired,
                isActive = updated.IsActive,
                displayOrder = updated.DisplayOrder,
                validationRules = updated.ValidationRules != null ? System.Text.Json.JsonSerializer.Deserialize<object>(updated.ValidationRules) : null
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating custom field {Id}", id);
            return BadRequest("Failed to update custom field");
        }
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
                supportedDomains = new[] { "babajishivram.com" },
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
    // TODO: Fix entity reference issues 
    /*
    // GET: api/tickets/settings/tags
    [HttpGet("tags")]
    public async Task<ActionResult<IEnumerable<object>>> GetTags([FromQuery] bool includeInactive = false)
    {
        try
        {
            var tags = await _context.TicketTags
                .Where(t => includeInactive || t.IsActive)
                .Include(t => t.SubCategory)
                .Select(t => new
                {
                    Id = t.Id,
                    Name = t.Name,
                    SubCategoryId = t.SubCategoryId,
                    SubCategoryName = t.SubCategory != null ? t.SubCategory.Name : null,
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
}

public record CreateEmailAccountRequest(string EmailAddress, string DisplayName, int CategoryId, bool? IsActive, string? Keywords);
public record UpdateEmailAccountRequest(string? EmailAddress, string? DisplayName, int? CategoryId, bool? IsActive, string? Keywords);
public record CreateTagRequest(string Name, int SubCategoryId, bool? IsActive);
public record UpdateTagRequest(string? Name, int? SubCategoryId, bool? IsActive);

public record ProcessEmailToTicketRequest(string EmailAddress, string Subject, string? Content);
