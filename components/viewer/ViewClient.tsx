'use client';

import dynamic from 'next/dynamic';

const BabylonCanvas = dynamic(
  () => import('@/components/configurator/BabylonCanvas').then((mod) => mod.BabylonCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">Loading viewer...</div>
    ),
  }
);

interface ViewClientProps {
  configId: string;
}

export default function ViewClient({ configId }: ViewClientProps) {
  return <BabylonCanvas modelUrl={`/api/config/${configId}/model`} />;
}
