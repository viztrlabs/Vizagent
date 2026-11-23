import { Suspense } from 'react';
import { BabylonCanvas } from '@/components/configurator/BabylonCanvas';
import { Sidebar } from '@/components/configurator/Sidebar';
import { Toolbar } from '@/components/configurator/Toolbar';

interface ConfiguratorPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ConfiguratorPage({ params }: ConfiguratorPageProps) {
  const { projectId } = await params;

  return (
    <div className="h-screen flex bg-bg">
      {/* Main 3D Viewport */}
      <div className="flex-1 relative">
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading 3D Engine...</div>}>
          <BabylonCanvas modelUrl={`/api/projects/${projectId}/model`} />
        </Suspense>

        {/* Floating Toolbar */}
        <Toolbar projectId={projectId} />
      </div>

      {/* Side Panel */}
      <Sidebar projectId={projectId} />
    </div>
  );
}