'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { listTiers } from '@/lib/stripe/tiers';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tiers = listTiers();

  async function handleSubscribe(tier: string) {
    setLoading(tier);
    setError(null);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(null);
    }
  }

  async function handleManage() {
    try {
      const res = await fetch('/api/payments/portal', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open billing portal');
      }
    } catch {
      setError('Network error');
    }
  }

  return (
    <div className="min-h-screen bg-bg py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">Simple, transparent pricing</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Choose the plan that fits your studio. Upgrade or downgrade anytime.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className="bg-surface rounded-2xl border border-gray-800 p-6 flex flex-col"
            >
              <h2 className="text-xl font-semibold text-white">{tier.name}</h2>
              <p className="text-sm text-gray-400 mt-1 mb-4">{tier.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">${tier.monthlyPrice}</span>
                <span className="text-gray-400">/mo</span>
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-cyan mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe(tier.tier)}
                disabled={loading === tier.tier}
                className="w-full"
              >
                {loading === tier.tier ? 'Redirecting...' : 'Subscribe'}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="ghost" onClick={handleManage}>
            Manage existing subscription
          </Button>
        </div>
      </div>
    </div>
  );
}
