'use client';

export function ARPanel() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">AR View</h3>

      <div className="p-6 bg-surface rounded-md text-center">
        <div className="w-16 h-16 bg-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📱</span>
        </div>
        <p className="text-gray-400">AR functionality coming in FuturePhase</p>
        <p className="text-xs text-gray-500 mt-2">
          This tab will enable WebAR for mobile devices
        </p>
      </div>
    </div>
  );
}
