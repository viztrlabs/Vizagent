'use client';

import { useState, useEffect } from 'react';
import { useTourFeature } from '@/components/tour/TourFeatureContext';
import type { BrandingConfig } from '@/lib/tour/types';

interface ThemingControlsProps {
  onThemeChange?: (branding: BrandingConfig) => void;
}

const DEFAULT_PRIMARY_COLOR = '#00C8E0';
const DEFAULT_THEME = {
  primaryColor: DEFAULT_PRIMARY_COLOR,
};

const PRESET_COLORS = [
  '#00C8E0', '#0D9488', '#3B82F6', '#8B5CF6',
  '#EF4444', '#F59E0B', '#10B981', '#EC4899',
];

export function ThemingControls({ onThemeChange }: ThemingControlsProps) {
  const { config } = useTourFeature();
  const existingBranding = config?.branding ?? {};
  const [primaryColor, setPrimaryColor] = useState(existingBranding.primaryColor ?? DEFAULT_PRIMARY_COLOR);

  useEffect(() => {
    document.documentElement.style.setProperty('--viztr-primary', primaryColor);
  }, [primaryColor]);

  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    const branding: BrandingConfig = {
      primaryColor: color,
      logoUrl: existingBranding.logoUrl,
      coverImage: existingBranding.coverImage,
    };
    onThemeChange?.(branding);
  };

  return (
    <div className="viztr-theming-controls">
      <div className="viztr-color-preview">
        <div
          className="viztr-color-swatch"
          style={{ backgroundColor: primaryColor }}
        />
      </div>

      <div className="viztr-preset-colors">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handleColorChange(color)}
            className={`viztr-preset-button ${
              primaryColor.toLowerCase() === color.toLowerCase() ? 'active' : ''
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Set primary color to ${color}`}
          />
        ))}
      </div>

      <input
        type="color"
        value={primaryColor}
        onChange={(e) => handleColorChange(e.target.value)}
        className="viztr-color-picker"
        aria-label="Custom primary color"
      />

      <style jsx>{`
        .viztr-theming-controls {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 25;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
          background: rgba(13, 17, 23, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          backdrop-filter: blur(8px);
        }
        .viztr-color-preview {
          display: flex;
          justify-content: center;
        }
        .viztr-color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .viztr-preset-colors {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }
        .viztr-preset-button {
          width: 24px;
          height: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.15s, border-color 0.15s;
        }
        .viztr-preset-button:hover {
          transform: scale(1.1);
          border-color: rgba(255, 255, 255, 0.6);
        }
        .viztr-preset-button.active {
          border: 2px solid #fff;
          transform: scale(1.1);
        }
        .viztr-color-picker {
          width: 100%;
          height: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          padding: 0;
          overflow: hidden;
        }
        .viztr-color-picker::-webkit-color-swatch-wrapper {
          padding: 2px;
        }
      `}</style>
    </div>
  );
}

ThemingControls.displayName = 'ThemingControls';

export { DEFAULT_THEME };
export type { BrandingConfig };
