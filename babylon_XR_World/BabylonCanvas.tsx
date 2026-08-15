// src/components/xr/BabylonCanvas.tsx
"use client";

import { forwardRef } from "react";

interface BabylonCanvasProps {
  isLoading: boolean;
  error: string | null;
  posterUrl?: string;
}

export const BabylonCanvas = forwardRef<HTMLCanvasElement, BabylonCanvasProps>(
  ({ isLoading, error, posterUrl }, ref) => {
    return (
      <div className="viztr-canvas-shell">
        <canvas ref={ref} className="viztr-canvas" touch-action="none" />

        {isLoading && (
          <div className="viztr-canvas-overlay">
            {posterUrl ? (
              <img src={posterUrl} alt="" className="viztr-canvas-poster" loading="lazy" />
            ) : (
              <div className="viztr-spinner" aria-label="Loading model" />
            )}
          </div>
        )}

        {error && (
          <div className="viztr-canvas-error">
            Couldn&apos;t load this model. {error}
          </div>
        )}

        <style jsx>{`
          .viztr-canvas-shell {
            position: relative;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 30% 20%, #1a1330 0%, #0b0710 70%);
            border-radius: 12px;
            overflow: hidden;
          }
          .viztr-canvas {
            width: 100%;
            height: 100%;
            display: block;
            outline: none;
          }
          .viztr-canvas-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0b0710;
          }
          .viztr-canvas-poster {
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 0.85;
          }
          .viztr-spinner {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 3px solid rgba(107, 33, 168, 0.25);
            border-top-color: #0d9488;
            animation: spin 0.8s linear infinite;
          }
          .viztr-canvas-error {
            position: absolute;
            bottom: 16px;
            left: 16px;
            right: 16px;
            padding: 10px 14px;
            background: rgba(220, 38, 38, 0.15);
            border: 1px solid rgba(220, 38, 38, 0.4);
            color: #fca5a5;
            font-size: 13px;
            border-radius: 8px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
);

BabylonCanvas.displayName = "BabylonCanvas";
