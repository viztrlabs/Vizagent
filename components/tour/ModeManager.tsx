'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { TourConfig, TourHotspot } from '@/lib/tour/types';

const MarzipanoTourViewer = dynamic(
  () => import('@/components/marzipano/MarzipanoTourViewer').then((m) => m.MarzipanoTourViewer),
  { ssr: false }
);

export type TourMode = 'panoramic' | 'dollhouse' | 'floor-plan';

interface ModeManagerProps {
  config: TourConfig;
  mode?: TourMode;
  defaultMode?: TourMode;
  className?: string;
  selectedFloor?: string | null;
  onHeadingChange?: (heading: number | null) => void;
  onHotspotClick?: (hotspot: TourHotspot) => void;
  currentSceneId?: string | null;
}

function BabylonStub({ mode }: { mode: TourMode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080a0f',
        color: '#94a3b8',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      role="status"
      aria-label={`${mode} 3D viewer`}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>
          3D {mode === 'dollhouse' ? 'Dollhouse' : 'Floor Plan'} View
        </p>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Coming soon</p>
      </div>
    </div>
  );
}

export function ModeManager({
  config,
  mode: controlledMode,
  defaultMode = 'panoramic',
  className = '',
  selectedFloor,
  onHeadingChange,
  onHotspotClick,
  currentSceneId,
}: ModeManagerProps) {
  const [internalMode, setInternalMode] = useState<TourMode>(defaultMode);
  const currentMode = controlledMode ?? internalMode;

  const modeSwitcher: ReactNode = (
    <div
      className="viztr-mode-switcher"
      role="tablist"
      aria-label="View mode"
    >
      <button
        role="tab"
        aria-selected={currentMode === 'panoramic'}
        onClick={() => setInternalMode('panoramic')}
        className={`viztr-mode-tab ${currentMode === 'panoramic' ? 'active' : ''}`}
      >
        Panoramic
      </button>
      <button
        role="tab"
        aria-selected={currentMode === 'dollhouse'}
        onClick={() => setInternalMode('dollhouse')}
        className={`viztr-mode-tab ${currentMode === 'dollhouse' ? 'active' : ''}`}
      >
        Dollhouse
      </button>
      <button
        role="tab"
        aria-selected={currentMode === 'floor-plan'}
        onClick={() => setInternalMode('floor-plan')}
        className={`viztr-mode-tab ${currentMode === 'floor-plan' ? 'active' : ''}`}
      >
        Floor Plan
      </button>
      <style jsx>{`
        .viztr-mode-switcher {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 20;
          display: flex;
          gap: 4px;
          padding: 4px;
          background: rgba(13, 17, 23, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          backdrop-filter: blur(8px);
        }
        .viztr-mode-tab {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #94a3b8;
          font-size: 13px;
          font-family: Inter, system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .viztr-mode-tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }
        .viztr-mode-tab.active {
          background: rgba(13, 148, 136, 0.3);
          color: #fff;
        }
        .viztr-mode-tab:focus-visible {
          outline: 2px solid #06b6d4;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );

  if (currentMode === 'panoramic') {
    return (
      <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
        {modeSwitcher}
        <MarzipanoTourViewer
          config={config}
          selectedFloor={selectedFloor}
          onHeadingChange={onHeadingChange}
          onHotspotClick={onHotspotClick}
          currentSceneId={currentSceneId}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      {modeSwitcher}
      <BabylonStub mode={currentMode} />
    </div>
  );
}

ModeManager.displayName = 'ModeManager';
