'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualTourScene } from './useVirtualTourScene';
import { ViewerControls } from './ViewerControls';
import { HotspotMarker } from './HotspotMarker';
import type { TourConfig, TourHotspot } from '@/lib/tour/types';

interface VirtualTourViewerProps {
  config: TourConfig;
  className?: string;
}

export function VirtualTourViewer({ config, className = '' }: VirtualTourViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(config.settings.autoRotate);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<number>(0);

  const {
    canvasRef,
    getGuiManager,
    isLoading,
    error,
    isVRSupported,
    isInVR,
    enterVR,
    exitVR,
  } = useVirtualTourScene(config, autoRotate);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const show = () => {
      setShowControls(true);
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('pointermove', show);
    window.addEventListener('keydown', show);
    return () => {
      window.clearTimeout(hideTimerRef.current);
      window.removeEventListener('pointermove', show);
      window.removeEventListener('keydown', show);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, [canvasRef]);

  const handleHotspotSelect = useCallback((hotspot: TourHotspot) => {
    if (hotspot.url) {
      window.open(hotspot.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  if (error) {
    return (
      <div className={`viztr-tour-viewer ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas ref={canvasRef} className="viztr-tour-canvas" />
        <div className="viztr-tour-error">
          Couldn&apos;t load this tour. {error}
        </div>
        <style jsx>{`
          .viztr-tour-viewer {
            position: relative;
            width: 100%;
            height: 100%;
            background: #080a0f;
            border-radius: 12px;
            overflow: hidden;
          }
          .viztr-tour-canvas {
            width: 100%;
            height: 100%;
            display: block;
            outline: none;
            touch-action: none;
          }
          .viztr-tour-error {
            position: absolute;
            bottom: 16px;
            left: 16px;
            right: 16px;
            padding: 12px 16px;
            background: rgba(220, 38, 38, 0.15);
            border: 1px solid rgba(220, 38, 38, 0.4);
            color: #fca5a5;
            font-size: 14px;
            border-radius: 8px;
            z-index: 20;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`viztr-tour-viewer ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} className="viztr-tour-canvas" />

      {isLoading && (
        <div className="viztr-tour-overlay">
          <div className="viztr-spinner" aria-label="Loading tour" />
        </div>
      )}

      {showControls && (
        <ViewerControls
          title={config.title}
          isLoading={isLoading}
          isFullscreen={isFullscreen}
          isVRSupported={isVRSupported}
          isInVR={isInVR}
          autoRotate={autoRotate}
          onToggleFullscreen={toggleFullscreen}
          onToggleVR={isInVR ? exitVR : enterVR}
          onToggleAutoRotate={() => setAutoRotate((v) => !v)}
        />
      )}

      {config.hotspots.map((hotspot) => (
        <HotspotMarker
          key={hotspot.id}
          hotspot={hotspot}
          getGuiManager={getGuiManager}
          onSelect={handleHotspotSelect}
        />
      ))}

      <style jsx>{`
        .viztr-tour-viewer {
          position: relative;
          width: 100%;
          height: 100%;
          background: #080a0f;
          border-radius: 12px;
          overflow: hidden;
        }
        .viztr-tour-canvas {
          width: 100%;
          height: 100%;
          display: block;
          outline: none;
          touch-action: none;
        }
        .viztr-tour-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080a0f;
          z-index: 10;
        }
        .viztr-spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(13, 148, 136, 0.25);
          border-top-color: #0d9488;
          animation: viztr-spin 0.8s linear infinite;
        }
        @keyframes viztr-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .viztr-spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

VirtualTourViewer.displayName = 'VirtualTourViewer';
