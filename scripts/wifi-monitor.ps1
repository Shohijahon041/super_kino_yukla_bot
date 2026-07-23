# ============================================
# WiFi Avtomatik Qayta Ulanish Skripti
# ============================================
# Bu skript WiFi uzilsa:
#   1. Avtomatik qayta ulanishga urinadi
#   2. Agar WiFi topilmasa, telefon hotspotiga ulanadi
#   3. Har 30 soniyada holatni tekshiradi
#
# Ishlatish:
#   powershell -ExecutionPolicy Bypass -File scripts\wifi-monitor.ps1
#
# Yashirin ishlash uchun:
#   start "" powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "scripts\wifi-monitor.ps1"
# ============================================

$HOTSPOT_NAME = "iPhone"                    # Telefon hotspot nomi (o'zgartiring)
$HOTSPOT_PASS = ""                           # Hotspot paroli (kerak bo'lsa)
$CHECK_INTERVAL = 30                          # Tekshirish intervali (soniya)
$MAX_RETRY = 5                                # Maksimal qayta urinishlar

$wifiInterfaces = @()
$retryCount = 0
$lastStatus = "unknown"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logDir = Join-Path $PSScriptRoot "..\logs"
    if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    $logFile = Join-Path $logDir "wifi-monitor.log"
    "$timestamp [$Level] $Message" | Out-File -Append -FilePath $logFile
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $(switch($Level) { "ERROR" { "Red" } "WARN" { "Yellow" } default { "Green" } })
}

function Test-WiFiConnection {
    try {
        $result = netsh wlan show interfaces 2>&1
        if ($result -match "State\s*:\s*(Connected|Ulanmaqda)") {
            $ssid = ""
            if ($result -match "SSID\s*:\s*(.+)") { $ssid = $matches[1].Trim() }
            return @{ Connected = $true; SSID = $ssid }
        }
        return @{ Connected = $false; SSID = "" }
    } catch {
        return @{ Connected = $false; SSID = "" }
    }
}

function Connect-WiFi {
    param([string]$ProfileName)
    try {
        Write-Log "WiFi'ga qayta ulanmoqda: $ProfileName"
        netsh wlan connect name="$ProfileName" 2>&1 | Out-Null
        Start-Sleep -Seconds 5
        $status = Test-WiFiConnection
        if ($status.Connected) {
            Write-Log "Muvaffaqiyatli ulanildi: $($status.SSID)"
            return $true
        }
        return $false
    } catch {
        Write-Log "Ulanish xatoligi: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Connect-Hotspot {
    param([string]$HotspotName)
    try {
        Write-Log "Hotspot'ga ulanmoqda: $HotspotName" "WARN"
        
        # Profil yaratish (agar yo'q bo'lsa)
        $profileXml = @"
<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>$HotspotName</name>
    <SSIDConfig><SSID><name>$HotspotName</name></SSID></SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>manual</connectionMode>
    <MSM><security>
        <authEncryption><authentication>WPA2PSK</authentication><encryption>AES</encryption><useOneX>false</useOneX></authEncryption>
        <sharedKey><keyType>passPhrase</keyType><protected>false</protected><keyMaterial>$HOTSPOT_PASS</keyMaterial></sharedKey>
    </security></MSM>
</WLANProfile>
"@
        $tempFile = Join-Path $env:TEMP "hotspot_profile.xml"
        $profileXml | Out-File -FilePath $tempFile -Encoding UTF8
        netsh wlan add profile filename="$tempFile" 2>&1 | Out-Null
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
        
        # Ulanish
        netsh wlan connect name="$HotspotName" 2>&1 | Out-Null
        Start-Sleep -Seconds 8
        
        $status = Test-WiFiConnection
        if ($status.Connected) {
            Write-Log "Hotspot'ga muvaffaqiyatli ulanildi: $($status.SSID)"
            return $true
        }
        Write-Log "Hotspot'ga ulanib bo'lmadi" "WARN"
        return $false
    } catch {
        Write-Log "Hotspot xatoligi: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# ============================================
# ASOSIY DOIRA
# ============================================
Write-Log "WiFi Monitor ishga tushdi"
Write-Log "Tekshirish intervali: $CHECK_INTERVAL soniya"
Write-Log "Hotspot nomi: $HOTSPOT_NAME"

while ($true) {
    $status = Test-WiFiConnection
    
    if ($status.Connected) {
        if ($lastStatus -ne "connected") {
            Write-Log "WiFi ulanishi tiklandi: $($status.SSID)"
        }
        $lastStatus = "connected"
        $retryCount = 0
    } else {
        if ($lastStatus -ne "disconnected") {
            Write-Log "WiFi uzildi! Qayta ulanishga urinish..." "WARN"
        }
        $lastStatus = "disconnected"
        $retryCount++
        
        if ($retryCount -le $MAX_RETRY) {
            # Avval oddiy WiFi'ga qayta ulanishga urinish
            $profiles = (netsh wlan show profiles 2>&1 | Select-String "All User Profile\s*:\s*(.+)" | ForEach-Object { $_.Matches.Groups[1].Value.Trim() })
            
            $connected = $false
            foreach ($profile in $profiles) {
                if (Connect-WiFi -ProfileName $profile) {
                    $connected = $true
                    break
                }
                Start-Sleep -Seconds 2
            }
            
            # Agar WiFi topilmasa, hotspotga ulanish
            if (!$connected -and $HOTSPOT_NAME) {
                Write-Log "Oddiy WiFi topilmadi. Hotspotga ulanishga urinilmoqda..." "WARN"
                Connect-Hotspot -HotspotName $HOTSPOT_NAME
            }
        } else {
            Write-Log "Maksimal urinishlar ($MAX_RETRY) tugadi. $CHECK_INTERVAL soniyadan keyin qayta uriniladi." "WARN"
            $retryCount = 0
        }
    }
    
    Start-Sleep -Seconds $CHECK_INTERVAL
}
