@echo off
REM ============================================
REM CinemaHub AI — To'xtatish
REM ============================================

echo.
echo CinemaHub AI to'xtatilmoqda...
echo.

REM PM2 orqali ishga tushirilgan bo'lsa
pm2 stop all 2>nul
pm2 delete all 2>nul

REM Frontend protsesslari
taskkill /F /FI "WINDOWTITLE eq CinemaHub-Backend*" 2>nul
taskkill /F /FI "WINDOWTITLE eq CinemaHub-Admin*" 2>nul

REM WiFi monitor
taskkill /F /FI "WINDOWTITLE eq WiFi-Monitor*" 2>nul

echo.
echo CinemaHub AI to'xtatildi.
echo.
pause
