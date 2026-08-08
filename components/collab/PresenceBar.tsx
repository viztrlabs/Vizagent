'use client';

import { PresenceUser } from '@/lib/realtime/presence';

interface PresenceBarProps {
  users: Record<string, PresenceUser>;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PresenceBar({ users }: PresenceBarProps) {
  const list = Object.values(users);

  if (list.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-2 h-2 rounded-full bg-gray-600" />
        No one else here
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {list.map((u) => (
        <div
          key={u.userId}
          className="relative group"
          title={u.name}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-bg"
            style={{ backgroundColor: u.color }}
          >
            {initials(u.name) || '?'}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-surface" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-surface border border-gray-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            {u.name}
          </span>
        </div>
      ))}
      <span className="text-xs text-gray-500 ml-1">{list.length} online</span>
    </div>
  );
}
