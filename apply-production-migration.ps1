# Run this on production server to apply database migration
# Replace connection details with your production database

$serverInstance = "YOUR_PRODUCTION_SERVER"  # e.g., "sql8020.site4now.net" or "localhost\SQLEXPRESS"
$database = "YOUR_PRODUCTION_DATABASE"      # e.g., "ERPTrainingDB_Production"
$username = "YOUR_DB_USERNAME"              # e.g., "sa" or "admin"
$password = "YOUR_DB_PASSWORD"

# Path to migration script
$scriptPath = "D:\BabajiShivram_training\production-db-migration.sql"

Write-Host "Applying database migration..." -ForegroundColor Cyan

# Execute the SQL script
Invoke-Sqlcmd -ServerInstance $serverInstance `
              -Database $database `
              -Username $username `
              -Password $password `
              -InputFile $scriptPath `
              -Verbose

Write-Host "Migration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying UserNotifications table..." -ForegroundColor Yellow

# Verify the table exists
$verifyQuery = "SELECT COUNT(*) as TableExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserNotifications'"
$result = Invoke-Sqlcmd -ServerInstance $serverInstance `
                        -Database $database `
                        -Username $username `
                        -Password $password `
                        -Query $verifyQuery

if ($result.TableExists -eq 1) {
    Write-Host "[OK] UserNotifications table exists" -ForegroundColor Green
} else {
    Write-Host "[ERROR] UserNotifications table NOT found!" -ForegroundColor Red
}
