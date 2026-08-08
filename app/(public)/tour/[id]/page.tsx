import type { Metadata } from 'next';
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
  const tourConfig = await fetchTourConfig(id);

  return <TourPageClient config={tourConfig} />;
}

async function fetchTourConfig(tourId: string): Promise<TourConfig | null> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  try {
    const response = await fetch(`${base}/api/tours/${tourId}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.success && body.data ? (body.data as TourConfig) : null;
  } catch (err) {
    console.error('Failed to fetch tour config:', err);
    return null;
  }
}
