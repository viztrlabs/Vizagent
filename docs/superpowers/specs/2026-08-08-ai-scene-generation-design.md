# AI Scene Generation + Enhancement Design

**Date:** 2026-08-08
**Status:** Approved
**Sub-project:** Phase 3 / 2 (builds on the AI Service Layer, sub-project 1)

## Goal

Let a configurator user type a prompt ("warm sunset living room") and get a
complete, applyable scene: an AI-generated `ConfigData` (scene exposure, lights,
camera, materials) **plus** an AI-generated environment image, run as an async
BullMQ job and saved as a new configuration variant.

## Context / Existing Patterns

- Config data shape (`lib/types.ts`): `ConfigData = { scene, materials[],
  objects[], lights[], camera }`, serialized to JSON string in `Configuration.data`.
- The codebase uses **API route handlers + `withTenant` + BullMQ queues**, not
  Next.js server actions. The QA flow is the template to mirror:
  - `app/api/qa/route.ts` — POST starts a `qa-run` job; GET polls status.
  - `lib/server/queues/qa.queue.ts` — `getQaQueue()` with Upstash Redis.
  - `lib/server/workers/qa.worker.ts` — BullMQ `Worker`.
- R2 helpers exist for presigned upload/download (`lib/server/lib/r2.ts`) but
  there is **no direct `putObject`** helper yet — one must be added.
- Babylon scene currently uses only `config.scene.bg` + `exposure`; the
  `environment` string field is stored but not rendered. The generated env
  image URL is stored in `ConfigData.scene.environment`; rendering the skydome
  is out of scope for this sub-project (the value is persisted for the viewer).

## Architecture

```
┌────────────┐  POST /api/ai/scenes   ┌──────────────────────┐
│ AI Panel   │ ─────────────────────► │ create row (queued)  │
│ (sidebar)  │                        │ enqueue ai-scene job │
└─────┬──────┘                        └──────────┬───────────┘
      │  poll GET /api/ai/scenes/[id]            │ BullMQ
      ▼                                          ▼
┌────────────┐                     ┌──────────────────────────────┐
│ Apply      │                     │ ai-scene worker              │
│ setConfig  │                     │ 1. LLM -> ConfigData (zod)   │
│ (live 3D)  │                     │ 2. image gen -> R2           │
└────────────┘                     │ 3. save Configuration row    │
                                   └──────────────────────────────┘
```

## Data Model

New Prisma model `AISceneGeneration` (table `ai_scene_generations`):

| column | type | notes |
|---|---|---|
| id | String PK uuid | |
| projectId | String | FK -> project |
| xrAssetId | String | FK -> xr_asset |
| tenantId | String | |
| prompt | String | <= 500 chars |
| status | String | `queued` \| `running` \| `succeeded` \| `failed` |
| configData | Json? | generated ConfigData on success |
| environmentImageUrl | String? | R2 key on success (may be null) |
| error | String? | failure reason |
| createdAt / updatedAt | DateTime | |
| completedAt | DateTime? | |

Indexes: `[projectId]`, `[tenantId]`.

No changes to existing `Configuration` / `XrAsset` models — the variant is a
regular `Configuration` row named `AI: <first 30 chars of prompt>`.

## API Surface

### POST `/api/ai/scenes`

Request: `{ "project_id": string, "prompt": string }`

- Auth: `getTenantId()` (existing server helper).
- Validates `project_id` present and `prompt` non-empty, `<= 500` chars (else 400).
- Creates `AISceneGeneration` (status `queued`), enqueues BullMQ `ai-scene`
  job with `{ generationId, projectId, xrAssetId, tenantId, prompt }`.
- Response `201`: `{ generationId }`.

### GET `/api/ai/scenes/[id]`

- Tenant-scoped read of the generation row.
- Response `200`: `{ generation: { id, status, prompt, configData,
  environmentImageUrl, error, completedAt } }`.
- `404` if not found for this tenant.

## Worker Pipeline (`lib/server/workers/ai-scene.worker.ts`)

1. Mark row `running`.
2. **Step 1 — LLM config:** call `generate()` from the AI service layer with
   the `generateScenePrompt(brief)` system prompt. Parse + validate output with
   zod `generateSceneSchema`. On parse failure, retry the LLM call once; still
   invalid -> status `failed`.
3. **Step 2 — environment image:** if `AI_SCENE_IMAGE_ENABLED !== 'false'`:
   `openai.images.generate({ prompt: buildImagePrompt(brief), size:
   '1024x1024', response_format: 'b64_json' })`, upload the b64 bytes to R2 at
   `ai/environments/{generationId}.png` via new `putObject(key, body)` helper.
   Image failure is non-fatal: continue with `environmentImageUrl = null`.
4. **Step 3 — persist variant:** merge `scene.environment =
   environmentImageUrl` into the validated config, `JSON.stringify`, create a
   `Configuration` row via `ConfigurationRepository.upsert(xrAssetId, name,
   data, tenantId)`.
5. Mark row `succeeded` with `configData` (as parsed JSON) + `completedAt`.

Any thrown error (outside the image non-fatal path) -> status `failed` + error
message; queue `attempts: 2` mirrors the QA queue.

## Prompt & Validation

### System prompt (`lib/ai/prompts.ts`, `generateScenePrompt`)

```
You are an expert architectural visualization scene designer for a Babylon.js
configurator. Given a user's brief, produce ONLY a JSON object with this shape:

{
  "scene": { "bg": "#hex", "exposure": 0.0-3.0, "toneMapping": "aces"|"standard", "environment": "" },
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
- Provide 1-4 lights and 1-3 materials tuned to the brief.
- Default camera position [0, 2, 8], target [0, 1.7, 0].
- Use hex colors with #.
```

The prompt is passed as the user message: `"Scene brief: <brief>"`.

### Image prompt (`buildImagePrompt`)

`"Photorealistic 360-degree equirectangular environment HDRI for a {brief}. Architectural visualization backdrop, even lighting, no people, no text."`

### Zod schema `generateSceneSchema` (`lib/ai/scene-schema.ts`)

Validates the shape above with zod (v4): nested `scene`, arrays `lights`
(1-4), `materials` (0-3), `camera` with numeric tuples. Rejects unknown
provider shapes, out-of-range intensities, non-hex colors.

## UI — AI Panel (`components/configurator/AIScenePanel.tsx`)

- New sidebar tab `ai` ("AI Scene", icon ⚡) added to `Sidebar.tsx` tabs
  array (both desktop and mobile layouts).
- Textarea (max 500 chars) + "Generate" button (disabled while a generation
  is in flight).
- On submit: POST `/api/ai/scenes`, then poll GET every 3s.
- Progress states shown as a step list:
  - queued/running -> "Generating scene…", then "Creating environment…"
  - succeeded -> preview card with the environment image, the config summary,
    and actions: **Apply** (`setConfig(generated.configData)` for live
    preview), **Retry** (re-enqueue), **Discard** (hide card).
  - failed -> error message + Retry.
- Client store stays unchanged (Apply uses the existing `setConfig` action).

## Error Handling & Cost Controls

- LLM + image calls wrapped; `AIProviderError` -> worker -> row `failed`.
- Image failure is non-fatal (config-only result).
- `attempts: 2` on the queue, exponential backoff 1s (matches QA queue).
- Prompt length cap 500 chars enforced client + server.
- `AI_SCENE_IMAGE_ENABLED` env (default true) disables image generation.
- No per-tenant usage metering here — that is the AI usage/billing linkage
  sub-project (T-050).

## Testing

- **Unit — schema:** `scene-schema.test.ts` — valid config passes; invalid
  JSON, missing fields, out-of-range intensity/fov/opacity fail.
- **Unit — prompts:** `prompts.test.ts` — system prompt embeds the brief;
  image prompt includes the brief; no markdown fences in system prompt.
- **Unit — worker:** `ai-scene.worker.test.ts` — mock `generate()`, mocked
  OpenAI images, mocked `putObject`, mocked repo — assert state transitions
  queued->running->succeeded, Configuration row created, image uploaded;
  LLM-invalid-output path retries then fails; image-failure path still
  succeeds config-only.
- **Route tests:** POST validates project_id + prompt (400 paths), returns
  generationId; GET returns status and 404 for missing.
- **Manual e2e:** run `pnpm dev` with a queue + worker, generate from the AI
  panel, confirm variant row in DB and live Apply on the 3D model.

## Out of Scope (later sub-projects)

- Rendering the environment image as a Babylon skydome (viewer sub-project).
- AI usage metering / cost tracking per tenant (AI usage/billing sub-project).
- Prompt history / saved briefs.
- Ollama-specific model tuning beyond the AI service layer's provider routing.
