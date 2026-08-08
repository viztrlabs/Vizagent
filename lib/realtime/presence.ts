import { getSignalingRedis } from '@/lib/server/lib/signaling';

const PRESENCE_PREFIX = 'collab:presence:';
const MESSAGE_PREFIX = 'collab:messages:';
const PRESENCE_TTL = 30;
const MAX_MESSAGES = 200;

export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  joinedAt: number;
  cursor?: { x: number; y: number };
}

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  type: 'chat' | 'annotation';
  ts: number;
}

const COLORS = ['#00e5ff', '#4ade80', '#fbbf24', '#fb923c', '#a78bfa', '#f472b6', '#38bdf8', '#34d399'];

export function userColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export async function joinPresence(
  roomId: string,
  userId: string,
  name: string
): Promise<Record<string, PresenceUser>> {
  const redis = getSignalingRedis();
  const key = PRESENCE_PREFIX + roomId;
  const user: PresenceUser = { userId, name, color: userColor(userId), joinedAt: Date.now() };
  await redis.hset(key, { [userId]: JSON.stringify(user) });
  await redis.expire(key, PRESENCE_TTL);
  return listPresence(roomId);
}

export async function leavePresence(roomId: string, userId: string): Promise<Record<string, PresenceUser>> {
  const redis = getSignalingRedis();
  const key = PRESENCE_PREFIX + roomId;
  await redis.hdel(key, userId);
  return listPresence(roomId);
}

export async function heartbeat(roomId: string, userId: string): Promise<void> {
  const redis = getSignalingRedis();
  const key = PRESENCE_PREFIX + roomId;
  await redis.expire(key, PRESENCE_TTL);
  const raw = await redis.hget(key, userId);
  if (raw) {
    const user = JSON.parse(raw as string) as PresenceUser;
    user.joinedAt = Date.now();
    await redis.hset(key, { [userId]: JSON.stringify(user) });
  }
}

export async function updateCursor(roomId: string, userId: string, pos: { x: number; y: number }): Promise<void> {
  const redis = getSignalingRedis();
  const key = PRESENCE_PREFIX + roomId;
  const raw = await redis.hget(key, userId);
  if (!raw) return;
  const user = JSON.parse(raw as string) as PresenceUser;
  user.cursor = pos;
  await redis.hset(key, { [userId]: JSON.stringify(user) });
  await redis.expire(key, PRESENCE_TTL);
}

export async function listPresence(roomId: string): Promise<Record<string, PresenceUser>> {
  const redis = getSignalingRedis();
  const key = PRESENCE_PREFIX + roomId;
  const entries = await redis.hgetall(key);
  if (!entries) return {};
  const result: Record<string, PresenceUser> = {};
  for (const [userId, raw] of Object.entries(entries)) {
    try {
      result[userId] = JSON.parse(raw as string) as PresenceUser;
    } catch {
      // skip malformed entries
    }
  }
  return result;
}

let msgSeq = 0;
function messageId(): string {
  return 'm-' + Date.now() + '-' + ++msgSeq;
}

export async function postMessage(
  roomId: string,
  userId: string,
  name: string,
  text: string,
  type: 'chat' | 'annotation' = 'chat'
): Promise<ChatMessage> {
  const redis = getSignalingRedis();
  const key = MESSAGE_PREFIX + roomId;
  const msg: ChatMessage = { id: messageId(), userId, name, text, type, ts: Date.now() };
  await redis.rpush(key, JSON.stringify(msg));
  await redis.ltrim(key, -MAX_MESSAGES, -1);
  await redis.expire(key, 24 * 60 * 60);
  return msg;
}

export async function listMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
  const redis = getSignalingRedis();
  const key = MESSAGE_PREFIX + roomId;
  const raw = await redis.lrange(key, -limit, -1);
  return raw.map((r) => JSON.parse(r as string) as ChatMessage);
}