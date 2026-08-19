export type BillingInterval = 'monthly' | 'annually';

export type Tier = 'free' | 'pro' | 'studio' | 'enterprise';

export interface TierConfig {
  tier: Tier;
  name: string;
  description: string;
  monthlyPrice: number; // in cents
  annuallyPrice: number; // in cents
  priceIdEnv: string; // monthly
  annuallyPriceIdEnv: string; // annually
  features: string[];
  limits: {
    projects: number;
    storageGb: number;
    collaborators: number;
    processingMinutes: number; // per month
    gpuHours: number; // per month
  };
}

const ANNUAL_DISCOUNT = 0.2; // 20% off

export const TIERS: Record<Tier, TierConfig> = {
  free: {
    tier: 'free',
    name: 'Free',
    description: 'For hobbyists and evaluation',
    monthlyPrice: 0,
    annuallyPrice: 0,
    priceIdEnv: '',
    annuallyPriceIdEnv: '',
    features: [
      '1 project',
      '1 GB storage',
      '1 collaborator',
      'Community support',
      'Basic analytics',
      '100 processing minutes/month',
      '1 GPU hour/month',
    ],
    limits: { projects: 1, storageGb: 1, collaborators: 1, processingMinutes: 100, gpuHours: 1 },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    description: 'For growing studios',
    monthlyPrice: 4999, // $49.99
    annuallyPrice: Math.round(4999 * 12 * (1 - ANNUAL_DISCOUNT)), // $479.90/year
    priceIdEnv: 'STRIPE_PRICE_PRO_MONTHLY',
    annuallyPriceIdEnv: 'STRIPE_PRICE_PRO_ANNUALLY',
    features: [
      'Up to 25 projects',
      '100 GB storage',
      '10 collaborators',
      'Priority email support',
      'Advanced analytics',
      'Custom branding',
      '5,000 processing minutes/month',
      '50 GPU hours/month',
    ],
    limits: { projects: 25, storageGb: 100, collaborators: 10, processingMinutes: 5000, gpuHours: 50 },
  },
  studio: {
    tier: 'studio',
    name: 'Studio',
    description: 'For professional studios and agencies',
    monthlyPrice: 14999, // $149.99
    annuallyPrice: Math.round(14999 * 12 * (1 - ANNUAL_DISCOUNT)), // $1,439.90/year
    priceIdEnv: 'STRIPE_PRICE_STUDIO_MONTHLY',
    annuallyPriceIdEnv: 'STRIPE_PRICE_STUDIO_ANNUALLY',
    features: [
      'Up to 100 projects',
      '500 GB storage',
      '50 collaborators',
      'Priority support (email + chat)',
      'Advanced analytics + custom reports',
      'Custom branding + white-label',
      'API access',
      '25,000 processing minutes/month',
      '200 GPU hours/month',
    ],
    limits: { projects: 100, storageGb: 500, collaborators: 50, processingMinutes: 25000, gpuHours: 200 },
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and firms',
    monthlyPrice: 39999, // $399.99
    annuallyPrice: Math.round(39999 * 12 * (1 - ANNUAL_DISCOUNT)), // $3,839.90/year
    priceIdEnv: 'STRIPE_PRICE_ENTERPRISE_MONTHLY',
    annuallyPriceIdEnv: 'STRIPE_PRICE_ENTERPRISE_ANNUALLY',
    features: [
      'Unlimited projects',
      '2 TB storage',
      'Unlimited collaborators',
      'Dedicated support + Slack channel',
      'Custom integrations',
      'SLA guarantee (99.9%)',
      'SSO (SAML/OIDC)',
      'Audit logs',
      'Unlimited processing minutes',
      'Unlimited GPU hours',
    ],
    limits: { projects: -1, storageGb: 2000, collaborators: -1, processingMinutes: -1, gpuHours: -1 },
  },
};

export function getTierConfig(tier: string): TierConfig | undefined {
  return TIERS[tier as Tier];
}

export function getPriceId(tier: string, interval: BillingInterval = 'monthly'): string | undefined {
  const config = getTierConfig(tier);
  if (!config) return undefined;
  return process.env[interval === 'annually' ? config.annuallyPriceIdEnv : config.priceIdEnv];
}

export function getPrice(tier: string, interval: BillingInterval = 'monthly'): number {
  const config = getTierConfig(tier);
  if (!config) return 0;
  return interval === 'annually' ? config.annuallyPrice : config.monthlyPrice;
}

export function listTiers(): TierConfig[] {
  return Object.values(TIERS);
}

export function formatPrice(priceCents: number, interval: BillingInterval = 'monthly'): string {
  if (priceCents === 0) return 'Free';
  const dollars = (priceCents / 100).toFixed(2);
  return `$${dollars}/${interval === 'monthly' ? 'mo' : 'yr'}`;
}

export function getAnnualSavings(tier: string): number {
  const config = getTierConfig(tier);
  if (!config || config.monthlyPrice === 0) return 0;
  return config.monthlyPrice * 12 - config.annuallyPrice;
}