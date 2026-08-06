'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionCardProps {
  session: { id: string; service?: string; project_id: string; start_at?: string | Date; [key: string]: unknown };
  isPast?: boolean;
  isCancelled?: boolean;
}

export default function SessionCard({ session, isPast = false, isCancelled = false }: SessionCardProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const cancel = async () => {
    setCancelling(true);
    await fetch(`/api/bookings/${session.id}`, { method: 'DELETE' });
    setShowConfirm(false);
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-gray-800 p-4 mb-3 bg-surface">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-white truncate">{session.service || 'XR Session'}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{session.project_id}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
          isCancelled ? 'bg-red-900/30 text-red-400' :
          isPast ? 'bg-gray-800 text-gray-400' :
          'bg-cyan-900/30 text-cyan-400'
        }`}>
          {isCancelled ? 'Cancelled' : isPast ? 'Completed' : 'Confirmed'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
        <div>
          <div className="text-gray-500">Date</div>
          <div className="font-medium text-white">
            {session.start_at ? new Date(session.start_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Time</div>
          <div className="font-medium text-white">
            {session.start_at ? new Date(session.start_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'TBD'} IST
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="text-gray-500">ID</div>
          <div className="font-medium font-mono text-[11px] text-white">{session.id.slice(0, 10)}…</div>
        </div>
      </div>

      {!isPast && !isCancelled && !showConfirm && (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-xs text-red-400 border border-red-900/50 rounded-lg px-3 py-2 hover:bg-red-900/20 transition min-h-touch"
        >
          Cancel session
        </button>
      )}

      {showConfirm && (
        <div className="bg-red-900/20 rounded-lg p-3 text-xs">
          <p className="text-red-400 mb-2 font-medium">Cancel this session?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 border border-gray-700 rounded-lg py-2 text-white min-h-touch"
            >
              Keep it
            </button>
            <button
              onClick={cancel}
              disabled={cancelling}
              className="flex-1 bg-red-600 text-white rounded-lg py-2 disabled:opacity-60 min-h-touch"
            >
              {cancelling ? 'Cancelling…' : 'Yes, cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
