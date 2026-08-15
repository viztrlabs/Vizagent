'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const PixelStreamingPlayer = dynamic(
  () => import('@/components/pixel-streaming/PixelStreamingPlayer').then((m) => m.PixelStreamingPlayer),
  { ssr: false }
);

export function StreamPageClient() {
  return (
    <div className="viztr-stream-page">
      <Suspense fallback={<div className="viztr-stream-loading">Loading stream...</div>}>
        <PixelStreamingPlayer />
      </Suspense>
      <style jsx>{`
        .viztr-stream-page {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #0D0D0F;
        }
        .viztr-stream-loading {
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0D0D0F;
          color: #A09D97;
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
