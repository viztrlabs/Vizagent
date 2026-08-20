'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VisualEffectsControlsProps {
  initialBrightness?: number;
  initialContrast?: number;
  initialSaturation?: number;
  onChange?: (brightness: number, contrast: number, saturation: number) => void;
}

export function VisualEffectsControls({
  initialBrightness = 0,
  initialContrast = 0,
  initialSaturation = 0,
  onChange
}: VisualEffectsControlsProps) {
  const [brightness, setBrightness] = useState(initialBrightness);
  const [contrast, setContrast] = useState(initialContrast);
  const [saturation, setSaturation] = useState(initialSaturation);
  const brightnessRef = useRef<HTMLInputElement>(null);
  const contrastRef = useRef<HTMLInputElement>(null);
  const saturationRef = useRef<HTMLInputElement>(null);

  // Apply CSS filters to the viewer container
  useEffect(() => {
    const viewerContainer = document.querySelector<HTMLElement>('.marzipano-viewer');
    if (viewerContainer) {
      viewerContainer.style.filter = `
        brightness(${brightness + 100}%)
        contrast(${contrast + 100}%)
        saturate(${saturation + 100}%)
      `;
    }

    // Call onChange prop if provided
    if (onChange) {
      onChange(brightness, contrast, saturation);
    }
  }, [brightness, contrast, saturation, onChange]);

  // Reset to default values
  const resetEffects = useCallback(() => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  }, []);

  return (
    <div className="relative inline-flex items-center space-x-4">
      {/* Brightness Control */}
      <div className="flex items-center space-x-2">
        <label htmlFor="brightness-slider" className="sr-only">
          Brightness
        </label>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2.252a9 9 0 110 18 9 9 0 010-18zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zm6.407 4.995a.75.75 0 00-1.414-.146l-3.222.94a.75.75 0 10.106 1.48l3.222-.94a.75.75 0 001.308-1.334zm-10.814-3.037a.75.75 0 00-1.414.146l3.222-.94a.75.75 0 00-.106-1.48l-3.222-.94a.75.75 0 00-1.308 1.334zm5.664 6.407a.75.75 0 001.414.146l-.94 3.222a.75.75 0 10-1.48-.106l.94-3.222a.75.75 0 001.334-1.308zM4.121 8.791a.75.75 0 00-1.48-.106l-.94 3.222a.75.75 0 00-.106 1.48l3.222-.94a.75.75 0 001.334-1.308z" />
          </svg>
          <input
            id="brightness-slider"
            type="range"
            min="-100"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(parseInt(e.target.value))}
            ref={brightnessRef}
            className="w-24"
            aria-label="Brightness"
          />
          <span className="w-8 text-center text-xs">{brightness}</span>
        </div>
      </div>

      {/* Contrast Control */}
      <div className="flex items-center space-x-2">
        <label htmlFor="contrast-slider" className="sr-only">
          Contrast
        </label>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16.886c0 .613.395 1.104.852 1.301l6.448 1.242a1 1 0 001.197-.524l1.242-6.448a1 1 0 00.524-1.197L12.075 7.949a5.948 5.948 0 00-4.243-4.243l-6.448 1.242a1 1 0 00-1.197.524l1.242 6.448A1 1 0 004.886 18H4V4z" />
          </svg>
          <input
            id="contrast-slider"
            type="range"
            min="-100"
            max="100"
            value={contrast}
            onChange={(e) => setContrast(parseInt(e.target.value))}
            ref={contrastRef}
            className="w-24"
            aria-label="Contrast"
          />
          <span className="w-8 text-center text-xs">{contrast}</span>
        </div>
      </div>

      {/* Saturation Control */}
      <div className="flex items-center space-x-2">
        <label htmlFor="saturation-slider" className="sr-only">
          Saturation
        </label>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2.252a9 9 0 110 18 9 9 0 010-18zm0 14.25a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5zM16.5 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <input
            id="saturation-slider"
            type="range"
            min="-100"
            max="100"
            value={saturation}
            onChange={(e) => setSaturation(parseInt(e.target.value))}
            ref={saturationRef}
            className="w-24"
            aria-label="Saturation"
          />
          <span className="w-8 text-center text-xs">{saturation}</span>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetEffects}
        className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-md hover:bg-white/20 transition-colors text-sm text-gray-100 hover:text-white"
        aria-label="Reset visual effects to default"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.001 8.001 0 01-15.357-2m15.357 2h6.418" />
        </svg>
        Reset
      </button>
    </div>
  );
}