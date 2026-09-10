@echo off
title Microplastic Detector - REAL MODE (Port 3001)
cd /d "%~dp0"
echo ====================================================
echo  Starting REAL MODE Dashboard (ESP32 Hardware)
echo  URL: http://localhost:3001
echo ====================================================
npm run real
pause
