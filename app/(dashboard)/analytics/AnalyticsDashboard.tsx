'use client';

import { useState, useEffect, useCallback } from 'react';

interface ViewStats {
  totalViews: number;
  uniqueVisitors: number;
  avgDurationMs: number;
}

interface TopPath {
  path: string;
  views: number;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<ViewStats | null>(null);
  const [topPaths, setTopPaths] = useState<TopPath[]>([]);
  const [timeRange, setTimeRange] = useState('7d');

  const fetchData = useCallback(async () => {
    const now = new Date();
    const from = new Date();
    if (timeRange === '24h') from.setHours(from.getHours() - 24);
    else if (timeRange === '7d') from.setDate(from.getDate() - 7);
    else if (timeRange === '30d') from.setDate(from.getDate() - 30);

    const params = `from=${from.toISOString()}&to=${now.toISOString()}`;
    const [statsRes, pathsRes] = await Promise.all([
      fetch(`/api/analytics/views?stats=true&${params}`),
      fetch(`/api/analytics/views?topPaths=true&limit=10`),
    ]);
    if (statsRes.ok) { const s = await statsRes.json(); setStats(s.stats); }
    if (pathsRes.ok) { const p = await pathsRes.json(); setTopPaths(p.topPaths || []); }
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Analytics</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['24h', '7d', '30d'].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              style={{
                padding: '0.375rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: timeRange === r ? '#3b82f6' : 'white',
                color: timeRange === r ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Views</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats?.totalViews?.toLocaleString() || '0'}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Unique Visitors</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats?.uniqueVisitors?.toLocaleString() || '0'}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Avg. Duration</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {stats?.avgDurationMs ? `${Math.round(stats.avgDurationMs / 1000)}s` : '—'}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Top Pages</h2>
        {topPaths.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No page view data yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Page</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Views</th>
              </tr>
            </thead>
            <tbody>
              {topPaths.map(p => (
                <tr key={p.path} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>{p.path}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{p.views.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
