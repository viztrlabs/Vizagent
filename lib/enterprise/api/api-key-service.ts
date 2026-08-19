// M17: API Key Management Service
import { prisma } from '@/lib/db/server';
import { ApiKeyStatus } from '@prisma/client';

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  status: ApiKeyStatus;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyInput {
  name: string;
  scopes?: string[];
  expiresAt?: Date;
}

export async function createApiKey(tenantId: string, data: ApiKeyInput): Promise<{ apiKey: ApiKey; rawKey: string }> {
  const rawKey = `vztr_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  const keyPrefix = `vztr_${rawKey.substring(4, 12)}`;
  const keyHash = await hashKey(rawKey);
  
  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      name: data.name,
      keyHash,
      keyPrefix,
      scopes: data.scopes || ['read'],
      expiresAt: data.expiresAt,
    },
  });
  
  return {
    apiKey: formatApiKey(apiKey),
    rawKey,
  };
}

export async function getApiKeys(tenantId: string): Promise<ApiKey[]> {
  const keys = await prisma.apiKey.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  return keys.map(formatApiKey);
}

export async function getApiKey(id: string, tenantId: string): Promise<ApiKey | null> {
  const key = await prisma.apiKey.findFirst({ where: { id, tenantId } });
  return key ? formatApiKey(key) : null;
}

export async function revokeApiKey(id: string, tenantId: string): Promise<void> {
  await prisma.apiKey.update({ where: { id, tenantId }, data: { status: 'REVOKED' } });
}

export async function updateApiKeyLastUsed(id: string): Promise<void> {
  await prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } });
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatApiKey(key: any): ApiKey {
  return {
    ...key,
    createdAt: key.createdAt.toISOString(),
    updatedAt: key.updatedAt.toISOString(),
    expiresAt: key.expiresAt?.toISOString() || null,
    lastUsedAt: key.lastUsedAt?.toISOString() || null,
  };
}