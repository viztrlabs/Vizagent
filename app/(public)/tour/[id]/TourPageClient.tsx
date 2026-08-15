'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import type { TourConfig } from '@/lib/tour/types';

const MarzipanoTourViewer = dynamic(
  () => import('@/components/marzipano/MarzipanoTourViewer').then((m) => m.MarzipanoTourViewer),
  { ssr: false }
);

interface TourPageClientProps {
  config: TourConfig | null;
}

export function TourPageClient({ config }: TourPageClientProps) {
  if (!config) {
    return (
      <div className="viztr-tour-page">
        <div className="viztr-tour-missing">
          <h1>Tour Not Found</h1>
          <p>The requested virtual tour could not be found.</p>
          <Link href="/" className="viztr-tour-back-link">
            ← Back home
          </Link>
        </div>
        <style jsx>{`
          .viztr-tour-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #080a0f;
            padding: 24px;
          }
          .viztr-tour-missing {
            text-align: center;
            color: #fff;
            max-width: 400px;
          }
          .viztr-tour-missing h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 12px;
            font-family: Inter, system-ui, sans-serif;
          }
          .viztr-tour-missing p {
            color: #94a3b8;
            margin-bottom: 24px;
            font-family: Inter, system-ui, sans-serif;
          }
          .viztr-tour-back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #0d9488;
            text-decoration: none;
            font-weight: 500;
            font-family: Inter, system-ui, sans-serif;
            transition: color 0.2s;
          }
          .viztr-tour-back-link:hover {
            color: #06b6d4;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="viztr-tour-page">
      <div className="viztr-tour-container">
        <Suspense
          fallback={
            <div className="viztr-tour-fallback">
              <div className="viztr-spinner" role="status" aria-label="Loading tour" />
            </div>
          }
        >
          <MarzipanoTourViewer config={config} />
        </Suspense>
      </div>
      <style jsx>{`
        .viztr-tour-page {
          min-height: 100vh;
          background: #080a0f;
          padding: 0;
        }
        .viztr-tour-container {
          width: 100%;
          height: 100vh;
          max-width: 100%;
        }
        .viztr-tour-fallback {
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080a0f;
        }
        .viztr-spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(13, 148, 136, 0.25);
          border-top-color: #0d9488;
          animation: viztr-spin 0.8s linear infinite;
        }
        @keyframes viztr-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (min-width: 1024px) {
          .viztr-tour-container {
            max-width: 896px;
            margin: 0 auto;
            height: 100vh;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .viztr-spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
