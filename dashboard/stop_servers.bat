@echo off
echo ==============================================
echo  Stopping Microplastic Detection Dashboard...
echo ==============================================

:: Stop all Node processes holding ports 3000 and 3001
taskkill /F /IM node.exe >nul 2>&1

echo [OK] All dashboard servers stopped.
echo Ports 3000 and 3001 are now completely free!
echo.
pause
