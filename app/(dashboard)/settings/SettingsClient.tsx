'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Users, Shield, CreditCard, ExternalLink } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  role: string;
  name: string | null;
}

interface SettingsClientProps {
  user: { email: string; name: string };
  subscription: { tier: string; status: string } | null;
  members: Member[];
}

export function SettingsClient({ user, subscription, members }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'team' | 'billing'>('account');

  const tabs = [
    { key: 'account' as const, label: 'Account', icon: Mail },
    { key: 'team' as const, label: 'Team', icon: Users },
    { key: 'billing' as const, label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-surface border border-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'account' && (
        <section className="bg-surface border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <p className="text-white">{user.name || 'Not set'}</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'team' && (
        <section className="bg-surface border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Team Members</h2>
            <Link
              href="/privacy"
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Privacy Center <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {members.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm text-white">
                      {(member.name ?? member.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm">{member.name || member.email}</p>
                      <p className="text-gray-500 text-xs">{member.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded capitalize">
                    {member.role.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No team members found.</p>
          )}
        </section>
      )}

      {activeTab === 'billing' && (
        <section className="bg-surface border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Billing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Plan</label>
              <p className="text-white capitalize">{subscription?.tier || 'Free'}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <p className="text-white capitalize">{subscription?.status || 'Active'}</p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Upgrade Plan
            </Link>
          </div>
        </section>
      )}

      <section className="bg-surface border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-medium text-white">Privacy & Data</h2>
        </div>
        <div className="flex gap-3">
          <Link href="/privacy" className="text-sm text-indigo-400 hover:text-indigo-300">
            Privacy Center
          </Link>
          <Link href="/legal/privacy-policy" className="text-sm text-indigo-400 hover:text-indigo-300">
            Privacy Policy
          </Link>
          <Link href="/legal/cookie-policy" className="text-sm text-indigo-400 hover:text-indigo-300">
            Cookie Policy
          </Link>
        </div>
      </section>
    </div>
  );
}