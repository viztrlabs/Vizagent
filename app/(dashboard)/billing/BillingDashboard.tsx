'use client';

import { useState, useEffect, useCallback } from 'react';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  stripePriceId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface Usage {
  current: { processingMinutes: number; storageGb: number; gpuHours: number };
  limits: { processingMinutes: number; storageGb: number; gpuHours: number };
  percentage: { processingMinutes: number; storageGb: number; gpuHours: number };
  tier: string;
  overLimit: boolean;
}

interface Invoice {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created: number;
  periodStart: number;
  periodEnd: number;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

interface TierConfig {
  tier: string;
  name: string;
  monthlyPrice: number;
  annuallyPrice: number;
  features: string[];
  limits: Record<string, number>;
}

export default function BillingDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [interval, setInterval] = useState<'monthly' | 'annually'>('monthly');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, usageRes, invRes, tiersRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/usage'),
        fetch('/api/billing/invoices?limit=10'),
        fetch('/api/billing/tiers'),
      ]);
      if (subRes.ok) { const d = await subRes.json(); setSubscription(d.subscription); }
      if (usageRes.ok) { const d = await usageRes.json(); setUsage(d.usage); }
      if (invRes.ok) { const d = await invRes.json(); setInvoices(d.invoices || []); }
      if (tiersRes.ok) { const d = await tiersRes.json(); setTiers(d.tiers || []); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpgrade = async (tier: string) => {
    setUpgrading(tier);
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade', tier, interval }),
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      } else {
        alert('Upgrade failed: ' + result.error);
      }
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel subscription? Access continues until period ends.')) return;
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', atPeriodEnd: true }),
      });
      const result = await res.json();
      if (result.success) fetchData();
      else alert('Cancellation failed: ' + result.error);
    } catch {}
  };

  const formatPrice = (cents: number) => cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Billing & Subscription</h1>

      {/* Current Plan */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {tiers.find(t => t.tier === subscription?.tier)?.name || subscription?.tier || 'Free'} Plan
            </h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Status: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{subscription?.status || 'inactive'}</span>
            </p>
            {subscription?.currentPeriodEnd && (
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={handleCancel} disabled={!subscription || subscription.status === 'canceled'}
              style={{ padding: '0.5rem 1rem', border: '1px solid #ef4444', color: '#ef4444', background: 'white', borderRadius: '0.5rem', cursor: 'pointer' }}>
              Cancel Plan
            </button>
          </div>
        </div>
      </div>

      {/* Usage Metering */}
      {usage && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Usage This Period</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { key: 'processingMinutes' as const, label: 'Processing Minutes', unit: 'min' },
              { key: 'storageGb' as const, label: 'Storage', unit: 'GB' },
              { key: 'gpuHours' as const, label: 'GPU Hours', unit: 'hrs' },
            ].map(m => (
              <div key={m.key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: usage.overLimit && usage.percentage[m.key] > 100 ? '#ef4444' : '#111827' }}>
                  {usage.current[m.key]}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{m.label}</div>
                <div style={{ marginTop: '0.5rem', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, usage.percentage[m.key])}%`,
                    height: '100%',
                    background: usage.percentage[m.key] > 100 ? '#ef4444' : '#3b82f6',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {usage.limits[m.key] > 0 ? `${usage.limits[m.key]} ${m.unit}` : 'Unlimited'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Upgrade Plan</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: interval === 'monthly' ? 600 : 400 }}>Monthly</span>
            <label style={{ width: '50px', height: '26px', position: 'relative' }}>
              <input type="checkbox" checked={interval === 'annually'} onChange={e => setInterval(e.target.checked ? 'annually' : 'monthly')}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 1 }} />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: interval === 'annually' ? '#3b82f6' : '#e5e7eb',
                borderRadius: '13px', transition: 'background 0.2s'
              }}>
                <div style={{
                  position: 'absolute', top: '2px', left: interval === 'annually' ? '26px' : '2px',
                  width: '22px', height: '22px', background: 'white', borderRadius: '50%',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }} />
              </div>
            </label>
            <span style={{ fontWeight: interval === 'annually' ? 600 : 400 }}>Annually <span style={{ background: '#10b981', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '0.5rem', fontSize: '0.625rem', marginLeft: '0.375rem' }}>Save 20%</span></span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {tiers
            .filter(t => t.tier !== subscription?.tier)
            .map(tier => {
              const price = interval === 'annually' ? tier.annuallyPrice : tier.monthlyPrice;
              const isUpgrade = ['free', 'pro', 'studio', 'enterprise'].indexOf(tier.tier) > ['free', 'pro', 'studio', 'enterprise'].indexOf(subscription?.tier || 'free');

              return (
                <div key={tier.tier} style={{ border: isUpgrade ? '2px solid #10b981' : '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: 600 }}>{tier.name}</h3>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatPrice(price)}</span>
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{interval === 'annually' ? 'Billed annually' : 'Per month'}</span>
                  {isUpgrade && (
                    <button onClick={() => handleUpgrade(tier.tier)} disabled={upgrading === tier.tier}
                      style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                      {upgrading === tier.tier ? 'Upgrading...' : `Upgrade to ${tier.name}`}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Invoice History */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Invoice History</h2>
        {invoices.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No invoices yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem' }}>{new Date(inv.created * 1000).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem' }}>{(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '1rem',
                      background: inv.status === 'paid' ? '#d1fae5' : inv.status === 'open' ? '#fef3c7' : '#fee2e2',
                      color: inv.status === 'paid' ? '#065f46' : inv.status === 'open' ? '#92400e' : '#991b1b' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {inv.hostedInvoiceUrl && (
                      <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: '#3b82f6' }}>View</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}