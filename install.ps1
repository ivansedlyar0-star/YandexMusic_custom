# Yandex Music Enhancer - Windows PowerShell Installer
# Run: powershell -ExecutionPolicy Bypass -File install.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "      Yandex Music Enhancer - Windows       " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$NodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCheck) {
    Write-Host "Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Exit 1
}

Write-Host "Closing running instances of Yandex Music..." -ForegroundColor Gray
Get-Process | Where-Object { $_.ProcessName -like "*yandex*" -or $_.ProcessName -like "*музыка*" -or $_.ProcessName -like "*music*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node "$ScriptDir\scripts\patcher.js" install $args
