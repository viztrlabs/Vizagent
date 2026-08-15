# AI Scene Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a configurator user type a prompt and get an applyable AI-generated scene — an LLM-built `ConfigData` plus an OpenAI environment image stored to R2 — run as an async BullMQ job and saved as a `Configuration` variant.

**Architecture:** Mirrors the existing QA flow (T-043): `POST /api/ai/scenes` creates an `AISceneGeneration` row (status `queued`) and enqueues an `ai-scene` BullMQ job; the worker runs LLM config generation → image generation → R2 upload → variant persistence, updating status as it goes; `GET /api/ai/scenes/[id]` polls progress; a new `AIScenePanel` in the configurator sidebar drives it and applies the result with the store's existing `setConfig`.

**Tech Stack:** Next.js App Router, Prisma + Postgres (Supabase), BullMQ + Upstash Redis, `@aws-sdk/client-s3` (R2), `openai` SDK v7, zod v4, the AI Service Layer (`@/lib/ai/client`), existing `withTenant`/repository/queue patterns.

## Global Constraints

- Follow the QA flow's exact patterns (T-043): repository, queue, worker, `withTenant`, route shape.
- Generated config MUST pass `configDataSchema` from `lib/xr/validation.ts` (the store's `setConfig` rejects invalid configs).
- New `AISceneGeneration` model; do NOT modify existing `Configuration`/`XrAsset` models.
- Image generation is non-fatal: a failure still produces a config-only result.
- Prompt length cap: 500 chars (enforced client + server).
- `AI_SCENE_IMAGE_ENABLED` env (default true) disables image generation when `'false'`.
- Tests live next to source as `<name>.test.ts` (jest + ts-jest, root `lib/`).
- Do NOT commit real API keys.

---

### Task 1: Prisma `AISceneGeneration` model + migration

**Files:**
- Modify: `prisma/schema.prisma` (append model)
- Create: migration via `pnpm prisma migrate dev --name add_ai_scene_generation`

**Interfaces:**
- Consumes: existing `Project`/`XrAsset` models
- Produces: model `AISceneGeneration` — fields `id`, `projectId`, `xrAssetId`, `tenantId`, `prompt`, `status`, `configData Json?`, `environmentImageUrl String?`, `error String?`, `createdAt`, `updatedAt`, `completedAt DateTime?`

- [ ] **Step 1: Append the model to `prisma/schema.prisma`**

Add after the `Configuration` model (before `ConfiguratorSession`):

```prisma
model AISceneGeneration {
  id                  String    @id @default(uuid())
  projectId           String    @map("project_id")
  xrAssetId           String    @map("xr_asset_id")
  tenantId            String    @map("tenant_id")
  prompt              String
  status              String    @default("queued")
  configData          Json?     @map("config_data")
  environmentImageUrl String?   @map("environment_image_url")
  error               String?
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  completedAt         DateTime? @map("completed_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([tenantId])
  @@map("ai_scene_generations")
}
```

- [ ] **Step 2: Run the migration**

Run: `pnpm prisma migrate dev --name add_ai_scene_generation`
Expected: migration applied, Prisma client regenerated with `prisma.aISceneGeneration`.

- [ ] **Step 3: Verify the client regenerated**

Run: `rg -n "aISceneGeneration" node_modules/.prisma/client/index.d.ts | head -3`
Expected: the model is present in the generated client.

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(ai): add AISceneGeneration model"
```

---

### Task 2: Scene schema + prompt builders

**Files:**
- Create: `lib/ai/scene-schema.ts`
- Create: `lib/ai/prompts.ts`
- Test: `lib/ai/scene-schema.test.ts`
- Test: `lib/ai/prompts.test.ts`

**Interfaces:**
- Consumes: `z` from `zod`; `materialSchema`, `lightSchema` from `@/lib/xr/validation`
- Produces:
  - `const generateSceneSchema: ZodType<SceneGenerationData>` where `SceneGenerationData = { scene: { bg, exposure, toneMapping, environment }, materials: MaterialData[], lights: LightData[], camera: { position: [n,n,n], target: [n,n,n], fov: number } }`
  - `function generateScenePrompt(brief: string): string`
  - `function buildImagePrompt(brief: string): string`

- [ ] **Step 1: Write the failing test `lib/ai/scene-schema.test.ts`**

```ts
import { generateSceneSchema } from './scene-schema';

const valid = {
  scene: { bg: '#1a1a2e', exposure: 1.2, toneMapping: 'ACES', environment: '' },
  lights: [
    { id: 'l1', name: 'Key', enabled: true, type: 'directional', color: '#ffaa44', intensity: 2.5, position: [5, 8, 3], castShadow: true },
  ],
  camera: { position: [0, 2, 8], target: [0, 1.7, 0], fov: 60 },
  materials: [
    { id: 'm1', name: 'Wood', albedo: '#8b4513', metallic: 0, roughness: 0.8, normalScale: 1, emissiveColor: '#000000', emissiveIntensity: 0, opacity: 1, doubleSided: false },
  ],
};

describe('generateSceneSchema', () => {
  it('accepts a valid scene', () => {
    const res = generateSceneSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects invalid hex color', () => {
    expect(generateSceneSchema.safeParse({ ...valid, scene: { ...valid.scene, bg: 'red' } }).success).toBe(false);
  });

  it('rejects out-of-range exposure', () => {
    expect(generateSceneSchema.safeParse({ ...valid, scene: { ...valid.scene, exposure: 99 } }).success).toBe(false);
  });

  it('rejects bad light type', () => {
    expect(
      generateSceneSchema.safeParse({
        ...valid,
        lights: [{ ...valid.lights[0], type: 'torch' }],
      }).success
    ).toBe(false);
  });

  it('rejects non-numeric camera tuple', () => {
    expect(
      generateSceneSchema.safeParse({ ...valid, camera: { position: [0, 'x', 8], target: [0, 1.7, 0], fov: 60 } }).success
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/ai/scene-schema.test.ts`
Expected: FAIL with "Cannot find module './scene-schema'"

- [ ] **Step 3: Write the failing test `lib/ai/prompts.test.ts`**

```ts
import { generateScenePrompt, buildImagePrompt } from './prompts';

describe('prompts', () => {
  it('embeds the brief in the scene system prompt', () => {
    const p = generateScenePrompt('warm sunset living room');
    expect(p).toContain('warm sunset living room');
    expect(p).toContain('JSON');
    expect(p).toContain('lights');
  });

  it('builds an image prompt that includes the brief', () => {
    const p = buildImagePrompt('warm sunset living room');
    expect(p).toContain('warm sunset living room');
    expect(p).toContain('equirectangular');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test lib/ai/prompts.test.ts`
Expected: FAIL with "Cannot find module './prompts'"

- [ ] **Step 5: Implement `lib/ai/scene-schema.ts`**

```ts
import { z } from 'zod';
import { lightSchema, materialSchema } from '@/lib/xr/validation';

export const generateSceneSchema = z.object({
  scene: z.object({
    bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    exposure: z.number().min(0).max(5),
    toneMapping: z.string(),
    environment: z.string(),
  }),
  lights: z.array(lightSchema).min(1).max(4),
  materials: z.array(materialSchema).max(3),
  camera: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    target: z.tuple([z.number(), z.number(), z.number()]),
    fov: z.number().min(10).max(120),
  }),
});

export type SceneGenerationData = z.infer<typeof generateSceneSchema>;
```

Note: `materialSchema` (intensity 0-100, normalScale 0-2, emissiveIntensity 0-10) and `lightSchema` are reused from `lib/xr/validation.ts` so any output that passes `generateSceneSchema` also passes `configDataSchema` once `objects` is added.

- [ ] **Step 6: Implement `lib/ai/prompts.ts`**

```ts
const SCENE_SYSTEM_PROMPT_TEMPLATE = `You are an expert architectural visualization scene designer for a Babylon.js
configurator. Given a user's brief, produce ONLY a JSON object with this shape:

{
  "scene": { "bg": "#hex", "exposure": 0.0-3.0, "toneMapping": "ACES"|"standard", "environment": "" },
  "lights": [ { "id": "light-1", "name": string, "enabled": true,
    "type": "hemisphere"|"directional"|"point"|"spot", "color": "#hex",
    "intensity": 0-10, "position": [x,y,z], "castShadow": bool } ],
  "camera": { "position": [x,y,z], "target": [x,y,z], "fov": 20-120 },
  "materials": [ { "id": "mat-1", "name": string, "albedo": "#hex",
    "metallic": 0-1, "roughness": 0-1, "normalScale": 0-2,
    "emissiveColor": "#hex", "emissiveIntensity": 0-5,
    "opacity": 0-1, "doubleSided": bool } ]
}

Constraints:
- Always respond with valid JSON only, no markdown fences, no commentary.
- Choose lighting that matches the mood of the brief (warm sunset -> orange
  directional + soft hemisphere).
- Provide 1-4 lights and 0-3 materials tuned to the brief.
- Default camera position [0, 2, 8], target [0, 1.7, 0].
- Use hex colors with #.`;

export function generateScenePrompt(brief: string): string {
  return `${SCENE_SYSTEM_PROMPT_TEMPLATE}

User brief: ${brief}`;
}

export function buildImagePrompt(brief: string): string {
  return `Photorealistic 360-degree equirectangular environment HDRI for a ${brief}. Architectural visualization backdrop, even lighting, no people, no text.`;
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm test lib/ai/scene-schema.test.ts lib/ai/prompts.test.ts`
Expected: PASS (7 tests total)

- [ ] **Step 8: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/ai/scene-schema.ts lib/ai/prompts.ts lib/ai/scene-schema.test.ts lib/ai/prompts.test.ts
git commit -m "feat(ai): add scene schema and prompt builders"
```

---

### Task 3: R2 `putObject` helper + environment image helper

**Files:**
- Modify: `lib/server/lib/r2.ts` (add `PutObjectCommand` import + `putObject` export)
- Modify: `lib/server/lib/r2.test.ts`
- Create: `lib/ai/images.ts`
- Test: `lib/ai/images.test.ts`

**Interfaces:**
- Consumes: existing R2 client pattern (`getR2Client`, `getBucket`)
- Produces:
  - `function putObject(key: string, body: Buffer, contentType?: string): Promise<void>`
  - `function generateEnvironmentImage(prompt: string): Promise<string>` — returns base64-encoded image bytes (no data: prefix)

- [ ] **Step 1: Write the failing test for `putObject` (append to `lib/server/lib/r2.test.ts`)**

```ts
import { PutObjectCommand } from '@aws-sdk/client-s3';
// existing mock import list at top of file
import { putObject } from './r2';

describe('putObject', () => {
  it('uploads bytes to the configured bucket and key', async () => {
    await putObject('ai/environments/abc.png', Buffer.from('x'), 'image/png');
    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'viztr',
        Key: 'ai/environments/abc.png',
        ContentType: 'image/png',
      })
    );
  });
});
```

Note: the existing test file already mocks `@aws-sdk/client-s3`. Add `PutObjectCommand: jest.fn()` to that mock factory, and export `putObject` from the module under test. Confirm the existing `send` mock is the shared instance (the file uses a `send` mock in the factory).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/server/lib/r2.test.ts`
Expected: FAIL with `putObject is not a function`.

- [ ] **Step 3: Add `putObject` to `lib/server/lib/r2.ts`**

Add `PutObjectCommand` to the import from `@aws-sdk/client-s3`, then:

```ts
export async function putObject(
  key: string,
  body: Buffer,
  contentType = 'application/octet-stream'
): Promise<void> {
  const s3 = getR2Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/server/lib/r2.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test `lib/ai/images.test.ts`**

```ts
import OpenAI from 'openai';
import { generateEnvironmentImage } from './images';

jest.mock('openai', () => {
  const generate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn(() => ({ images: { generate } })),
  };
});

const mockOpenAI = OpenAI as unknown as jest.Mock;

describe('generateEnvironmentImage', () => {
  const mockedGenerate = mockOpenAI().images.generate as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.AI_IMAGE_MODEL = 'gpt-image-1';
  });

  it('calls images.generate with b64_json and returns the image bytes', async () => {
    mockedGenerate.mockResolvedValue({
      data: [{ b64_json: 'aGVsbG8=' }],
    });

    const result = await generateEnvironmentImage('warm sunset');
    expect(result).toBe('aGVsbG8=');
    expect(mockedGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'warm sunset', response_format: 'b64_json' })
    );
  });

  it('throws when no image data is returned', async () => {
    mockedGenerate.mockResolvedValue({ data: [] });
    await expect(generateEnvironmentImage('warm sunset')).rejects.toThrow('No image data');
  });

  it('throws when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(generateEnvironmentImage('warm sunset')).rejects.toThrow('OPENAI_API_KEY');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm test lib/ai/images.test.ts`
Expected: FAIL with "Cannot find module './images'"

- [ ] **Step 7: Implement `lib/ai/images.ts`**

```ts
import OpenAI from 'openai';

export async function generateEnvironmentImage(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const client = new OpenAI({ apiKey });
  const response = await client.images.generate({
    model: process.env.AI_IMAGE_MODEL || 'gpt-image-1',
    prompt,
    size: '1024x1024',
    response_format: 'b64_json',
  });
  const image = response.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('No image data returned by image provider');
  }
  return image;
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm test lib/server/lib/r2.test.ts lib/ai/images.test.ts`
Expected: PASS.

- [ ] **Step 9: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/server/lib/r2.ts lib/server/lib/r2.test.ts lib/ai/images.ts lib/ai/images.test.ts
git commit -m "feat(ai): add R2 putObject and environment image helper"
```

---

### Task 4: AI scene repository + queue

**Files:**
- Create: `lib/server/repositories/ai-scene.repository.ts`
- Create: `lib/server/queues/ai-scene.queue.ts`
- Test: `lib/server/repositories/ai-scene.repository.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/db/server`
- Produces:
  - `class AISceneRepository` with `create(projectId, xrAssetId, prompt, tenantId)`, `markRunning(id, tenantId)`, `markSucceeded(id, configData, environmentImageUrl, tenantId)`, `markFailed(id, error, tenantId)`, `findById(id, tenantId)`
  - `function getAiSceneQueue(): Queue` — BullMQ `Queue('ai-scene', { attempts: 2, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: true, removeOnFail: false })`

- [ ] **Step 1: Write the failing test `lib/server/repositories/ai-scene.repository.test.ts`**

```ts
import { prisma } from '@/lib/db/server';
import { AISceneRepository } from './ai-scene.repository';

jest.mock('@/lib/db/server', () => ({
  prisma: {
    aISceneGeneration: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const mockedCreate = prisma.aISceneGeneration.create as jest.Mock;
const mockedUpdate = prisma.aISceneGeneration.update as jest.Mock;

describe('AISceneRepository', () => {
  const repo = new AISceneRepository();
  const tenantId = 't1';

  beforeEach(() => jest.clearAllMocks());

  it('creates a queued generation', async () => {
    mockedCreate.mockResolvedValue({ id: 'g1' });
    const row = await repo.create('p1', 'x1', 'warm sunset', tenantId);
    expect(row).toEqual({ id: 'g1' });
    expect(mockedCreate).toHaveBeenCalledWith({
      data: { projectId: 'p1', xrAssetId: 'x1', prompt: 'warm sunset', tenantId, status: 'queued' },
    });
  });

  it('marks a generation failed with error', async () => {
    mockedUpdate.mockResolvedValue({ id: 'g1' });
    await repo.markFailed('g1', 'boom', tenantId);
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 'g1', tenantId },
      data: expect.objectContaining({ status: 'failed', error: 'boom' }),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/server/repositories/ai-scene.repository.test.ts`
Expected: FAIL with "Cannot find module './ai-scene.repository'"

- [ ] **Step 3: Implement `lib/server/repositories/ai-scene.repository.ts`**

```ts
import { prisma } from '@/lib/db/server';

export class AISceneRepository {
  async create(projectId: string, xrAssetId: string, prompt: string, tenantId: string) {
    return prisma.aISceneGeneration.create({
      data: { projectId, xrAssetId, prompt, tenantId, status: 'queued' },
    });
  }

  async markRunning(id: string, tenantId: string) {
    return prisma.aISceneGeneration.update({
      where: { id, tenantId },
      data: { status: 'running' },
    });
  }

  async markSucceeded(id: string, configData: object, environmentImageUrl: string | null, tenantId: string) {
    return prisma.aISceneGeneration.update({
      where: { id, tenantId },
      data: {
        status: 'succeeded',
        configData: configData as object,
        environmentImageUrl,
        error: null,
        completedAt: new Date(),
      },
    });
  }

  async markFailed(id: string, error: string, tenantId: string) {
    return prisma.aISceneGeneration.update({
      where: { id, tenantId },
      data: { status: 'failed', error, completedAt: new Date() },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.aISceneGeneration.findUnique({ where: { id, tenantId } });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/server/repositories/ai-scene.repository.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Implement `lib/server/queues/ai-scene.queue.ts`**

```ts
import { Queue } from 'bullmq';
import { Redis } from '@upstash/redis';

let redisConnection: Redis | null = null;

function getRedisConnection(): Redis {
  if (!redisConnection) {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN must be set');
    }

    redisConnection = new Redis({ url, token });
  }
  return redisConnection;
}

export function getAiSceneQueue() {
  return new Queue('ai-scene', {
    connection: getRedisConnection() as unknown as import('bullmq').ConnectionOptions,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
}
```

- [ ] **Step 6: Typecheck + full repo/queue test pass**

Run: `pnpm exec tsc --noEmit` then `pnpm test lib/server/repositories/ai-scene.repository.test.ts`
Expected: typecheck PASS, repo tests PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/server/repositories/ai-scene.repository.ts lib/server/repositories/ai-scene.repository.test.ts lib/server/queues/ai-scene.queue.ts
git commit -m "feat(ai): add AI scene repository and queue"
```

---

### Task 5: AI scene worker

**Files:**
- Create: `lib/server/workers/ai-scene.worker.ts`
- Test: `lib/server/workers/ai-scene.worker.test.ts`

**Interfaces:**
- Consumes: `AISceneRepository`, `ConfigurationRepository` (`upsert(xrAssetId, name, data, tenantId)`), `getAiSceneQueue`, `generate()` from `@/lib/ai/client`, `generateScenePrompt`/`buildImagePrompt` from `@/lib/ai/prompts`, `generateSceneSchema` from `@/lib/ai/scene-schema`, `generateEnvironmentImage` from `@/lib/ai/images`, `putObject` from `@/lib/server/lib/r2`, `configDataSchema` from `@/lib/xr/validation`, `withTenant` + `prisma`
- Produces: exports `processAiSceneJob(jobData)` (a pure function for testability) and a default `Worker` instance

- [ ] **Step 1: Write the failing test `lib/server/workers/ai-scene.worker.test.ts`**

```ts
import { processAiSceneJob } from './ai-scene.worker';
import { generate } from '@/lib/ai/client';
import { generateEnvironmentImage } from '@/lib/ai/images';
import { putObject } from '@/lib/server/lib/r2';

jest.mock('@/lib/ai/client', () => ({ generate: jest.fn() }));
jest.mock('@/lib/ai/images', () => ({ generateEnvironmentImage: jest.fn() }));
jest.mock('@/lib/server/lib/r2', () => ({
  putObject: jest.fn(),
  presignGetObject: jest.fn(),
}));

const mockedGenerate = generate as unknown as jest.Mock;
const mockedImage = generateEnvironmentImage as unknown as jest.Mock;
const mockedPutObject = putObject as unknown as jest.Mock;

const validJson = JSON.stringify({
  scene: { bg: '#1a1a2e', exposure: 1.2, toneMapping: 'ACES', environment: '' },
  lights: [{ id: 'l1', name: 'Key', enabled: true, type: 'directional', color: '#ffaa44', intensity: 2.5, position: [5, 8, 3], castShadow: true }],
  camera: { position: [0, 2, 8], target: [0, 1.7, 0], fov: 60 },
  materials: [],
});

// The repository module must be mocked too. Simplest: mock prisma and
// construct AISceneRepository with real prisma mock, OR mock the repo module.
jest.mock('@/lib/server/repositories/ai-scene.repository', () => {
  const marks = {
    create: jest.fn(),
    markRunning: jest.fn(),
    markSucceeded: jest.fn(),
    markFailed: jest.fn(),
    findById: jest.fn(),
  };
  return {
    AISceneRepository: jest.fn(() => marks),
    __testMarks: marks,
  };
});

// Also mock ConfigurationRepository + withTenant + prisma the same way.
```

Then write the actual assertions:

```ts
describe('processAiSceneJob', () => {
  const jobData = { generationId: 'g1', projectId: 'p1', xrAssetId: 'x1', tenantId: 't1', prompt: 'warm sunset' };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_SCENE_IMAGE_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test';
  });

  it('marks running, generates config + image, persists variant, marks succeeded', async () => {
    mockedGenerate.mockResolvedValue({ text: validJson, provider: 'openai', model: 'gpt-4o-mini' });
    mockedImage.mockResolvedValue('aGVsbG8=');
    mockedPutObject.mockResolvedValue(undefined);

    await processAiSceneJob(jobData);

    expect(require('@/lib/server/repositories/ai-scene.repository').__testMarks.markRunning).toHaveBeenCalledWith('g1', 't1');
    expect(require('@/lib/server/repositories/ai-scene.repository').__testMarks.markSucceeded).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({ scene: expect.objectContaining({ environment: 'ai/environments/g1.png' }) }),
      'ai/environments/g1.png',
      't1'
    );
    expect(mockedPutObject).toHaveBeenCalledWith('ai/environments/g1.png', expect.any(Buffer), 'image/png');
  });

  it('marks failed when the LLM output is not valid JSON after retry', async () => {
    mockedGenerate.mockResolvedValue({ text: 'not json', provider: 'openai', model: 'gpt-4o-mini' });
    await processAiSceneJob(jobData);
    expect(require('@/lib/server/repositories/ai-scene.repository').__testMarks.markFailed).toHaveBeenCalledWith(
      'g1',
      expect.any(String),
      't1'
    );
  });

  it('continues config-only when image generation fails', async () => {
    mockedGenerate.mockResolvedValue({ text: validJson, provider: 'openai', model: 'gpt-4o-mini' });
    mockedImage.mockRejectedValue(new Error('image boom'));
    await processAiSceneJob(jobData);
    expect(require('@/lib/server/repositories/ai-scene.repository').__testMarks.markSucceeded).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({ scene: expect.objectContaining({ environment: '' }) }),
      null,
      't1'
    );
  });
});
```

Note: this test mocks the repository modules, `@/lib/ai/client`, `@/lib/ai/images`, and `@/lib/server/lib/r2`. It does NOT mock `withTenant`/`prisma` — the worker must be structured so the pure `processAiSceneJob` performs DB writes through the repositories (which are mocked), keeping the real `withTenant`/prisma usage inside the exported `Worker` callback only.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/server/workers/ai-scene.worker.test.ts`
Expected: FAIL with "Cannot find module './ai-scene.worker'"

- [ ] **Step 3: Implement `lib/server/workers/ai-scene.worker.ts`**

```ts
import { Worker } from 'bullmq';
import { Redis } from '@upstash/redis';
import { prisma } from '@/lib/db/server';
import { withTenant } from '@/lib/server/middleware/tenant';
import { putObject } from '@/lib/server/lib/r2';
import { AISceneRepository } from '@/lib/server/repositories/ai-scene.repository';
import { ConfigurationRepository } from '@/lib/server/repositories/configuration.repository';
import { generate } from '@/lib/ai/client';
import { generateScenePrompt, buildImagePrompt } from '@/lib/ai/prompts';
import { generateSceneSchema } from '@/lib/ai/scene-schema';
import { generateEnvironmentImage } from '@/lib/ai/images';
import { configDataSchema } from '@/lib/xr/validation';

export interface AiSceneJobData {
  generationId: string;
  projectId: string;
  xrAssetId: string;
  tenantId: string;
  prompt: string;
}

const aiSceneRepository = new AISceneRepository();
const configurationRepository = new ConfigurationRepository();

function parseConfigJson(raw: string) {
  const json = JSON.parse(raw) as unknown;
  const parsed = generateSceneSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Generated config failed schema validation: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function processAiSceneJob(jobData: AiSceneJobData): Promise<void> {
  const { generationId, xrAssetId, tenantId, prompt } = jobData;

  await aiSceneRepository.markRunning(generationId, tenantId);

  let configData;
  try {
    const first = await generate({ prompt: 'Generate the scene configuration JSON for the brief.', system: generateScenePrompt(prompt) });
    configData = parseConfigJson(first.text);
  } catch (firstError) {
    const retry = await generate({ prompt: 'Generate the scene configuration JSON for the brief.', system: generateScenePrompt(prompt) });
    configData = parseConfigJson(retry.text);
  }

  let environmentImageUrl: string | null = null;
  if (process.env.AI_SCENE_IMAGE_ENABLED !== 'false') {
    try {
      const b64 = await generateEnvironmentImage(buildImagePrompt(prompt));
      const key = `ai/environments/${generationId}.png`;
      await putObject(key, Buffer.from(b64, 'base64'), 'image/png');
      environmentImageUrl = key;
    } catch (imageError) {
      console.warn(`AI scene image generation failed for ${generationId}:`, imageError);
    }
  }

  const fullConfig = {
    ...configData,
    scene: { ...configData.scene, environment: environmentImageUrl ?? '' },
    objects: [],
  };
  const validated = configDataSchema.safeParse(fullConfig);
  if (!validated.success) {
    throw new Error(`Generated config failed final validation: ${validated.error.message}`);
  }

  const name = `AI: ${prompt.slice(0, 30)}`;
  await configurationRepository.upsert(xrAssetId, name, JSON.stringify(validated.data), tenantId);
  await aiSceneRepository.markSucceeded(generationId, validated.data as object, environmentImageUrl, tenantId);
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

const worker = new Worker(
  'ai-scene',
  async (job) => {
    const jobData = job.data as AiSceneJobData;
    try {
      await withTenant(prisma, jobData.tenantId, async () => {
        await processAiSceneJob(jobData);
      });
    } catch (error) {
      await withTenant(prisma, jobData.tenantId, async () => {
        await aiSceneRepository.markFailed(jobData.generationId, (error as Error).message, jobData.tenantId);
      });
      throw error;
    }
  },
  {
    connection: redis as unknown as import('bullmq').ConnectionOptions,
    concurrency: 2,
  }
);

worker.on('completed', (job) => {
  console.log(`AI scene job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`AI scene job ${job?.id} failed:`, err.message);
});

export default worker;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/server/workers/ai-scene.worker.test.ts`
Expected: PASS (3 tests). If the worker module fails to import (because `new Worker(...)` runs at import time and needs Redis), restructure: guard the worker instantiation behind an `if (process.env.NODE_ENV !== 'test')` block OR export `processAiSceneJob` from a separate module `ai-scene.process.ts` and have the test import from there. Prefer the separate-module approach if import-time Redis connection blocks tests.

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/server/workers/ai-scene.worker.ts lib/server/workers/ai-scene.worker.test.ts
git commit -m "feat(ai): add AI scene worker"
```

---

### Task 6: API routes

**Files:**
- Create: `app/api/ai/scenes/route.ts`
- Create: `app/api/ai/scenes/[id]/route.ts`

**Interfaces:**
- Consumes: `getTenantId` from `@/lib/server/lib/tenant`, `withTenant` + `prisma`, `AISceneRepository`, `getAiSceneQueue`
- Produces:
  - `POST /api/ai/scenes` — body `{ project_id, prompt }`, `201 { generationId }`
  - `GET /api/ai/scenes/[id]` — `200 { generation }` or `404`

- [ ] **Step 1: Implement `app/api/ai/scenes/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { AISceneRepository } from '@/lib/server/repositories/ai-scene.repository';
import { getAiSceneQueue } from '@/lib/server/queues/ai-scene.queue';

const aiSceneRepository = new AISceneRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, prompt } = body as { project_id?: string; prompt?: string };

    if (!project_id) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    }
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: 'prompt must be 500 characters or fewer' }, { status: 400 });
    }

    const tenantId = await getTenantId();

    const xrAsset = await withTenant(prisma, tenantId, async () =>
      prisma.xrAsset.findFirst({
        where: { projectId: project_id, tenantId },
        orderBy: { createdAt: 'asc' },
      })
    );

    if (!xrAsset) {
      return NextResponse.json({ error: 'No 3D asset found for project' }, { status: 400 });
    }

    const generation = await withTenant(prisma, tenantId, async () =>
      aiSceneRepository.create(project_id, xrAsset.id, prompt.trim(), tenantId)
    );

    const queue = getAiSceneQueue();
    await queue.add('ai-scene-run', {
      generationId: generation.id,
      projectId: project_id,
      xrAssetId: xrAsset.id,
      tenantId,
      prompt: prompt.trim(),
    });

    return NextResponse.json({ generationId: generation.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to start AI scene generation:', error);
    return NextResponse.json({ error: 'Failed to start AI scene generation' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement `app/api/ai/scenes/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { AISceneRepository } from '@/lib/server/repositories/ai-scene.repository';

const aiSceneRepository = new AISceneRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId();

    const generation = await withTenant(prisma, tenantId, async () =>
      aiSceneRepository.findById(id, tenantId)
    );

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    return NextResponse.json({
      generation: {
        id: generation.id,
        status: generation.status,
        prompt: generation.prompt,
        configData: generation.configData,
        environmentImageUrl: generation.environmentImageUrl,
        error: generation.error,
        completedAt: generation.completedAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch generation' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/api/ai/scenes/route.ts app/api/ai/scenes/[id]/route.ts
git commit -m "feat(ai): add AI scene generation API routes"
```

---

### Task 7: AI Scene Panel UI + sidebar tab

**Files:**
- Create: `components/configurator/AIScenePanel.tsx`
- Modify: `components/configurator/Sidebar.tsx`

**Interfaces:**
- Consumes: `projectId` prop; `useConfiguratorStore` (`getState().config`, `setConfig`)
- Produces: `AIScenePanel({ projectId }: { projectId: string })`; sidebar tab `ai`

- [ ] **Step 1: Implement `components/configurator/AIScenePanel.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useConfiguratorStore } from '@/lib/store/configurator-store';

interface GenerationStatus {
  id: string;
  status: string;
  configData?: { scene: { environment: string }; lights: unknown[]; materials: unknown[]; camera: unknown; bg?: string };
  environmentImageUrl?: string | null;
  error?: string | null;
}

interface AIScenePanelProps {
  projectId: string;
}

const MAX_PROMPT = 500;

export function AIScenePanel({ projectId }: AIScenePanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [generation, setGeneration] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setConfig = useConfiguratorStore((s) => s.setConfig);

  const poll = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 60;
    const run = async (): Promise<GenerationStatus> => {
      const res = await fetch(`/api/ai/scenes/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch generation');
      const g = data.generation as GenerationStatus;
      if (g.status === 'queued') setProgressStep(1);
      else if (g.status === 'running') setProgressStep(2);
      if (g.status === 'succeeded' || g.status === 'failed') {
        setGeneration(g);
        setLoading(false);
        return g;
      }
      if (attempts >= maxAttempts) {
        setLoading(false);
        setError('Generation timed out. Try again.');
        return g;
      }
      attempts += 1;
      await new Promise((r) => setTimeout(r, 3000));
      return run();
    };
    await run();
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setGeneration(null);
    setProgressStep(0);
    try {
      const res = await fetch('/api/ai/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start generation');
      setProgressStep(1);
      await poll(data.generationId as string);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!generation?.configData) return;
    const current = useConfiguratorStore.getState().config;
    setConfig({
      ...(generation.configData as object),
      objects: current?.objects ?? [],
    } as never);
  };

  const steps = ['Generating scene…', 'Creating environment…'];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading text-cyan">AI Scene</h3>

      <div>
        <label className="text-sm text-gray-400">Describe your scene</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
          placeholder="e.g. warm sunset living room with soft directional light"
          rows={3}
          className="w-full mt-2 p-2 bg-bg border border-gray-700 rounded-md text-sm min-h-touch"
        />
        <p className="text-xs text-gray-500 mt-1">{prompt.length}/{MAX_PROMPT}</p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || loading}
        className="w-full py-2 rounded-md bg-cyan text-bg font-medium hover:bg-cyan/90 disabled:opacity-40 min-h-touch"
      >
        {loading ? 'Generating…' : 'Generate Scene'}
      </button>

      {loading && (
        <div className="space-y-2 text-sm">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className={i <= progressStep ? 'text-cyan' : 'text-gray-600'}>
                {i < progressStep ? '✓' : i === progressStep ? '…' : '•'}
              </span>
              <span className={i <= progressStep ? 'text-gray-200' : 'text-gray-600'}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {generation?.status === 'failed' && (
        <div>
          <p className="text-sm text-red-400">{generation.error || 'Generation failed.'}</p>
          <button
            onClick={handleGenerate}
            className="mt-2 w-full py-2 rounded-md border border-gray-700 text-sm min-h-touch"
          >
            Retry
          </button>
        </div>
      )}

      {generation?.status === 'succeeded' && (
        <div className="space-y-3">
          {generation.environmentImageUrl && (
            <img
              src={`/api/ai/environments/${generation.id}`}
              alt="Generated environment"
              className="w-full rounded-md border border-gray-700"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 py-2 rounded-md bg-cyan text-bg font-medium hover:bg-cyan/90 min-h-touch"
            >
              Apply
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 py-2 rounded-md border border-gray-700 text-sm min-h-touch"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Note: the success thumbnail references `/api/ai/environments/[id]` — the R2 object URL is served via presigned URL elsewhere; for this panel, the simplest correct approach is to render a `<img>` whose `src` is the presigned R2 URL fetched from the generation record. Since the spec stores the R2 **key**, the panel should call `presignGetObject` server-side to render it. Adjust: add `GET /api/ai/scenes/[id]` to also return a presigned URL for `environmentImageUrl` via `presignGetObject` when the key is present (add that one line to the route in Task 6), and set the img `src` to that URL. If `environmentImageUrl` is already a full URL, use it directly.

- [ ] **Step 2: Add the `ai` tab to `Sidebar.tsx`**

Modify the `tabs` array:

```tsx
const tabs = [
  { id: 'ai', label: 'AI Scene', icon: '⚡' },
  { id: 'materials', label: 'Materials', icon: '🎨' },
  { id: 'lighting', label: 'Lighting', icon: '💡' },
  { id: 'hotspots', label: 'Hotspots', icon: '📍' },
  { id: 'export', label: 'Export', icon: '📤' },
  { id: 'ar', label: 'AR', icon: '📱' },
];
```

Add a lazy import:

```tsx
const AIScenePanel = dynamic(
  () => import('./AIScenePanel').then((mod) => mod.AIScenePanel),
  { ssr: false, loading: () => <PanelSkeleton /> }
);
```

And render it in both desktop and mobile content blocks:

```tsx
{activeTab === 'ai' && <AIScenePanel projectId={projectId} />}
```

- [ ] **Step 3: Add the environment image presigned GET route**

Modify `app/api/ai/scenes/[id]/route.ts` to return a renderable URL. Import `presignGetObject` from `@/lib/server/lib/r2` and add:

```ts
const imageUrl = generation.environmentImageUrl
  ? (generation.environmentImageUrl.startsWith('http')
      ? generation.environmentImageUrl
      : await presignGetObject(generation.environmentImageUrl))
  : null;
```

and return `environmentImageUrl: imageUrl` in the JSON payload.

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Build**

Run: `pnpm build`
Expected: PASS, `/api/ai/scenes` and `/api/ai/scenes/[id]` in the route list.

- [ ] **Step 6: Commit**

```bash
git add components/configurator/AIScenePanel.tsx components/configurator/Sidebar.tsx app/api/ai/scenes/[id]/route.ts
git commit -m "feat(ai): add AI Scene panel and sidebar tab"
```

---

### Task 8: README env docs + full verification

**Files:**
- Modify: `README.md` (AI section)

**Interfaces:**
- Consumes: `AI_SCENE_IMAGE_ENABLED`, `AI_IMAGE_MODEL`, `OPENAI_API_KEY`

- [ ] **Step 1: Update the README AI env block**

In the AI providers section (added in T-052), extend the env example:

```env
AI_DEFAULT_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1"
AI_IMAGE_MODEL="gpt-image-1"
AI_SCENE_IMAGE_ENABLED="true"
```

Add one sentence: "`AI_SCENE_IMAGE_ENABLED=false` disables AI environment image generation; `AI_IMAGE_MODEL` sets the image model (default `gpt-image-1`)."

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: all suites PASS (existing 58 + new AI scene suites).

- [ ] **Step 3: Typecheck + build**

Run: `pnpm exec tsc --noEmit` then `pnpm build`
Expected: both PASS.

- [ ] **Step 4: Update TODO.md T-053 row status to done**

Edit `TODO.md` T-053 row: set Status `done`, Done At timestamp, append files touched.

- [ ] **Step 5: Commit**

```bash
git add README.md TODO.md
git commit -m "docs: document AI scene env vars and mark T-053 done"
```

---

## Self-Review

**Spec coverage:**
- `AISceneGeneration` model → Task 1 ✓
- zod `generateSceneSchema` + prompt builders → Task 2 ✓
- R2 `putObject` + image helper → Task 3 ✓
- Repository + BullMQ queue → Task 4 ✓
- Worker (LLM config → image → R2 → variant) → Task 5 ✓
- POST/GET routes with `withTenant` → Task 6 ✓
- AI Scene panel + sidebar tab → Task 7 ✓
- README env docs + verification → Task 8 ✓
- Image failure non-fatal, prompt cap, `AI_SCENE_IMAGE_ENABLED`, attempts=2 → Tasks 5/6 ✓
- Generated config passes `configDataSchema` → Tasks 2 (schema reuse) + 5 (final validation) ✓

**Placeholder scan:** No TBDs; every step has concrete code or commands.

**Type consistency:** `AiSceneJobData` shape `{ generationId, projectId, xrAssetId, tenantId, prompt }` matches the queue add in Task 6 and worker destructuring in Task 5. `markSucceeded(generationId, configData, environmentImageUrl, tenantId)` consistent across repo (Task 4), worker (Task 5), and test (Task 5). `getAiSceneQueue()` used in Task 6 matches Task 4. `generateSceneSchema` uses `SceneGenerationData` (no `objects`) while the worker builds the full `ConfigData` with `objects: []` then validates with `configDataSchema` — consistent.

**Known note:** The `imageUrl` presign addition (Task 7 Step 3) is a small post-spec enhancement to make the environment thumbnail renderable; it changes the GET route to return a presigned URL rather than the raw R2 key.
