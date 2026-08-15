import Link from 'next/link';
import { XRConsoleLayout } from '@/components/xr-console/XRConsoleLayout';
import { AssetListClient } from '@/components/xr-console/AssetListClient';

export default function AssetsPage() {
  return (
    <XRConsoleLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">Assets</h1>
            <p className="text-gray-400 mt-1">Manage your 3D models, textures, and media assets</p>
          </div>
          <Link href="/xr-console/assets/upload" className="px-4 py-2 bg-cyan text-bg rounded-lg font-medium hover:bg-cyan/90 transition-colors min-h-touch">
            Upload Asset
          </Link>
        </div>
        <AssetListClient />
      </div>
    </XRConsoleLayout>
  );
}