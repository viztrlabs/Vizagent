'use client';

import { useState } from 'react';

const CATEGORIES = {
  database: { label: 'Database', icon: '🗄️', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  auth: { label: 'Authentication', icon: '🔐', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  email: { label: 'Email', icon: '📧', color: 'text-green-400', bg: 'bg-green-500/10' },
  storage: { label: 'Storage', icon: '☁️', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  payments: { label: 'Payments', icon: '💳', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  streaming: { label: 'Streaming', icon: '📺', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  other: { label: 'Other', icon: '🔧', color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

const ENV_VARS = [
  // Database
  { key: 'DATABASE_URL', label: 'Database URL', description: 'PostgreSQL connection string', category: 'database', required: true, sensitive: true, placeholder: 'postgresql://user:pass@host:5432/db' },
  { key: 'DIRECT_URL', label: 'Direct URL', description: 'Direct connection for migrations', category: 'database', required: false, sensitive: true, placeholder: 'postgresql://user:pass@host:5432/db' },

  // Auth
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', description: 'Your Supabase project URL', category: 'auth', required: true, sensitive: false, placeholder: 'https://xxx.supabase.co' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key', description: 'Public anonymous key', category: 'auth', required: true, sensitive: true, placeholder: 'eyJ...' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key', description: 'Admin service role key', category: 'auth', required: true, sensitive: true, placeholder: 'eyJ...' },

  // Email
  { key: 'RESEND_API_KEY', label: 'Resend API Key', description: 'API key for transactional emails', category: 'email', required: true, sensitive: true, placeholder: 're_...' },
  { key: 'EMAIL_FROM', label: 'From Email', description: 'Default sender email address', category: 'email', required: true, sensitive: false, placeholder: 'noreply@viztr.io' },

  // Storage
  { key: 'R2_ACCOUNT_ID', label: 'R2 Account ID', description: 'Cloudflare R2 account identifier', category: 'storage', required: true, sensitive: false, placeholder: 'abc123' },
  { key: 'R2_ACCESS_KEY_ID', label: 'R2 Access Key ID', description: 'R2 API access key', category: 'storage', required: true, sensitive: true, placeholder: '...' },
  { key: 'R2_SECRET_ACCESS_KEY', label: 'R2 Secret Access Key', description: 'R2 API secret key', category: 'storage', required: true, sensitive: true, placeholder: '...' },
  { key: 'R2_BUCKET_NAME', label: 'R2 Bucket Name', description: 'Storage bucket name', category: 'storage', required: true, sensitive: false, placeholder: 'viztr-assets' },
  { key: 'R2_ENDPOINT', label: 'R2 Endpoint', description: 'R2 S3-compatible endpoint', category: 'storage', required: true, sensitive: false, placeholder: 'https://xxx.r2.cloudflarestorage.com' },

  // Payments
  { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', description: 'Stripe API secret key', category: 'payments', required: false, sensitive: true, placeholder: 'sk_live_...' },
  { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', description: 'Webhook signing secret', category: 'payments', required: false, sensitive: true, placeholder: 'whsec_...' },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', label: 'Stripe Publishable Key', description: 'Stripe public key', category: 'payments', required: false, sensitive: false, placeholder: 'pk_live_...' },

  // Streaming
  { key: 'NEXT_PUBLIC_SIGNALING_URL', label: 'Signaling URL', description: 'WebRTC signaling server URL', category: 'streaming', required: true, sensitive: false, placeholder: 'wss://stream.viztr.io' },
  { key: 'NEXT_PUBLIC_METRICS_URL', label: 'Metrics URL', description: 'Metrics sidecar URL', category: 'streaming', required: true, sensitive: false, placeholder: 'https://metrics.viztr.io' },
  { key: 'CRON_SECRET', label: 'Cron Secret', description: 'Secret for Vercel cron authentication', category: 'streaming', required: true, sensitive: true, placeholder: 'random-secret' },
  { key: 'GOOGLE_CLIENT_ID', label: 'Google Client ID', description: 'OAuth client ID for Calendar sync', category: 'streaming', required: false, sensitive: false, placeholder: 'xxx.apps.googleusercontent.com' },
  { key: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', description: 'OAuth client secret', category: 'streaming', required: false, sensitive: true, placeholder: '...' },

  // Other
  { key: 'REDIS_URL', label: 'Redis URL', description: 'Redis connection for queues/cache', category: 'other', required: false, sensitive: true, placeholder: 'redis://localhost:6379' },
  { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', description: 'OpenAI API key for AI features', category: 'other', required: false, sensitive: true, placeholder: 'sk-...' },
  { key: 'VERCEL_TOKEN', label: 'Vercel Token', description: 'Vercel deployment token', category: 'other', required: false, sensitive: true, placeholder: '...' },
] as const;

const PROVIDERS = {
  database: [
    { id: 'postgresql', name: 'PostgreSQL', description: 'Primary relational database', icon: '🗄️', envVars: ['DATABASE_URL', 'DIRECT_URL'], current: true },
    { id: 'mysql', name: 'MySQL', description: 'Alternative relational database', icon: '🗄️', envVars: ['DATABASE_URL'], current: false },
    { id: 'supabase', name: 'Supabase (PostgreSQL)', description: 'Managed PostgreSQL with auth', icon: '🏢', envVars: ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], current: false },
  ],
  email: [
    { id: 'resend', name: 'Resend', description: 'Transactional email API', icon: '📧', envVars: ['RESEND_API_KEY', 'EMAIL_FROM'], current: true },
    { id: 'sendgrid', name: 'SendGrid', description: 'Email delivery platform', icon: '📧', envVars: ['SENDGRID_API_KEY', 'EMAIL_FROM'], current: false },
    { id: 'nodemailer', name: 'Nodemailer (SMTP)', description: 'Self-hosted SMTP', icon: '📧', envVars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'], current: false },
  ],
  storage: [
    { id: 'r2', name: 'Cloudflare R2', description: 'S3-compatible object storage', icon: '☁️', envVars: ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_ENDPOINT'], current: true },
    { id: 's3', name: 'AWS S3', description: 'Amazon Simple Storage Service', icon: '☁️', envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'], current: false },
    { id: 'supabase-storage', name: 'Supabase Storage', description: 'Supabase managed storage', icon: '🏢', envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], current: false },
  ],
  payments: [
    { id: 'stripe', name: 'Stripe', description: 'Payment processing', icon: '💳', envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'], current: true },
    { id: 'paddle', name: 'Paddle', description: 'Merchant of record', icon: '💳', envVars: ['PADDLE_API_KEY', 'PADDLE_WEBHOOK_SECRET'], current: false },
  ],
  auth: [
    { id: 'supabase-auth', name: 'Supabase Auth', description: 'Built-in authentication', icon: '🔐', envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'], current: true },
  ],
} as const;

type CategoryKey = keyof typeof CATEGORIES;

export function AdminEnvSettingsClient() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('database');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState<string[]>([]);

  const handleSave = async () => {
    if (!editingKey) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setEditingKey(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleProvider = (category: string, providerId: string) => {
    setExpandedProviders(prev =>
      prev.includes(providerId) ? prev.filter(p => p !== providerId) : [...prev, providerId]
    );
  };

  const isProviderCurrent = (category: string, providerId: string) => {
    const providers = PROVIDERS[category as keyof typeof PROVIDERS];
    return providers?.find(p => p.id === providerId)?.current ?? false;
  };

  const maskValue = (value: string | undefined, sensitive: boolean) => {
    if (!value || !sensitive) return value || 'Not set';
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••' + value.slice(-4);
  };

  return (
    <div className="viztr-admin-env">
      <header className="viztr-env-header">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Environment Settings</h1>
            <p className="text-sm text-gray-400">Manage environment variables and service providers</p>
          </div>
          <div className="flex-1" />
          <a
            href="/docs/env-config"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-sm text-gray-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Documentation
          </a>
        </div>
      </header>

      <div className="viztr-env-layout">
        <nav className="viztr-env-sidebar">
          <div className="p-4 border-b border-gray-700/50">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
            <div className="space-y-1">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const count = ENV_VARS.filter(v => v.category === key).length;
                const required = ENV_VARS.filter(v => v.category === key && v.required).length;
                const missing = ENV_VARS.filter(v => v.category === key && v.required && !process.env[v.key]).length;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key as CategoryKey)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      activeCategory === key
                        ? 'bg-purple-600/20 text-white border border-purple-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded ${cat.bg}`}>{cat.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{cat.label}</div>
                      <div className="text-xs text-gray-500">{required} required · {count} total</div>
                    </div>
                    {missing > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">{missing} missing</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-700/50">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Provider Switcher</h3>
            <div className="space-y-2">
              {Object.entries({
                database: [
                  { id: 'postgresql', name: 'PostgreSQL', description: 'Primary relational database', icon: '🗄️', envVars: ['DATABASE_URL', 'DIRECT_URL'], current: true },
                  { id: 'mysql', name: 'MySQL', description: 'Alternative relational database', icon: '🗄️', envVars: ['DATABASE_URL'] },
                  { id: 'supabase', name: 'Supabase (PostgreSQL)', description: 'Managed PostgreSQL with auth', icon: '🏢', envVars: ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
                ],
                email: [
                  { id: 'resend', name: 'Resend', description: 'Transactional email API', icon: '📧', envVars: ['RESEND_API_KEY', 'EMAIL_FROM'], current: true },
                  { id: 'sendgrid', name: 'SendGrid', description: 'Email delivery platform', icon: '📧', envVars: ['SENDGRID_API_KEY', 'EMAIL_FROM'] },
                  { id: 'nodemailer', name: 'Nodemailer (SMTP)', description: 'Self-hosted SMTP', icon: '📧', envVars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'] },
                ],
                storage: [
                  { id: 'r2', name: 'Cloudflare R2', description: 'S3-compatible object storage', icon: '☁️', envVars: ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_ENDPOINT'], current: true },
                  { id: 's3', name: 'AWS S3', description: 'Amazon Simple Storage Service', icon: '☁️', envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'] },
                  { id: 'supabase-storage', name: 'Supabase Storage', description: 'Supabase managed storage', icon: '🏢', envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
                ],
                payments: [
                  { id: 'stripe', name: 'Stripe', description: 'Payment processing', icon: '💳', envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'], current: true },
                  { id: 'paddle', name: 'Paddle', description: 'Merchant of record', icon: '💳', envVars: ['PADDLE_API_KEY', 'PADDLE_WEBHOOK_SECRET'] },
                ],
                auth: [
                  { id: 'supabase-auth', name: 'Supabase Auth', description: 'Built-in authentication', icon: '🔐', envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'], current: true },
                ],
              }).map(([category, providers]) => (
                <div key={category} className="space-y-1">
                  <button
                    className="w-full flex items-center gap-2 px-2 py-1 text-left"
                    onClick={() => toggleProvider(category, providers[0].id)}
                  >
                    <span className="w-4 h-4">{CATEGORIES[category as keyof typeof CATEGORIES].icon}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider flex-1">{CATEGORIES[category as keyof typeof CATEGORIES].label}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 text-gray-500 ml-auto transition-transform ${expandedProviders.some(p => providers.some(pr => pr.id === p)) ? 'rotate-90' : ''}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {expandedProviders.some(p => providers.some(pr => pr.id === p)) && (
                    <div className="ml-6 space-y-1 pl-2 border-l border-gray-700/50">
                      {providers.map(provider => (
                        <button
                          key={provider.id}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            isProviderCurrent(category, provider.id)
                              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                          }`}
                          onClick={() => toggleProvider(category, provider.id)}
                        >
                          <span className="p-1 bg-gray-800/50 rounded">{provider.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="font-medium truncate">{provider.name}</div>
                            <div className="text-[10px] text-gray-500 truncate">{provider.description}</div>
                          </div>
                          {isProviderCurrent(category, provider.id) && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>

        <main className="viztr-env-main flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">{CATEGORIES[activeCategory].label} Variables</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {ENV_VARS.filter(v => v.category === activeCategory && v.required).length} required, {ENV_VARS.filter(v => v.category === activeCategory && !v.required).length} optional
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saved && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Saved
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {ENV_VARS.filter(v => v.category === activeCategory).map(v => (
                <div
                  key={v.key}
                  className={`bg-gray-900/50 border rounded-xl p-4 transition-colors ${
                    editingKey === v.key
                      ? 'border-purple-500/50 bg-purple-600/5'
                      : 'border-gray-700/50 hover:border-gray-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-white">{v.key}</span>
                        {v.required && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded">Required</span>
                        )}
                        {!v.required && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-gray-700 text-gray-400 rounded">Optional</span>
                        )}
                        {v.sensitive && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">Sensitive</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{v.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingKey === v.key ? (
                        <div className="flex items-center gap-2">
                          <input
                            type={v.sensitive ? 'password' : 'text'}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            placeholder={v.placeholder}
                            className="flex-1 min-w-[200px] px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:border-purple-500 focus:outline-none"
                            autoFocus
                          />
                          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium disabled:opacity-50">
                            {saving ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> : 'Save'}
                          </button>
                          <button onClick={() => setEditingKey(null)} className="px-3 py-2 text-gray-400 hover:text-white">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 min-w-[200px] px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-400 font-mono">
                            {maskValue(process.env[v.key], v.sensitive)}
                          </code>
                          <button
                            onClick={() => { setEditingKey(v.key); setEditValue(process.env[v.key] || ''); }}
                            className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5a2.121 2.121 0 0 1 3 3z"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {v.placeholder && !editingKey && !process.env[v.key] && (
                    <p className="mt-2 text-xs text-gray-500">Example: <code className="font-mono">{v.placeholder}</code></p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-gray-900/30 border border-gray-700/50 rounded-xl">
              <h3 className="font-medium text-white mb-2">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://vercel.com/docs/concepts/projects/environment-variables"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Set in Vercel Dashboard
                </a>
                <a
                  href="/docs/env-config"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Full Documentation
                </a>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 2.86l10.29-10.29a2 2 0 0 0 0-2.86L10.29 3.86z"/><line x1="12" y1="9" x2="12" y2="15"/></svg>
                  Validate All Required
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .viztr-admin-env {
          min-height: 100vh;
          background: #0D0D0F;
          color: #F0EDE8;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .viztr-env-header {
          padding: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: #0D0D0F;
        }
        .viztr-env-layout {
          display: flex;
        }
        .viztr-env-sidebar {
          width: 280px;
          flex-shrink: 0;
          border-right: 1px solid rgba(255,255,255,0.07);
          background: #0D0D0F;
          height: calc(100vh - 72px);
          overflow-y: auto;
        }
        .viztr-env-main {
          flex-1;
        }
        @media (max-width: 1024px) {
          .viztr-env-sidebar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}