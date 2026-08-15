import { Metadata } from "next";
import { lazy, Suspense } from "react";
import type { TourData } from "@/components/viewer/VirtualTourViewer";

const VirtualTourViewer = lazy(() => import("@/components/viewer/VirtualTourViewer").then(m => ({ default: m.VirtualTourViewer })));

interface TourPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Virtual Tour | VizTR",
  description: "Explore immersive 360° virtual tours",
  openGraph: {
    type: "website",
    title: "Virtual Tour | VizTR",
    description: "Explore immersive 360° virtual tours",
  },
};

export default async function TourPage({ params }: TourPageProps) {
  const { id } = await params;

  const tourData = await fetchTourData(id);

  if (!tourData) {
    return (
      <div className="viztr-tour-page">
        <div className="viztr-tour-error">
          <h1>Tour Not Found</h1>
          <p>The requested virtual tour could not be found.</p>
          <a href="/xr/virtual-tour" className="viztr-tour-back-link">
            ← Back to Virtual Tour
          </a>
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
          .viztr-tour-error {
            text-align: center;
            color: #fff;
            max-width: 400px;
          }
          .viztr-tour-error h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 12px;
            font-family: Inter, system-ui, sans-serif;
          }
          .viztr-tour-error p {
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
        <Suspense fallback={<div className="viztr-tour-viewer" style={{ position: "relative", width: "100%", height: "100%" }}><canvas className="viztr-tour-canvas" touch-action="none" /><div className="viztr-tour-overlay"><div className="viztr-spinner" aria-label="Loading tour" /></div></Suspense>}
          <VirtualTourViewer tourData={tourData} />
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
        @media (min-width: 1024px) {
          .viztr-tour-container {
            max-width: 896px; /* max-w-4xl */
            margin: 0 auto;
            height: 100vh;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </div>
  );
}

async function fetchTourData(tourId: string): Promise<TourData | null> {
  try {
    const response = await fetch(`/api/tours/${tourId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}