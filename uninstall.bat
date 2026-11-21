@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================
echo      Yandex Music Enhancer - Uninstaller    
echo ============================================

echo Closing running instances of Yandex Music...
taskkill /F /IM "Яндекс Музыка.exe" /IM "YandexMusic.exe" /IM "yandex-music.exe" >nul 2>nul
ping 127.0.0.1 -n 2 >nul

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

node "scripts\patcher.js" restore %*
echo.
pause
