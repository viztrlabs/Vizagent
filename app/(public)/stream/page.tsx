import type { Metadata } from 'next';
import { StreamPageClient } from './StreamPageClient';

export const metadata: Metadata = {
  title: 'Live Stream | VizTR',
  description: 'Watch the live 3D stream',
};

export default function StreamPage() {
  return <StreamPageClient />;
}
