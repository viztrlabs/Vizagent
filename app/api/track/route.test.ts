import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/analytics/server', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({
  getCurrentAuth: vi.fn(() => Promise.resolve({
    authUser: { id: 'user-1', email: 'test@example.com' },
    dbUser: { id: 'db-user-1', role: 'USER', tenantId: 'tenant-1' },
    role: 'USER', tenantId: 'tenant-1',
  })),
}));

describe('POST /api/track', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 403 when consent cookie is missing', async () => {
    const request = new Request('http://localhost/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'signup_started', properties: { method: 'email', referrer: '' } }),
    });
    const { POST } = await import('./route');
    const response = await POST(request as any);
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid event name', async () => {
    const request = new Request('http://localhost/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'viztr-cookie-consent=accepted' },
      body: JSON.stringify({ event: 'invalid_event', properties: {} }),
    });
    const { POST } = await import('./route');
    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('returns 202 for valid event', async () => {
    const request = new Request('http://localhost/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'viztr-cookie-consent=accepted' },
      body: JSON.stringify({ event: 'signup_started', properties: { method: 'email', referrer: '' } }),
    });
    const { POST } = await import('./route');
    const response = await POST(request as any);
    expect(response.status).toBe(202);
  });
});