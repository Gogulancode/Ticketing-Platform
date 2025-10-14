# Create Admin User Script
# Run this if you need to create a new admin account

Write-Host "Creating admin user account..." -ForegroundColor Green

# Register new user
$registerBody = @{
    email = "admin@demo.com"
    password = "Admin@123"
    confirmPassword = "Admin@123"
    firstName = "Admin"
    lastName = "User"
    department = "IT"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "http://localhost:5015/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host "✅ User created successfully!" -ForegroundColor Green
    Write-Host "Token: $($response.token)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Cyan
    Write-Host "  Email: admin@demo.com" -ForegroundColor White
    Write-Host "  Password: Admin@123" -ForegroundColor White
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "User may already exist. Try logging in with:" -ForegroundColor Yellow
    Write-Host "  Email: admin@demo.com" -ForegroundColor White
    Write-Host "  Password: Admin@123" -ForegroundColor White
}
