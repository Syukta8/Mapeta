@echo off
title Mapeta Navigation Server
color 0B
cls

echo ======================================================================
echo          MAPETA -- Self-Hosted GPS Navigation ^& Map Engine
echo               Minimalist Genshin Impact Celestia Theme
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check if build exists, if not build it
if not exist "dist\index.html" (
    echo [INFO] First-time setup: Building Mapeta PWA and server...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed. Please check errors above.
        pause
        exit /b 1
    )
    echo.
)

:: 3. Detect and display Local IP
echo [NETWORK] Detecting local network IP addresses...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo   -^> Local Access URL:  http://%%b:3000
    )
)
echo.

:: 4. Start Mapeta Backend Server and Cloudflare Tunnel concurrently
echo [START] Launching Mapeta Server on http://127.0.0.1:3000...
echo [START] Generating secure remote HTTPS tunnel for Android cellular access...
echo.
echo ======================================================================
echo  1. On Same WiFi / Hotspot: Open http://<YOUR-PC-IP>:3000 on your phone
echo  2. Anywhere on 4G/5G:      Open the https://*.trycloudflare.com link below
echo ======================================================================
echo.

start /b "" node dist-server/index.js
timeout /t 2 /nobreak >nul

if exist "bin\cloudflared.exe" (
    bin\cloudflared.exe tunnel --url http://127.0.0.1:3000
) else (
    echo [INFO] Running in local-only mode (bin\cloudflared.exe not found).
    node dist-server/index.js
)

pause
