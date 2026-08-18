import { Suspense } from 'react';
import CrmDashboard from './CrmDashboard';

export default function CrmPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading CRM...</div>}>
      <CrmDashboard />
    </Suspense>
  );
}
