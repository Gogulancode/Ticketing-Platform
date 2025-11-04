namespace ERPTraining.Core.DTOs;

public class RoleMasterDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    // Identity role backing this role (Name-based sync). Needed client-side for permission updates.
    public string? IdentityRoleId { get; set; }
}

public class CreateRoleMasterDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateRoleMasterDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ToggleRoleStatusRequest
{
    public bool IsActive { get; set; }
}
