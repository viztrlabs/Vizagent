import { Suspense } from 'react';
import AgentsDashboard from './AgentsDashboard';

export default function AgentsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading agents...</div>}>
      <AgentsDashboard />
    </Suspense>
  );
}
