@echo off
title HOLOKA Frontend
cd /d "%~dp0frontend"
echo ========================================================
echo          HOLOKA Frontend (Vite React - Port 5173)
echo ========================================================
call npm run dev
pause
