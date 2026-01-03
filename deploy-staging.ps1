# FTP Deployment Script for Staging
$ftpHost = "win8137.site4now.net"
$ftpUser = "solutionsnext-001"
$ftpPass = '4Peddun2!RVR_aA'
$remotePath = "/enrichbeauty/api"
$localPath = "d:\Ticketing Platform\staging-deploy"

function Upload-FtpFile {
    param([string]$LocalFile, [string]$RemoteFile)
    
    try {
        $ftpUri = "ftp://${ftpHost}${RemoteFile}"
        $request = [System.Net.FtpWebRequest]::Create($ftpUri)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $request.UseBinary = $true
        $request.UsePassive = $true
        
        $content = [System.IO.File]::ReadAllBytes($LocalFile)
        $request.ContentLength = $content.Length
        
        $stream = $request.GetRequestStream()
        $stream.Write($content, 0, $content.Length)
        $stream.Close()
        
        $response = $request.GetResponse()
        $response.Close()
        return $true
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
}

function Create-FtpDirectory {
    param([string]$RemotePath)
    
    try {
        $ftpUri = "ftp://${ftpHost}${RemotePath}"
        $request = [System.Net.FtpWebRequest]::Create($ftpUri)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $request.UsePassive = $true
        
        $response = $request.GetResponse()
        $response.Close()
        return $true
    } catch {
        # Directory may already exist, that's OK
        return $true
    }
}

Write-Host "=== Staging Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload app_offline.htm to stop the app
Write-Host "Step 1: Stopping application..." -ForegroundColor Yellow
$offlineContent = "<html><body>Deploying updates, please wait...</body></html>"
$offlineBytes = [System.Text.Encoding]::UTF8.GetBytes($offlineContent)
$tempFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllBytes($tempFile, $offlineBytes)

if (Upload-FtpFile -LocalFile $tempFile -RemoteFile "$remotePath/app_offline.htm") {
    Write-Host "  App offline" -ForegroundColor Green
}
Remove-Item $tempFile -Force

# Step 2: Upload key DLL files
Write-Host ""
Write-Host "Step 2: Uploading main application files..." -ForegroundColor Yellow

$keyFiles = @(
    "ERPTraining.API.dll",
    "ERPTraining.Core.dll",
    "ERPTraining.Infrastructure.dll"
)

foreach ($file in $keyFiles) {
    $localFile = Join-Path $localPath $file
    if (Test-Path $localFile) {
        Write-Host "  Uploading $file..." -NoNewline
        if (Upload-FtpFile -LocalFile $localFile -RemoteFile "$remotePath/$file") {
            Write-Host " OK" -ForegroundColor Green
        }
    }
}

# Step 3: Upload wwwroot/assets (frontend)
Write-Host ""
Write-Host "Step 3: Uploading frontend assets..." -ForegroundColor Yellow

$assetsPath = Join-Path $localPath "wwwroot\assets"
if (Test-Path $assetsPath) {
    # Create assets directory
    Create-FtpDirectory -RemotePath "$remotePath/wwwroot/assets"
    
    Get-ChildItem $assetsPath -File | ForEach-Object {
        Write-Host "  Uploading $($_.Name)..." -NoNewline
        if (Upload-FtpFile -LocalFile $_.FullName -RemoteFile "$remotePath/wwwroot/assets/$($_.Name)") {
            Write-Host " OK" -ForegroundColor Green
        }
    }
}

# Upload index.html
$indexFile = Join-Path $localPath "wwwroot\index.html"
if (Test-Path $indexFile) {
    Write-Host "  Uploading index.html..." -NoNewline
    if (Upload-FtpFile -LocalFile $indexFile -RemoteFile "$remotePath/wwwroot/index.html") {
        Write-Host " OK" -ForegroundColor Green
    }
}

# Step 4: Delete app_offline.htm to restart the app
Write-Host ""
Write-Host "Step 4: Restarting application..." -ForegroundColor Yellow

try {
    $ftpUri = "ftp://${ftpHost}${remotePath}/app_offline.htm"
    $request = [System.Net.FtpWebRequest]::Create($ftpUri)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
    $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $request.UsePassive = $true
    
    $response = $request.GetResponse()
    $response.Close()
    Write-Host "  App restarted" -ForegroundColor Green
} catch {
    Write-Host "  Error deleting app_offline.htm: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "Please test: https://enrichbeauty.solutionsnextwave.com" -ForegroundColor White
