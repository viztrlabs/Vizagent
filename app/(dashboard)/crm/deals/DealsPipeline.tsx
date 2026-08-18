'use client';

import { useState, useEffect, useCallback } from 'react';

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number | null;
  currency: string;
  closeDate: string | null;
  lead: { name: string; email: string };
}

interface PipelineStage {
  stage: string;
  count: number;
  totalValue: number;
}

const STAGES = ['PROSPECT', 'QUOTE', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
const STAGE_COLORS: Record<string, string> = {
  PROSPECT: '#6366f1',
  QUOTE: '#3b82f6',
  NEGOTIATION: '#f59e0b',
  CLOSED_WON: '#10b981',
  CLOSED_LOST: '#ef4444',
};

export default function DealsPipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', leadId: '', value: '' });
  const [reloadKey, setReloadKey] = useState(0);

  const fetchData = useCallback(async () => {
    const [dealsRes, pipelineRes] = await Promise.all([
      fetch('/api/crm/deals'),
      fetch('/api/crm/deals?pipeline=true'),
    ]);
    if (dealsRes.ok) { const d = await dealsRes.json(); setDeals(d.deals || []); }
    if (pipelineRes.ok) { const p = await pipelineRes.json(); setPipeline(p.pipeline || []); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, reloadKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, value: formData.value ? parseFloat(formData.value) : undefined }),
    });
    if (res.ok) {
      setFormData({ title: '', leadId: '', value: '' });
      setShowForm(false);
      setReloadKey(k => k + 1);
    }
  };

  const moveStage = async (dealId: string, newStage: string) => {
    await fetch(`/api/crm/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    setReloadKey(k => k + 1);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Deal Pipeline</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ New Deal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <input placeholder="Deal title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={{ flex: 2, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
          <input placeholder="Lead ID" value={formData.leadId} onChange={e => setFormData({ ...formData, leadId: e.target.value })} required style={{ flex: 2, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
          <input placeholder="Value ($)" type="number" step="0.01" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
          <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Create</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {STAGES.map(stage => {
          const info = pipeline.find(p => p.stage === stage);
          return (
            <div key={stage} style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem', borderTop: `3px solid ${STAGE_COLORS[stage]}` }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>{stage.replace('_', ' ')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{info?.count || 0}</div>
              <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>${(info?.totalValue || 0).toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', alignItems: 'start' }}>
        {STAGES.map(stage => (
          <div key={stage}>
            {deals.filter(d => d.stage === stage).map(deal => (
              <div key={deal.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{deal.title}</div>
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{deal.lead?.name || 'Unknown'}</div>
                {deal.value != null && <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.25rem' }}>${deal.value.toLocaleString()}</div>}
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {STAGES.filter(s => s !== stage).slice(0, 2).map(s => (
                    <button key={s} onClick={() => moveStage(deal.id, s)} style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', background: 'white', cursor: 'pointer' }}>
                      → {s.split('_')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
