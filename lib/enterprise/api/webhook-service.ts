// M17: Webhook Service
import { prisma } from '@/lib/db/server';
import { WebhookEvent } from '@prisma/client';

export interface Webhook {
  id: string;
  tenantId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookInput {
  url: string;
  events: WebhookEvent[];
}

export async function createWebhook(tenantId: string, data: WebhookInput): Promise<Webhook> {
  const secret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  const webhook = await prisma.webhook.create({
    data: { tenantId, url: data.url, events: data.events, secret },
  });
  return formatWebhook(webhook);
}

export async function getWebhooks(tenantId: string): Promise<Webhook[]> {
  const webhooks = await prisma.webhook.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  return webhooks.map(formatWebhook);
}

export async function getWebhook(id: string, tenantId: string): Promise<Webhook | null> {
  const webhook = await prisma.webhook.findFirst({ where: { id, tenantId } });
  return webhook ? formatWebhook(webhook) : null;
}

export async function updateWebhook(id: string, tenantId: string, data: Partial<WebhookInput>): Promise<Webhook> {
  const webhook = await prisma.webhook.update({ where: { id, tenantId }, data });
  return formatWebhook(webhook);
}

export async function deleteWebhook(id: string, tenantId: string): Promise<void> {
  await prisma.webhook.delete({ where: { id, tenantId } });
}

export async function deliverWebhook(webhookId: string, event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
  const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook || !webhook.active) return;
  
  const delivery = await prisma.webhookDelivery.create({
    data: { webhookId, event, payload: payload as any, status: 'pending' },
  });
  
  try {
    const signature = await generateSignature(JSON.stringify(payload), webhook.secret);
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-Delivery': delivery.id,
      },
      body: JSON.stringify(payload),
    });
    
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: { status: response.ok ? 'success' : 'failed', response: { status: response.status } as any },
    });
  } catch (error) {
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
}

async function generateSignature(payload: string, secret: string): Promise<string> {
  // HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return 'sha256=' + Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatWebhook(webhook: any): Webhook {
  return {
    ...webhook,
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
  };
}