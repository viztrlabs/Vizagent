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

  const statusConfig = isCancelled
    ? { label: 'Cancelled', className: 'viztr-badge-cancelled' }
    : isPast
    ? { label: 'Completed', className: 'viztr-badge-past' }
    : { label: 'Confirmed', className: 'viztr-badge-active' };

  return (
    <div className="viztr-session-card">
      <div className="viztr-card-header">
        <div className="viztr-card-info">
          <p className="viztr-card-service">
            {SERVICE_NAMES[session.serviceId] || session.serviceId}
          </p>
          <p className="viztr-card-project">
            {session.company || session.projectType}
          </p>
        </div>
        <span className={`viztr-badge ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="viztr-card-details">
        <div className="viztr-detail">
          <span className="viztr-detail-label">Date</span>
          <span className="viztr-detail-value">{dateStr}</span>
        </div>
        <div className="viztr-detail">
          <span className="viztr-detail-label">Time</span>
          <span className="viztr-detail-value">{timeStr} IST</span>
        </div>
        <div className="viztr-detail">
          <span className="viztr-detail-label">Duration</span>
          <span className="viztr-detail-value">{session.durationMinutes}m</span>
        </div>
        <div className="viztr-detail">
          <span className="viztr-detail-label">ID</span>
          <span className="viztr-detail-id">{session.id.slice(0, 10)}…</span>
        </div>
      </div>

      {!isPast && !isCancelled && !showConfirm && (
        <div className="viztr-card-actions">
          <button
            onClick={() => setShowConfirm(true)}
            className="viztr-btn-cancel"
          >
            Cancel session
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="viztr-confirm-overlay">
          <p className="viztr-confirm-title">Cancel this session?</p>
          <p className="viztr-confirm-text">
            This will remove the session from your calendar and notify the team.
          </p>
          <div className="viztr-confirm-buttons">
            <button
              onClick={() => setShowConfirm(false)}
              className="viztr-btn-keep"
            >
              Keep it
            </button>
            <button
              onClick={cancel}
              disabled={cancelling}
              className="viztr-btn-confirm-cancel"
            >
              {cancelling ? 'Cancelling…' : 'Yes, cancel'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .viztr-session-card {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 8px;
          transition: border-color 0.2s;
        }
        .viztr-session-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
        }
        .viztr-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .viztr-card-info {
          flex: 1;
        }
        .viztr-card-service {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #F0EDE8;
          margin-bottom: 2px;
        }
        .viztr-card-project {
          font-size: 12px;
          color: #A09D97;
        }
        .viztr-badge {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .viztr-badge-active {
          background: rgba(83, 74, 183, 0.15);
          color: #534AB7;
          border: 1px solid rgba(83, 74, 183, 0.3);
        }
        .viztr-badge-past {
          background: rgba(255, 255, 255, 0.05);
          color: #A09D97;
          border: 1px solid rgba(255, 255, 255, 0.07);
        }
        .viztr-badge-cancelled {
          background: rgba(226, 75, 74, 0.1);
          color: #E24B4A;
          border: 1px solid rgba(226, 75, 74, 0.2);
        }
        .viztr-card-details {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding: 12px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 12px;
        }
        .viztr-detail {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .viztr-detail-label {
          font-size: 10px;
          color: #55534E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .viztr-detail-value {
          font-size: 12px;
          font-weight: 500;
          color: #F0EDE8;
        }
        .viztr-detail-id {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: #A09D97;
        }
        .viztr-card-actions {
          display: flex;
          gap: 8px;
        }
        .viztr-btn-cancel {
          font-size: 11px;
          color: #E24B4A;
          background: rgba(226, 75, 74, 0.08);
          border: 1px solid rgba(226, 75, 74, 0.2);
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .viztr-btn-cancel:hover {
          background: rgba(226, 75, 74, 0.15);
          border-color: rgba(226, 75, 74, 0.35);
        }
        .viztr-confirm-overlay {
          background: rgba(226, 75, 74, 0.06);
          border: 1px solid rgba(226, 75, 74, 0.15);
          border-radius: 8px;
          padding: 12px;
        }
        .viztr-confirm-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #F0EDE8;
          margin-bottom: 4px;
        }
        .viztr-confirm-text {
          font-size: 11px;
          color: #A09D97;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .viztr-confirm-buttons {
          display: flex;
          gap: 8px;
        }
        .viztr-btn-keep {
          flex: 1;
          font-size: 12px;
          color: #A09D97;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .viztr-btn-keep:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #F0EDE8;
        }
        .viztr-btn-confirm-cancel {
          flex: 1;
          font-size: 12px;
          font-weight: 500;
          color: #fff;
          background: #E24B4A;
          border: none;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .viztr-btn-confirm-cancel:hover {
          opacity: 0.9;
        }
        .viztr-btn-confirm-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 480px) {
          .viztr-card-details {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
