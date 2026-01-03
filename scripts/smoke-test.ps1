# Smoke Test Script for Ticketing Platform
# Tests all critical API endpoints and reports status

param(
    [string]$BaseUrl = "https://enrichbeauty.solutionsnextwave.com",
    [string]$Token = ""  # Optional: JWT token for authenticated endpoints
)

$ApiUrl = "$BaseUrl/api"
$results = @()
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [int]$ExpectedStatus = 200,
        [bool]$RequiresAuth = $false,
        [object]$Body = $null,
        [string]$Category = "General"
    )
    
    $headers = @{}
    if ($RequiresAuth -and $Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = 30
            Headers = $headers
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
            $params["ContentType"] = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        $success = $status -eq $ExpectedStatus
        
        return @{
            Name = $Name
            Status = $status
            Success = $success
            Message = if ($success) { "OK" } else { "Expected $ExpectedStatus, got $status" }
            Category = $Category
        }
    }
    catch {
        $errorStatus = 0
        if ($_.Exception.Response) {
            $errorStatus = [int]$_.Exception.Response.StatusCode
        }
        
        # 401 is expected for auth-required endpoints without token
        if ($RequiresAuth -and -not $Token -and $errorStatus -eq 401) {
            return @{
                Name = $Name
                Status = 401
                Success = $true
                Message = "OK (Auth required - expected)"
                Category = $Category
            }
        }
        
        return @{
            Name = $Name
            Status = $errorStatus
            Success = $false
            Message = $_.Exception.Message
            Category = $Category
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TICKETING PLATFORM SMOKE TEST" -ForegroundColor Cyan
Write-Host "  $BaseUrl" -ForegroundColor Gray
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============ INFRASTRUCTURE ENDPOINTS ============
Write-Host "Testing Infrastructure..." -ForegroundColor Yellow

$infraTests = @(
    @{ Name = "Health Check"; Url = "$ApiUrl/health"; RequiresAuth = $false; Category = "Infrastructure" },
    @{ Name = "Frontend Index"; Url = "$BaseUrl/index.html"; RequiresAuth = $false; Category = "Infrastructure" }
)

foreach ($test in $infraTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url -RequiresAuth $test.RequiresAuth -Category $test.Category
    $results += $result
    
    if ($result.Success) {
        Write-Host "  [PASS] $($result.Name): $($result.Message)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAIL] $($result.Name): $($result.Message)" -ForegroundColor Red
        $failed++
    }
}

# ============ TICKET SETTINGS ENDPOINTS ============
Write-Host "`nTesting Ticket Settings..." -ForegroundColor Yellow

$settingsTests = @(
    @{ Name = "Categories"; Url = "$ApiUrl/tickets/settings/categories"; RequiresAuth = $true; Category = "Settings" },
    @{ Name = "Subcategories"; Url = "$ApiUrl/tickets/settings/subcategories"; RequiresAuth = $true; Category = "Settings" },
    @{ Name = "Priorities"; Url = "$ApiUrl/tickets/settings/priorities"; RequiresAuth = $true; Category = "Settings" },
    @{ Name = "Statuses"; Url = "$ApiUrl/tickets/settings/statuses"; RequiresAuth = $true; Category = "Settings" },
    @{ Name = "Departments"; Url = "$ApiUrl/tickets/settings/departments"; RequiresAuth = $true; Category = "Settings" },
    @{ Name = "Agents"; Url = "$ApiUrl/tickets/settings/agents"; RequiresAuth = $true; Category = "Settings" },
    @{ Name = "Quick Templates"; Url = "$ApiUrl/tickets/settings/quick-templates"; RequiresAuth = $true; Category = "Settings" }
)

foreach ($test in $settingsTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url -RequiresAuth $test.RequiresAuth -Category $test.Category
    $results += $result
    
    if ($result.Success) {
        Write-Host "  [PASS] $($result.Name): $($result.Message)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAIL] $($result.Name): $($result.Message)" -ForegroundColor Red
        $failed++
    }
}

# ============ TICKETS V2 ENDPOINTS ============
Write-Host "`nTesting Tickets API..." -ForegroundColor Yellow

$ticketTests = @(
    @{ Name = "My Tickets"; Url = "$ApiUrl/tickets/my?pageSize=10"; RequiresAuth = $true; Category = "Tickets" }
)

foreach ($test in $ticketTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url -RequiresAuth $test.RequiresAuth -Category $test.Category
    $results += $result
    
    if ($result.Success) {
        Write-Host "  [PASS] $($result.Name): $($result.Message)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAIL] $($result.Name): $($result.Message)" -ForegroundColor Red
        $failed++
    }
}

# ============ ANALYTICS & REPORTS ENDPOINTS ============
Write-Host "`nTesting Analytics & Reports..." -ForegroundColor Yellow

$analyticsTests = @(
    @{ Name = "Dashboard Analytics"; Url = "$ApiUrl/analytics/dashboard"; RequiresAuth = $true; Category = "Analytics" },
    @{ Name = "All Tickets Report"; Url = "$ApiUrl/Reports/all-tickets"; RequiresAuth = $true; Category = "Analytics" }
)

foreach ($test in $analyticsTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url -RequiresAuth $test.RequiresAuth -Category $test.Category
    $results += $result
    
    if ($result.Success) {
        Write-Host "  [PASS] $($result.Name): $($result.Message)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAIL] $($result.Name): $($result.Message)" -ForegroundColor Red
        $failed++
    }
}

# ============ AUTH ENDPOINTS ============
Write-Host "`nTesting Auth..." -ForegroundColor Yellow

$authTests = @(
    @{ Name = "Get Current User"; Url = "$ApiUrl/auth/me"; RequiresAuth = $true; Category = "Auth" }
)

foreach ($test in $authTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url -RequiresAuth $test.RequiresAuth -Category $test.Category
    $results += $result
    
    if ($result.Success) {
        Write-Host "  [PASS] $($result.Name): $($result.Message)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAIL] $($result.Name): $($result.Message)" -ForegroundColor Red
        $failed++
    }
}

# ============ CHAT ENDPOINTS ============
Write-Host "`nTesting Chat..." -ForegroundColor Yellow

$chatTests = @(
    @{ Name = "Conversations"; Url = "$ApiUrl/chat/conversations"; RequiresAuth = $true; Category = "Chat" },
    @{ Name = "Canned Responses"; Url = "$ApiUrl/chat/canned-responses"; RequiresAuth = $true; Category = "Chat" }
)

foreach ($test in $chatTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url -RequiresAuth $test.RequiresAuth -Category $test.Category
    $results += $result
    
    if ($result.Success) {
        Write-Host "  [PASS] $($result.Name): $($result.Message)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAIL] $($result.Name): $($result.Message)" -ForegroundColor Red
        $failed++
    }
}

# ============ SUMMARY ============
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Group by category
$categories = $results | Group-Object -Property Category
foreach ($cat in $categories) {
    $catPassed = ($cat.Group | Where-Object { $_.Success }).Count
    $catTotal = $cat.Group.Count
    $color = if ($catPassed -eq $catTotal) { "Green" } else { "Yellow" }
    Write-Host "  $($cat.Name): $catPassed/$catTotal passed" -ForegroundColor $color
}

Write-Host ""
Write-Host "  TOTAL: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "========================================" -ForegroundColor Cyan

# Return exit code
if ($failed -gt 0) { exit 1 } else { exit 0 }
