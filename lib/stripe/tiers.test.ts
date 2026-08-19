import { getTierConfig, getPriceId, listTiers, getPrice, formatPrice, getAnnualSavings } from './tiers';

describe('stripe tiers', () => {
  it('getTierConfig returns config for all tiers', () => {
    expect(getTierConfig('free')?.monthlyPrice).toBe(0);
    expect(getTierConfig('pro')?.monthlyPrice).toBe(4999);
    expect(getTierConfig('studio')?.monthlyPrice).toBe(14999);
    expect(getTierConfig('enterprise')?.monthlyPrice).toBe(39999);
  });

  it('getTierConfig returns undefined for unknown tier', () => {
    expect(getTierConfig('nonexistent')).toBeUndefined();
  });

  it('getPriceId reads from correct env var name', () => {
    process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_monthly';
    process.env.STRIPE_PRICE_PRO_ANNUALLY = 'price_annually';
    expect(getPriceId('pro', 'monthly')).toBe('price_monthly');
    expect(getPriceId('pro', 'annually')).toBe('price_annually');
    delete process.env.STRIPE_PRICE_PRO_MONTHLY;
    delete process.env.STRIPE_PRICE_PRO_ANNUALLY;
  });

  it('getPrice returns correct price for interval', () => {
    expect(getPrice('pro', 'monthly')).toBe(4999);
    expect(getPrice('pro', 'annually')).toBe(Math.round(4999 * 12 * 0.8));
    expect(getPrice('free', 'monthly')).toBe(0);
  });

  it('formatPrice formats correctly', () => {
    expect(formatPrice(4999, 'monthly')).toBe('$49.99/mo');
    expect(formatPrice(47990, 'annually')).toBe('$479.90/yr');
    expect(formatPrice(0, 'monthly')).toBe('Free');
  });

  it('getAnnualSavings calculates correctly', () => {
    expect(getAnnualSavings('pro')).toBe(4999 * 12 - Math.round(4999 * 12 * 0.8));
    expect(getAnnualSavings('free')).toBe(0);
  });

  it('listTiers returns all four tiers', () => {
    const tiers = listTiers();
    expect(tiers.map((t) => t.tier)).toEqual(['free', 'pro', 'studio', 'enterprise']);
  });
});