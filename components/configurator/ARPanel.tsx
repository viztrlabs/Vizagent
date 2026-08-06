'use client';

export function ARPanel() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">AR View</h3>

      <div className="p-6 bg-surface rounded-md text-center">
        <div className="w-16 h-16 bg-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.5 14.5l2.5-2.5 2.5 2.5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 9.5l2.5 2.5-2.5 2.5" />
          </svg>
        </div>
        <p className="text-gray-400">AR functionality coming in FuturePhase</p>
        <p className="text-xs text-gray-500 mt-2">
          This tab will enable WebAR for mobile devices
        </p>
      </div>
    </div>
  );
}
