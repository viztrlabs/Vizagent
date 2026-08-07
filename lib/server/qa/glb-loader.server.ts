import type { QACheck } from '@/lib/types';

export const GLB_LOADABLE = 'glb-loadable';

const NAME_RE = /^[a-z0-9-]+\.(glb)$/i;

export interface GlbParseResult {
  ok: boolean;
  error?: string;
  meshCount?: number;
}

/**
 * Parse a GLB binary container without a 3D runtime.
 * Validates: magic number, version 2, total length, JSON chunk type + parse,
 * required glTF 2.0 fields (asset/scenes/nodes/meshes), and buffer consistency.
 * This catches the real-world corruption modes (truncation, bad headers,
 * invalid JSON, missing required fields) deterministically and fast.
 */
export function parseGlb(buffer: ArrayBuffer | Buffer): GlbParseResult {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (buf.length < 12) return { ok: false, error: 'File too small to be a GLB' };

  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) return { ok: false, error: `Bad magic: expected glTF, got 0x${magic.toString(16)}` };

  const version = buf.readUInt32LE(4);
  if (version !== 2) return { ok: false, error: `Unsupported GLB version ${version}` };

  const totalLen = buf.readUInt32LE(8);
  if (totalLen !== buf.length) return { ok: false, error: `Length mismatch: header says ${totalLen}, file is ${buf.length}` };

  // First chunk must be JSON
  const jsonLen = buf.readUInt32LE(12);
  const jsonType = buf.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) return { ok: false, error: 'First chunk is not JSON' };

  const jsonStart = 20;
  const jsonEnd = jsonStart + jsonLen;
  if (jsonEnd > buf.length) return { ok: false, error: 'JSON chunk exceeds file length' };

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(buf.subarray(jsonStart, jsonEnd).toString('utf8'));
  } catch (e) {
    return { ok: false, error: `JSON chunk parse error: ${(e as Error).message}` };
  }

  const required = ['asset', 'scenes', 'nodes', 'meshes'];
  for (const k of required) {
    if (!(k in json)) return { ok: false, error: `Missing required glTF field: ${k}` };
  }
  const asset = json.asset as Record<string, unknown> | undefined;
  if (!asset || asset.version !== '2.0') return { ok: false, error: 'asset.version must be 2.0' };

  const buffers = (json.buffers as Array<{ byteLength?: number }> | undefined) || [];
  const bufferViews = (json.bufferViews as Array<unknown> | undefined) || [];
  if (buffers.length && bufferViews.length) {
    const binLen = buffers.reduce((s, b) => s + (b.byteLength || 0), 0);
    if (binLen === 0) return { ok: false, error: 'buffers declare zero length but bufferViews exist' };
  }

  return { ok: true, meshCount: (json.meshes as unknown[] | undefined)?.length ?? 0 };
}

export function isGlbFileName(name: string): boolean {
  return NAME_RE.test(name);
}
