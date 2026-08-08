'use client';

import { Maximize, Minimize, RotateCw, Pause, Headset, Loader2 } from 'lucide-react';

interface ViewerControlsProps {
  title: string;
  isLoading: boolean;
  isFullscreen: boolean;
  isVRSupported: boolean;
  isInVR: boolean;
  autoRotate: boolean;
  onToggleFullscreen: () => void;
  onToggleVR: () => void;
  onToggleAutoRotate: () => void;
}

export function ViewerControls({
  title,
  isLoading,
  isFullscreen,
  isVRSupported,
  isInVR,
  autoRotate,
  onToggleFullscreen,
  onToggleVR,
  onToggleAutoRotate,
}: ViewerControlsProps) {
  return (
    <div
      className="viztr-tour-controls"
      role="toolbar"
      aria-label="Tour controls"
    >
      <div className="viztr-tour-control-group viztr-tour-control-left">
        <button
          className="viztr-tour-btn"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        <button
          className="viztr-tour-btn"
          onClick={onToggleAutoRotate}
          aria-label={autoRotate ? 'Pause auto-rotate' : 'Start auto-rotate'}
          aria-pressed={autoRotate}
          title={autoRotate ? 'Pause auto-rotate' : 'Start auto-rotate'}
        >
          {autoRotate ? <Pause size={20} /> : <RotateCw size={20} />}
        </button>
      </div>

      <div className="viztr-tour-control-group viztr-tour-control-center">
        <span className="viztr-tour-title">{title}</span>
        {isLoading && <Loader2 className="viztr-tour-spin" size={14} />}
      </div>

      <div className="viztr-tour-control-group viztr-tour-control-right">
        {isVRSupported && (
          <button
            className="viztr-tour-btn viztr-tour-btn-vr"
            onClick={onToggleVR}
            aria-label={isInVR ? 'Exit VR' : 'Enter VR'}
            title={isInVR ? 'Exit VR' : 'Enter VR'}
          >
            <Headset size={20} />
          </button>
        )}
      </div>

      <style jsx>{`
        .viztr-tour-controls {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          pointer-events: none;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 12px 16px;
        }
        .viztr-tour-control-group {
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }
        .viztr-tour-title {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          font-family: Inter, system-ui, sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }
        .viztr-tour-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: rgba(13, 17, 23, 0.8);
          backdrop-filter: blur(8px);
          color: #fff;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .viztr-tour-btn:hover {
          background: rgba(13, 17, 23, 0.95);
          transform: scale(1.05);
        }
        .viztr-tour-btn:active {
          transform: scale(0.95);
        }
        .viztr-tour-btn:focus-visible {
          outline: 2px solid #0d9488;
          outline-offset: 2px;
        }
        .viztr-tour-btn-vr {
          background: linear-gradient(135deg, #0d9488, #06b6d4);
        }
        .viztr-tour-btn-vr:hover {
          background: linear-gradient(135deg, #06b6d4, #0d9488);
        }
        .viztr-tour-spin {
          animation: viztr-spin 0.8s linear infinite;
          color: #0d9488;
        }
        @keyframes viztr-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 640px) {
          .viztr-tour-title {
            max-width: 150px;
            font-size: 12px;
          }
          .viztr-tour-btn {
            width: 36px;
            height: 36px;
          }
          .viztr-tour-controls {
            padding: 8px 12px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .viztr-tour-btn {
            transition: none;
          }
          .viztr-tour-spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
