import { Suspense } from 'react';
import EnterpriseDashboard from './EnterpriseDashboard';

export default function EnterprisePage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading enterprise...</div>}>
      <EnterpriseDashboard />
    </Suspense>
  );
}