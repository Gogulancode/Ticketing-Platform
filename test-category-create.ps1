$body = @{
    name = "Test Category $(Get-Date -Format 'HHmmss')"
    description = "Test from API"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5015/api/tickets/settings/categories' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Response Body: $($reader.ReadToEnd())"
    }
}

# Now check if it was saved
Start-Sleep -Seconds 1
Write-Host "`nChecking database..." -ForegroundColor Yellow
sqlcmd -S "." -d ERPTrainingDB -E -Q "SELECT TOP 3 Id, Name, IsActive, CreatedAt FROM TicketCategories ORDER BY CreatedAt DESC"
