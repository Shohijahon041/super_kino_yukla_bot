@echo off
REM ============================================
REM CinemaHub AI — Bir tugma bilan ishga tushirish
REM ============================================
REM Dastur: Python 3.x talab qilinadi
REM Ishlatish: start.bat ni ikki marta bosing
REM ============================================

cd /d "%~dp0"

echo.
echo ========================================
echo   CinemaHub AI — Ishga tushirilmoqda...
echo ========================================
echo.

REM 1. Docker xizmatlarini ishga tushirish (PostgreSQL, Redis, MinIO, ElasticSearch)
echo [1/4] Docker xizmatlarini ishga tushirish...
docker-compose up -d
timeout /t 8 /nobreak >nul

REM 2. Backend ishga tushirish
echo [2/4] Backend ishga tushirish...
cd backend
if not exist "dist" (
    echo    Build qilinmoqda...
    npx nest build
)
start "CinemaHub-Backend" cmd /k "npm run start:dev"
cd ..

REM 3. Admin panel ishga tushirish
echo [3/4] Admin panel ishga tushirish...
cd admin
start "CinemaHub-Admin" cmd /k "npm run dev"
cd ..

REM 4. WiFi avtomatik ulanish skriptini ishga tushirish (ixtiyoriy)
echo [4/4] WiFi boshqaruv...
if exist "scripts\wifi-monitor.ps1" (
    start "WiFi-Monitor" powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "scripts\wifi-monitor.ps1"
)

echo.
echo ========================================
echo   CinemaHub AI muvaffaqiyatli ishga tushdi!
echo ========================================
echo.
echo   Backend:  http://localhost:3002
echo   Admin:    http://localhost:3001
echo   API Docs: http://localhost:3002/docs
echo   Bot:      @super_kino_yukla_bot
echo.
echo   Terminallarni yopmang — ular orqada ishlashi kerak!
echo.
pause
