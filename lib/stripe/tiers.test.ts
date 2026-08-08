import { getTierConfig, getPriceId, listTiers } from './tiers';

describe('stripe tiers', () => {
  it('getTierConfig returns config for known tiers', () => {
    expect(getTierConfig('starter')?.monthlyPrice).toBe(299);
    expect(getTierConfig('pro')?.monthlyPrice).toBe(499);
    expect(getTierConfig('enterprise')?.monthlyPrice).toBe(799);
  });

  it('getTierConfig returns undefined for unknown tier', () => {
    expect(getTierConfig('nonexistent')).toBeUndefined();
  });

  it('getPriceId reads from env var name', () => {
    process.env.STRIPE_PRICE_PRO = 'price_123';
    expect(getPriceId('pro')).toBe('price_123');
    delete process.env.STRIPE_PRICE_PRO;
  });

  it('listTiers returns all three tiers', () => {
    const tiers = listTiers();
    expect(tiers.map((t) => t.tier)).toEqual(['starter', 'pro', 'enterprise']);
  });
});
