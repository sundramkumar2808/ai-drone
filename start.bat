@echo off
title AI Drone Fleet Management Platform Launcher
color 0b

echo ======================================================================
echo           AI DRONE FLEET MANAGEMENT PLATFORM - AUTO LAUNCHER
echo ======================================================================
echo.

set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

echo [1/4] Checking Python and Node.js environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Python and Node.js detected.
echo.

echo [2/4] Checking Backend environment...
cd /d "%PROJECT_ROOT%backend"
if not exist "venv\Scripts\python.exe" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    echo [INFO] Installing backend dependencies...
    .\venv\Scripts\python.exe -m pip install --upgrade pip --quiet
    .\venv\Scripts\python.exe -m pip install -r requirements.txt --quiet
    echo [INFO] Seeding initial fleet data...
    .\venv\Scripts\python.exe -m app.database.seed
) else (
    echo [OK] Virtual environment found.
)

:: Ensure Windows App Control policy does not block Cython C-extensions
powershell -NoProfile -Command "Get-ChildItem -Path 'venv\Lib\site-packages\sqlalchemy' -Filter '*.pyd' -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Rename-Item -Path $_.FullName -NewName ($_.FullName + '.disabled') -ErrorAction SilentlyContinue }" >nul 2>&1

echo.
echo [3/4] Checking Frontend dependencies...
cd /d "%PROJECT_ROOT%frontend"
if not exist "node_modules" (
    echo [INFO] Installing React dependencies...
    call npm install
) else (
    echo [OK] Node modules found.
)

echo.
echo [4/4] Freeing ports and starting servers...

:: Free ports 8001 and 3000 if previously occupied
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8001" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: Launch Backend in its own terminal window
start "Drone Fleet AI - Backend (Port 8001)" cmd /k "cd /d "%PROJECT_ROOT%backend" && .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001"

:: Wait 3 seconds for backend initialization
ping 127.0.0.1 -n 4 >nul

:: Launch Frontend in its own terminal window
if exist "%PROJECT_ROOT%frontend\build\index.html" (
    start "Drone Fleet AI - Frontend (Port 3000)" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npx serve -s build -l 3000 --no-port-switching"
) else (
    start "Drone Fleet AI - Frontend (Port 3000)" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npm start"
)

:: Wait 2 seconds and automatically open browser
ping 127.0.0.1 -n 3 >nul
start http://localhost:3000

echo.
echo ======================================================================
echo   SUCCESS! Both servers have been launched in separate windows.
echo.
echo   - Web App UI:       http://localhost:3000
echo   - Backend API Docs: http://localhost:8001/api/docs
echo   - Demo Login:       admin@dronefleet.ai / AdminPassword123!
echo ======================================================================
echo.
echo Keep the backend and frontend terminal windows open while using the app.
pause
