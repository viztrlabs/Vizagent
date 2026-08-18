import { PostHog } from 'posthog-node';
import type { EventName, EventPropertiesMap } from './events';

let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (posthogClient) return posthogClient;
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST;
  if (!apiKey || !host) {
    console.warn('[Analytics] POSTHOG_API_KEY or POSTHOG_HOST not set');
    return null;
  }
  posthogClient = new PostHog(apiKey, { host, flushAt: 20, flushInterval: 10000 });
  return posthogClient;
}

export interface TrackEventOptions {
  event: EventName;
  properties: EventPropertiesMap[EventName];
  userId: string;
  tenantId: string;
  sessionId: string;
}

export async function trackEvent(options: TrackEventOptions): Promise<void> {
  const client = getPostHogClient();
  if (!client) return;
  const { event, properties, userId, tenantId, sessionId } = options;
  try {
    client.capture({
      distinctId: userId,
      event,
      properties: { ...properties, $lib: 'viztr-server', $lib_version: '0.1.0', session_id: sessionId, tenant_id: tenantId },
      groups: { tenant: tenantId },
    });
  } catch (error) {
    console.error('[Analytics] Track failed:', event, error);
  }
}

export async function shutdownAnalytics(): Promise<void> {
  if (posthogClient) { await posthogClient._shutdown(); posthogClient = null; }
}