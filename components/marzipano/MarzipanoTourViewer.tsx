'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
} from 'lucide-react';
import { useMarzipanoTour } from './useMarzipanoTour';
import type { TourConfig, TourHotspot } from '@/lib/tour/types';

interface MarzipanoTourViewerProps {
  config: TourConfig;
  className?: string;
  selectedFloor?: string | null;
  onHeadingChange?: (heading: number | null) => void;
  onHotspotClick?: (hotspot: TourHotspot) => void;
  currentSceneId?: string | null;
}

export function MarzipanoTourViewer({ config, className = '' }: MarzipanoTourViewerProps) {
  const {
    containerRef,
    isLoading,
    error,
    currentSceneIndex,
    isPlaying,
    goNext,
    goPrev,
    toggleAutorotate,
  } = useMarzipanoTour(config);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<number>(0);

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
    hideTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
    window.addEventListener('pointermove', show);
    window.addEventListener('keydown', show);
    return () => {
      window.clearTimeout(hideTimerRef.current);
      window.removeEventListener('pointermove', show);
      window.removeEventListener('keydown', show);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => setIsFullscreen(!!document.fullscreenElement));
    } else {
      document.exitFullscreen().catch(() => setIsFullscreen(!!document.fullscreenElement));
    }
  }, [containerRef]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (config.scenes.length <= 1) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
    },
    [config.scenes.length, goNext, goPrev]
  );

  const hasMultipleScenes = config.scenes.length > 1;
  const currentScene = config.scenes[currentSceneIndex];

  return (
    <div
      ref={containerRef}
      className={`viztr-marzipano-viewer ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`${config.title} — virtual tour`}
    >
      {isLoading && (
        <div className="viztr-marzipano-loading" role="status" aria-label="Loading tour">
          <div className="viztr-spinner" />
        </div>
      )}

      {error && (
        <div className="viztr-marzipano-error" role="status">
          Couldn&apos;t load this tour. {error}
        </div>
      )}

      {showControls && !error && (
        <div className="viztr-marzipano-controls">
          <button
            type="button"
            className="viztr-marzipano-btn"
            onClick={toggleAutorotate}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? 'Pause auto-rotate' : 'Play auto-rotate'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {hasMultipleScenes && (
            <div className="viztr-marzipano-nav">
              <button
                type="button"
                className="viztr-marzipano-btn"
                onClick={goPrev}
                aria-label="Previous scene"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="viztr-marzipano-scene-label">
                {currentScene?.title ?? ''}
              </span>
              <button
                type="button"
                className="viztr-marzipano-btn"
                onClick={goNext}
                aria-label="Next scene"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="viztr-marzipano-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      )}

      <style jsx>{`
        .viztr-marzipano-viewer {
          position: relative;
          width: 100%;
          height: 100%;
          background: #080a0f;
          border-radius: 12px;
          overflow: hidden;
          outline: none;
        }
        .viztr-marzipano-viewer :global(canvas) {
          width: 100%;
          height: 100%;
          display: block;
          touch-action: none;
        }
        .viztr-marzipano-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080a0f;
          z-index: 10;
          pointer-events: none;
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
        .viztr-marzipano-error {
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
        .viztr-marzipano-controls {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(13, 17, 23, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          backdrop-filter: blur(8px);
          z-index: 30;
        }
        .viztr-marzipano-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .viztr-marzipano-btn:hover {
          background: rgba(13, 148, 136, 0.4);
          color: #fff;
        }
        .viztr-marzipano-btn:focus-visible {
          outline: 2px solid #06b6d4;
          outline-offset: 2px;
        }
        .viztr-marzipano-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .viztr-marzipano-scene-label {
          min-width: 120px;
          text-align: center;
          color: #cbd5e1;
          font-size: 13px;
          font-family: Inter, system-ui, sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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

MarzipanoTourViewer.displayName = 'MarzipanoTourViewer';
