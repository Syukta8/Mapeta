@echo off
title Stop Mapeta
color 0C
cd /d "%~dp0"

echo ======================================================================
echo             Stopping Mapeta Server ^& Background Tunnels
echo ======================================================================
echo.

:: Stop node and cloudflared processes
taskkill /F /IM cloudflared.exe 2>nul
powershell -Command "Get-Process -Name 'node' -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'dist-server|launcher' } | Stop-Process -Force" 2>nul

:: Free port 3000 if occupied
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

if exist ".mapeta.pid" del ".mapeta.pid" 2>nul

echo [SUCCESS] Mapeta Server and Tunnels have been cleanly stopped.
echo You can safely close this window.
echo.

