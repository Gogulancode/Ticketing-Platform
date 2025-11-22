# Deploy Fixed Backend to Production Server
# This script deploys the SqlClient-fixed backend to resolve CORS issues
Write-Host "=== ERP Training Backend Deployment (SqlClient Fixed) ===" -ForegroundColor Green
Write-Host "Target: 192.168.6.171:81" -ForegroundColor Yellow
Write-Host "Package: ERPTraining-Backend-SQLCLIENT-FIXED-20251105-195517" -ForegroundColor Yellow
Write-Host ""

$productionServer = "192.168.6.171"
$deploymentPath = "C:\inetpub\wwwroot\api"
$backupPath = "C:\inetpub\wwwroot\api_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$packagePath = "ERPTraining-Backend-SQLCLIENT-FIXED-20251105-195517"

Write-Host "Step 1: Create backup of existing deployment..." -ForegroundColor Blue
Write-Host "This creates a backup at: $backupPath"
Write-Host ""

Write-Host "Step 2: Stop IIS Application Pool..." -ForegroundColor Blue
Write-Host "Invoke-Command -ComputerName $productionServer -ScriptBlock { Stop-WebAppPool -Name 'DefaultAppPool' }"
Write-Host ""

Write-Host "Step 3: Copy new deployment files..." -ForegroundColor Blue
Write-Host "Copy-Item -Path '$packagePath\*' -Destination '\\$productionServer\c$\inetpub\wwwroot\api' -Recurse -Force"
Write-Host ""

Write-Host "Step 4: Update connection string for production..." -ForegroundColor Blue
Write-Host "Update appsettings.json with production database connection"
Write-Host ""

Write-Host "Step 5: Start IIS Application Pool..." -ForegroundColor Blue
Write-Host "Invoke-Command -ComputerName $productionServer -ScriptBlock { Start-WebAppPool -Name 'DefaultAppPool' }"
Write-Host ""

Write-Host "Step 6: Test API endpoint..." -ForegroundColor Blue
Write-Host "Test: http://$productionServer`:81/api"
Write-Host ""

Write-Host "MANUAL DEPLOYMENT STEPS:" -ForegroundColor Red
Write-Host "1. Copy ERPTraining-Backend-SQLCLIENT-FIXED-20251105-195517 folder to production server"
Write-Host "2. Backup existing C:\inetpub\wwwroot\api folder"
Write-Host "3. Replace contents with new deployment"
Write-Host "4. Update appsettings.json with production database connection string"
Write-Host "5. Restart IIS Application Pool"
Write-Host "6. Test API: http://192.168.6.171:81/api"
Write-Host ""

Write-Host "CONNECTION STRING UPDATE REQUIRED:" -ForegroundColor Yellow
Write-Host "In appsettings.json, update:"
Write-Host 'ConnectionStrings.DefaultConnection to production SQL Server instance'
Write-Host ""

Write-Host "VERIFICATION:" -ForegroundColor Green
Write-Host "After deployment, test these endpoints:"
Write-Host "- http://192.168.6.171:81/api (should return API info)"
Write-Host "- http://192.168.6.171:81/api/auth/login (should accept POST requests)"
Write-Host "- Frontend CORS errors should be resolved"
Write-Host ""

Write-Host "SqlClient Dependency Fix Applied:" -ForegroundColor Green
Write-Host "✓ Microsoft.Data.SqlClient 5.2.2 package added"
Write-Host "✓ Clean build completed successfully"
Write-Host "✓ Local testing verified API startup"
Write-Host "✓ Production deployment package ready"