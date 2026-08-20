'use client';

import { useState, type ReactNode } from 'react';
import { useTourFeature } from '@/components/tour/TourFeatureContext';
import type { TourMode } from '@/components/tour/ModeManager';

interface ViewModeSwitcherProps {
  defaultMode?: TourMode;
  onChange?: (mode: TourMode) => void;
}

export function ViewModeSwitcher({
  defaultMode = 'panoramic',
  onChange,
}: ViewModeSwitcherProps) {
  const { config } = useTourFeature();
  const [mode, setMode] = useState<TourMode>(defaultMode);

  const has3D = !!config?.model3d?.length;

  const modes: Array<{ id: TourMode; label: string; requires3D: boolean }> = [
    { id: 'panoramic', label: 'Panoramic', requires3D: false },
    { id: 'dollhouse', label: 'Dollhouse', requires3D: true },
    { id: 'floor-plan', label: 'Floor Plan', requires3D: true },
  ];

  const visibleModes = modes.filter((m) => !m.requires3D || has3D);

  const handleModeChange = (newMode: TourMode) => {
    setMode(newMode);
    onChange?.(newMode);
  };

  return (
    <div
      className="viztr-view-mode-switcher"
      role="toolbar"
      aria-label="View mode"
    >
      {visibleModes.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={mode === m.id}
          onClick={() => handleModeChange(m.id)}
          className={`viztr-view-mode-button ${mode === m.id ? 'active' : ''}`}
          title={m.label}
        >
          <span className="viztr-view-mode-label">{m.label}</span>
        </button>
      ))}
      <style jsx>{`
        .viztr-view-mode-switcher {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 20;
          display: flex;
          gap: 4px;
          padding: 4px;
          background: rgba(13, 17, 23, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          backdrop-filter: blur(8px);
        }
        .viztr-view-mode-button {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #94a3b8;
          font-size: 13px;
          font-family: Inter, system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .viztr-view-mode-button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }
        .viztr-view-mode-button.active {
          background: rgba(13, 148, 136, 0.3);
          color: #fff;
        }
        .viztr-view-mode-button:focus-visible {
          outline: 2px solid #06b6d4;
          outline-offset: 1px;
        }
        .viztr-view-mode-button .viztr-view-mode-label {
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

ViewModeSwitcher.displayName = 'ViewModeSwitcher';

export type { TourMode };
