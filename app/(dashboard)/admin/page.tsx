import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Console | VizTR',
  description: 'Admin console for user management, audit logs, and system settings',
};

export default async function AdminPage() {
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
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">Admin Console</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage users, audit logs, and system settings</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/admin/users" className="bg-surface border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h2 className="text-xl font-semibold text-white mb-2">User Management</h2>
            <p className="text-gray-400 text-sm">View, filter, and manage users and roles</p>
          </Link>
          <Link href="/admin/audit" className="bg-surface border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h2 className="text-xl font-semibold text-white mb-2">Audit Logs</h2>
            <p className="text-gray-400 text-sm">View audit trail of system actions</p>
          </Link>
        </div>
      </div>
    </div>
  );
}