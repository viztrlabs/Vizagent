'use client';

import { useState, useEffect, useCallback } from 'react';

interface BusinessMetrics {
  leads: {
    total: number;
    byStatus: Record<string, number>;
    conversionRate: number;
    avgTimeToConvert: number;
  };
  deals: {
    total: number;
    totalValue: number;
    byStage: Record<string, { count: number; value: number }>;
    avgDealSize: number;
    winRate: number;
    avgTimeToClose: number;
  };
  pipeline: {
    velocity: number;
    coverage: number;
    weightedValue: number;
  };
  activity: {
    tasksCompleted: number;
    tasksOverdue: number;
    contactsEngaged: number;
  };
  trends: {
    leadsOverTime: { date: string; count: number }[];
    dealsOverTime: { date: string; count: number; value: number }[];
    revenueOverTime: { date: string; value: number }[];
  };
}

interface LeadFunnel {
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  unqualified: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
}

interface TopPerformer {
  id: string;
  name: string;
  email: string;
  dealsWon: number;
  totalValue: number;
}

interface ForecastItem {
  month: string;
  expected: number;
  bestCase: number;
  worstCase: number;
}

export default function BusinessAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [funnel, setFunnel] = useState<LeadFunnel | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = `from=${new Date(Date.now() - parseTimeRange(timeRange)).toISOString()}&to=${new Date().toISOString()}`;

      const [metricsRes, funnelRes, performersRes, forecastRes] = await Promise.all([
        fetch(`/api/analytics/business?type=metrics&${params}`),
        fetch(`/api/analytics/business?type=funnel&${params}`),
        fetch(`/api/analytics/business?type=top-performers&limit=5`),
        fetch(`/api/analytics/business?type=forecast&months=6`),
      ]);

      if (metricsRes.ok) { const m = await metricsRes.json(); setMetrics(m.metrics); }
      if (funnelRes.ok) { const f = await funnelRes.json(); setFunnel(f.funnel); }
      if (performersRes.ok) { const p = await performersRes.json(); setTopPerformers(p.performers || []); }
      if (forecastRes.ok) { const fc = await forecastRes.json(); setForecast(fc.forecast || []); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parseTimeRange = (range: string) => {
    switch (range) {
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      case '90d': return 90 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Loading Business Analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        background: '#fee2e2', 
        border: '1px solid #fecaca', 
        borderRadius: '0.5rem',
        margin: '2rem'
      }}>
        <p style={{ color: '#dc2626', margin: '0 0 0.5rem 0' }}>{error}</p>
        <button 
          onClick={fetchData}
          style={{ 
            padding: '0.5rem 1rem', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.375rem', 
            cursor: 'pointer' 
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        No data available. Add some leads and deals to see analytics.
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Business Analytics</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['24h', '7d', '30d', '90d'].map(r => (
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

      {/* KPI Cards Row 1 - Leads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Leads</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{formatNumber(metrics.leads.total)}</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Conversion Rate: <span style={{ fontWeight: 600, color: '#3b82f6' }}>{metrics.leads.conversionRate.toFixed(1)}%</span>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Avg Time to Convert</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics.leads.avgTimeToConvert.toFixed(1)} days</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            From creation to conversion
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tasks Completed</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{formatNumber(metrics.activity.tasksCompleted)}</div>
          <div style={{ fontSize: '0.875rem', color: metrics.activity.tasksOverdue > 0 ? '#ef4444' : '#10b981', marginTop: '0.5rem' }}>
            {metrics.activity.tasksOverdue} overdue
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Contacts Engaged (30d)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{formatNumber(metrics.activity.contactsEngaged)}</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Active in last 30 days
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2 - Deals & Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Deals</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{formatNumber(metrics.deals.total)}</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Total Value: <span style={{ fontWeight: 600 }}>{formatCurrency(metrics.deals.totalValue)}</span>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Avg Deal Size</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{formatCurrency(metrics.deals.avgDealSize)}</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Avg Time to Close: {metrics.deals.avgTimeToClose.toFixed(1)} days
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Win Rate</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: metrics.deals.winRate >= 50 ? '#10b981' : '#ef4444' }}>
            {metrics.deals.winRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Won vs Lost deals
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Weighted Pipeline</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{formatCurrency(metrics.pipeline.weightedValue)}</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Velocity: {formatCurrency(metrics.pipeline.velocity)}/day
          </div>
        </div>
      </div>

      {/* Lead Funnel */}
      {funnel && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Lead Funnel</h2>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem 0' }}>
            {[
              { label: 'New', value: funnel.new, color: '#6366f1' },
              { label: 'Contacted', value: funnel.contacted, color: '#3b82f6' },
              { label: 'Qualified', value: funnel.qualified, color: '#f59e0b' },
              { label: 'Converted', value: funnel.converted, color: '#10b981' },
              { label: 'Unqualified', value: funnel.unqualified, color: '#6b7280' },
            ].map(stage => (
              <div key={stage.label} style={{ flex: '0 0 180px', textAlign: 'center' }}>
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '50%', 
                  background: stage.color,
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{formatNumber(stage.value)}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{stage.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', color: '#6b7280', fontSize: '0.875rem' }}>
            <div>Total Deals: <strong>{funnel.totalDeals}</strong></div>
            <div style={{ color: '#10b981' }}>Won: <strong>{funnel.wonDeals}</strong></div>
            <div style={{ color: '#ef4444' }}>Lost: <strong>{funnel.lostDeals}</strong></div>
          </div>
        </div>
      )}

      {/* Deals by Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Deals by Stage</h2>
          {Object.entries(metrics.deals.byStage).map(([stage, data]) => {
            const stageColors: Record<string, string> = {
              PROSPECT: '#6366f1',
              QUOTE: '#3b82f6',
              NEGOTIATION: '#f59e0b',
              CLOSED_WON: '#10b981',
              CLOSED_LOST: '#ef4444',
            };
            const label = stage.replace('_', ' ');
            return (
              <div key={stage} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{data.count} deals · {formatCurrency(data.value)}</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${metrics.deals.total > 0 ? (data.count / metrics.deals.total) * 100 : 0}%`, 
                    height: '100%', 
                    background: stageColors[stage] || '#3b82f6',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Top Performers</h2>
          {topPerformers.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No team data available</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>Name</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>Deals Won</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 500, fontSize: '0.875rem' }}>{p.name}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>{p.dealsWon}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(p.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Trends Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Leads Over Time</h2>
          <div style={{ height: '200px', position: 'relative' }}>
            {metrics.trends.leadsOverTime.length > 0 ? (
              <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {(() => {
                  const points = metrics.trends.leadsOverTime.map((d, i) => {
                    const x = (i / Math.max(metrics.trends.leadsOverTime.length - 1, 1)) * 400;
                    const maxCount = Math.max(...metrics.trends.leadsOverTime.map(d => d.count), 1);
                    const y = 200 - (d.count / maxCount) * 160 - 20;
                    return `${x},${y}`;
                  }).join(' ');
                  const areaPoints = '0,200 ' + points + ` ${400},200`;
                  return (
                    <>
                      <polygon points={areaPoints} fill="url(#leadsGradient)" />
                      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" />
                    </>
                  );
                })()}
              </svg>
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '80px' }}>No trend data</p>
            )}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Revenue Over Time</h2>
          <div style={{ height: '200px', position: 'relative' }}>
            {metrics.trends.revenueOverTime.length > 0 ? (
              <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {(() => {
                  const points = metrics.trends.revenueOverTime.map((d, i) => {
                    const x = (i / Math.max(metrics.trends.revenueOverTime.length - 1, 1)) * 400;
                    const maxValue = Math.max(...metrics.trends.revenueOverTime.map(d => d.value), 1);
                    const y = 200 - (d.value / maxValue) * 160 - 20;
                    return `${x},${y}`;
                  }).join(' ');
                  const areaPoints = '0,200 ' + points + ` ${400},200`;
                  return (
                    <>
                      <polygon points={areaPoints} fill="url(#revenueGradient)" />
                      <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" />
                    </>
                  );
                })()}
              </svg>
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '80px' }}>No revenue data</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Forecast */}
      {forecast.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Revenue Forecast (Next 6 Months)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Month</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Expected</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Best Case</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Worst Case</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map(f => (
                  <tr key={f.month} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 500, fontSize: '0.875rem' }}>
                      {new Date(f.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>
                      {formatCurrency(f.expected)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#10b981' }}>
                      {formatCurrency(f.bestCase)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#ef4444' }}>
                      {formatCurrency(f.worstCase)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}