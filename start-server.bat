@echo off
echo ========================================
echo Campus Canteen - Backend Server
echo ========================================
echo.

cd backend

REM Check if node_modules exists
if not exist "node_modules" (
    echo ❌ Dependencies not installed!
    echo.
    echo Please run install-backend.bat first
    echo.
    pause
    exit /b 1
)

echo 🚀 Starting server...
echo.
echo ========================================
echo 📧 Demo Credentials:
echo.
echo Student App:
echo   Email: student@canteen.com
echo   Password: student123
echo.
echo Vendor Dashboard:
echo   Email: vendor@canteen.com
echo   Password: vendor123
echo ========================================
echo.
echo 📱 Open these files in your browser:
echo   - student-app\index.html
echo   - vendor-dashboard\index.html
echo.
echo ⚠️  KEEP THIS WINDOW OPEN while using the app!
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

npm start