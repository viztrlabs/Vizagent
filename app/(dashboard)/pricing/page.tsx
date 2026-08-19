import { Suspense } from 'react';
import PricingPage from './PricingClient';

export default function PricingPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading pricing...</div>}>
      <PricingPage />
    </Suspense>
  );
}