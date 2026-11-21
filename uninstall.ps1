# Yandex Music Enhancer - Windows PowerShell Uninstaller
# Run: powershell -ExecutionPolicy Bypass -File uninstall.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "     Yandex Music Enhancer - Uninstaller    " -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

$NodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCheck) {
    Write-Host "Node.js is not installed!" -ForegroundColor Red
    Exit 1
}

Write-Host "Closing running instances of Yandex Music..." -ForegroundColor Gray
Get-Process | Where-Object { $_.ProcessName -like "*yandex*" -or $_.ProcessName -like "*музыка*" -or $_.ProcessName -like "*music*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node "$ScriptDir\scripts\patcher.js" restore $args
