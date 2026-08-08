'use client';

import { PresenceUser } from '@/lib/realtime/presence';

interface LiveCursorsProps {
  users: Record<string, PresenceUser>;
  currentUserId: string;
}

export function LiveCursors({ users, currentUserId }: LiveCursorsProps) {
  const cursors = Object.values(users).filter(
    (u) => u.userId !== currentUserId && u.cursor
  );

  if (cursors.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {cursors.map((u) => (
        <div
          key={u.userId}
          className="absolute transition-all duration-75"
          style={{ left: `${u.cursor!.x}%`, top: `${u.cursor!.y}%` }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M0 0L16 6L7 7L6 16L0 0Z" fill={u.color} />
          </svg>
          <span
            className="ml-3 -mt-1 px-1.5 py-0.5 rounded text-[10px] text-white whitespace-nowrap"
            style={{ backgroundColor: u.color }}
          >
            {u.name}
          </span>
        </div>
      ))}
    </div>
  );
}
