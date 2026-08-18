'use client';

import { useState, useEffect, useCallback } from 'react';

interface Prompt {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
}

interface UsageStats {
  totalCalls: number;
  successRate: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

export default function AiAccessDashboard() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ slug: '', name: '', description: '', template: '', category: '' });
  const [reloadKey, setReloadKey] = useState(0);

  const fetchData = useCallback(async () => {
    const [promptsRes, statsRes] = await Promise.all([
      fetch('/api/ai-access/prompts'),
      fetch('/api/ai-access/prompts?stats=true'),
    ]);
    if (promptsRes.ok) { const d = await promptsRes.json(); setPrompts(d.prompts || []); }
    if (statsRes.ok) { const s = await statsRes.json(); setStats(s.stats); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, reloadKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/ai-access/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setFormData({ slug: '', name: '', description: '', template: '', category: '' });
      setShowForm(false);
      setReloadKey(k => k + 1);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>AI Access Layer</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ New Prompt'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Calls</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats?.totalCalls?.toLocaleString() || '0'}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Success Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats?.successRate?.toFixed(1) || '0'}%</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Input Tokens</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats?.totalInputTokens?.toLocaleString() || '0'}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Output Tokens</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats?.totalOutputTokens?.toLocaleString() || '0'}</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input placeholder="Slug (e.g. hero-copy)" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
            <input placeholder="Display name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
            <input placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
            <input placeholder="Category (e.g. xr, content)" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
          </div>
          <textarea placeholder="Prompt template..." value={formData.template} onChange={e => setFormData({ ...formData, template: e.target.value })} required rows={4} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }} />
          <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Create Prompt</button>
        </form>
      )}

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Registered Prompts</h2>
        {prompts.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No prompts registered yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {prompts.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid #f3f4f6', borderRadius: '0.375rem' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginLeft: '0.75rem' }}>{p.slug}</span>
                  {p.category && <span style={{ display: 'inline-block', marginLeft: '0.5rem', padding: '0.125rem 0.5rem', background: '#eff6ff', color: '#3b82f6', borderRadius: '1rem', fontSize: '0.625rem' }}>{p.category}</span>}
                </div>
                <span style={{ fontSize: '0.75rem', color: p.isActive ? '#10b981' : '#ef4444' }}>{p.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
