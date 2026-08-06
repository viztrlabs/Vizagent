'use client';

import { useConfiguratorStore } from '@/lib/store/configurator-store';

export function ExportPanel() {
  const config = useConfiguratorStore((s) => s.config);
  const saveConfig = useConfiguratorStore((s) => s.saveConfig);
  const isDirty = useConfiguratorStore((s) => s.isDirty);

  const handleExport = () => {
    if (!config) return;

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'viztr-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">Export</h3>

      <div className="space-y-3">
        <button
          onClick={saveConfig}
          disabled={!isDirty}
          className="w-full py-3 px-4 bg-cyan text-bg rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan/90 transition-colors min-h-touch"
        >
          Save to Cloud
        </button>

        <button
          onClick={handleExport}
          className="w-full py-3 px-4 bg-surface text-white rounded-md font-medium hover:bg-surface/80 transition-colors min-h-touch"
        >
          Export as JSON
        </button>

        <button
          onClick={() => {
            const shareUrl = `${window.location.origin}/view/current`;
            navigator.clipboard.writeText(shareUrl);
          }}
          className="w-full py-3 px-4 bg-surface text-white rounded-md font-medium hover:bg-surface/80 transition-colors min-h-touch"
        >
          Copy Share Link
        </button>
      </div>
    </div>
  );
}
