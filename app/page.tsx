'use client';

import { lazy, Suspense } from 'react';

const UploadDropzone = lazy(() => import('@/components/upload/UploadDropzone').then(m => ({ default: m.UploadDropzone })));

export default function HomePage() {
  const handleUploadComplete = (asset: { id: string; publicUrl: string }) => {
    console.log('Upload complete:', asset);
  };

  return (
    <main className="min-h-screen bg-bg p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="font-display text-5xl md:text-7xl text-cyan tracking-wide">VizTR</h1>
          <p className="mt-4 text-lg text-gray-400 font-body">Asset Upload</p>
        </header>
        
        <Suspense fallback={<div className="relative border-2 border-dashed rounded-lg p-8 text-center"><div className="w-16 h-16 rounded-full bg-surface border border-cyan/30 flex items-center justify-center mx-auto mb-4"><div className="w-8 h-8 border-3 border-cyan border-t-transparent rounded-full animate-spin" /></div><p className="text-gray-400 font-body">Loading upload...</p></div>}>
          <UploadDropzone 
            projectId="00000000-0000-0000-0000-000000000000" 
            onUploadComplete={handleUploadComplete}
          />
        </Suspense>
      </div>
    </main>
  );
}