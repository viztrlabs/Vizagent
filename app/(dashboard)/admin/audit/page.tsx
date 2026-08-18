import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { AuditClient } from './AuditClient';

export const metadata: Metadata = {
  title: 'Audit Logs | Admin Console | VizTR',
};

export default async function AdminAuditPage() {
  const hasAccess = await requireRole(['SUPER_ADMIN', 'ADMIN']);
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You need admin role to access this page.</p>
          <Link href="/dashboard" className="text-cyan hover:underline mt-4 inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">Audit Logs</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">System audit trail</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
          >
            Back to Admin
          </Link>
        </div>

        <AuditClient />
      </div>
    </div>
  );
}