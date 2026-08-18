import { Suspense } from 'react';
import DealsPipeline from './DealsPipeline';

export default function DealsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading deals...</div>}>
      <DealsPipeline />
    </Suspense>
  );
}
