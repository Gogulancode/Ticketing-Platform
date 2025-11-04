namespace ERPTraining.Core.DTOs;

public class UserRoleModuleSectionDto
{
    public int lRoleId { get; set; }
    public int lModuleId { get; set; }
    public int lTaskId { get; set; }  // This is Section ID
    public string sTaskId { get; set; } = string.Empty; // This is Section name
}

// Container for the array
public class UserRoleModuleSectionImportDto
{
    public List<UserRoleModuleSectionDto> RoleModuleSections { get; set; } = new();
}

// Alternative if your JSON is just a direct array
public class UserRoleModuleSectionArrayDto : List<UserRoleModuleSectionDto>
{
}
