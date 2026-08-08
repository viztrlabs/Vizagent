'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const VirtualTourView = dynamic(
  () => import('@/components/configurator/VirtualTourView').then((mod) => mod.VirtualTourView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-gray-400">Loading viewer...</div>
    ),
  }
);

interface ViewClientProps {
  configId: string;
}

interface ViewerAsset {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  url: string;
}

function isPanorama(fileName: string): boolean {
  return /\.(jpg|jpeg|png)$/i.test(fileName);
}

export default function ViewClient({ configId }: ViewClientProps) {
  const [asset, setAsset] = useState<ViewerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/assets?project_id=${encodeURIComponent(configId)}`);
        if (!res.ok) {
          if (!cancelled) setError('Failed to load project assets');
          return;
        }
        const data = await res.json();
        const assets: ViewerAsset[] = data.assets || [];
        const panorama = assets.find((a) => isPanorama(a.fileName));
        if (!cancelled) {
          if (panorama) {
            setAsset(panorama);
          } else {
            setError('No panorama asset found for this project.');
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load viewer');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [configId]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        {error}
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Loading viewer...
      </div>
    );
  }

  return <VirtualTourView equirectUrl={asset.url} className="w-full h-full" />;
}