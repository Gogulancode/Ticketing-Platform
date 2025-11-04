namespace ERPTraining.Core.DTOs;

public class RoleModuleImportDto
{
    public string RoleName { get; set; } = string.Empty;
    public string? ErpRoleId { get; set; }
    public List<ImportModuleAccessDto> Modules { get; set; } = new();
}

public class ImportModuleAccessDto
{
    public string ModuleName { get; set; } = string.Empty;
    public string? ErpModuleId { get; set; }
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    public List<ImportSectionAccessDto> Sections { get; set; } = new();
}

public class ImportSectionAccessDto
{
    public string SectionName { get; set; } = string.Empty;
    public string? ErpSectionId { get; set; }
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
}

// Alternative DTO if your JSON has a different structure
public class RoleModuleImportAlternativeDto
{
    public List<RoleModuleMapping> RoleModuleMappings { get; set; } = new();
}

public class RoleModuleMapping
{
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string ModuleId { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public string? SectionId { get; set; }
    public string? SectionName { get; set; }
    public string AccessLevel { get; set; } = "View"; // View, Edit, Delete
}
