import { PublicTourViewer } from '@/components/viewer/PublicTourViewer';

interface PublicAsset {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  url: string;
}

export default async function PublicTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/public/tour/${id}`, { cache: 'no-store' });

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-2">Tour not available</h1>
          <p className="text-gray-400">This tour could not be found or is not published.</p>
        </div>
      </div>
    );
  }

  const data = await res.json();
  const assets: PublicAsset[] = data.assets || [];

  return (
    <div className="h-screen bg-bg flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-surface border-b border-gray-800">
        <h1 className="font-display text-lg text-white truncate">
          {data.project?.name || 'Virtual Tour'}
        </h1>
      </header>
      <div className="flex-1 relative">
        <PublicTourViewer assets={assets} />
      </div>
    </div>
  );
}
