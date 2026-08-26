@echo off
REM ═══════════════════════════════════════════════════════════════════════════════
REM 9Router Windows Start Script
REM ═══════════════════════════════════════════════════════════════════════════════
REM
REM Features:
REM - Auto-detects system resources
REM - Optimizes memory usage
REM - Handles Windows-specific quirks
REM - Provides useful startup information
REM
REM Usage:
REM   start-windows.bat
REM   start-windows.bat --port 3000
REM   start-windows.bat --low-memory
REM ═══════════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

REM ═══════════════════════════════════════════════════════════════════════════════
REM Configuration
REM ═══════════════════════════════════════════════════════════════════════════════

set "PORT=20128"
set "HOST=0.0.0.0"
set "DATA_DIR=%APPDATA%\9router"
set "LOW_MEMORY=0"

REM ═══════════════════════════════════════════════════════════════════════════════
REM Parse Arguments
REM ═══════════════════════════════════════════════════════════════════════════════

:parse_args
if "%~1"=="" goto :done_args

if /i "%~1"=="--port" (
    set "PORT=%~2"
    shift
    shift
    goto :parse_args
)

if /i "%~1"=="-p" (
    set "PORT=%~2"
    shift
    shift
    goto :parse_args
)

if /i "%~1"=="--host" (
    set "HOST=%~2"
    shift
    shift
    goto :parse_args
)

if /i "%~1"=="-H" (
    set "HOST=%~2"
    shift
    shift
    goto :parse_args
)

if /i "%~1"=="--low-memory" (
    set "LOW_MEMORY=1"
    shift
    goto :parse_args
)

if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="-h" goto :show_help

echo Unknown option: %~1
exit /b 1

:done_args

REM ═══════════════════════════════════════════════════════════════════════════════
REM Banner
REM ═══════════════════════════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                   9Router for Windows                       ║
echo ║             AI Routing Gateway - Windows                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM ═══════════════════════════════════════════════════════════════════════════════
REM System Detection
REM ═══════════════════════════════════════════════════════════════════════════════

echo [INFO] Detecting system configuration...

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    echo [INFO] Install from: https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
echo [INFO] Node.js %NODE_VERSION% detected

REM Check npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set "NPM_VERSION=%%i"
echo [INFO] npm %NPM_VERSION% detected

REM Get system information using PowerShell
echo [INFO] Getting system information...

for /f "tokens=*" %%i in ('powershell -NonInteractive -WindowStyle Hidden -Command "(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB"') do set "TOTAL_RAM_MB=%%i"
for /f "tokens=*" %%i in ('powershell -NonInteractive -WindowStyle Hidden -Command "(Get-CimInstance Win32_Processor).NumberOfCores"') do set "CPU_CORES=%%i"

echo [INFO] Total RAM: %TOTAL_RAM_MB% MB
echo [INFO] CPU Cores: %CPU_CORES%

REM ═══════════════════════════════════════════════════════════════════════════════
REM Memory Optimization
REM ═══════════════════════════════════════════════════════════════════════════════

echo [INFO] Calculating memory limits...

if %LOW_MEMORY%==1 (
    set "MAX_OLD_SPACE_SIZE=256"
    set "MAX_SEMI_SPACE_SIZE=32"
    echo [WARN] Low memory mode: 256MB limit
) else if %TOTAL_RAM_MB% LSS 2048 (
    set "MAX_OLD_SPACE_SIZE=384"
    set "MAX_SEMI_SPACE_SIZE=48"
    echo [WARN] Low memory device: 384MB limit
) else if %TOTAL_RAM_MB% LSS 4096 (
    set "MAX_OLD_SPACE_SIZE=512"
    set "MAX_SEMI_SPACE_SIZE=64"
    echo [INFO] Standard mode: 512MB limit
) else (
    set "MAX_OLD_SPACE_SIZE=1024"
    set "MAX_SEMI_SPACE_SIZE=128"
    echo [INFO] Full mode: 1024MB limit
)

REM ═══════════════════════════════════════════════════════════════════════════════
REM Environment Setup
REM ═══════════════════════════════════════════════════════════════════════════════

echo [INFO] Setting up environment...

set "NODE_ENV=production"
set "NEXT_TELEMETRY_DISABLED=1"
set "DATA_DIR=%DATA_DIR%"

REM Create data directory if not exists
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

REM ═══════════════════════════════════════════════════════════════════════════════
REM Find Server
REM ═══════════════════════════════════════════════════════════════════════════════

set "SERVER_PATH="

if exist ".next\standalone\custom-server.js" (
    set "SERVER_PATH=.next\standalone\custom-server.js"
) else if exist "custom-server.js" (
    set "SERVER_PATH=custom-server.js"
) else (
    echo [ERROR] Server not found. Please run 'npm run build' first.
    exit /b 1
)

echo [INFO] Server found: %SERVER_PATH%

REM ═══════════════════════════════════════════════════════════════════════════════
REM Start Server
REM ═══════════════════════════════════════════════════════════════════════════════

echo.
echo [INFO] Starting 9Router server...
echo [INFO] Port: %PORT%
echo [INFO] Host: %HOST%
echo [INFO] Memory limit: %MAX_OLD_SPACE_SIZE%MB
echo.
echo [INFO] Press Ctrl+C to stop the server
echo.

node --max-old-space-size=%MAX_OLD_SPACE_SIZE% --max-semi-space-size=%MAX_SEMI_SPACE_SIZE% --optimize-for-size --dns-result-order=ipv4first "%SERVER_PATH%"

if errorlevel 1 (
    echo.
    echo [ERROR] Server exited with error code %errorlevel%
    echo [INFO] Check the logs for more information
)

exit /b %errorlevel%

REM ═══════════════════════════════════════════════════════════════════════════════
REM Help
REM ═══════════════════════════════════════════════════════════════════════════════

:show_help
echo.
echo 9Router Windows Start Script
echo.
echo Usage:
echo   start-windows.bat [OPTIONS]
echo.
echo Options:
echo   --port, -p ^<port^>     Port to run server (default: 20128)
echo   --host, -H ^<host^>     Host to bind (default: 0.0.0.0)
echo   --low-memory          Force low memory mode
echo   --help, -h            Show this help message
echo.
echo Examples:
echo   start-windows.bat
echo   start-windows.bat --port 3000
echo   start-windows.bat --low-memory
echo.
echo Notes:
echo   - Requires Node.js 18+ installed
echo   - Run 'npm run build' first if not using standalone build
echo   - Data is stored in: %APPDATA%\9router
echo.
exit /b 0
