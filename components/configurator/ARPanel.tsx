'use client';

import { useState, useEffect } from 'react';
import {
  tryEnterAR,
  tryEnterVR,
  exitXr,
  getMode,
  getDetectedPlanes,
  getCapabilities,
  type XrMode,
  type XrCapabilities,
} from '@/lib/xr/webxr-session';

export function ARPanel() {
  const [capabilities, setCapabilities] = useState<XrCapabilities | null>(null);
  const [mode, setMode] = useState<XrMode>('none');
  const [planes, setPlanes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCapabilities().then(setCapabilities).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'none') return;
    const interval = setInterval(() => {
      setMode(getMode());
      setPlanes(getDetectedPlanes());
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  async function handleEnterAR() {
    setBusy(true);
    setError(null);
    const ok = await tryEnterAR();
    setBusy(false);
    if (ok) setMode(getMode());
    else setError('Could not start AR. immersive-ar may not be supported on this device.');
  }

  async function handleEnterVR() {
    setBusy(true);
    setError(null);
    const ok = await tryEnterVR();
    setBusy(false);
    if (ok) setMode(getMode());
    else setError('Could not start VR. immersive-vr may not be supported on this device.');
  }

  async function handleExit() {
    await exitXr();
    setMode('none');
    setPlanes(0);
  }

  const arSupported = capabilities?.ar ?? false;
  const vrSupported = capabilities?.vr ?? false;
  const inSession = mode !== 'none';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">AR / VR</h3>

      {error && (
        <div className="p-3 rounded-md bg-red-900/30 border border-red-800 text-red-300 text-sm">{error}</div>
      )}

      {inSession ? (
        <div className="space-y-3">
          <div className="p-4 bg-surface rounded-md">
            <p className="text-sm text-white font-medium">
              {mode === 'ar' ? 'AR Session Active' : 'VR Session Active'}
            </p>
            {mode === 'ar' && <p className="text-xs text-gray-400 mt-1">Tracked planes: {planes}</p>}
          </div>
          <button onClick={handleExit} className="w-full py-3 px-4 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors min-h-touch">
            Exit {mode.toUpperCase()}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={handleEnterAR} disabled={!arSupported || busy} className="w-full py-3 px-4 bg-cyan text-bg rounded-md font-medium hover:bg-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-touch">
            Enter AR
          </button>
          <button onClick={handleEnterVR} disabled={!vrSupported || busy} className="w-full py-3 px-4 bg-surface text-white border border-gray-700 rounded-md font-medium hover:bg-surface/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-touch">
            Enter VR
          </button>
          <div className="p-4 bg-surface rounded-md text-center">
            {capabilities ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  {arSupported || vrSupported ? 'WebXR supported on this device' : 'WebXR not available in this browser'}
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded ${arSupported ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>AR {arSupported ? 'yes' : 'no'}</span>
                  <span className={`px-2 py-0.5 rounded ${vrSupported ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>VR {vrSupported ? 'yes' : 'no'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Detecting capabilities...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}