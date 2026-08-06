'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';
import { CanvasSkeleton, PanelSkeleton } from '@/components/ui/Skeleton';
import { Toolbar } from '@/components/configurator/Toolbar';

// Dynamic imports for heavy components
const BabylonCanvas = dynamic(
  () => import('@/components/configurator/BabylonCanvas').then((mod) => mod.BabylonCanvas),
  {
    ssr: false,
    loading: () => <CanvasSkeleton />,
  }
);

const Sidebar = dynamic(
  () => import('@/components/configurator/Sidebar').then((mod) => mod.Sidebar),
  {
    ssr: false,
    loading: () => <PanelSkeleton />,
  }
);

interface ConfiguratorPageProps {
  params: Promise<{ projectId: string }>;
}

export default function ConfiguratorPage({ params }: ConfiguratorPageProps) {
  const { projectId } = use(params);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <BabylonCanvas modelUrl="" className="w-full h-full" />
        <Toolbar projectId={projectId} />
      </div>

      {/* Sidebar - Mobile bottom sheet handled internally */}
      <Sidebar projectId={projectId} />
    </div>
  );
}