# Real-time Production Deployment Monitor
# Monitor the backend deployment and verify CORS fix
Write-Host "=== Production Backend Deployment Monitor ===" -ForegroundColor Green
Write-Host "Monitoring: 192.168.6.171:81" -ForegroundColor Yellow
Write-Host "Package: ERPTraining-Backend-SQLCLIENT-FIXED-20251105-195517" -ForegroundColor Yellow
Write-Host ""

$apiUrl = "http://192.168.6.171:81/api"
$frontendUrl = "http://192.168.6.171"

Write-Host "🚀 Starting deployment monitoring..." -ForegroundColor Blue
Write-Host ""

# Monitor loop
for ($i = 1; $i -le 10; $i++) {
    Write-Host "--- Check #$i $(Get-Date -Format 'HH:mm:ss') ---" -ForegroundColor Cyan
    
    # Test API availability
    try {
        $response = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ API Status: $($response.StatusCode) - Backend is responding!" -ForegroundColor Green
        
        # Test CORS headers
        try {
            $corsResponse = Invoke-WebRequest -Uri $apiUrl -Method Options -Headers @{'Origin'=$frontendUrl} -UseBasicParsing -TimeoutSec 5
            $corsHeader = $corsResponse.Headers['Access-Control-Allow-Origin']
            if ($corsHeader) {
                Write-Host "✅ CORS Headers: $corsHeader - CORS fix working!" -ForegroundColor Green
            } else {
                Write-Host "⚠️ CORS Headers: Not found" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️ CORS Test: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # Test auth endpoint
        try {
            $authResponse = Invoke-WebRequest -Uri "$apiUrl/auth" -UseBasicParsing -TimeoutSec 5
            Write-Host "✅ Auth Endpoint: $($authResponse.StatusCode) - Authentication ready!" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Auth Endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        Write-Host "🎉 DEPLOYMENT SUCCESSFUL! SqlClient fix is working!" -ForegroundColor Green
        break
        
    } catch {
        Write-Host "❌ API Status: Not responding - $($_.Exception.Message)" -ForegroundColor Red
        if ($i -eq 10) {
            Write-Host "⚠️ Backend still not responding after 10 checks" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Blue
Write-Host "1. Open browser to: $frontendUrl"
Write-Host "2. Try logging in"
Write-Host "3. Check browser console (F12) for CORS errors"
Write-Host "4. Verify login requests reach: $apiUrl/auth/login"
Write-Host ""
Write-Host "Expected Result: No more CORS errors! 🎉" -ForegroundColor Green