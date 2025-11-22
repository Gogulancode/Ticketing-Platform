# Direct SQL test - Insert category directly into database
$timestamp = Get-Date -Format "HHmmss"
$name = "Direct SQL Insert $timestamp"

Write-Host "Inserting directly into database via SQL..." -ForegroundColor Yellow

$sql = @"
INSERT INTO TicketCategories (Name, Description, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
VALUES ('$name', 'Testing direct SQL insert', 999, 1, GETUTCDATE(), GETUTCDATE());

SELECT * FROM TicketCategories WHERE Name = '$name';
"@

sqlcmd -S "." -d ERPTrainingDB -E -Q $sql

Write-Host "`nNow checking via API GET..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5015/api/tickets/settings/categories" -UseBasicParsing
    $categories = $response.Content | ConvertFrom-Json
    if ($categories | Where-Object { $_.name -eq $name }) {
        Write-Host "✓ Found in API response" -ForegroundColor Green
    } else {
        Write-Host "✗ NOT in API response" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ API not responding: $($_.Exception.Message)" -ForegroundColor Red
}
