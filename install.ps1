# Yandex Music Enhancer - Windows PowerShell Installer
# Run: powershell -ExecutionPolicy Bypass -File install.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "      Yandex Music Enhancer - Windows       " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$NodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCheck) {
    Write-Host "Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node "$ScriptDir\scripts\patcher.js" install $args
