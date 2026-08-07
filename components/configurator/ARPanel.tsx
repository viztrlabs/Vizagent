// components/configurator/ARPanel.tsx
// AR/VR settings panel for the XR Configurator

"use client";

import { useEffect, useState, useCallback } from "react";
import { Vector3, Quaternion } from "@babylonjs/core";
import {
  startARSession,
  startVRSession,
  endXRSession,
  checkARSupport,
  checkVRSupport,
  onHitTest,
  onSessionStatusChange,
  type XRSessionStatus,
  type XRSessionType,
} from "@/lib/xr/webxr";
import { useBabylonScene } from "@/components/xr/useBabylonScene";

interface ARPanelProps {
  scene: ReturnType<typeof useBabylonScene>;
  onPlaceModel?: (position: Vector3, rotation: Quaternion) => void;
}

export function ARPanel({ scene, onPlaceModel }: ARPanelProps) {
  const [arSupported, setArSupported] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<XRSessionStatus>({
    state: "ready",
    sessionType: null,
  });
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsDismissed, setInstructionsDismissed] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const [ar, vr] = await Promise.all([checkARSupport(), checkVRSupport()]);
      setArSupported(ar);
      setVrSupported(vr);
    };
    checkSupport();
  }, []);

  useEffect(() => {
    const unsubscribe = onSessionStatusChange(setSessionStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const cleanup = onHitTest((position, rotation) => {
      if (onPlaceModel && rotation) {
        onPlaceModel(position, rotation);
      }
    });
    return cleanup;
  }, [onPlaceModel]);

  const handleARStart = useCallback(async () => {
    if (!scene.isReady || !scene.sceneRef.current) return;
    setInstructionsDismissed(false);
    setShowInstructions(true);
    await startARSession(scene.sceneRef.current);
  }, [scene.isReady, scene.sceneRef]);

  const handleVRStart = useCallback(async () => {
    if (!scene.isReady || !scene.sceneRef.current) return;
    await startVRSession(scene.sceneRef.current);
  }, [scene.isReady, scene.sceneRef]);

  const handleEndSession = useCallback(async () => {
    setShowInstructions(false);
    await endXRSession();
  }, []);

  const getStatusLabel = (status: XRSessionStatus): string => {
    switch (status.state) {
      case "ready":
        return "Ready";
      case "starting":
        return `Starting ${status.sessionType === "immersive-ar" ? "AR" : "VR"}...`;
      case "active":
        return `${status.sessionType === "immersive-ar" ? "AR" : "VR"} Active`;
      case "error":
        return `Error: ${status.error ?? "Unknown error"}`;
      case "unsupported":
        return "Unsupported";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: XRSessionStatus): string => {
    switch (status.state) {
      case "active":
        return "#0D9488"; // teal
      case "starting":
        return "#F59E0B"; // amber
      case "error":
        return "#DC2626"; // red
      default:
        return "#8B8398"; // muted
    }
  };

  if (!arSupported && !vrSupported) {
    return (
      <div className="ar-panel">
        <div className="ar-panel-section">
          <h3 className="ar-panel-title">AR / VR</h3>
          <div className="ar-panel-unsupported">
            <svg
              className="ar-panel-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>WebXR is not supported on this device/browser.</p>
            <p className="ar-panel-hint">
              Try Chrome on Android, or a WebXR-compatible browser.
            </p>
          </div>
        </div>
        <style jsx>{`
          .ar-panel { display: flex; flex-direction: column; gap: 16px; }
          .ar-panel-section { display: flex; flex-direction: column; gap: 12px; }
          .ar-panel-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #8b8398; margin: 0; }
          .ar-panel-unsupported { text-align: center; padding: 24px 16px; color: #8b8398; }
          .ar-panel-icon { width: 48px; height: 48px; margin: 0 auto 12px; opacity: 0.5; }
          .ar-panel-hint { font-size: 12px; margin-top: 8px; opacity: 0.7; }
        `}</style>
      </div>
    );
  }

  const isActive = sessionStatus.state === "active";
  const isStarting = sessionStatus.state === "starting";
  const isError = sessionStatus.state === "error";

  return (
    <div className="ar-panel">
      <div className="ar-panel-section">
        <h3 className="ar-panel-title">AR / VR</h3>

        <div className="ar-panel-status" style={{ borderColor: getStatusColor(sessionStatus) }}>
          <div className="ar-panel-status-indicator" style={{ background: getStatusColor(sessionStatus) }} />
          <span className="ar-panel-status-text">{getStatusLabel(sessionStatus)}</span>
        </div>

        <div className="ar-panel-buttons">
          {arSupported && (
            <button
              className={`ar-panel-btn ar-panel-btn-ar ${sessionStatus.sessionType === "immersive-ar" && isActive ? "active" : ""}`}
              onClick={handleARStart}
              disabled={isActive || isStarting}
              aria-pressed={sessionStatus.sessionType === "immersive-ar" && isActive}
            >
              <svg className="ar-panel-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>Start AR</span>
            </button>
          )}

          {vrSupported && (
            <button
              className={`ar-panel-btn ar-panel-btn-vr ${sessionStatus.sessionType === "immersive-vr" && isActive ? "active" : ""}`}
              onClick={handleVRStart}
              disabled={isActive || isStarting}
              aria-pressed={sessionStatus.sessionType === "immersive-vr" && isActive}
            >
              <svg className="ar-panel-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 17v3M5 12h14" />
              </svg>
              <span>Start VR</span>
            </button>
          )}
        </div>

        {(isActive || isStarting) && (
          <button
            className="ar-panel-btn ar-panel-btn-end"
            onClick={handleEndSession}
            disabled={isStarting}
          >
            <svg className="ar-panel-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>End Session</span>
          </button>
        )}

        {isError && (
          <div className="ar-panel-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{sessionStatus.error}</span>
          </div>
        )}
      </div>

      {showInstructions && !instructionsDismissed && sessionStatus.sessionType === "immersive-ar" && (
        <div className="ar-instructions-overlay" onClick={() => setInstructionsDismissed(true)}>
          <div className="ar-instructions-content" onClick={(e) => e.stopPropagation()}>
            <button className="ar-instructions-close" onClick={() => setInstructionsDismissed(true)} aria-label="Dismiss">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h4>AR Session Started</h4>
            <p>Point your camera at a flat surface to place the model.</p>
            <div className="ar-instructions-steps">
              <div className="ar-instruction-step">
                <span className="ar-instruction-number">1</span>
                <span>Move device slowly to scan the environment</span>
              </div>
              <div className="ar-instruction-step">
                <span className="ar-instruction-number">2</span>
                <span>Wait for the floor grid to appear</span>
              </div>
              <div className="ar-instruction-step">
                <span className="ar-instruction-number">3</span>
                <span>Tap to place the model on the floor</span>
              </div>
            </div>
            <button className="ar-instructions-got-it" onClick={() => setInstructionsDismissed(true)}>
              Got it
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .ar-panel { display: flex; flex-direction: column; gap: 16px; }
        .ar-panel-section { display: flex; flex-direction: column; gap: 12px; }
        .ar-panel-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #8b8398; margin: 0; }

        .ar-panel-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #1a1330;
          border: 1px solid;
          border-radius: 8px;
          font-size: 13px;
          color: #e8e4f0;
        }
        .ar-panel-status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ar-panel-status-text { flex: 1; }

        .ar-panel-buttons { display: flex; flex-direction: column; gap: 8px; }
        .ar-panel-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 16px;
          background: #1a1330;
          border: 1px solid #2a1f47;
          border-radius: 8px;
          color: #e8e4f0;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ar-panel-btn:hover:not(:disabled) { background: #251a40; border-color: #3d2f5e; }
        .ar-panel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ar-panel-btn.active {
          background: #0D9488;
          border-color: #0D9488;
          color: #fff;
        }
        .ar-panel-btn.active:hover:not(:disabled) { background: #0f7d73; border-color: #0f7d73; }
        .ar-panel-btn-end {
          background: rgba(220, 38, 38, 0.15);
          border-color: rgba(220, 38, 38, 0.4);
          color: #fca5a5;
        }
        .ar-panel-btn-end:hover:not(:disabled) {
          background: rgba(220, 38, 38, 0.25);
          border-color: rgba(220, 38, 38, 0.6);
        }
        .ar-panel-btn-icon { width: 18px; height: 18px; flex-shrink: 0; }

        .ar-panel-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 12px;
        }

        .ar-instructions-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }
        .ar-instructions-content {
          background: #0f0a1c;
          border: 1px solid #2a1f47;
          border-radius: 16px;
          padding: 24px;
          max-width: 360px;
          width: 100%;
          position: relative;
          animation: slideUp 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .ar-instructions-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1330;
          border: 1px solid #2a1f47;
          border-radius: 8px;
          color: #8b8398;
          cursor: pointer;
        }
        .ar-instructions-close:hover { background: #251a40; color: #fff; }
        .ar-instructions-close svg { width: 16px; height: 16px; }
        .ar-instructions-content h4 { margin: 0 0 8px; font-size: 16px; color: #fff; }
        .ar-instructions-content > p { margin: 0 0 16px; color: #8b8398; font-size: 14px; line-height: 1.5; }
        .ar-instructions-steps { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .ar-instruction-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #e8e4f0;
          font-size: 13px;
          line-height: 1.5;
        }
        .ar-instruction-number {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0D9488;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .ar-instructions-got-it {
          width: 100%;
          padding: 12px;
          background: #0D9488;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .ar-instructions-got-it:hover { background: #0f7d73; }
      `}</style>
    </div>
  );
}