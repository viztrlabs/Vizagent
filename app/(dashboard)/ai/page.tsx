import { Suspense } from 'react';
import AiAccessDashboard from './AiAccessDashboard';

export default function AiPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading AI access...</div>}>
      <AiAccessDashboard />
    </Suspense>
  );
}
