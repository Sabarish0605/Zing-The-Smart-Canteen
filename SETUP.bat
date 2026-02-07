@echo off
echo ========================================
echo Campus Canteen - Project Setup
echo ========================================
echo.

REM Get the current directory
set PROJECT_DIR=%CD%\canteen-system

echo Creating project structure...
echo.

REM Create main project folder
if not exist "canteen-system" mkdir "canteen-system"
cd canteen-system

REM Create subdirectories
if not exist "backend" mkdir "backend"
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "backend\uploads\menu-images" mkdir "backend\uploads\menu-images"
if not exist "student-app" mkdir "student-app"
if not exist "vendor-dashboard" mkdir "vendor-dashboard"
if not exist "shared" mkdir "shared"

echo ✅ Project structure created successfully!
echo.
echo 📁 Project location: %PROJECT_DIR%
echo.
echo Next steps:
echo 1. Run setup-backend.bat to set up the backend
echo 2. Run start-server.bat to start the server
echo.
pause