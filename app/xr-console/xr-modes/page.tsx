import Link from 'next/link';
import { XRConsoleLayout } from '@/components/xr-console/XRConsoleLayout';

export default function XRModesPage() {
  const modes = [
    {
      id: 'virtual-tour',
      name: 'Virtual Tour (360°)',
      description: 'Immersive 360° panoramic tours with hotspot navigation',
      icon: 'Globe',
      color: 'cyan',
      status: 'Production Ready',
      features: ['Multi-scene tours', 'Hotspot navigation', 'Floor plan mini-map', 'Gyroscope support', 'Auto-rotation'],
      pricing: 'Included in all plans',
    },
    {
      id: 'webxr',
      name: 'WebXR (Browser VR)',
      description: 'Immersive VR experiences directly in the browser',
      icon: 'Headphones',
      color: 'blue',
      status: 'Beta',
      features: ['Teleportation locomotion', 'Controller support', 'Hand tracking', 'Comfort modes', 'LOD switching'],
      pricing: 'Pro plan and above',
    },
    {
      id: 'webar',
      name: 'WebAR (Mobile AR)',
      description: 'Augmented reality experiences in mobile browsers',
      icon: 'Globe',
      color: 'purple',
      status: 'Beta',
      features: ['Plane detection', 'Image tracking', 'Shadow rendering', 'Light estimation', 'Hit testing'],
      pricing: 'Pro plan and above',
    },
    {
      id: 'vr',
      name: 'VR (Native Headset)',
      description: 'Native VR applications for standalone headsets',
      icon: 'Headphones',
      color: 'purple',
      status: 'Alpha',
      features: ['6DOF tracking', 'Haptics', 'Eye tracking', 'Hand tracking', '90 FPS target'],
      pricing: 'Studio plan and above',
    },
    {
      id: 'streaming',
      name: 'Pixel Streaming',
      description: 'Photoreal remote rendering from GPU workstations',
      icon: 'Monitor',
      color: 'orange',
      status: 'Alpha',
      features: ['WebRTC streaming', '<100ms latency', 'Adaptive bitrate', 'GPU orchestration', 'Quality controls'],
      pricing: 'Enterprise plan',
    },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-4">XR Experience Modes</h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Transform a single asset into five immersive XR experiences. Each mode is optimized for its platform
            with automatic optimization, LOD generation, and one-click publishing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { id: 'virtual-tour', name: 'Virtual Tour (360°)', desc: 'Immersive 360° panoramic tours with hotspot navigation', icon: 'Globe', color: 'cyan', status: 'Production Ready', features: ['Multi-scene tours', 'Hotspot navigation', 'Floor plan mini-map', 'Gyroscope support', 'Auto-rotation'], pricing: 'Included in all plans' },
            { id: 'webxr', name: 'WebXR (Browser VR)', desc: 'Immersive VR experiences directly in the browser', icon: 'Headphones', color: 'blue', status: 'Beta', features: ['Teleportation locomotion', 'Controller support', 'Hand tracking', 'Comfort modes', 'LOD switching'], pricing: 'Pro plan and above' },
            { id: 'webar', name: 'WebAR (Mobile AR)', desc: 'Augmented reality experiences in mobile browsers', icon: 'Globe', color: 'purple', status: 'Beta', features: ['Plane detection', 'Image tracking', 'Shadow rendering', 'Light estimation', 'Hit testing'], pricing: 'Pro plan and above' },
            { id: 'vr', name: 'VR (Native Headset)', desc: 'Native VR applications for standalone headsets', icon: 'Headphones', color: 'purple', status: 'Alpha', features: ['6DOF tracking', 'Haptics', 'Eye tracking', 'Hand tracking', '90 FPS target'], pricing: 'Studio plan and above' },
            { id: 'streaming', name: 'Pixel Streaming', desc: 'Photoreal remote rendering from GPU workstations', icon: 'Monitor', color: 'orange', status: 'Alpha', features: ['WebRTC streaming', '<100ms latency', 'Adaptive bitrate', 'GPU orchestration', 'Quality controls'], pricing: 'Enterprise plan' },
          ].map((mode) => (
            <div key={mode.id} className="group relative bg-surface border border-gray-800 rounded-2xl p-8 hover:border-cyan/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.1)] transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${mode.color}/20 text-${mode.color}`}>
                  <span className="text-2xl">{mode.icon === 'Globe' ? '🌍' : mode.icon === 'Headphones' ? '🎧' : '🖥️'}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{mode.name}</h3>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/30 text-green-400">{mode.status}</span>
                </div>
              </div>
              <p className="text-gray-400 mb-6 line-clamp-2">{mode.desc}</p>
              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-medium text-gray-400">Key Features</h4>
                <ul className="space-y-1">
                  {mode.features.map((feature) => (
                    <li key={feature} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan/50" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{mode.pricing}</span>
                  <a href={`/xr-console/${mode.id.toLowerCase().replace(/[()]/g, '')}`} className="text-sm font-medium text-cyan hover:text-cyan/80 flex items-center gap-1">
                    Configure →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Ready to create immersive experiences?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Start building immersive XR experiences today. Upload your assets, configure your modes, and publish
            with one click. No coding required.
          </p>
          <Link href="/xr-console/projects/new" className="inline-flex items-center gap-2 px-8 py-4 bg-cyan text-bg rounded-lg font-semibold text-lg hover:bg-cyan/90 transition-colors">
            Start Building →
          </Link>
        </div>
      </div>
    </div>
  );
}