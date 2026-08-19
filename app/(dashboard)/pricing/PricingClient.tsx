'use client';

import { useState, useEffect } from 'react';
import { TierConfig } from '@/lib/stripe/tiers';

const ANNUAL_DISCOUNT = 20;

export default function PricingClient() {
  const [interval, setInterval] = useState<'monthly' | 'annually'>('monthly');
  const [tiers, setTiers] = useState<TierConfig[]>([]);

  useEffect(() => {
    fetch('/api/billing/tiers')
      .then(r => r.json())
      .then(d => setTiers(d.tiers || []));
  }, []);

  const getPrice = (tier: TierConfig) => interval === 'annually' ? tier.annuallyPrice : tier.monthlyPrice;
  const getAnnualSavings = (tier: TierConfig) => tier.monthlyPrice * 12 - tier.annuallyPrice;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>Simple, Transparent Pricing</h1>
        <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
          Choose the plan that's right for you. All plans include a 14-day free trial. No credit card required.
        </p>
      </div>

      {/* Interval Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <span style={{ fontWeight: interval === 'monthly' ? 700 : 400, color: interval === 'monthly' ? '#111827' : '#6b7280' }}>Monthly</span>
        <label style={{ position: 'relative', width: '60px', height: '30px' }}>
          <input
            type="checkbox"
            checked={interval === 'annually'}
            onChange={e => setInterval(e.target.checked ? 'annually' : 'monthly')}
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 1 }}
          />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: interval === 'annually' ? '#3b82f6' : '#e5e7eb',
            borderRadius: '15px', transition: 'background 0.2s'
          }}>
            <div style={{
              position: 'absolute', top: '3px', left: interval === 'annually' ? '31px' : '3px',
              width: '24px', height: '24px', background: 'white', borderRadius: '50%',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }} />
          </div>
        </label>
        <span style={{ fontWeight: interval === 'annually' ? 700 : 400, color: interval === 'annually' ? '#111827' : '#6b7280' }}>
          Annually
          <span style={{ background: '#10b981', color: 'white', padding: '0.125rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.625rem', marginLeft: '0.5rem' }}>
            Save {ANNUAL_DISCOUNT}%
          </span>
        </span>
      </div>

      {/* Tier Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {tiers.map(tier => {
          const price = getPrice(tier);
          const isPro = tier.tier === 'pro';
          const isFree = tier.tier === 'free';

          return (
            <div
              key={tier.tier}
              style={{
                background: 'white',
                border: isPro ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '1rem',
                padding: '2rem',
                position: 'relative',
                boxShadow: isPro ? '0 10px 25px rgba(59, 130, 246, 0.15)' : 'none',
              }}
            >
              {isPro && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: '#3b82f6', color: 'white', padding: '0.25rem 1rem',
                  borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{tier.name}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{tier.description}</p>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: '#111827' }}>
                  {price === 0 ? 'Free' : `$${(price / 100).toFixed(2)}`}
                </div>
                <span style={{ color: '#6b7280' }}>/month</span>
                {price > 0 && interval === 'annually' && (
                  <div style={{ color: '#10b981', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Billed annually: ${(tier.annuallyPrice / 100).toFixed(2)}/yr
                    <span style={{ marginLeft: '0.5rem' }}>(save ${((getAnnualSavings(tier) / 100).toFixed(2))}/yr)</span>
                  </div>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '2rem' }}>
                {tier.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', color: '#374151', fontSize: '0.875rem' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#10b981', flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  background: isPro ? '#3b82f6' : (isFree ? '#e5e7eb' : '#111827'),
                  color: isPro ? 'white' : (isFree ? '#374151' : 'white'),
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                {isFree ? 'Start Free' : isPro ? 'Get Started' : 'Contact Sales'}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div style={{ marginTop: '6rem', maxWidth: '800px', margin: '6rem auto 0' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade at any time. Prorated charges apply for upgrades, and credits are issued for downgrades.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex), bank transfers for annual Enterprise plans, and regional payment methods where available.' },
            { q: 'Is there a long-term contract?', a: 'Monthly plans can be canceled anytime. Annual plans are billed yearly but can be canceled with a pro-rated refund for unused months.' },
            { q: 'What happens when I exceed my limits?', a: 'We\'ll notify you at 80% and 95% usage. You can upgrade instantly or purchase add-ons for overages.' },
          ].map((faq, i) => (
            <details key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
              <summary style={{ fontWeight: 600, cursor: 'pointer', listStyle: 'none' }}>{faq.q}</summary>
              <p style={{ color: '#6b7280', marginTop: '0.75rem', lineHeight: 1.6 }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}