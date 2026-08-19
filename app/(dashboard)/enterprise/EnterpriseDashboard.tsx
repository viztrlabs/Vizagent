'use client';

import { useState, useEffect, useCallback } from 'react';

interface BrandingConfig {
  id: string;
  tenantId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
  customCss: string | null;
  whiteLabel: boolean;
}

interface CustomDomain {
  id: string;
  tenantId: string;
  domain: string;
  verified: boolean;
  sslEnabled: boolean;
}

interface SsoConfig {
  id: string;
  tenantId: string;
  provider: string;
  entityId: string | null;
  ssoUrl: string | null;
  certificate: string | null;
  attributeMapping: Record<string, unknown>;
  autoProvision: boolean;
  enabled: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

interface MarketplaceItem {
  id: string;
  title: string;
  type: string;
  description: string;
  thumbnailUrl: string | null;
  previewUrls: string[];
  fileUrl: string | null;
  fileSize: number | null;
  version: string;
  tags: string[];
  category: string;
  price: number;
  currency: string;
  commissionRate: number;
  status: string;
  reviewNotes: string | null;
  publishedAt: string | null;
  salesCount: number;
  revenue: number;
}

interface EnterpriseServer {
  id: string;
  name: string;
  region: string;
  instanceType: string;
  gpuEnabled: boolean;
  gpuType: string | null;
  status: string;
  slaTier: string;
  ipAddress: string | null;
  sshKey: string | null;
}

const ITEM_TYPES = ['TEMPLATE', 'MATERIAL_PACK', 'LIGHTING_PRESET', 'FURNITURE_PACK', 'CAMERA_PRESET', 'SCRIPT'];
const ITEM_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'UNLISTED'];

export default function EnterpriseDashboard() {
  const [tab, setTab] = useState<'branding' | 'domains' | 'sso' | 'api' | 'marketplace' | 'servers'>('branding');
  
  // Branding
  const [branding, setBranding] = useState<any>(null);
  const [brandingForm, setBrandingForm] = useState({
    logoUrl: '', faviconUrl: '', primaryColor: '#3b82f6', secondaryColor: '#8b5cf6',
    fontFamily: 'Inter', customCss: '', whiteLabel: false
  });

  // Domains
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState('');

  // SSO
  const [ssoConfig, setSsoConfig] = useState<any>(null);
  const [ssoForm, setSsoForm] = useState({
    provider: 'saml', entityId: '', ssoUrl: '', certificate: '', autoProvision: true, enabled: false
  });

  // API Keys
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyRaw, setNewApiKeyRaw] = useState('');

  // Webhooks
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['PROJECT_CREATED', 'PROJECT_PUBLISHED']);

  // Marketplace
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState<{type: string, title: string, description: string, category: string, price: number, tags: string[]}>({
    type: 'TEMPLATE', title: '', description: '', category: '', price: 0, tags: []
  });

  // Servers
  const [server, setServer] = useState<any>(null);
  const [serverForm, setServerForm] = useState({
    name: '', region: 'us-east-1', instanceType: 'standard', gpuEnabled: false, gpuType: '', slaTier: 'standard'
  });

  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [brandingRes, domainsRes, ssoRes, keysRes, webhooksRes, itemsRes, serverRes] = await Promise.all([
        fetch('/api/enterprise/branding'),
        fetch('/api/enterprise/domains'),
        fetch('/api/enterprise/sso'),
        fetch('/api/enterprise/api-keys'),
        fetch('/api/enterprise/webhooks'),
        fetch('/api/enterprise/marketplace/items'),
        fetch('/api/enterprise/servers'),
      ]);
      if (brandingRes.ok) { const d = await brandingRes.json(); setBranding(d.config); }
      if (domainsRes.ok) { const d = await domainsRes.json(); setDomains(d.domains || []); }
      if (ssoRes.ok) { const d = await ssoRes.json(); setSsoConfig(d.config); }
      if (keysRes.ok) { const d = await keysRes.json(); setApiKeys(d.keys || []); }
      if (webhooksRes.ok) { const d = await webhooksRes.json(); setWebhooks(d.webhooks || []); }
      if (itemsRes.ok) { const d = await itemsRes.json(); setMarketplaceItems(d.items || []); }
      if (serverRes.ok) { const d = await serverRes.json(); setServer(d.server); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Handlers ---
  const handleBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enterprise/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brandingForm),
    });
    if (res.ok) { const d = await res.json(); setBranding(d.config); }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enterprise/domains', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: newDomain }),
    });
    if (res.ok) { setNewDomain(''); fetchAll(); }
  };

  const handleDeleteDomain = async (id: string) => {
    await fetch(`/api/enterprise/domains/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const handleVerifyDomain = async (id: string) => {
    await fetch(`/api/enterprise/domains/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify' }) });
    fetchAll();
  };

  const handleSsoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enterprise/sso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ssoForm) });
    if (res.ok) { const d = await res.json(); setSsoConfig(d.config); }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enterprise/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newApiKeyName, scopes: ['read', 'write'] }) });
    if (res.ok) { const d = await res.json(); setApiKeys([d.apiKey, ...apiKeys]); setNewApiKeyRaw(d.rawKey); setNewApiKeyName(''); }
  };

  const handleRevokeApiKey = async (id: string) => {
    await fetch(`/api/enterprise/api-keys/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enterprise/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: newWebhookUrl, events: newWebhookEvents }) });
    if (res.ok) { const d = await res.json(); setWebhooks([d.webhook, ...webhooks]); setNewWebhookUrl(''); }
  };

  const handleDeleteWebhook = async (id: string) => {
    await fetch(`/api/enterprise/webhooks/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enterprise/marketplace/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
    if (res.ok) { setNewItem({ type: 'TEMPLATE', title: '', description: '', category: '', price: 0, tags: [] }); fetchAll(); }
  };

  const handlePublishItem = async (id: string) => {
    await fetch(`/api/enterprise/marketplace/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish' }) });
    fetchAll();
  };

  const handleDeleteItem = async (id: string) => {
    await fetch(`/api/enterprise/marketplace/items/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enterprise/servers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(serverForm) });
    if (res.ok) { const d = await res.json(); setServer(d.server); }
  };

  const handleUpdateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enterprise/servers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(serverForm) });
    if (res.ok) { const d = await res.json(); setServer(d.server); }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Enterprise Center</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'branding', label: 'Branding' },
          { id: 'domains', label: 'Custom Domains' },
          { id: 'sso', label: 'SSO/SAML' },
          { id: 'api', label: 'API Access' },
          { id: 'marketplace', label: 'Marketplace' },
          { id: 'servers', label: 'Dedicated Servers' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '0.5rem 1rem', border: 'none', background: tab === t.id ? '#3b82f6' : 'transparent',
            color: tab === t.id ? 'white' : '#374151', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Branding Tab */}
      {tab === 'branding' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>White-Label Branding</h2>
            <form onSubmit={handleBrandingSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input placeholder="Logo URL" value={brandingForm.logoUrl} onChange={e => setBrandingForm({...brandingForm, logoUrl: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
                <input placeholder="Favicon URL" value={brandingForm.faviconUrl} onChange={e => setBrandingForm({...brandingForm, faviconUrl: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
                <input type="color" value={brandingForm.primaryColor} onChange={e => setBrandingForm({...brandingForm, primaryColor: e.target.value})} style={{ height: '40px' }} />
                <input type="color" value={brandingForm.secondaryColor} onChange={e => setBrandingForm({...brandingForm, secondaryColor: e.target.value})} style={{ height: '40px' }} />
                <input placeholder="Font Family" value={brandingForm.fontFamily} onChange={e => setBrandingForm({...brandingForm, fontFamily: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
              </div>
              <textarea placeholder="Custom CSS" value={brandingForm.customCss} onChange={e => setBrandingForm({...brandingForm, customCss: e.target.value})} rows={4} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontFamily: 'monospace', fontSize: '0.875rem' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={brandingForm.whiteLabel} onChange={e => setBrandingForm({...brandingForm, whiteLabel: e.target.checked})} />
                Enable White-Label (removes VizTR branding)
              </label>
              <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Save Branding</button>
            </form>
          </div>

          {/* Live Preview */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Live Preview</h3>
            <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', fontFamily: brandingForm.fontFamily || 'Inter' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                {brandingForm.logoUrl && <img src={brandingForm.logoUrl} alt="Logo" style={{ maxHeight: '40px' }} />}
                <span style={{ color: brandingForm.primaryColor, fontWeight: 700, fontSize: '1.5rem' }}>VizTR Enterprise</span>
              </div>
              <button style={{ background: brandingForm.primaryColor, color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem' }}>Primary Button</button>
              <button style={{ background: 'transparent', border: `1px solid ${brandingForm.secondaryColor}`, color: brandingForm.secondaryColor, padding: '0.5rem 1rem', borderRadius: '0.375rem', marginLeft: '0.5rem' }}>Secondary Button</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Domains Tab */}
      {tab === 'domains' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 600 }}>Custom Domains</h2>
              <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: '0.5rem' }}>
                <input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="example.com" required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', flex: 1 }} />
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Add Domain</button>
              </form>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {domains.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No custom domains yet</p>
              ) : (
                domains.map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.domain}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {d.verified ? '✅ Verified' : '⏳ Pending'} • {d.sslEnabled ? '🔒 SSL Enabled' : '🔓 No SSL'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!d.verified && <button onClick={() => handleVerifyDomain(d.id)} style={{ padding: '0.25rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}>Verify</button>}
                      {!d.sslEnabled && <button onClick={() => { /* enable SSL */ }} style={{ padding: '0.25rem 0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}>Enable SSL</button>}
                      <button onClick={() => handleDeleteDomain(d.id)} style={{ padding: '0.25rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SSO/SAML Tab */}
      {tab === 'sso' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem', maxWidth: '800px' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>SSO / SAML Configuration</h2>
          <form onSubmit={handleSsoSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <select value={ssoForm.provider} onChange={e => setSsoForm({...ssoForm, provider: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                <option value="saml">SAML 2.0</option>
                <option value="oidc">OpenID Connect</option>
              </select>
              <input placeholder="Entity ID" value={ssoForm.entityId} onChange={e => setSsoForm({...ssoForm, entityId: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
            </div>
            <input placeholder="SSO URL (ACS)" value={ssoForm.ssoUrl} onChange={e => setSsoForm({...ssoForm, ssoUrl: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
            <textarea placeholder="Certificate (X.509)" value={ssoForm.certificate} onChange={e => setSsoForm({...ssoForm, certificate: e.target.value})} rows={4} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontFamily: 'monospace', fontSize: '0.875rem' }} />
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={ssoForm.autoProvision} onChange={e => setSsoForm({...ssoForm, autoProvision: e.target.checked})} /> Auto-provision users
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={ssoForm.enabled} onChange={e => setSsoForm({...ssoForm, enabled: e.target.checked})} /> Enable SSO
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Save SSO Config</button>
              <a href="/api/enterprise/sso?metadata=true" target="_blank" style={{ padding: '0.5rem 1.5rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', textDecoration: 'none' }}>Download SAML Metadata</a>
            </div>
          </form>
        </div>
      )}

      {/* API Keys Tab */}
      {tab === 'api' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 600 }}>API Keys</h2>
              <form onSubmit={handleCreateApiKey} style={{ display: 'flex', gap: '0.5rem' }}>
                <input value={newApiKeyName} onChange={e => setNewApiKeyName(e.target.value)} placeholder="Key name (e.g. Production Server)" required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', flex: 1 }} />
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Create Key</button>
              </form>
            </div>
            {newApiKeyRaw && (
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Your new API Key (save it now - you won't see it again!)</div>
                <code style={{ background: '#fffbeb', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', wordBreak: 'break-all' }}>{newApiKeyRaw}</code>
                <button onClick={() => setNewApiKeyRaw('')} style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer' }}>I've saved it</button>
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Prefix</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Scopes</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Created</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map(k => (
                  <tr key={k.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{k.name}</td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>{k.keyPrefix}****</td>
                    <td style={{ padding: '0.75rem' }}>{k.scopes.join(', ')}</td>
                    <td style={{ padding: '0.75rem' }}><span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', background: k.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2', color: k.status === 'ACTIVE' ? '#065f46' : '#991b1b' }}>{k.status}</span></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button onClick={() => handleRevokeApiKey(k.id)} style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}>Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marketplace Tab */}
      {tab === 'marketplace' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Marketplace Items</h2>
            <form onSubmit={handleCreateItem} style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                  {ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
                <input placeholder="Title" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
                <input placeholder="Category" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
                <input type="number" placeholder="Price (USD)" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} step="0.01" min="0" style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
              </div>
              <textarea placeholder="Description" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} rows={3} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
              <input placeholder="Tags (comma separated)" value={newItem.tags.join(', ')} onChange={e => setNewItem({...newItem, tags: e.target.value.split(',').map(t => t.trim())})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
              <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Create Item</button>
            </form>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {marketplaceItems.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No marketplace items yet</p>
              ) : (
                marketplaceItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {item.type} • {item.category} • ${(item.price / 100).toFixed(2)} • {item.status}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(item.status !== 'PUBLISHED') && (
                        <button onClick={() => handlePublishItem(item.id)} style={{ padding: '0.25rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}>Publish</button>
                      )}
                      <button onClick={() => handleDeleteItem(item.id)} style={{ padding: '0.25rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          </div>
      )}

      {/* Dedicated Servers Tab */}
      {tab === 'servers' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem', maxWidth: '800px' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Dedicated Server</h2>
          {server ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div><strong>Name:</strong> {server.name}</div>
                <div><strong>Region:</strong> {server.region}</div>
                <div><strong>Instance:</strong> {server.instanceType}</div>
                <div><strong>GPU:</strong> {server.gpuEnabled ? (server.gpuType || 'Enabled') : 'Disabled'}</div>
                <div><strong>Status:</strong> <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '1rem', background: server.status === 'active' ? '#d1fae5' : '#fef3c7', color: server.status === 'active' ? '#065f46' : '#92400e' }}>{server.status}</span></div>
                <div><strong>SLA:</strong> {server.slaTier}</div>
                <div><strong>IP:</strong> {server.ipAddress || 'Not assigned'}</div>
              </div>
              <form onSubmit={handleUpdateServer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <input placeholder="Server Name" value={serverForm.name} onChange={e => setServerForm({...serverForm, name: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
                <select value={serverForm.region} onChange={e => setServerForm({...serverForm, region: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
                <select value={serverForm.instanceType} onChange={e => setServerForm({...serverForm, instanceType: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                  <option value="standard">Standard</option>
                  <option value="high-memory">High Memory</option>
                  <option value="high-cpu">High CPU</option>
                  <option value="gpu-small">GPU Small (T4)</option>
                  <option value="gpu-large">GPU Large (A100)</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={serverForm.gpuEnabled} onChange={e => setServerForm({...serverForm, gpuEnabled: e.target.checked})} />
                  GPU Enabled
                </label>
                <select value={serverForm.gpuType} onChange={e => setServerForm({...serverForm, gpuType: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                  <option value="">None</option>
                  <option value="T4">NVIDIA T4</option>
                  <option value="A10G">NVIDIA A10G</option>
                  <option value="A100">NVIDIA A100</option>
                </select>
                <select value={serverForm.slaTier} onChange={e => setServerForm({...serverForm, slaTier: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                  <option value="standard">Standard (99.9%)</option>
                  <option value="premium">Premium (99.95%)</option>
                  <option value="enterprise">Enterprise (99.99%)</option>
                </select>
                <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', alignSelf: 'start' }}>Update Server</button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleCreateServer} style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Provision New Dedicated Server</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <input placeholder="Server Name" value={serverForm.name} onChange={e => setServerForm({...serverForm, name: e.target.value})} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
                <select value={serverForm.region} onChange={e => setServerForm({...serverForm, region: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
                <select value={serverForm.instanceType} onChange={e => setServerForm({...serverForm, instanceType: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                  <option value="standard">Standard</option>
                  <option value="high-memory">High Memory</option>
                  <option value="high-cpu">High CPU</option>
                  <option value="gpu-small">GPU Small (T4)</option>
                  <option value="gpu-large">GPU Large (A100)</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={serverForm.gpuEnabled} onChange={e => setServerForm({...serverForm, gpuEnabled: e.target.checked})} />
                  GPU Enabled
                </label>
                <select value={serverForm.gpuType} onChange={e => setServerForm({...serverForm, gpuType: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                  <option value="">None</option>
                  <option value="T4">NVIDIA T4</option>
                  <option value="A10G">NVIDIA A10G</option>
                  <option value="A100">NVIDIA A100</option>
                </select>
                <select value={serverForm.slaTier} onChange={e => setServerForm({...serverForm, slaTier: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                  <option value="standard">Standard (99.9%)</option>
                  <option value="premium">Premium (99.95%)</option>
                  <option value="enterprise">Enterprise (99.99%)</option>
                </select>
              </div>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Provision Server</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}