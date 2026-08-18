'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'CLIENT';

interface UserSummary {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isSuspended: boolean;
  createdAt: string;
}

const roleOptions: Role[] = ['SUPER_ADMIN', 'ADMIN', 'USER', 'CLIENT'];

export function UsersClient() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [search, roleFilter, reloadKey]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(`${userId}-${newRole}`);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateRole', userId, role: newRole }),
      });
      setReloadKey((k) => k + 1);
    } catch {
      setError('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendToggle = async (user: UserSummary) => {
    const action = user.isSuspended ? 'unsuspend' : 'suspend';
    setActionLoading(`${user.id}-${action}`);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: user.id,
          ...(action === 'suspend' && { reason: 'Suspended via admin console' }),
        }),
      });
      setReloadKey((k) => k + 1);
    } catch {
      setError('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-900/30 text-purple-400';
      case 'ADMIN': return 'bg-indigo-900/30 text-indigo-400';
      case 'USER': return 'bg-gray-900/30 text-gray-400';
      case 'CLIENT': return 'bg-cyan-900/30 text-cyan-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-surface border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan/60 text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-surface border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan/60 text-sm"
        >
          <option value="">All Roles</option>
          {roleOptions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading users...</div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500 text-sm">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 text-gray-400 font-medium">User</th>
                <th className="text-left py-3 text-gray-400 font-medium">Role</th>
                <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 text-gray-400 font-medium">Created</th>
                <th className="text-right py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50">
                  <td className="py-3">
                    <div>
                      <p className="text-white">{user.name || user.email}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${roleColor(user.role)}`}>
                      {user.role}
                    </span>
                    {user.role !== 'SUPER_ADMIN' && (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={actionLoading === `${user.id}-${user.role}`}
                        className="ml-2 text-xs bg-black/40 border border-gray-700 rounded px-1 py-0.5 text-white focus:outline-none focus:border-cyan/60"
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.isSuspended
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-green-900/30 text-green-400'
                    }`}>
                      {user.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleSuspendToggle(user)}
                      disabled={actionLoading === `${user.id}-${user.isSuspended ? 'unsuspend' : 'suspend'}`}
                      className={`text-xs px-2 py-1 rounded ${
                        user.isSuspended
                          ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                          : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                      }`}
                    >
                      {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
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
