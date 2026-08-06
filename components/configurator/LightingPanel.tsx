'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';

export function LightingPanel() {
  const config = useConfiguratorStore((s) => s.config);
  const updateLight = useConfiguratorStore((s) => s.updateLight);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">Lighting</h3>

      {config?.lights.map((light) => (
        <div key={light.id} className="p-3 bg-surface rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{light.name}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={light.enabled}
                onChange={(e) => updateLight(light.id, { enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan"></div>
            </label>
          </div>

          <div>
            <label className="text-xs text-gray-500">Color</label>
            <input
              type="color"
              value={light.color}
              onChange={(e) => updateLight(light.id, { color: e.target.value })}
              className="w-full h-10 sm:h-6 rounded-md cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-500">Intensity</label>
              <span className="text-xs text-gray-400">{light.intensity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={light.intensity}
              onChange={(e) =>
                updateLight(light.id, { intensity: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
