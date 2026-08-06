'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';

export function HotspotsPanel() {
  const config = useConfiguratorStore((s) => s.config);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">Hotspots</h3>
      <p className="text-sm text-gray-400">
        Click on the 3D model to place hotspots. Hotspots will be saved with the configuration.
      </p>

      <div className="p-4 bg-surface rounded-md">
        <p className="text-xs text-gray-500">
          {config?.objects.length || 0} objects in scene
        </p>
      </div>
    </div>
  );
}