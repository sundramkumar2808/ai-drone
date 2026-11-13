@echo off
title Drone Fleet AI - Backend (Port 8001)
color 0b
cd /d "%~dp0backend"

echo ======================================================================
echo             DRONE FLEET AI - BACKEND SERVER (PORT 8001)
echo ======================================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [INFO] First-time setup: Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment. Ensure Python 3.10+ is installed.
        pause
        exit /b 1
    )
    echo [INFO] Installing backend dependencies...
    .\venv\Scripts\python.exe -m pip install --upgrade pip --quiet
    .\venv\Scripts\python.exe -m pip install -r requirements.txt --quiet
    echo [INFO] Initializing and seeding database...
    .\venv\Scripts\python.exe -m app.database.seed
)

:: Ensure Windows App Control policy does not block Cython C-extensions
powershell -NoProfile -Command "Get-ChildItem -Path 'venv\Lib\site-packages\sqlalchemy' -Filter '*.pyd' -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Rename-Item -Path $_.FullName -NewName ($_.FullName + '.disabled') -ErrorAction SilentlyContinue }" >nul 2>&1

:: Free port 8001 if a previous process is still holding it
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8001" ^| findstr "LISTENING"') do (
    echo [INFO] Freeing port 8001 from previous process PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [OK] Starting FastAPI Backend on http://127.0.0.1:8001 ...
echo [OK] Swagger API Docs: http://127.0.0.1:8001/api/docs
echo.
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

if errorlevel 1 (
    echo.
    echo [ERROR] Backend stopped with error code %errorlevel%.
)
pause
