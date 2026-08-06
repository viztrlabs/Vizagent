'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';
import { MaterialData } from '@/lib/types';

const materialPresets: MaterialData[] = [
  {
    id: 'preset-chrome',
    name: 'Chrome',
    albedo: '#c0c0c0',
    metallic: 1.0,
    roughness: 0.1,
    normalScale: 1.0,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    opacity: 1.0,
    doubleSided: false,
  },
  {
    id: 'preset-wood',
    name: 'Wood',
    albedo: '#8b4513',
    metallic: 0.0,
    roughness: 0.8,
    normalScale: 1.0,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    opacity: 1.0,
    doubleSided: false,
  },
  {
    id: 'preset-glass',
    name: 'Glass',
    albedo: '#ffffff',
    metallic: 0.0,
    roughness: 0.0,
    normalScale: 1.0,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    opacity: 0.3,
    doubleSided: true,
  },
];

interface MaterialsPanelProps {
  selectedMaterialId?: string;
}

export function MaterialsPanel({ selectedMaterialId }: MaterialsPanelProps) {
  const config = useConfiguratorStore((s) => s.config);
  const updateMaterial = useConfiguratorStore((s) => s.updateMaterial);
  const addMaterial = useConfiguratorStore((s) => s.addMaterial);

  const selectedMaterial = config?.materials.find((m) => m.id === selectedMaterialId);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">Materials</h3>

      {/* Material Presets */}
      <div>
        <label className="text-sm text-gray-400">Presets</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {materialPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => addMaterial({ ...preset, id: `mat-${Date.now()}` })}
              className="p-3 bg-surface rounded-md hover:bg-surface/80 transition-colors min-h-touch"
            >
              <div
                className="w-10 h-10 sm:w-8 sm:h-8 rounded-full mx-auto mb-1"
                style={{ backgroundColor: preset.albedo }}
              />
              <span className="text-xs">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Controls */}
      {selectedMaterial && (
        <div className="space-y-3">
          <label className="text-sm text-gray-400">Manual Controls</label>

          <div>
            <label className="text-xs text-gray-500">Albedo Color</label>
            <input
              type="color"
              value={selectedMaterial.albedo}
              onChange={(e) => updateMaterial(selectedMaterial.id, { albedo: e.target.value })}
              className="w-full h-10 sm:h-8 rounded-md cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-500">Metallic</label>
              <span className="text-xs text-gray-400">{selectedMaterial.metallic.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedMaterial.metallic}
              onChange={(e) =>
                updateMaterial(selectedMaterial.id, { metallic: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-500">Roughness</label>
              <span className="text-xs text-gray-400">{selectedMaterial.roughness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedMaterial.roughness}
              onChange={(e) =>
                updateMaterial(selectedMaterial.id, { roughness: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-500">Opacity</label>
              <span className="text-xs text-gray-400">{selectedMaterial.opacity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedMaterial.opacity}
              onChange={(e) =>
                updateMaterial(selectedMaterial.id, { opacity: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan"
            />
          </div>
        </div>
      )}
    </div>
  );
}
