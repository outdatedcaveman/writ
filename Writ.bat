@echo off
title Writ Desktop Studio
cd /d "%~dp0"

echo ========================================================
echo   WRIT DESKTOP STUDIO -- Launching Native Desktop Engine
echo ========================================================
echo.

:: If release\Writ.exe exists, launch it directly
if exist "release\Writ.exe" (
    echo Starting standalone Writ.exe...
    start "" "release\Writ.exe"
    exit /b 0
)

:: Otherwise run Electron desktop runner
echo Starting embedded local server and desktop window...
npx electron electron/main.cjs
