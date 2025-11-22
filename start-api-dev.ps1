# Start API Server in Development Mode (Local Database)
$env:ASPNETCORE_ENVIRONMENT = 'Development'
Write-Host "Starting API server in DEVELOPMENT mode..." -ForegroundColor Green
Write-Host "This will use your LOCAL database: ERPTrainingDB" -ForegroundColor Yellow
Write-Host ""
dotnet run --project backend/ERPTraining.API --urls http://localhost:5015
