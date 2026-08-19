// M14: Invoice Generation — PDF/CSV invoice creation
import Stripe from 'stripe';
import { prisma } from '@/lib/db/server';
import { getStripe } from '@/lib/stripe/server';
import { Tier, getTierConfig } from '@/lib/stripe/tiers';

export interface InvoiceData {
  id: string;
  customer: {
    name: string;
    email: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  subscription: {
    tier: Tier;
    interval: 'monthly' | 'annually';
    periodStart: Date;
    periodEnd: Date;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number; // cents
    amount: number; // cents
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  issuedAt: Date;
  dueAt?: Date;
  paidAt?: Date;
}

export async function generateInvoiceFromStripe(invoiceId: string): Promise<InvoiceData | null> {
  const stripe = getStripe();
  const invoice = await stripe.invoices.retrieve(invoiceId, { expand: ['customer', 'subscription'] });

  if (!invoice.customer || typeof invoice.customer === 'string') {
    return null;
  }

  const customer = invoice.customer;
  const subscription = (invoice as unknown as { subscription?: Stripe.Subscription }).subscription as Stripe.Subscription | null;

  const items = invoice.lines.data.map(line => ({
    description: line.description || (line as unknown as { price?: { product?: string } }).price?.product?.toString() || 'Service',
    quantity: line.quantity || 1,
    unitPrice: (line as unknown as { price?: { unit_amount?: number } }).price?.unit_amount || 0,
    amount: line.amount,
  }));

  const customerData = customer as unknown as Stripe.Customer & { name?: string | null; email?: string | null; address?: Stripe.Address | null };

  return {
    id: invoice.id,
    customer: {
      name: customerData.name || 'Unknown',
      email: customerData.email || '',
      address: customerData.address ? {
        line1: customerData.address.line1 || '',
        line2: customerData.address.line2 || undefined,
        city: customerData.address.city || '',
        state: customerData.address.state || '',
        postal_code: customerData.address.postal_code || '',
        country: customerData.address.country || '',
      } : undefined,
    },
    subscription: {
      tier: (subscription?.metadata?.tier as Tier) || 'free',
      interval: (subscription?.metadata?.interval as 'monthly' | 'annually') || 'monthly',
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    },
    items,
    subtotal: invoice.subtotal,
    tax: (invoice as unknown as { tax?: number }).tax || 0,
    total: invoice.total,
    currency: invoice.currency.toUpperCase(),
    status: invoice.status as InvoiceData['status'],
    issuedAt: new Date(invoice.created * 1000),
    dueAt: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
    paidAt: (invoice as unknown as { status_transitions?: { paid_at?: number } }).status_transitions?.paid_at 
      ? new Date((invoice as unknown as { status_transitions: { paid_at: number } }).status_transitions.paid_at * 1000) 
      : undefined,
  };
}

export function formatInvoiceAsText(invoice: InvoiceData): string {
  const lines: string[] = [
    '========================================',
    'INVOICE',
    '========================================',
    '',
    `Invoice ID: ${invoice.id}`,
    `Status: ${invoice.status.toUpperCase()}`,
    `Date: ${invoice.issuedAt.toLocaleDateString()}`,
    invoice.dueAt ? `Due Date: ${invoice.dueAt.toLocaleDateString()}` : '',
    invoice.paidAt ? `Paid: ${invoice.paidAt.toLocaleDateString()}` : '',
    '',
    'CUSTOMER',
    `  ${invoice.customer.name}`,
    `  ${invoice.customer.email}`,
    invoice.customer.address ? [
      `  ${invoice.customer.address.line1}`,
      invoice.customer.address.line2,
      `${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.postal_code}`,
      invoice.customer.address.country,
    ].filter(Boolean).join('\n') : '',
    '',
    'SUBSCRIPTION',
    `  ${getTierConfig(invoice.subscription.tier)?.name || invoice.subscription.tier} (${invoice.subscription.interval})`,
    `  Period: ${invoice.subscription.periodStart.toLocaleDateString()} - ${invoice.subscription.periodEnd.toLocaleDateString()}`,
    '',
    'ITEMS',
    ...invoice.items.map(item =>
      `  ${item.description.padEnd(40)} ${item.quantity.toString().padStart(3)} x ${(item.unitPrice / 100).toFixed(2).padStart(8)} = ${(item.amount / 100).toFixed(2).padStart(10)}`
    ),
    '',
    'TOTALS',
    `  Subtotal: ${(invoice.subtotal / 100).toFixed(2)} ${invoice.currency}`,
    `  Tax: ${(invoice.tax / 100).toFixed(2)} ${invoice.currency}`,
    `  ─────────────────────────`,
    `  Total: ${(invoice.total / 100).toFixed(2)} ${invoice.currency}`,
    '',
    '========================================',
  ];

  return lines.filter(Boolean).join('\n');
}

export async function createManualInvoice(
  userId: string,
  tier: Tier,
  interval: 'monthly' | 'annually',
  periodStart: Date,
  periodEnd: Date
): Promise<InvoiceData> {
  const config = getTierConfig(tier);
  const price = interval === 'annually' ? config?.annuallyPrice : config?.monthlyPrice;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  return {
    id: `inv_manual_${Date.now()}`,
    customer: {
      name: user?.name || 'Customer',
      email: user?.email || '',
    },
    subscription: { tier, interval, periodStart, periodEnd },
    items: [{
      description: `${config?.name} Plan (${interval})`,
      quantity: 1,
      unitPrice: price || 0,
      amount: price || 0,
    }],
    subtotal: price || 0,
    tax: 0,
    total: price || 0,
    currency: 'USD',
    status: 'draft',
    issuedAt: new Date(),
    dueAt: periodEnd,
  };
}