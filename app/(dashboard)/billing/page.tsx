import { Suspense } from 'react';
import BillingDashboard from './BillingDashboard';

export default function BillingPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading billing...</div>}>
      <BillingDashboard />
    </Suspense>
  );
}