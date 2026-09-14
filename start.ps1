# =============================================
# Wallet App Starter - Phone Hotspot Mode
# 1. Turn ON phone hotspot
# 2. Connect laptop to phone hotspot  
# 3. Run this script
# 4. Scan QR code in Expo Go
# =============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     Wallet App - Phone Hotspot Mode    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ---- STEP 1: Get laptop's IP on the hotspot network ----
Write-Host "Detecting your IP address..." -ForegroundColor Yellow

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.PrefixOrigin -eq "Dhcp" -and
    $_.InterfaceAlias -notlike "*Loopback*" -and
    $_.InterfaceAlias -notlike "*WSL*"
} | Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host ""
    Write-Host "ERROR: No network found!" -ForegroundColor Red
    Write-Host "Make sure your laptop is connected to your phone hotspot first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Your laptop IP: $ip" -ForegroundColor Green
Write-Host ""

# ---- STEP 2: Update .env with correct IP ----
Write-Host "Setting API URL to: http://$ip`:5001/api" -ForegroundColor Yellow
$envPath = "$PSScriptRoot\mobile\.env"
$content = Get-Content $envPath -Raw
$content = $content -replace "EXPO_PUBLIC_API_URL=[^\r\n]*", "EXPO_PUBLIC_API_URL=http://$ip`:5001/api"
[System.IO.File]::WriteAllText($envPath, $content)
Write-Host ".env updated!" -ForegroundColor Green
Write-Host ""

# ---- STEP 3: Open firewall ports ----
Write-Host "Opening firewall ports 8081 and 5001..." -ForegroundColor Yellow
$null = netsh advfirewall firewall delete rule name="Expo8081" 2>$null
$null = netsh advfirewall firewall delete rule name="Backend5001" 2>$null
$null = netsh advfirewall firewall add rule name="Expo8081" dir=in action=allow protocol=TCP localport=8081
$null = netsh advfirewall firewall add rule name="Backend5001" dir=in action=allow protocol=TCP localport=5001
Write-Host "Firewall ready!" -ForegroundColor Green
Write-Host ""

# ---- STEP 4: Start backend ----
Write-Host "Starting backend (port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"
Start-Sleep -Seconds 4
Write-Host "Backend started!" -ForegroundColor Green
Write-Host ""

# ---- STEP 5: Start Expo with correct LAN IP ----
Write-Host "Starting Expo app..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:REACT_NATIVE_PACKAGER_HOSTNAME='$ip'; cd '$PSScriptRoot\mobile'; npx expo start --lan --clear"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "         Everything is running!         " -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Your IP:  $ip" -ForegroundColor White
Write-Host "  Backend:  http://$ip`:5001/api" -ForegroundColor White
Write-Host "  Expo QR:  exp://$ip`:8081" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Wait for QR code in the Expo window" -ForegroundColor White
Write-Host "  2. Open Expo Go on your phone" -ForegroundColor White
Write-Host "  3. Scan the QR code" -ForegroundColor White
Write-Host "  4. The app should load and work fully!" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to close this window"
