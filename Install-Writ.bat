@echo off
setlocal enabledelayedexpansion
title Writ Desktop Studio - 1-Click Windows Installer & Launcher

echo =======================================================================
echo        WRIT DESKTOP STUDIO - AUTONOMOUS LITERARY WORKSPACE
echo           Craft Engines: McPhee, Nabokov, Gilligan, Nolan
echo =======================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Check for existing pre-built executable
set "EXE_PATH="
if exist "%SCRIPT_DIR%release\win-unpacked\Writ.exe" (
    set "EXE_PATH=%SCRIPT_DIR%release\win-unpacked\Writ.exe"
    set "EXE_DIR=%SCRIPT_DIR%release\win-unpacked"
) else if exist "%SCRIPT_DIR%..\release\win-unpacked\Writ.exe" (
    set "EXE_PATH=%SCRIPT_DIR%..\release\win-unpacked\Writ.exe"
    set "EXE_DIR=%SCRIPT_DIR%..\release\win-unpacked"
) else if exist "%SCRIPT_DIR%Writ.exe" (
    set "EXE_PATH=%SCRIPT_DIR%Writ.exe"
    set "EXE_DIR=%SCRIPT_DIR%"
)

if defined EXE_PATH (
    echo [OK] Pre-compiled Writ Studio standalone executable detected:
    echo      !EXE_PATH!
    echo.
    goto :SETUP_SHORTCUT
)

:: If not found, check Node.js to build from source
echo [INFO] Pre-compiled binary not found in local folder. Checking build tools...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this system.
    echo Please download and install Node.js 18+ or 20+ from https://nodejs.org
    echo Once installed, rerun this installer to build Writ.exe automatically.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node --version
echo.
echo [1/3] Installing studio dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Check your internet connection.
    pause
    exit /b 1
)

echo.
echo [2/3] Building literary interface and Four Masters Sentinel...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Packaging standalone Windows executable (Writ.exe)...
call npx electron-builder --win --dir
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed.
    pause
    exit /b 1
)

set "EXE_PATH=%SCRIPT_DIR%release\win-unpacked\Writ.exe"
set "EXE_DIR=%SCRIPT_DIR%release\win-unpacked"

:SETUP_SHORTCUT
echo.
echo -----------------------------------------------------------------------
echo [SHORTCUT SETUP] Creating Desktop Shortcut for 1-Click Launch...
echo -----------------------------------------------------------------------

set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP_DIR%\Writ Studio.lnk"

:: Use PowerShell to create authentic Windows shortcut
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -comObject WScript.Shell; " ^
  "$Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); " ^
  "$Shortcut.TargetPath = '%EXE_PATH%'; " ^
  "$Shortcut.WorkingDirectory = '%EXE_DIR%'; " ^
  "$Shortcut.Description = 'Writ - Autonomous Literary Studio & Dialectical Manuscript Engine'; " ^
  "$Shortcut.Save();"

if exist "%SHORTCUT_PATH%" (
    echo [OK] Desktop Shortcut successfully created at:
    echo      "%SHORTCUT_PATH%"
) else (
    echo [NOTE] Could not create shortcut automatically. You can launch directly from:
    echo        "!EXE_PATH!"
)

echo.
echo =======================================================================
echo                     INSTALLATION COMPLETE!
echo =======================================================================
echo.
echo Launching Writ Desktop Studio now...
start "" "!EXE_PATH!"

echo.
echo Press any key to close this installer window.
pause >nul
exit /b 0
