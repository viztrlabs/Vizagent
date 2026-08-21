import { Suspense } from 'react';
import BusinessAnalyticsDashboard from './BusinessAnalyticsDashboard';

export default function BusinessAnalyticsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading business analytics...</div>}>
      <BusinessAnalyticsDashboard />
    </Suspense>
  );
}