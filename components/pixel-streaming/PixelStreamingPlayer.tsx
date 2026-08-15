'use client';

import { useEffect, useRef, useState } from 'react';
import { usePixelStreaming } from './usePixelStreaming';
import { SIGNALING_URL } from '@/lib/pixel-streaming/constants';
import type { PixelStreamingConfig } from '@/lib/pixel-streaming/types';

const DEFAULT_CONFIG: PixelStreamingConfig = {
  signalingUrl: SIGNALING_URL,
  sessionId: 'VZT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  sessionName: 'VizTR Stream',
  sessionType: 'Live Session',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

interface PixelStreamingPlayerProps {
  config?: Partial<PixelStreamingConfig>;
  className?: string;
}

export function PixelStreamingPlayer({ config: configProp, className = '' }: PixelStreamingPlayerProps) {
  const config = { ...DEFAULT_CONFIG, ...configProp };
  const { state, stats, videoRef, reconnect, toggleMute, isMuted } = usePixelStreaming(config);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState('Ultra');
  const animRef = useRef<number>(0);
  const stepRef = useRef(0);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || state === 'live') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      stepRef.current++;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#08090A';
      ctx.fillRect(0, 0, W, H);

      const t = stepRef.current * 0.007;
      const gx = W * 0.5 + Math.sin(t) * W * 0.2;
      const gy = H * 0.5 + Math.cos(t * 0.8) * H * 0.15;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.6);
      g.addColorStop(0, 'rgba(83,74,183,.08)');
      g.addColorStop(0.4, 'rgba(0,200,224,.04)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(0,200,224,.055)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const cx = W * 0.5;
      const cy = H * 0.5;
      const sc = Math.min(W, H) * 0.3;
      ctx.save();
      ctx.translate(cx, cy);

      ctx.strokeStyle = 'rgba(201,168,76,.2)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-sc, -sc * 0.68, sc * 2, sc * 1.36);

      ctx.strokeStyle = 'rgba(201,168,76,.1)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(sc * 0.18, -sc * 0.68);
      ctx.lineTo(sc * 0.18, sc * 0.68);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-sc, 0);
      ctx.lineTo(sc * 0.18, 0);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0,200,224,.18)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.arc(-sc * 0.38, 0, sc * 0.11, -Math.PI * 0.5, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sc * 0.18, sc * 0.28, sc * 0.1, Math.PI, Math.PI * 1.5);
      ctx.stroke();

      const sy = ((stepRef.current * 1.4) % (sc * 2.72)) - sc * 1.36;
      const sg = ctx.createLinearGradient(0, sy - 10, 0, sy + 10);
      sg.addColorStop(0, 'transparent');
      sg.addColorStop(0.5, 'rgba(0,200,224,.1)');
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg;
      ctx.fillRect(-sc, sy - 10, sc * 2, 20);

      const dy = sc * 0.74;
      ctx.strokeStyle = 'rgba(201,168,76,.18)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-sc, dy + 9);
      ctx.lineTo(sc, dy + 9);
      ctx.moveTo(-sc, dy + 5);
      ctx.lineTo(-sc, dy + 13);
      ctx.moveTo(sc, dy + 5);
      ctx.lineTo(sc, dy + 13);
      ctx.stroke();
      ctx.font = '9px "JetBrains Mono",monospace';
      ctx.fillStyle = 'rgba(201,168,76,.3)';
      ctx.textAlign = 'center';
      ctx.fillText('24.00 m', 0, dy + 21);

      ctx.restore();
      ctx.save();
      ctx.translate(W - 34, 34);
      ctx.strokeStyle = 'rgba(201,168,76,.22)';
      ctx.lineWidth = 0.75;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI * 0.25;
        const r = i % 2 === 0 ? 13 : 9;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(a) * r, -Math.cos(a) * r);
        ctx.stroke();
      }
      ctx.font = '9px "JetBrains Mono",monospace';
      ctx.fillStyle = 'rgba(201,168,76,.35)';
      ctx.textAlign = 'center';
      ctx.fillText('N', 0, -16);
      ctx.restore();

      ctx.font = '500 10px "Syne",sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.05)';
      ctx.textAlign = 'right';
      ctx.fillText('VizTR · DEMO MODE', W - 12, H - 12);

      animRef.current = requestAnimationFrame(draw);
    };

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [state]);

  const toggleFullscreen = () => {
    const el = document.querySelector('.viztr-ps-player');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className={`viztr-ps-player ${className}`}>
      <canvas
        ref={canvasRef}
        className="viztr-ps-canvas"
        style={{ display: state === 'live' ? 'none' : 'block' }}
      />
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="viztr-ps-video"
        style={{ display: state === 'live' ? 'block' : 'none' }}
      />

      {state === 'connecting' && (
        <div className="viztr-ps-overlay viztr-ps-overlay-connecting">
          <div className="viztr-ps-connecting-grid" />
          <div className="viztr-ps-connecting-scan" />
          <div className="viztr-ps-connecting-content">
            <div className="viztr-ps-connecting-logo-wrap">
              <div className="viztr-ps-connecting-ring" />
              <div className="viztr-ps-connecting-ring viztr-ps-ring-2" />
              <div className="viztr-ps-connecting-logo">V</div>
            </div>
            <div>
              <div className="viztr-ps-connecting-text">
                Connecting to stream<span className="viztr-ps-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
              <div className="viztr-ps-connecting-url">{config.signalingUrl}</div>
            </div>
          </div>
        </div>
      )}

      {state === 'live' && (
        <div className="viztr-ps-overlay viztr-ps-overlay-live">
          <div className="viztr-ps-live-top" />
          <div className="viztr-ps-live-bottom" />
          <div className="viztr-ps-live-badge">
            <div className="viztr-ps-live-dot" />
            LIVE
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="viztr-ps-overlay viztr-ps-overlay-error">
          <div className="viztr-ps-error-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="viztr-ps-error-title">Stream unavailable</div>
          <div className="viztr-ps-error-sub">
            Could not connect to the signalling server. The stream may be offline or the Cloudflare Tunnel is not running.
          </div>
          <button onClick={reconnect} className="viztr-ps-btn-retry">
            Retry connection
          </button>
        </div>
      )}

      {showStats && state === 'live' && (
        <div className="viztr-ps-stats">
          <div className="viztr-ps-stat">
            <div className="viztr-ps-stat-label">Bitrate</div>
            <div className="viztr-ps-stat-value">{stats.bitrate} Mbps</div>
          </div>
          <div className="viztr-ps-stat-divider" />
          <div className="viztr-ps-stat">
            <div className="viztr-ps-stat-label">FPS</div>
            <div className="viztr-ps-stat-value">{stats.fps}</div>
          </div>
          <div className="viztr-ps-stat-divider" />
          <div className="viztr-ps-stat">
            <div className="viztr-ps-stat-label">Latency</div>
            <div className="viztr-ps-stat-value">{stats.latency} ms</div>
          </div>
          <div className="viztr-ps-stat-divider" />
          <div className="viztr-ps-stat">
            <div className="viztr-ps-stat-label">Resolution</div>
            <div className="viztr-ps-stat-value">{stats.resolution}</div>
          </div>
          <div className="viztr-ps-stat-divider" />
          <div className="viztr-ps-stat">
            <div className="viztr-ps-stat-label">Codec</div>
            <div className="viztr-ps-stat-value">{stats.codec}</div>
          </div>
          <button onClick={() => setShowStats(false)} className="viztr-ps-stats-close">✕</button>
        </div>
      )}

      <div className="viztr-ps-controls">
        <button onClick={toggleMute} className="viztr-ps-btn" title="Toggle audio">
          {isMuted ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          )}
        </button>

        <div className="viztr-ps-quality-wrap">
          <button onClick={() => setShowSettings(!showSettings)} className="viztr-ps-btn-quality">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>{quality}</span>
          </button>
          {showSettings && (
            <div className="viztr-ps-quality-menu">
              {['Ultra', 'High', 'Standard', 'Low'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuality(q); setShowSettings(false); }}
                  className={`viztr-ps-quality-item ${quality === q ? 'viztr-ps-quality-active' : ''}`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="viztr-ps-controls-spacer" />

        <div className="viztr-ps-session-id" title="Session ID">
          {config.sessionId}
        </div>

        <button onClick={() => setShowStats(!showStats)} className={`viztr-ps-btn ${showStats ? 'viztr-ps-btn-active' : ''}`} title="Stream stats">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </button>

        <button onClick={toggleFullscreen} className="viztr-ps-btn" title="Fullscreen">
          {isFullscreen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          )}
        </button>
      </div>

      <style jsx>{`
        .viztr-ps-player {
          position: relative;
          width: 100%;
          height: 100%;
          background: #080809;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .viztr-ps-canvas, .viztr-ps-video {
          width: 100%;
          height: 100%;
          display: block;
        }
        .viztr-ps-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: opacity 0.45s ease;
        }
        .viztr-ps-overlay-connecting {
          background: #0D0D0F;
        }
        .viztr-ps-overlay-live {
          pointer-events: none;
        }
        .viztr-ps-overlay-error {
          background: rgba(13,13,15,0.94);
        }
        .viztr-ps-connecting-grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(0,200,224,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,224,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          background-position: center;
        }
        .viztr-ps-connecting-scan {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 0%, rgba(0,200,224,0.04) 49.5%, rgba(0,200,224,0.08) 50%, transparent 51%);
          animation: viztr-ps-scan 2.8s linear infinite;
        }
        @keyframes viztr-ps-scan {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        .viztr-ps-connecting-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }
        .viztr-ps-connecting-logo-wrap {
          position: relative;
        }
        .viztr-ps-connecting-ring {
          position: absolute;
          inset: -9px;
          border-radius: 22px;
          border: 1px solid rgba(0,200,224,0.28);
          animation: viztr-ps-rexp 2.2s ease-out infinite;
        }
        .viztr-ps-ring-2 {
          animation-delay: 0.65s;
          inset: -18px;
          border-radius: 30px;
        }
        @keyframes viztr-ps-rexp {
          0% { opacity: 0.7; transform: scale(0.9); }
          100% { opacity: 0; transform: scale(1.45); }
        }
        .viztr-ps-connecting-logo {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #534AB7, #00C8E0);
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: #fff;
        }
        .viztr-ps-connecting-text {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #F0EDE8;
          text-align: center;
        }
        .viztr-ps-dots span {
          animation: viztr-ps-blink 1.2s ease-in-out infinite;
          color: #00C8E0;
        }
        .viztr-ps-dots span:nth-child(2) { animation-delay: 0.2s; }
        .viztr-ps-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes viztr-ps-blink {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        .viztr-ps-connecting-url {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          color: #55534E;
          margin-top: 4px;
          text-align: center;
        }
        .viztr-ps-live-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 55px;
          background: linear-gradient(to bottom, rgba(13,13,15,0.72), transparent);
        }
        .viztr-ps-live-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: linear-gradient(to top, rgba(13,13,15,0.82), transparent);
        }
        .viztr-ps-live-badge {
          position: absolute;
          top: 11px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 500;
          color: #1D9E75;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.05em;
        }
        .viztr-ps-live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #1D9E75;
          animation: viztr-ps-pulse 1.5s ease-in-out infinite;
        }
        @keyframes viztr-ps-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .viztr-ps-error-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(226,75,74,0.1);
          border: 0.5px solid rgba(226,75,74,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .viztr-ps-error-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #F0EDE8;
          margin-bottom: 5px;
        }
        .viztr-ps-error-sub {
          font-size: 12px;
          color: #A09D97;
          margin-bottom: 18px;
          text-align: center;
          max-width: 290px;
          line-height: 1.65;
        }
        .viztr-ps-btn-retry {
          padding: 8px 18px;
          background: #1A1A1E;
          border: 0.5px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #F0EDE8;
          font-size: 12px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }
        .viztr-ps-btn-retry:hover {
          background: #222226;
          border-color: rgba(255,255,255,0.2);
        }
        .viztr-ps-stats {
          position: absolute;
          bottom: 52px;
          left: 0;
          right: 0;
          background: rgba(18,18,20,0.96);
          border-top: 0.5px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(14px);
          padding: 9px 14px;
          display: flex;
          gap: 20px;
          align-items: center;
          z-index: 90;
        }
        .viztr-ps-stat {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .viztr-ps-stat-label {
          font-size: 9px;
          color: #55534E;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .viztr-ps-stat-value {
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
          color: #F0EDE8;
          font-weight: 500;
        }
        .viztr-ps-stat-divider {
          width: 0.5px;
          height: 26px;
          background: rgba(255,255,255,0.07);
        }
        .viztr-ps-stats-close {
          margin-left: auto;
          background: none;
          border: none;
          color: #55534E;
          cursor: pointer;
          font-size: 15px;
          padding: 3px;
        }
        .viztr-ps-stats-close:hover {
          color: #A09D97;
        }
        .viztr-ps-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 52px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 3px;
          background: rgba(13,13,15,0.85);
          border-top: 0.5px solid rgba(255,255,255,0.07);
          z-index: 100;
        }
        .viztr-ps-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          border: none;
          background: transparent;
          color: #A09D97;
          cursor: pointer;
          transition: all 0.12s;
        }
        .viztr-ps-btn:hover {
          background: #1A1A1E;
          color: #F0EDE8;
        }
        .viztr-ps-btn-active {
          background: #222226;
          color: #00C8E0;
        }
        .viztr-ps-quality-wrap {
          position: relative;
        }
        .viztr-ps-btn-quality {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px 8px;
          background: #1A1A1E;
          border: 0.5px solid rgba(255,255,255,0.12);
          border-radius: 5px;
          color: #A09D97;
          font-size: 10px;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.12s;
        }
        .viztr-ps-btn-quality:hover {
          border-color: rgba(255,255,255,0.2);
          color: #F0EDE8;
        }
        .viztr-ps-quality-menu {
          position: absolute;
          bottom: calc(100% + 8px);
          right: 0;
          width: 120px;
          background: #1A1A1E;
          border: 0.5px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(0,0,0,0.55);
        }
        .viztr-ps-quality-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          font-size: 11px;
          text-align: left;
          cursor: pointer;
          color: #A09D97;
          background: none;
          border: none;
          transition: background 0.1s;
        }
        .viztr-ps-quality-item:hover {
          background: #222226;
          color: #F0EDE8;
        }
        .viztr-ps-quality-active {
          color: #00C8E0;
        }
        .viztr-ps-controls-spacer {
          flex: 1;
        }
        .viztr-ps-session-id {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          color: #55534E;
          padding: 3px 8px;
          border-radius: 20px;
          border: 0.5px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: all 0.12s;
          white-space: nowrap;
        }
        .viztr-ps-session-id:hover {
          color: #A09D97;
          border-color: rgba(255,255,255,0.12);
        }
        @media (max-width: 600px) {
          .viztr-ps-session-id { display: none; }
          .viztr-ps-stats { gap: 12px; }
        }
      `}</style>
    </div>
  );
}
