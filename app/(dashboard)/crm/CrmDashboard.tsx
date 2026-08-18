'use client';

import { useState, useEffect, useCallback } from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  source: string | null;
  createdAt: string;
  contacts: unknown[];
  deals: unknown[];
}

export default function CrmDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '', source: '' });
  const [reloadKey, setReloadKey] = useState(0);

  const fetchLeads = useCallback(async () => {
    const params = filter ? `?status=${filter}` : '';
    const res = await fetch(`/api/crm/leads${params}`);
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads || []);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, reloadKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setFormData({ name: '', email: '', company: '', phone: '', source: '' });
      setShowForm(false);
      setReloadKey(k => k + 1);
    }
  };

  const statusColors: Record<string, string> = {
    NEW: '#10b981',
    CONTACTED: '#3b82f6',
    QUALIFIED: '#f59e0b',
    UNQUALIFIED: '#6b7280',
    CONVERTED: '#8b5cf6',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>CRM Pipeline</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          {showForm ? 'Cancel' : '+ Add Lead'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
            <input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
            <input placeholder="Company" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
            <input placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
            <input placeholder="Source (e.g. website, referral)" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
          </div>
          <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Create Lead</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['', 'NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '0.375rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '1rem',
              background: filter === s ? '#3b82f6' : 'white',
              color: filter === s ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {leads.map(lead => (
          <div key={lead.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>{lead.name || lead.email}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{lead.email}{lead.company ? ` · ${lead.company}` : ''}</div>
              {lead.source && <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Source: {lead.source}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', background: statusColors[lead.status] || '#e5e7eb', color: 'white' }}>
                {lead.status}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                {lead.contacts?.length || 0} contacts · {lead.deals?.length || 0} deals
              </span>
            </div>
          </div>
        ))}
        {leads.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No leads found. Add your first lead!</p>}
      </div>
    </div>
  );
}
