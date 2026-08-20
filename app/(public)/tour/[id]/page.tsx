import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { TourConfig } from '@/lib/tour/types';
import { TourPageClient } from './TourPageClient';

interface TourPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Virtual Tour | VizTR',
  description: 'Explore immersive 360° virtual tours',
  openGraph: {
    type: 'website',
    title: 'Virtual Tour | VizTR',
    description: 'Explore immersive 360° virtual tours',
  },
};

export default async function TourPage({ params }: TourPageProps) {
  const { id } = await params;
  const { config, error } = await fetchTourConfig(id);

  if (error) {
    return (
      <div className="viztr-tour-page">
        <div className="viztr-tour-missing">
          <h1>Tour Unavailable</h1>
          <p>The requested virtual tour could not be loaded.</p>
          <a className="viztr-tour-back-link" href="/">← Back home</a>
        </div>
      </div>
    );
  }

  return <TourPageClient config={config} />;
}

async function fetchTourConfig(
  tourId: string
): Promise<{ config: TourConfig | null; error: string | null }> {
  try {
    const headerStore = await headers();
    const proto = headerStore.get('x-forwarded-proto') ?? 'http';
    const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000';
    const response = await fetch(`${proto}://${host}/api/public/tour/${tourId}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return { config: null, error: `HTTP ${response.status}` };
    }
    const body: { success: boolean; data?: TourConfig } = await response.json();
    return {
      config: body.success && body.data ? body.data : null,
      error: body.success ? null : 'API returned success=false',
    };
  } catch (err) {
    console.error('Failed to fetch tour config:', err);
    return {
      config: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
