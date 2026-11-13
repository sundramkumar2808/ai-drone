@echo off
title Drone Fleet AI - Frontend (Port 3000)
color 0b
cd /d "%~dp0frontend"

echo ======================================================================
echo             DRONE FLEET AI - FRONTEND WEB SERVER (PORT 3000)
echo ======================================================================
echo.

if not exist "node_modules" (
    echo [INFO] First-time setup: Installing React npm packages...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install npm packages. Ensure Node.js is installed.
        pause
        exit /b 1
    )
)

:: Free port 3000 if a previous process is still holding it
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [INFO] Freeing port 3000 from previous process PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [OK] Starting Frontend Web Server on http://localhost:3000 ...
echo.

if exist "build\index.html" (
    call npx serve -s build -l 3000 --no-port-switching
) else (
    call npm start
)

if errorlevel 1 (
    echo.
    echo [ERROR] Frontend stopped with error code %errorlevel%.
)
pause
