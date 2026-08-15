@echo off
title VizTR Pixel Streaming — First-Time Setup
color 0B

echo.
echo  ==============================================
echo   VizTR  ^|  First-Time Setup
echo  ==============================================
echo.

:: ─── Check Node.js ────────────────────────────
echo  [1/4] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found.
    echo          Download: https://nodejs.org/en/download
    pause & exit /b 1
)
echo       Node.js found.

:: ─── Install PM2 ──────────────────────────────
echo.
echo  [2/4] Installing PM2 globally...
call npm install -g pm2
echo       PM2 installed.

:: ─── Check cloudflared ────────────────────────
echo.
echo  [3/4] Checking cloudflared...
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo  Installing cloudflared via winget...
    winget install --id Cloudflare.cloudflared -e --silent
    echo       cloudflared installed.
) else (
    echo       cloudflared already installed.
)

:: ─── Cloudflare Login + Tunnel Create ─────────
echo.
echo  [4/4] Setting up Cloudflare Tunnel...
echo.
echo  Step 1: Login to Cloudflare ^(browser will open^)
cloudflared login

echo.
echo  Step 2: Creating tunnel named viztr-pixel...
cloudflared tunnel create viztr-pixel

echo.
echo  Step 3: Routing stream.viztr.io to this tunnel...
echo  ^(Make sure stream.viztr.io is on your Cloudflare-managed domain^)
cloudflared tunnel route dns viztr-pixel stream.viztr.io

echo.
echo  Step 4: Routing metrics.viztr.io ^(for admin panel^)...
cloudflared tunnel route dns viztr-pixel metrics.viztr.io

echo.
echo  ==============================================
echo   Setup complete!
echo   Now edit CONFIG section in viztr-stream-start.bat
echo   then run it to go live.
echo  ==============================================
echo.
pause
