@echo off
title VizTR Pixel Streaming — Shutdown
color 0C

echo.
echo  ==============================================
echo   VizTR  ^|  Shutting down Pixel Streaming
echo  ==============================================
echo.

echo  Stopping PM2 processes...
pm2 delete viztr-cirrus   >nul 2>&1
pm2 delete viztr-metrics  >nul 2>&1
echo       viztr-cirrus    stopped
echo       viztr-metrics   stopped

echo.
echo  Stopping Cloudflare Tunnel...
taskkill /f /im cloudflared.exe >nul 2>&1
echo       cloudflared     stopped

echo.
echo  Stopping UE5...
taskkill /f /im VizTR.exe >nul 2>&1
echo       UE5 process     stopped

echo.
echo  ==============================================
echo   All VizTR stream processes stopped.
echo  ==============================================
echo.
pause
