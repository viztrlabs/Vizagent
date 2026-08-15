@echo off
setlocal EnableDelayedExpansion
title VizTR Pixel Streaming — Startup

:: ============================================================
::  VIZTR PIXEL STREAMING LAUNCHER
::  Starts Cirrus + Cloudflare Tunnel + Metrics Sidecar + UE5
::  Edit the CONFIG section below before first run
:: ============================================================

:: ─────────────────────────────────────────────
::  CONFIG — edit these paths for your machine
:: ─────────────────────────────────────────────

:: Full path to your packaged UE5 .exe
set UE5_EXE=C:\VizTR\Build\Windows\VizTR.exe

:: Cirrus signalling server folder (inside UE5 engine or custom copy)
set CIRRUS_DIR=C:\Program Files\Epic Games\UE_5.4\Engine\Plugins\Media\PixelStreaming\Resources\WebServers\SignallingWebServer

:: Cloudflare tunnel name (created via: cloudflared tunnel create viztr-pixel)
set CF_TUNNEL_NAME=viztr-pixel

:: Path to your ps-metrics-server.js
set METRICS_DIR=C:\VizTR\ps-metrics-server

:: Port UE5 streams to Cirrus on
set STREAMER_PORT=8888

:: Port Cirrus serves the web player on
set HTTP_PORT=80

:: Metrics sidecar port (exposed via separate CF tunnel or same)
set METRICS_PORT=9000

:: Your PS_METRICS_SECRET (must match .env.local on Vercel)
set METRICS_SECRET=your-long-random-secret-here

:: UE5 resolution
set RES_X=1920
set RES_Y=1080

:: ─────────────────────────────────────────────
::  INTERNAL — do not edit below this line
:: ─────────────────────────────────────────────

cls
color 0F

echo.
echo  ==============================================
echo   VizTR  ^|  Pixel Streaming Launcher
echo   wss://stream.viztr.io
echo  ==============================================
echo.

:: ─── 1. CHECK PREREQUISITES ───────────────────
echo  [1/6] Checking prerequisites...
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    goto :error
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo       Node.js  %NODE_VER%  OK

:: Check PM2
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARN]  PM2 not found. Installing globally...
    call npm install -g pm2 --silent
)
echo       PM2      OK

:: Check cloudflared
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] cloudflared not found. Install: winget install Cloudflare.cloudflared
    goto :error
)
for /f "tokens=*" %%v in ('cloudflared --version 2^>^&1') do (
    set CF_VER=%%v
    goto :cf_ver_done
)
:cf_ver_done
echo       cloudflared  OK

:: Check UE5 exe
if not exist "%UE5_EXE%" (
    echo  [ERROR] UE5 build not found at: %UE5_EXE%
    echo          Update UE5_EXE in the CONFIG section.
    goto :error
)
echo       UE5 build    OK

:: Check Cirrus dir
if not exist "%CIRRUS_DIR%\cirrus.js" (
    echo  [ERROR] cirrus.js not found at: %CIRRUS_DIR%
    echo          Update CIRRUS_DIR in the CONFIG section.
    goto :error
)
echo       Cirrus       OK

echo.
echo  [2/6] Stopping any existing VizTR processes...
echo.

:: Kill stale PM2 processes silently
pm2 delete viztr-cirrus    >nul 2>&1
pm2 delete viztr-metrics   >nul 2>&1
pm2 delete viztr-tunnel    >nul 2>&1

:: Kill any stale cloudflared
taskkill /f /im cloudflared.exe >nul 2>&1
echo       Cleaned up old processes.

:: ─── 3. INSTALL CIRRUS DEPS (first run only) ──
echo.
echo  [3/6] Starting Cirrus signalling server...
echo.

cd /d "%CIRRUS_DIR%"
if not exist "node_modules" (
    echo       Installing Cirrus dependencies (first run)...
    call npm install --silent
)

pm2 start cirrus.js ^
    --name viztr-cirrus ^
    --log "%TEMP%\viztr-cirrus.log" ^
    -- ^
    --StreamerPort %STREAMER_PORT% ^
    --HttpPort %HTTP_PORT% ^
    --SFUPort 8889 ^
    --LogToFile ^
    >nul 2>&1

timeout /t 2 /nobreak >nul

:: Verify Cirrus started
pm2 show viztr-cirrus | findstr /i "online" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Cirrus failed to start. Check: %TEMP%\viztr-cirrus.log
    goto :error
)
echo       Cirrus running on port %HTTP_PORT% / streamer port %STREAMER_PORT%

:: ─── 4. METRICS SIDECAR ───────────────────────
echo.
echo  [4/6] Starting metrics sidecar...
echo.

if exist "%METRICS_DIR%\ps-metrics-server.js" (
    cd /d "%METRICS_DIR%"
    set PS_METRICS_SECRET=%METRICS_SECRET%
    pm2 start ps-metrics-server.js ^
        --name viztr-metrics ^
        --log "%TEMP%\viztr-metrics.log" ^
        >nul 2>&1
    echo       Metrics sidecar running on port %METRICS_PORT%
) else (
    echo       [SKIP] Metrics sidecar not found at %METRICS_DIR%
    echo             Admin panel health checks will show unavailable.
)

:: ─── 5. CLOUDFLARE TUNNEL ─────────────────────
echo.
echo  [5/6] Connecting Cloudflare Tunnel ^(wss://stream.viztr.io^)...
echo.

start "VizTR CF Tunnel" /min cloudflared tunnel --loglevel warn run --url http://localhost:%HTTP_PORT% %CF_TUNNEL_NAME%

:: Give tunnel 4 seconds to handshake
timeout /t 4 /nobreak >nul
echo       Tunnel connecting to Cloudflare edge...
echo       Signalling URL: wss://stream.viztr.io

:: ─── 6. LAUNCH UE5 ───────────────────────────
echo.
echo  [6/6] Launching Unreal Engine 5 with Pixel Streaming...
echo.
echo       Project:  %UE5_EXE%
echo       Res:      %RES_X% x %RES_Y%
echo       Cirrus:   localhost:%STREAMER_PORT%
echo.

start "" "%UE5_EXE%" ^
    -PixelStreamingIP=127.0.0.1 ^
    -PixelStreamingPort=%STREAMER_PORT% ^
    -RenderOffScreen ^
    -Unattended ^
    -ResX=%RES_X% ^
    -ResY=%RES_Y% ^
    -GraphicsAdapter=0 ^
    -AudioMixer ^
    -AllowPixelStreamingCommands ^
    -PixelStreamingEncoderTargetBitrate=8000000 ^
    -PixelStreamingEncoderMaxBitrate=12000000 ^
    -PixelStreamingEncoderMinQP=20 ^
    -PixelStreamingEncoderMaxQP=40 ^
    -PixelStreamingWebRTCFps=30

:: Wait for UE5 to register with Cirrus (takes ~10-15s)
echo.
echo  Waiting for UE5 to register with Cirrus...
timeout /t 12 /nobreak >nul

:: ─── STATUS SUMMARY ───────────────────────────
echo.
echo  ==============================================
echo   VIZTR STREAM IS LIVE
echo  ==============================================
echo.
echo   Signalling  :  wss://stream.viztr.io
echo   Cirrus log  :  %TEMP%\viztr-cirrus.log
echo   Metrics     :  http://localhost:%METRICS_PORT%
echo   Admin panel :  https://viztr.io/admin/pixel-streaming
echo.
echo   PM2 status:
echo.
pm2 list
echo.
echo  ── Keep this window open while streaming ──
echo  ── Run viztr-stream-stop.bat to shut down ──
echo.
pause
goto :eof

:error
echo.
echo  ==============================================
echo   STARTUP FAILED — check errors above
echo  ==============================================
echo.
pause
exit /b 1
