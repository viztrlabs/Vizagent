'use client';

import { useEffect, useState } from 'react';
import { Activity, Users, BarChart2, Settings, RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

const METRICS_URL = process.env.NEXT_PUBLIC_METRICS_URL || 'https://metrics.viztr.io';

interface HealthData {
  status: 'connected' | 'disconnected' | 'reconnecting';
  fps: number;
  latency: number;
  uptime: number;
  lastHeartbeat: number | null;
}

interface ViewersData {
  count: number;
  lastUpdate: number | null;
}

interface SessionData {
  id: string;
  startTime: number;
  endTime: number | null;
  peakViewers: number;
  status: 'active' | 'ended';
}

interface ConfigData {
  controlAccess: 'full' | 'partial' | 'view-only';
}

type Tab = 'health' | 'sessions' | 'analytics' | 'control';

export function AdminPixelStreamingClient() {
  const [activeTab, setActiveTab] = useState<Tab>('health');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [viewers, setViewers] = useState<ViewersData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, viewersRes, sessionsRes, configRes] = await Promise.all([
        fetch(`${METRICS_URL}/health`),
        fetch(`${METRICS_URL}/viewers`),
        fetch(`${METRICS_URL}/sessions`),
        fetch(`${METRICS_URL}/config`),
      ]);

      if (healthRes.ok) setHealth(await healthRes.json() as unknown as HealthData);
      if (viewersRes.ok) setViewers(await viewersRes.json() as unknown as ViewersData);
      if (sessionsRes.ok) {
        const data = await sessionsRes.json() as unknown as { sessions: SessionData[] };
        setSessions(data.sessions || []);
      }
      if (configRes.ok) setConfig(await configRes.json() as unknown as ConfigData);
    } catch (err) {
      setError('Failed to fetch metrics. Is the metrics sidecar running?');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (controlAccess: 'full' | 'partial' | 'view-only') => {
    try {
      const res = await fetch(`${METRICS_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controlAccess }),
      });
      if (res.ok) {
        setConfig((prev) => prev ? { ...prev, controlAccess } : { controlAccess });
      }
    } catch (err) {
      setError('Failed to update config');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const statusConfig = health
    ? health.status === 'connected'
      ? { label: 'Connected', icon: <Wifi className="w-4 h-4" />, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' }
      : health.status === 'reconnecting'
      ? { label: 'Reconnecting', icon: <Activity className="w-4 h-4 animate-spin" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' }
      : { label: 'Disconnected', icon: <WifiOff className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' }
    : { label: 'Unknown', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-gray-500', bg: 'bg-gray-500/10 border-gray-500/30' };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'health', label: 'Health', icon: <Activity className="w-4 h-4" /> },
    { id: 'sessions', label: 'Sessions', icon: <Users className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'control', label: 'Control Access', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="viztr-admin-ps">
      <header className="viztr-admin-header">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Pixel Streaming Admin</h1>
              <p className="text-sm text-gray-400">Monitor and control live streaming</p>
            </div>
          </div>
          <div className="flex-1" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusConfig.bg}`}>
            {statusConfig.icon}
            <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
          </div>
          <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-300 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <nav className="viztr-admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="viztr-admin-main p-4">
        {activeTab === 'health' && <HealthTab health={health} viewers={viewers} formatUptime={formatUptime} />}
        {activeTab === 'sessions' && <SessionsTab sessions={sessions} />}
        {activeTab === 'analytics' && <AnalyticsTab sessions={sessions} />}
        {activeTab === 'control' && <ControlTab config={config} onUpdate={updateConfig} />}
      </main>

      <style jsx>{`
        .viztr-admin-ps {
          min-height: 100vh;
          background: #0D0D0F;
          color: #F0EDE8;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .viztr-admin-header {
          padding: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: #0D0D0F;
        }
        .viztr-admin-tabs {
          display: flex;
          gap: 8px;
          padding: 0 24px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          overflow-x: auto;
        }
        .viztr-admin-main {
          max-width: 1200px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}

function HealthTab({ health, viewers, formatUptime }: { health: any; viewers: any; formatUptime: (s: number) => string }) {
  if (!health) return <div className="p-8 text-center text-gray-400">Loading health data...</div>;

  const stats = [
    { label: 'Stream Status', value: health.status, icon: <Activity className="w-5 h-5" /> },
    { label: 'Viewers', value: viewers?.count ?? 0, icon: <Users className="w-5 h-5" /> },
    { label: 'FPS', value: health.fps, icon: <Activity className="w-5 h-5" /> },
    { label: 'Latency', value: `${health.latency}ms`, icon: <Activity className="w-5 h-5" /> },
    { label: 'Uptime', value: formatUptime(health.uptime), icon: <Activity className="w-5 h-5" /> },
    { label: 'Last Heartbeat', value: health.lastHeartbeat ? new Date(health.lastHeartbeat).toLocaleTimeString() : 'Never', icon: <Activity className="w-5 h-5" /> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-600/20 rounded-lg">{stat.icon}</div>
            <span className="text-sm text-gray-400">{stat.label}</span>
          </div>
          <div className="text-2xl font-semibold text-white">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

function SessionsTab({ sessions }: { sessions: any[] }) {
  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700/50">
            <th className="text-left p-4 text-sm text-gray-400 font-medium">Session ID</th>
            <th className="text-left p-4 text-sm text-gray-400 font-medium">Start Time</th>
            <th className="text-left p-4 text-sm text-gray-400 font-medium">Duration</th>
            <th className="text-left p-4 text-sm text-gray-400 font-medium">Peak Viewers</th>
            <th className="text-left p-4 text-sm text-gray-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-gray-400">No sessions recorded</td>
            </tr>
          ) : (
            sessions.map((session) => (
              <tr key={session.id} className="border-b border-gray-700/30 hover:bg-gray-800/30">
                <td className="p-4 font-mono text-sm text-gray-300">{session.id.slice(0, 12)}…</td>
                <td className="p-4 text-sm">{new Date(session.startTime).toLocaleString()}</td>
                <td className="p-4 text-sm">
                  {session.endTime
                    ? `${Math.floor((session.endTime - session.startTime) / 60000)}m`
                    : 'Active'}
                </td>
                <td className="p-4 text-sm">{session.peakViewers}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {session.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsTab({ sessions }: { sessions: any[] }) {
  const totalSessions = sessions.length;
  const totalViewers = sessions.reduce((sum, s) => sum + s.peakViewers, 0);
  const avgViewers = totalSessions ? Math.round(totalViewers / totalSessions) : 0;
  const activeSessions = sessions.filter(s => s.status === 'active').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total Sessions', value: totalSessions, icon: <Activity className="w-5 h-5" /> },
        { label: 'Active Now', value: activeSessions, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
        { label: 'Total Viewers', value: totalViewers, icon: <Users className="w-5 h-5" /> },
        { label: 'Avg Viewers/Session', value: avgViewers, icon: <BarChart2 className="w-5 h-5" /> },
      ].map((stat, i) => (
        <div key={i} className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-600/20 rounded-lg">{stat.icon}</div>
            <span className="text-sm text-gray-400">{stat.label}</span>
          </div>
          <div className="text-3xl font-semibold text-white">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

function ControlTab({ config, onUpdate }: { config: any; onUpdate: (access: 'full' | 'partial' | 'view-only') => void }) {
  const accessOptions = [
    { value: 'full', label: 'Full Access', desc: 'Mouse + keyboard input enabled' },
    { value: 'partial', label: 'Partial Access', desc: 'Camera rotation only' },
    { value: 'view-only', label: 'View Only', desc: 'No input sent to UE5' },
  ];

  return (
    <div className="max-w-md">
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2">Viewer Control Access</h3>
        <p className="text-sm text-gray-400 mb-6">
          Set the default control level for all connected viewers. Changes apply immediately.
        </p>
        <div className="space-y-3">
          {accessOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                config?.controlAccess === opt.value
                  ? 'border-purple-500 bg-purple-600/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="controlAccess"
                value={opt.value}
                checked={config?.controlAccess === opt.value}
                onChange={() => onUpdate(opt.value as any)}
                className="w-4 h-4 accent-purple-500"
              />
              <div>
                <div className="font-medium">{opt.label}</div>
                <div className="text-sm text-gray-400">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}