'use client';

import { useEffect, useRef, useState } from 'react';
import { createExperienceEngine, ExperienceEngine, ExperienceConfig, XRMode } from '@/lib/xr/ExperienceEngine';
import { Globe, Headphones, Monitor, Play, Box, X, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MODE_CONFIGS: Record<XRMode, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  tour: { label: 'Virtual Tour', icon: Globe, color: 'cyan', description: '360° panoramic tours with hotspot navigation' },
  webxr: { label: 'WebXR', icon: Headphones, color: 'blue', description: 'Immersive VR experiences in the browser' },
  webAR: { label: 'WebAR', icon: Globe, color: 'purple', description: 'Augmented reality in mobile browsers' },
  vr: { label: 'VR', icon: Headphones, color: 'purple', description: 'Native VR for standalone headsets' },
  streaming: { label: 'Pixel Streaming', icon: Monitor, color: 'orange', description: 'Remote GPU rendering via WebRTC' },
};

export default function UnifiedXRConsole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ExperienceEngine | null>(null);
  const [selectedMode, setSelectedMode] = useState<XRMode>('tour');
  const [engineState, setEngineState] = useState<ReturnType<ExperienceEngine['getState']>>({
    status: 'idle',
    mode: 'tour',
    frameCount: 0,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [availableModes, setAvailableModes] = useState<Partial<Record<XRMode, boolean>>>({});

  useEffect(() => {
    checkCapabilities();
  }, []);

  async function checkCapabilities() {
    if (typeof navigator === 'undefined' || !navigator.xr) return;
    const caps: Partial<Record<XRMode, boolean>> = {};
    try {
      caps.webxr = await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
      caps.webAR = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
      caps.vr = caps.webxr;
      caps.streaming = true; // Always available if server supports it
      caps.tour = true; // Always available
    } catch {
      caps.tour = true;
    }
    setAvailableModes(caps);
  }

  async function initializeEngine(mode: XRMode) {
    if (!canvasRef.current) return;
    if (engineRef.current) {
      engineRef.current.dispose();
    }

    const config: ExperienceConfig = {
      mode,
      assetId: 'demo-asset',
      projectId: 'demo-project',
      tenantId: 'default-tenant',
    };

    const engine = createExperienceEngine(canvasRef.current, config);
    engineRef.current = engine;

    setEngineState({ status: 'initializing', mode, frameCount: 0 });

    try {
      await engine.initialize();
      setEngineState(engine.getState());
    } catch (error) {
      console.error(`Failed to initialize ${mode} engine:`, error);
      setEngineState(prev => ({ ...prev, status: 'error', error: (error as Error).message }));
    }
  }

  async function startExperience() {
    if (!engineRef.current) return;
    try {
      await engineRef.current.start();
      setEngineState(engineRef.current.getState());
    } catch (error) {
      console.error('Failed to start experience:', error);
      setEngineState(prev => ({ ...prev, status: 'error', error: (error as Error).message }));
    }
  }

  function pauseExperience() {
    engineRef.current?.pause();
    setEngineState(engineRef.current?.getState() ?? engineState);
  }

  function resumeExperience() {
    engineRef.current?.resume();
    setEngineState(engineRef.current?.getState() ?? engineState);
  }

  function handleModeChange(mode: XRMode) {
    setSelectedMode(mode);
    initializeEngine(mode);
  }

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
    };
  }, []);

  const config = MODE_CONFIGS[selectedMode];
  const status = engineState.status;
  const isActive = status === 'running';

  return (
    <div className={cn('min-h-screen bg-bg', isFullscreen && 'fixed inset-0 z-50')}>
      {!isFullscreen && (
        <header className="border-b border-gray-800 bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="font-display text-2xl text-white">Unified XR Console</h1>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                disabled={status === 'idle' || status === 'initializing'}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>
        </header>
      )}

      {isFullscreen && (
        <div className="fixed top-4 right-4 z-60 flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)}>
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => engineRef.current?.dispose()}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <main className={cn('flex-1 flex flex-col', isFullscreen && 'h-screen')}>
        <div className={cn('flex flex-1', isFullscreen ? 'h-full' : 'min-h-[calc(100vh-4rem)]')}>
          <aside className={cn('w-64 bg-surface border-r border-gray-800 flex-shrink-0 p-4 overflow-y-auto', isFullscreen && 'h-full')}>
            <div className="mb-6">
              <h2 className="font-semibold text-white mb-3">XR Modes</h2>
              <div className="space-y-2">
                {(Object.keys(MODE_CONFIGS) as XRMode[]).map((mode) => {
                  const modeConfig = MODE_CONFIGS[mode];
                  const available = availableModes[mode] !== false;
                  const isSelected = mode === selectedMode;
                  return (
                    <button
                      key={mode}
                      onClick={() => available && handleModeChange(mode)}
                      disabled={!available}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-all min-h-touch',
                        isSelected
                          ? `bg-${modeConfig.color}/20 border border-${modeConfig.color}/50 text-white`
                          : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent',
                        !available && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', `bg-${modeConfig.color}/20 text-${modeConfig.color}`)}>
                          <modeConfig.icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium">{modeConfig.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{modeConfig.description}</p>
                      {!available && <span className="text-xs text-gray-500">Unsupported</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h3 className="font-medium text-white mb-3">Experience State</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Status</span>
                  <span className={cn('font-medium', status === 'running' && 'text-green-400', status === 'error' && 'text-red-400', status === 'initializing' && 'text-yellow-400')}>
                    {status}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Mode</span>
                  <span className="font-medium">{engineState.mode}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Frames</span>
                  <span className="font-medium font-mono">{engineState.frameCount}</span>
                </div>
                {engineState.error && (
                  <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded">
                    {engineState.error}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <section className="flex-1 relative flex flex-col">
            <div className={cn('relative flex-1 bg-black', isFullscreen ? 'h-full' : 'min-h-[500px]')}>
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ touchAction: 'none' }}
              />
              {status === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center p-8">
                    <Box className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select an XR Mode</h3>
                    <p className="text-gray-400">Choose a mode from the sidebar to initialize the engine</p>
                  </div>
                </div>
              )}
              {status === 'initializing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-cyan/50 border-t-cyan rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white">Initializing {config.label}...</p>
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center p-8 bg-red-900/30 rounded-xl border border-red-500/50 max-w-md mx-4">
                    <div className="w-12 h-12 mx-auto text-red-400 mb-4">⚠</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Initialization Failed</h3>
                    <p className="text-red-300 mb-4">{engineState.error}</p>
                    <Button variant="secondary" onClick={() => initializeEngine(selectedMode)}>
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className={cn('p-4 border-t border-gray-800 bg-surface flex items-center justify-between gap-4', isFullscreen && 'fixed bottom-0 left-64 right-0')}>
              <div className="flex items-center gap-4">
                <Button
                  onClick={startExperience}
                  disabled={status !== 'ready' && status !== 'paused' || !engineRef.current}
                  className="min-w-[120px]"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isActive ? 'Running' : 'Start'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={isActive ? pauseExperience : resumeExperience}
                  disabled={status !== 'running' && status !== 'paused' || !engineRef.current}
                >
                  {isActive ? 'Pause' : 'Resume'}
                </Button>
              </div>
              <div className="flex-1" />
              <div className="text-sm text-gray-400 font-mono">
                {engineState.frameCount} frames · {status}
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .min-h-screen {
          min-height: 100vh;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}