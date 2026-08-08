export type Tier = 'starter' | 'pro' | 'enterprise';

export interface TierConfig {
  tier: Tier;
  name: string;
  description: string;
  monthlyPrice: number;
  priceIdEnv: string;
  features: string[];
  limits: {
    projects: number;
    storageGb: number;
    collaborators: number;
  };
}

export const TIERS: Record<Tier, TierConfig> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    description: 'For individuals and small projects',
    monthlyPrice: 299,
    priceIdEnv: 'STRIPE_PRICE_STARTER',
    features: [
      'Up to 5 projects',
      '10 GB storage',
      '2 collaborators',
      'Email support',
      'Basic analytics',
    ],
    limits: { projects: 5, storageGb: 10, collaborators: 2 },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    description: 'For growing studios',
    monthlyPrice: 499,
    priceIdEnv: 'STRIPE_PRICE_PRO',
    features: [
      'Up to 25 projects',
      '100 GB storage',
      '10 collaborators',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
    ],
    limits: { projects: 25, storageGb: 100, collaborators: 10 },
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and firms',
    monthlyPrice: 799,
    priceIdEnv: 'STRIPE_PRICE_ENTERPRISE',
    features: [
      'Unlimited projects',
      '1 TB storage',
      'Unlimited collaborators',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'SSO',
    ],
    limits: { projects: -1, storageGb: 1000, collaborators: -1 },
  },
};

export function getTierConfig(tier: string): TierConfig | undefined {
  return TIERS[tier as Tier];
}

export function getPriceId(tier: string): string | undefined {
  return process.env[getTierConfig(tier)?.priceIdEnv ?? ''];
}

export function listTiers(): TierConfig[] {
  return Object.values(TIERS);
}
