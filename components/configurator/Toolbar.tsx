'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';

interface ToolbarProps {
  projectId: string;
}

export function Toolbar({ projectId }: ToolbarProps) {
  const undo = useConfiguratorStore((s) => s.undo);
  const redo = useConfiguratorStore((s) => s.redo);
  const canUndo = useConfiguratorStore((s) => s.canUndo);
  const canRedo = useConfiguratorStore((s) => s.canRedo);
  const isDirty = useConfiguratorStore((s) => s.isDirty);
  const lastSavedAt = useConfiguratorStore((s) => s.lastSavedAt);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/90 backdrop-blur-sm rounded-lg p-2">
      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={!canUndo()}
        className="p-2 rounded-md hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        onClick={redo}
        disabled={!canRedo()}
        className="p-2 rounded-md hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-700" />

      {/* Status */}
      <div className="px-3 text-sm">
        {isDirty ? (
          <span className="text-yellow-400">Unsaved changes</span>
        ) : lastSavedAt ? (
          <span className="text-gray-400">
            Saved {new Date(lastSavedAt).toLocaleTimeString()}
          </span>
        ) : (
          <span className="text-gray-400">No changes</span>
        )}
      </div>
    </div>
  );
}