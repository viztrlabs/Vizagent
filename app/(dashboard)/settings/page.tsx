import { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SettingsClient } from './SettingsClient';

export const metadata: Metadata = {
  title: 'Settings | VizTR',
  description: 'Manage your account settings and team',
};

export default async function SettingsPage() {
  const { authUser, tenantId } = await getCurrentAuth();
  if (!authUser) redirect('/auth/signin?callbackUrl=/settings');

  const currentUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { name: true },
  });

  const members = await prisma.user.findMany({
    where: { tenantId },
    select: { id: true, email: true, role: true, name: true },
  });

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: { tier: true, status: true },
  });

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white">Settings</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage your account and team</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <SettingsClient
          user={{ email: authUser.email, name: currentUser?.name ?? '' }}
          subscription={subscription}
          members={members.map((m) => ({
            id: m.id,
            email: m.email,
            role: m.role,
            name: m.name,
          }))}
        />
      </div>
    </div>
  );
}