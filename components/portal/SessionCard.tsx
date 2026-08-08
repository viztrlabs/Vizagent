'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  serviceId: string;
  firstName: string;
  lastName: string;
  company: string | null;
  date: string;
  time: string;
  startAt: Date;
  durationMinutes: number;
  status: string;
  projectType: string;
}

const SERVICE_NAMES: Record<string, string> = {
  'vr-walkthrough': 'VR Walkthrough',
  'exterior-viz': 'Exterior Visualisation',
  'interior-xr': 'Interior XR Tour',
  'masterplan': 'Master Plan Review',
};

interface SessionCardProps {
  session: Session;
  isPast?: boolean;
  isCancelled?: boolean;
}

export function SessionCard({ session, isPast = false, isCancelled = false }: SessionCardProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const cancel = async () => {
    setCancelling(true);
    await fetch(`/api/bookings/${session.id}`, { method: 'DELETE' });
    setShowConfirm(false);
    router.refresh();
  };

  const startAt = new Date(session.startAt);
  const dateStr = startAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = startAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  return (
    <div className="rounded-xl border border-border p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-sm">
            {SERVICE_NAMES[session.serviceId] || session.serviceId}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.company || session.projectType}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            isCancelled
              ? 'bg-red-50 text-red-800'
              : isPast
              ? 'bg-muted text-muted-foreground'
              : 'bg-purple-50 text-purple-800'
          }`}
        >
          {isCancelled ? 'Cancelled' : isPast ? 'Completed' : 'Confirmed'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div>
          <div className="text-muted-foreground">Date</div>
          <div className="font-medium">{dateStr}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Time</div>
          <div className="font-medium">{timeStr} IST</div>
        </div>
        <div>
          <div className="text-muted-foreground">ID</div>
          <div className="font-medium font-mono text-[11px]">
            {session.id.slice(0, 10)}…
          </div>
        </div>
      </div>

      {!isPast && !isCancelled && !showConfirm && (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition"
        >
          Cancel session
        </button>
      )}

      {showConfirm && (
        <div className="bg-red-50 rounded-lg p-3 text-xs">
          <p className="text-red-800 mb-2 font-medium">Cancel this session?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 border border-border rounded-lg py-1.5"
            >
              Keep it
            </button>
            <button
              onClick={cancel}
              disabled={cancelling}
              className="flex-1 bg-red-600 text-white rounded-lg py-1.5 disabled:opacity-60"
            >
              {cancelling ? 'Cancelling…' : 'Yes, cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
