import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

export function getSignalingRedis(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN must be set');
    }

    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

const ROOM_PREFIX = 'webrtc:room:';
const ROOM_TTL = 24 * 60 * 60;

export async function createRoom(roomId: string): Promise<void> {
  const redis = getSignalingRedis();
  const key = `${ROOM_PREFIX}${roomId}`;
  await redis.set(key, JSON.stringify({ peers: [], createdAt: Date.now() }), { ex: ROOM_TTL });
}

export async function getRoom(roomId: string): Promise<{ peers: string[]; createdAt: number } | null> {
  const redis = getSignalingRedis();
  const key = `${ROOM_PREFIX}${roomId}`;
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data as string);
}

export async function addPeer(roomId: string, userId: string): Promise<string[]> {
  const redis = getSignalingRedis();
  const key = `${ROOM_PREFIX}${roomId}`;
  const room = await getRoom(roomId);
  if (!room) {
    await createRoom(roomId);
  }
  const updatedRoom = await getRoom(roomId) || { peers: [], createdAt: Date.now() };
  if (!updatedRoom.peers.includes(userId)) {
    updatedRoom.peers.push(userId);
    await redis.set(key, JSON.stringify(updatedRoom), { ex: ROOM_TTL });
  }
  return updatedRoom.peers;
}

export async function removePeer(roomId: string, userId: string): Promise<string[]> {
  const redis = getSignalingRedis();
  const key = `${ROOM_PREFIX}${roomId}`;
  const room = await getRoom(roomId);
  if (!room) return [];
  const updatedPeers = room.peers.filter((id: string) => id !== userId);
  if (updatedPeers.length === 0) {
    await redis.del(key);
    return [];
  }
  await redis.set(key, JSON.stringify({ ...room, peers: updatedPeers }), { ex: ROOM_TTL });
  return updatedPeers;
}
