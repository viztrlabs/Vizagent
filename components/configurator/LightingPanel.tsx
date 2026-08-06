'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';

export function LightingPanel() {
  const config = useConfiguratorStore((s) => s.config);
  const updateLight = useConfiguratorStore((s) => s.updateLight);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">Lighting</h3>

      {config?.lights.map((light) => (
        <div key={light.id} className="p-3 bg-surface rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">{light.name}</span>
            <input
              type="checkbox"
              checked={light.enabled}
              onChange={(e) => updateLight(light.id, { enabled: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Color</label>
            <input
              type="color"
              value={light.color}
              onChange={(e) => updateLight(light.id, { color: e.target.value })}
              className="w-full h-6 rounded-md cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Intensity: {light.intensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={light.intensity}
              onChange={(e) =>
                updateLight(light.id, { intensity: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}