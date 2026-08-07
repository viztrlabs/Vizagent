'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const VirtualTourView = dynamic(
  () => import('@/components/configurator/VirtualTourView').then((m) => m.VirtualTourView),
  { ssr: false }
);

const BabylonCanvas = dynamic(
  () => import('@/components/configurator/BabylonCanvas').then((m) => m.BabylonCanvas),
  { ssr: false }
);

interface PublicAsset {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  url: string;
}

function isImage(fileType: string, fileName: string): boolean {
  return /\.(jpg|jpeg|png)$/i.test(fileName) || /image\//.test(fileType);
}

function isGlb(fileType: string, fileName: string): boolean {
  return /\.glb$/i.test(fileName) || /gltf-binary/.test(fileType);
}

export function PublicTourViewer({ assets }: { assets: PublicAsset[] }) {
  const panorama = useMemo(
    () => assets.find((a) => isImage(a.fileType, a.fileName)),
    [assets]
  );
  const glb = useMemo(() => assets.find((a) => isGlb(a.fileType, a.fileName)), [assets]);

  if (panorama) {
    return (
      <VirtualTourView
        equirectUrl={panorama.url}
        className="w-full h-full"
      />
    );
  }

  if (glb) {
    return <BabylonCanvas modelUrl={glb.url} className="w-full h-full" />;
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-gray-400">
      No viewable content available for this tour.
    </div>
  );
}
