$body = @{
    name = "Test Save Issue $(Get-Date -Format 'HHmmss')"
    description = "Testing database save"
} | ConvertTo-Json

Write-Host "Creating category..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5015/api/tickets/settings/categories' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Response ID: $($result.id)" -ForegroundColor Green
    Write-Host "Response Name: $($result.name)" -ForegroundColor Green
    
    # Check database
    Write-Host ""
    Write-Host "Checking if it's in database..." -ForegroundColor Yellow
    $dbCheck = sqlcmd -S "." -d ERPTrainingDB -E -Q "SELECT Id, Name FROM TicketCategories WHERE Id = $($result.id)" -h -1
    if ($dbCheck -match $result.id) {
        Write-Host "FOUND IN DATABASE!" -ForegroundColor Green
    } else {
        Write-Host "NOT IN DATABASE - This is the problem!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Latest 3 records in database:" -ForegroundColor Yellow
        sqlcmd -S "." -d ERPTrainingDB -E -Q "SELECT TOP 3 Id, Name, CreatedAt FROM TicketCategories ORDER BY CreatedAt DESC"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
