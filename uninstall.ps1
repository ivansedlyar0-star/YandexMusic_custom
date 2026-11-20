# Yandex Music Enhancer - Windows PowerShell Uninstaller
# Run: powershell -ExecutionPolicy Bypass -File uninstall.ps1

Write-Host "============================================" -ForegroundColor Yellow
Write-Host "     Yandex Music Enhancer - Uninstaller    " -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

$NodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCheck) {
    Write-Host "Node.js is not installed!" -ForegroundColor Red
    Exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node "$ScriptDir\scripts\patcher.js" restore $args
