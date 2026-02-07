@echo off
echo ========================================
echo Installing Backend Dependencies
echo ========================================
echo.

cd backend

echo Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

echo Installing npm packages...
echo This may take 1-2 minutes...
echo.

call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Installation Complete!
    echo ========================================
    echo.
    echo Backend is ready to use!
    echo.
    echo Next step: Run start-server.bat
    echo.
) else (
    echo.
    echo ❌ Installation failed!
    echo Please check the error messages above.
    echo.
)

pause