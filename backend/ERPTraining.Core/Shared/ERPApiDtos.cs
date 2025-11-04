namespace ERPTraining.Core.DTOs;

// ERP Login Response
public class ERPLoginResponseDto
{
    public bool Success { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime ExpiryTime { get; set; }
}

// ERP Module Response
public class ERPModuleDto
{
    public int lId { get; set; }
    public string sName { get; set; } = string.Empty;
    public string? sDescription { get; set; } = string.Empty;
}

// ERP Section/Page Response - matches GetPageMasterList API
public class ERPSectionDto
{
    public int pageId { get; set; }
    public string pageName { get; set; } = string.Empty;
    public int parentPage { get; set; }
    public int moduleID { get; set; }
}

// ERP User Response
public class ERPUserDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? JoinDate { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public List<int> RoleIds { get; set; } = new();
}

// ERP Role Response - matches actual GetAllRoleMaster API format
public class ERPRoleDto
{
    public int lRoleId { get; set; }
    public string sName { get; set; } = string.Empty;
    public string? sRemarks { get; set; } = string.Empty;
}

// ERP Role Details Response - matches GetAllRoleDetails API
public class ERPRoleDetailApiDto
{
    public int lRoleId { get; set; }      // ERP Role ID
    public int lModuleId { get; set; }    // ERP Module ID  
    public int lTaskId { get; set; }      // ERP Task/Section ID
    public string sTaskId { get; set; } = string.Empty; // Role detail/task name
}

// ERP User Master Response - matches GetUserMasterList API
public class ERPUserMasterApiDto
{
    public int lId { get; set; }          // ERP User ID
    public string sName { get; set; } = string.Empty;    // User Name
    public string sEmail { get; set; } = string.Empty;   // User Email
    public object lRoleId { get; set; } = 0;      // ERP Role ID (can be int or object)
    public string password { get; set; } = string.Empty; // Password (usually empty in response)
    
    // Helper property to safely get RoleId as integer
    public int SafeRoleId
    {
        get
        {
            if (lRoleId == null) return 0;
            
            if (lRoleId is int intValue) return intValue;
            
            if (int.TryParse(lRoleId.ToString(), out int parsedValue))
                return parsedValue;
                
            return 0; // Default fallback
        }
    }
}

// ERP Role Details Response (Legacy)
public class ERPRoleDetailsDto
{
    public int RoleDetailId { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public int? PageId { get; set; }
    public string? PageName { get; set; } = string.Empty;
    public bool CanView { get; set; }
    public bool CanAdd { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public bool IsActive { get; set; }
}

// ERP API Generic Response Wrapper
public class ERPApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public string? ErrorCode { get; set; }
}

// ERP Login Request
public class ERPLoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
