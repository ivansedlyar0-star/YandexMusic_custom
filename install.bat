@echo off
setlocal
cd /d "%~dp0"
echo ============================================
echo       Yandex Music Enhancer - Windows       
echo ============================================

echo Closing running instances of Yandex Music...
taskkill /F /IM "YandexMusic.exe" >nul 2>nul
timeout /t 1 /nobreak >nul

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (LTS) from https://nodejs.org and try again.
    pause
    exit /b 1
)

node "scripts\patcher.js" install %*
echo.
pause
