import { Suspense } from 'react';
import { BabylonCanvas } from '@/components/configurator/BabylonCanvas';
import { StreamViewer } from '@/components/stream/StreamViewer';

interface ViewPageProps {
  params: Promise<{ configId: string }>;
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { configId } = await params;

  return (
    <div className="h-screen bg-bg">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading viewer...</div>}>
        <BabylonCanvas modelUrl={`/api/config/${configId}/model`} />
      </Suspense>
    </div>
  );
}
