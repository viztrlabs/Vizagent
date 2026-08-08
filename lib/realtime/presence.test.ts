jest.mock('@/lib/server/lib/signaling', () => {
  const store: Record<string, Record<string, string>> = {};
  return {
    getSignalingRedis: () => ({
      hset: jest.fn(async (key: string, val: Record<string, string>) => {
        store[key] = { ...(store[key] || {}), ...val };
      }),
      hget: jest.fn(async (key: string, field: string) => store[key]?.[field] ?? null),
      hdel: jest.fn(async (key: string, field: string) => { delete (store[key] || {})[field]; }),
      hgetall: jest.fn(async (key: string) => store[key] || null),
      expire: jest.fn(async () => 1),
      rpush: jest.fn(async (key: string, val: string) => {
        (store[key] = store[key] || {})['_list'] = ((store[key]['_list'] as unknown as string[]) || []).concat([val]) as unknown as string;
      }),
      ltrim: jest.fn(async () => 'OK'),
      lrange: jest.fn(async (key: string, start: number, stop: number) => {
        const list = (store[key]?.['_list'] as unknown as string[]) || [];
        return list.slice(start >= 0 ? start : list.length + start);
      }),
    }),
  };
});

import { joinPresence, leavePresence, listPresence, postMessage, listMessages, userColor } from './presence';

describe('realtime presence', () => {
  it('joinPresence adds a user and lists them', async () => {
    await joinPresence('room-1', 'u1', 'Alice');
    const presence = await listPresence('room-1');
    expect(presence['u1']).toBeDefined();
    expect(presence['u1'].name).toBe('Alice');
  });

  it('leavePresence removes the user', async () => {
    await joinPresence('room-2', 'u2', 'Bob');
    await leavePresence('room-2', 'u2');
    const presence = await listPresence('room-2');
    expect(presence['u2']).toBeUndefined();
  });

  it('userColor returns a stable color per user', () => {
    expect(userColor('user-a')).toBe(userColor('user-a'));
  });

  it('postMessage and listMessages round-trip', async () => {
    await postMessage('room-3', 'u3', 'Carol', 'hello world', 'chat');
    const msgs = await listMessages('room-3');
    expect(msgs.length).toBe(1);
    expect(msgs[0].text).toBe('hello world');
    expect(msgs[0].userId).toBe('u3');
  });
});