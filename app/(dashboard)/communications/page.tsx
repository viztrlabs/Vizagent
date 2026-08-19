import { Suspense } from 'react';
import CommunicationsDashboard from './CommunicationsDashboard';

export default function CommunicationsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading communications...</div>}>
      <CommunicationsDashboard />
    </Suspense>
  );
}