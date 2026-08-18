import { Suspense } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading analytics...</div>}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
