'use client';

import { useState, useEffect } from 'react';

interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  actorId: string;
  actorRole: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

function getActionColor(action: string): string {
  const prefix = action.split('.')[0];
  const colors: Record<string, string> = {
    user: 'bg-blue-900/30 text-blue-400',
    project: 'bg-green-900/30 text-green-400',
    deployment: 'bg-purple-900/30 text-purple-400',
    approval: 'bg-yellow-900/30 text-yellow-400',
    auth: 'bg-gray-900/30 text-gray-400',
  };
  return colors[prefix] ?? 'bg-gray-800 text-gray-400';
}

export function AuditClient() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (actionFilter) params.set('action', actionFilter);

        const res = await fetch(`/api/admin/audit?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logs');
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-surface border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan/60 text-sm"
        />
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading audit logs...</div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-sm">No audit logs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 text-gray-400 font-medium">Action</th>
                <th className="text-left py-3 text-gray-400 font-medium">Resource</th>
                <th className="text-left py-3 text-gray-400 font-medium">Resource ID</th>
                <th className="text-left py-3 text-gray-400 font-medium">Actor</th>
                <th className="text-left py-3 text-gray-400 font-medium">Timestamp</th>
                <th className="text-left py-3 text-gray-400 font-medium">Changes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/50">
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400">{log.resource}</td>
                  <td className="py-3 text-gray-500 text-xs">{log.resourceId ?? '-'}</td>
                  <td className="py-3 text-white">{log.actorId}</td>
                  <td className="py-3 text-gray-400 text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 text-gray-500 text-xs max-w-xs truncate">
                    {log.changes ? JSON.stringify(log.changes).slice(0, 80) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
