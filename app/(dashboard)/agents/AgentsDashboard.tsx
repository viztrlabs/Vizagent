'use client';

import { useState, useEffect, useCallback } from 'react';

interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
  allowedTools: string[];
}

interface AgentStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  agentStats: Record<string, { total: number; completed: number; failed: number; active: number }>;
}

interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  state: string;
  priority: string;
  createdAt: string;
  error?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  orchestrator: '#8b5cf6',
  'xr-conversion': '#3b82f6',
  service: '#10b981',
};

const STATE_COLORS: Record<string, string> = {
  idle: '#6b7280',
  planning: '#f59e0b',
  executing: '#3b82f6',
  waiting_approval: '#f97316',
  completed: '#10b981',
  failed: '#ef4444',
  stopped: '#6b7280',
};

export default function AgentsDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [request, setRequest] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchData = useCallback(async () => {
    const [agentsRes, statsRes, tasksRes] = await Promise.all([
      fetch('/api/agents'),
      fetch('/api/agents?stats=true'),
      fetch('/api/agents/tasks'),
    ]);
    if (agentsRes.ok) { const d = await agentsRes.json(); setAgents(d.agents || []); }
    if (statsRes.ok) { const d = await statsRes.json(); setStats(d.stats); }
    if (tasksRes.ok) { const d = await tasksRes.json(); setTasks(d.tasks || []); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, reloadKey]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;
    setDispatching(true);
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request }),
      });
      setRequest('');
      setReloadKey(k => k + 1);
    } finally {
      setDispatching(false);
    }
  };

  const handleStop = async (taskId: string) => {
    await fetch('/api/agents/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    setReloadKey(k => k + 1);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>AI Agent System</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Tasks', value: stats?.totalTasks || 0, color: '#3b82f6' },
          { label: 'Active', value: stats?.activeTasks || 0, color: '#f59e0b' },
          { label: 'Completed', value: stats?.completedTasks || 0, color: '#10b981' },
          { label: 'Failed', value: stats?.failedTasks || 0, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem', borderLeft: `4px solid ${s.color}` }}>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Request dispatch */}
      <form onSubmit={handleDispatch} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>Dispatch Request</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            value={request}
            onChange={e => setRequest(e.target.value)}
            placeholder="e.g. Create a WebXR experience for project abc123"
            style={{ flex: 1, padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
          />
          <button
            type="submit"
            disabled={dispatching}
            style={{ padding: '0.625rem 1.5rem', background: dispatching ? '#93c5fd' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: dispatching ? 'wait' : 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
          >
            {dispatching ? 'Routing...' : 'Send to CEO Agent'}
          </button>
        </div>
      </form>

      {/* Agent grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Registered Agents ({agents.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {agents.map(agent => {
            const agentStats = stats?.agentStats[agent.id];
            return (
              <div key={agent.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{agent.name}</span>
                  <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', background: CATEGORY_COLORS[agent.category] || '#e5e7eb', color: 'white' }}>
                    {agent.category}
                  </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>{agent.description}</p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                  <span>{agentStats?.total || 0} tasks</span>
                  <span>{agentStats?.active || 0} active</span>
                  <span style={{ color: '#10b981' }}>{agentStats?.completed || 0} done</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent tasks */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Tasks</h2>
        {tasks.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No tasks dispatched yet. Use the request form above to dispatch work to agents.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {tasks.slice(0, 20).map(task => (
              <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid #f3f4f6', borderRadius: '0.375rem' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{task.agentId}</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{task.type}</span>
                  {task.error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>— {task.error}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', background: STATE_COLORS[task.state] || '#e5e7eb', color: 'white' }}>
                    {task.state}
                  </span>
                  <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', background: '#f3f4f6', color: '#374151' }}>
                    {task.priority}
                  </span>
                  {['executing', 'planning'].includes(task.state) && (
                    <button onClick={() => handleStop(task.id)} style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem', border: '1px solid #ef4444', borderRadius: '0.25rem', background: 'white', color: '#ef4444', cursor: 'pointer' }}>
                      Stop
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
