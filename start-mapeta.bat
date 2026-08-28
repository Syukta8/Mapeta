@echo off
title Mapeta Navigation Server
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "dist\index.html" (
    echo [INFO] First-time setup: Building Mapeta...
    call npm run build
)

node server/launcher.js
pause
