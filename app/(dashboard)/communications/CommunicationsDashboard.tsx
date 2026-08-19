'use client';

import { useState, useEffect, useCallback } from 'react';

interface Conversation {
  id: string;
  type: 'direct' | 'project' | 'support' | 'team';
  title?: string;
  participantIds: string[];
  lastMessageAt: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string;
  messageType: string;
  createdAt: string;
}

interface Notification {
  id: string;
  category: string;
  title: string;
  body: string;
  priority: string;
  readAt?: string;
  createdAt: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpfulCount: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
}

interface ChannelConfig {
  channel: string;
  enabled: boolean;
  config: Record<string, string>;
}

interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  telegram: boolean;
  discord: boolean;
  whatsapp: boolean;
  push: boolean;
  categories: Record<string, { enabled: boolean; channels: string[] }>;
}

const CHANNELS = ['email', 'in_app', 'telegram', 'discord', 'whatsapp', 'push'];
const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  in_app: 'In-App',
  telegram: 'Telegram',
  discord: 'Discord',
  whatsapp: 'WhatsApp',
  push: 'Push',
};

const SEED_FAQS = [
  { question: 'How do I create my first project?', answer: 'Click "New Project" on the dashboard, give it a name, and start uploading your 3D assets. Supported formats: GLB, GLTF, OBJ, FBX.', category: 'getting_started', tags: ['project', 'create', 'first'] },
  { question: 'What file formats are supported?', answer: 'We support GLB/GLTF (recommended), OBJ, FBX, and USDZ. Maximum file size: 500MB per asset.', category: 'assets', tags: ['formats', 'upload', 'files'] },
  { question: 'How do I publish my project?', answer: 'Once your project passes QA, click "Publish" in the project settings. You\'ll get a shareable URL instantly.', category: 'publishing', tags: ['publish', 'share', 'url'] },
  { question: 'How does billing work?', answer: 'Plans are billed monthly or annually (20% discount). You can upgrade/downgrade anytime with prorated charges.', category: 'billing', tags: ['pricing', 'subscription', 'payment'] },
  { question: 'Can I use my own domain?', answer: 'Yes, Enterprise plans support custom domains. Configure DNS in project settings.', category: 'integrations', tags: ['domain', 'custom', 'white-label'] },
];

export default function CommunicationsDashboard() {
  const [tab, setTab] = useState<'conversations' | 'notifications' | 'settings' | 'support'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [channelConfigs, setChannelConfigs] = useState<ChannelConfig[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [faqQuery, setFaqQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const authUserId = 'current-user-id';

  const updatePref = useCallback(async (category: string, channel: string, enabled: boolean) => {
    if (!preferences) return;
    const newPrefs = {
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: {
          ...preferences.categories[category],
          channels: enabled
            ? [...(preferences.categories[category]?.channels || []), channel]
            : (preferences.categories[category]?.channels || []).filter((c: string) => c !== channel),
        },
      },
    };
    setPreferences(newPrefs);
    await fetch('/api/communications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrefs),
    });
  }, [preferences]);

  const toggleChannel = useCallback(async (channel: string, enabled: boolean) => {
    const newConfigs = channelConfigs.map(c => c.channel === channel ? { ...c, enabled } : c);
    setChannelConfigs(newConfigs);
    await fetch('/api/communications/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, config: {}, enabled }),
    });
  }, [channelConfigs]);

  const configureChannel = useCallback((channel: string) => {
    alert(`Configure ${channel} integration`);
  }, []);

  useEffect(() => {
    let mounted = true;
    const doFetch = async () => {
      setLoading(true);
      try {
        const [convRes, notifRes, prefRes, channelRes, faqRes, ticketRes, unreadRes] = await Promise.all([
          fetch('/api/communications/conversations'),
          fetch('/api/communications/notifications'),
          fetch('/api/communications/preferences'),
          fetch('/api/communications/channels'),
          fetch('/api/communications/support?action=faq-search&q='),
          fetch('/api/communications/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get-tickets' }) }),
          fetch('/api/communications/notifications?action=unread-count'),
        ]);
        if (mounted) {
          if (convRes.ok) { const d = await convRes.json(); setConversations(d.conversations || []); }
          if (notifRes.ok) { const d = await notifRes.json(); setNotifications(d.notifications || []); }
          if (prefRes.ok) { const d = await prefRes.json(); setPreferences(d.preferences); }
          if (channelRes.ok) { const d = await channelRes.json(); setChannelConfigs(d.channels || []); }
          if (faqRes.ok) { const d = await faqRes.json(); setFaqs(d.faqs || []); }
          if (ticketRes.ok) { const d = await ticketRes.json(); setTickets(d.tickets || []); }
          if (unreadRes.ok) { const d = await unreadRes.json(); setUnreadCount(d.count || 0); }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    doFetch();
    return () => { mounted = false; };
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(`/api/communications/messages?conversationId=${conversationId}`);
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages || []);
    }
  }, []);

  const handleConversationClick = async (c: Conversation) => {
    setActiveConversation(c);
    await loadMessages(c.id);
    if (c.unreadCount) {
      await fetch('/api/communications/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: c.id }),
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    const res = await fetch('/api/communications/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConversation.id, content: newMessage }),
    });
    if (res.ok) {
      setNewMessage('');
      const d = await res.json();
      setMessages([d.message, ...messages]);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const subject = (form.elements.namedItem('subject') as HTMLInputElement).value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
    if (!subject || !message) return;

    const res = await fetch('/api/communications/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-ticket', subject, message, category: 'general' }),
    });
    if (res.ok) {
      form.reset();
      // Refresh data
      fetch('/api/communications/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get-tickets' }) })
        .then(r => r.json()).then(d => setTickets(d.tickets || []));
      fetch('/api/communications/notifications?action=unread-count')
        .then(r => r.json()).then(d => setUnreadCount(d.count || 0));
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Communications Center</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        {[
          { id: 'conversations', label: 'Messages', count: conversations.reduce((a, c) => a + (c.unreadCount || 0), 0) },
          { id: 'notifications', label: 'Notifications', count: unreadCount },
          { id: 'support', label: 'Support' },
          { id: 'settings', label: 'Settings' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id as 'conversations' | 'notifications' | 'settings' | 'support'); setActiveConversation(null); }}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: tab === t.id ? '#3b82f6' : 'transparent',
              color: tab === t.id ? 'white' : '#374151',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {t.label}
            {t.count && <span style={{ marginLeft: '0.5rem', background: tab === t.id ? 'rgba(255,255,255,0.2)' : '#ef4444', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '1rem', fontSize: '0.625rem' }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Conversations Tab */}
      {tab === 'conversations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: 'calc(100vh - 250px)' }}>
          {/* Conversation List */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Conversations</h2>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No conversations yet</div>
              ) : (
                conversations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleConversationClick(c)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: 'none',
                      background: activeConversation?.id === c.id ? '#f0f9ff' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                      {c.title || (c.type === 'project' ? 'Project Chat' : c.type === 'support' ? 'Support' : 'Direct Message')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {new Date(c.lastMessageAt).toLocaleString()}
                    </div>
                    {c.unreadCount && <span style={{ background: '#ef4444', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '1rem', fontSize: '0.625rem' }}>{c.unreadCount}</span>}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message View */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeConversation ? (
              <>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>{activeConversation.title || 'Conversation'}</h2>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>No messages yet. Start the conversation!</div>
                  ) : (
                    messages.map(m => (
                      <div key={m.id} style={{ alignSelf: m.senderId === authUserId ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          padding: '0.75rem 1rem',
                          background: m.senderId === authUserId ? '#3b82f6' : '#f3f4f6',
                          borderRadius: m.senderId === authUserId ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                          color: m.senderId === authUserId ? 'white' : '#111827',
                        }}>
                          {m.content}
                          <div style={{ fontSize: '0.625rem', opacity: 0.7, marginTop: '0.25rem', textAlign: 'right' }}>
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '1.5rem', fontSize: '0.875rem' }}
                  />
                  <button type="submit" disabled={!newMessage.trim()} style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '1.5rem', cursor: 'pointer' }}>Send</button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                Select a conversation or start a new one
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Notifications {unreadCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{unreadCount}</span>}</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            {notifications.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No notifications</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.readAt) {
                        fetch(`/api/communications/notifications`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'mark-read', notificationId: n.id }),
                        }).then(() => {
                          fetch('/api/communications/notifications?action=unread-count')
                            .then(r => r.json()).then(d => setUnreadCount(d.count || 0));
                          setNotifications(notifications.map(n2 => n2.id === n.id ? { ...n2, readAt: new Date().toISOString() } : n2));
                        });
                      }
                    }}
                    style={{
                      padding: '1rem',
                      background: n.readAt ? 'transparent' : '#f0f9ff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: n.readAt ? '#374151' : '#111827' }}>{n.title}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{n.body}</div>
                    <div style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: '0.5rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Support Tab */}
      {tab === 'support' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* FAQ Search */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Help Center</h2>
            <input
              value={faqQuery}
              onChange={e => setFaqQuery(e.target.value)}
              placeholder="Search help articles..."
              style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', marginBottom: '1rem' }}
            />
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {faqs.length === 0 && faqQuery ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No results found</p>
              ) : (
                faqs.slice(0, 10).map(f => (
                  <details key={f.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                    <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{f.question}</summary>
                    <p style={{ color: '#6b7280', marginTop: '0.75rem', lineHeight: 1.6 }}>{f.answer}</p>
                  </details>
                ))
              )}
              {faqs.length === 0 && !faqQuery && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {SEED_FAQS.slice(0, 5).map((f, i) => (
                    <details key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                      <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{f.question}</summary>
                      <p style={{ color: '#6b7280', marginTop: '0.75rem', lineHeight: 1.6 }}>{f.answer}</p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tickets */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Support Tickets</h2>
            <form onSubmit={handleCreateTicket} style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <input name="subject" placeholder="Subject" required style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <textarea name="message" placeholder="Describe your issue..." required rows={4} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Submit Ticket</button>
            </form>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {tickets.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No tickets yet</p>
              ) : (
                tickets.map(t => (
                  <div key={t.id} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem', borderRadius: '1rem',
                        background: t.status === 'open' ? '#d1fae5' : t.status === 'resolved' ? '#e5e7eb' : '#fef3c7',
                        color: t.status === 'open' ? '#065f46' : t.status === 'resolved' ? '#374151' : '#92400e'
                      }}>{t.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Notification Preferences */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Notification Preferences</h2>
            {preferences && Object.entries(preferences.categories).map(([cat, cfg]: [string, { enabled: boolean; channels: string[] }]) => (
              <div key={cat} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {CHANNELS.map(ch => (
                    <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input type="checkbox" checked={cfg.channels?.includes(ch)} onChange={e => updatePref(cat, ch, e.target.checked)} />
                      {CHANNEL_LABELS[ch]}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Channel Configurations */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Channel Integrations</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {channelConfigs.map(c => (
                <div key={c.channel} style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: 600, textTransform: 'capitalize' }}>{CHANNEL_LABELS[c.channel] || c.channel}</h3>
                    <label style={{ position: 'relative', width: '44px', height: '24px' }}>
                      <input type="checkbox" checked={c.enabled} onChange={e => toggleChannel(c.channel, e.target.checked)}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 1 }} />
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: c.enabled ? '#3b82f6' : '#e5e7eb',
                        borderRadius: '12px', transition: 'background 0.2s'
                      }}>
                        <div style={{
                          position: 'absolute', top: '2px', left: c.enabled ? '22px' : '2px',
                          width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }} />
                      </div>
                    </label>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '1rem' }}>
                    {c.enabled ? 'Connected' : 'Not configured'}
                  </p>
                  {c.enabled ? (
                    <button onClick={() => toggleChannel(c.channel, false)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ef4444', color: '#ef4444', background: 'white', borderRadius: '0.5rem', cursor: 'pointer' }}>Disconnect</button>
                  ) : (
                    <button onClick={() => configureChannel(c.channel)} style={{ width: '100%', padding: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Configure</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}