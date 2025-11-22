# Quick test: Create category without login (direct API call)
$body = @{
    name = "Test Category $(Get-Date -Format 'HHmmss')"
    description = "Testing local DB save"
} | ConvertTo-Json

Write-Host "Creating category via API..." -ForegroundColor Yellow
Write-Host "POST http://localhost:5015/api/tickets/settings/categories" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5015/api/tickets/settings/categories' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Created with ID: $($result.id)" -ForegroundColor Green
    Write-Host "✅ Name: $($result.name)" -ForegroundColor Green
    
    # Check database immediately
    Write-Host ""
    Write-Host "Checking local database..." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    sqlcmd -S "." -d ERPTrainingDB -E -Q "SELECT TOP 5 Id, Name, IsActive, CreatedAt FROM TicketCategories ORDER BY CreatedAt DESC"
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
