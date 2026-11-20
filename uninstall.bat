@echo off
setlocal
cd /d "%~dp0"
echo ============================================
echo      Yandex Music Enhancer - Uninstaller    
echo ============================================

echo Closing running instances of Yandex Music...
taskkill /F /IM "YandexMusic.exe" >nul 2>nul

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

node "scripts\patcher.js" restore %*
echo.
pause
