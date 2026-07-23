@echo off
REM ============================================
REM CinemaHub AI — PM2 bilan ishga tushirish
REM ============================================
REM PM2: Node.js protsesslarini background'da boshqarish
REM Ekran yopsa ham, WiFi uzilsa ham ishlaydi!
REM ============================================

cd /d "%~dp0"

echo.
echo ========================================
echo   CinemaHub AI — PM2 bilan ishga tushirish
echo ========================================
echo.

REM 1. PM2 o'rnatilganini tekshirish
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2 topilmadi. O'rnatilmoqda...
    npm install -g pm2
    npm install -g pm2-windows-startup
    pm2-startup install
)

REM 2. Docker xizmatlarini ishga tushirish
echo [1/5] Docker xizmatlari...
docker-compose up -d
timeout /t 10 /nobreak >nul

REM 3. Backend build
echo [2/5] Backend build...
cd backend
if exist "dist" (rmdir /s /q dist)
npx nest build
if %errorlevel% neq 0 (
    echo BUILD XATOLIK! Tuzatilgandan keyin qayta ishga tushiring.
    pause
    exit /b 1
)

REM 4. Admin panel build
echo [3/5] Admin panel build...
cd ..\admin
if exist ".next" (rmdir /s /q .next)
npm run build
if %errorlevel% neq 0 (
    echo ADMIN BUILD XATOLIK! Tuzatilgandan keyin qayta ishga tushiring.
    pause
    exit /b 1
)
cd ..

REM 5. PM2 bilan ishga tushirish
echo [4/5] PM2 bilan ishga tushirish...
pm2 delete all 2>nul
pm2 start ecosystem.config.cjs
pm2 save

echo [5/5] Autostart sozlash...
pm2-startup install 2>nul

echo.
echo ========================================
echo   CinemaHub AI PM2 bilan ishga tushdi!
echo ========================================
echo.
echo   Holatni tekshirish: pm2 status
echo   Loglarni ko'rish:   pm2 logs
echo   To'xtatish:         pm2 stop all
echo   Qayta ishga tushirish: pm2 restart all
echo.
echo   Kompyuter restart bo'lsa ham avtomatik ishlaydi!
echo.
pm2 status
pause
