# Check all SQL Server instances and their ERPTrainingDB databases
Write-Host "=== Checking Default Instance (.) ===" -ForegroundColor Cyan
sqlcmd -S "." -E -Q "SELECT @@SERVERNAME AS ServerInstance, DB_NAME() AS CurrentDB; SELECT TOP 3 Id, Name FROM TicketCategories ORDER BY CreatedAt DESC" -d ERPTrainingDB

Write-Host "`n=== Checking MSSQLSERVER01 Instance ===" -ForegroundColor Cyan
sqlcmd -S ".\MSSQLSERVER01" -E -Q "SELECT @@SERVERNAME AS ServerInstance, DB_NAME() AS CurrentDB; SELECT TOP 3 Id, Name FROM TicketCategories ORDER BY CreatedAt DESC" -d ERPTrainingDB 2>&1

Write-Host "`n=== Checking TRAINING_MODULE Instance ===" -ForegroundColor Cyan
sqlcmd -S "DESKTOP-81Q1B98\TRAINING_MODULE" -E -Q "SELECT @@SERVERNAME AS ServerInstance, DB_NAME() AS CurrentDB; SELECT TOP 3 Id, Name FROM TicketCategories ORDER BY CreatedAt DESC" -d ERPTrainingDB 2>&1
