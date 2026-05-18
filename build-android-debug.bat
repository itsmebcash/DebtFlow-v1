@echo off
REM Build Android APK (Debug)
REM This script runs gradlew.bat directly

cd /d "%~dp0android"

if not exist "gradlew.bat" (
    echo ✗ gradlew.bat not found in %CD%
    exit /b 1
)

echo ╔════════════════════════════════════════╗
echo ║  Building Android Debug APK            ║
echo ╚════════════════════════════════════════╝

call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔════════════════════════════════════════╗
    echo ║  ✓ Build Successful!                   ║
    echo ╚════════════════════════════════════════╝
    echo.
    echo APK location:
    echo   %CD%\app\build\outputs\apk\debug\app-debug.apk
    echo.
) else (
    echo.
    echo ╔════════════════════════════════════════╗
    echo ║  ✗ Build Failed                        ║
    echo ╚════════════════════════════════════════╝
    exit /b %ERRORLEVEL%
)

cd /d "%~dp0"
