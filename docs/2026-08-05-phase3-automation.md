# Phase 3 — Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Operationalize the automation spine: website auto-update (Content-as-Code), the 13-agent system over a Universal MCP Connector, Hermes local runner, Connect/Publish workflow, upload pipeline, job queue, and the QA gate.

**Architecture:** LangGraph (CEO orchestrator, online) + AgentGPT (12 worker agents, online browser multi-agent) + Hermes (local runner) coordinated through a Universal MCP Connector (§10.1/§10.4). BullMQ + Redis is the job backbone (§6.1). Supabase hosts `agent_runs` + `website_pages` tables; content updates are Content-as-Code through GitHub + CI (§10.9).

**Tech Stack:** LangGraph (JS), AgentGPT (self-hosted), Node.js 20, BullMQ 5, Redis 7, Supabase Edge Functions, GitHub REST, Vercel API, zod.

## Global Constraints

- Minimal Software Rule (§21.4): LangGraph owns orchestration (online), AgentGPT owns task crews (online), Hermes owns local ops — no additional orchestration framework.
- LLM Smart Routing (§21.4): gpt-4o-mini (fast/cheap), gpt-4.1 (complex), o3-mini (reasoning); all via API-provider LLMs (OmniRoute → OpenAI → OpenRouter → Groq) (§21.6).
- Every agent run persists to `agent_runs` (§10.7).
- Per-agent budgets: manifest entries set `maxTokensPerRun`; runs stop (and `agent_runs.status` flips to FAILED) once the budget/credit limit is exceeded (§18.4).
- Website updates are Content-as-Code with a human approval gate before publish (§10.9).
- Upload pipeline: validation (type/size/content scan) before storage (§11.2).
- QA gate is non-negotiable before publish (§12.3).
- Connect/Publish is hybrid local+cloud (§12.5).

---

### Task 1: Job queue foundation (BullMQ)

**Files:**
- Create: `packages/queue/src/index.ts`
- Create: `packages/queue/src/workers/process-asset.ts`
- Create: `packages/queue/src/workers/render.ts`
- Create: `packages/queue/src/workers/notify.ts`
- Test: `packages/queue/test/queue.test.ts`

**Interfaces:**
- Consumes: `getSupabaseClient` (Phase 0/1 Task 7).
- Produces: `createQueue(name, redisUrl)`, `enqueue(queue, jobName, payload)`, worker factories `processAssetWorker`, `renderWorker`, `notifyWorker`; Redis connection string from `REDIS_URL`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createQueue } from "../src/index";
describe("queue", () => {
  it("creates a BullMQ queue", () => {
    const q = createQueue("assets", "redis://localhost:6379");
    expect(q.name).toBe("assets");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/queue test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
import { Queue } from "bullmq";
export function createQueue(name: string, redisUrl: string): Queue {
  return new Queue(name, { connection: { url: redisUrl } });
}
export async function enqueue(queue: Queue, jobName: string, payload: unknown) {
  return queue.add(jobName, payload, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });
}
```

`workers/process-asset.ts`: worker consuming `asset.process` — steps: download source → validate → optimize → store → emit `asset.optimized`. `render.ts`: consumes `render.start`, resolves GPU/CLOUD lane. `notify.ts`: consumes `notify.send`, dispatches Resend/Twilio. Expose `@bull-board/fastify` at `/admin/queue` in the admin panel for failed-job visibility (DLQ inspection).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/queue test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/queue
git commit -m "feat(queue): add BullMQ queue factory, enqueue helper, and three workers"
```

---

### Task 2: Upload pipeline

**Files:**
- Create: `apps/web/app/api/upload/route.ts`
- Create: `packages/queue/src/jobs/upload.ts`
- Test: `packages/queue/test/upload.test.ts`

**Interfaces:**
- Consumes: Task 1 `enqueue`, Task 5 (Phase 2) `getProject`.
- Produces: `POST /api/upload` (resumable multipart, `allowedTypes`, `maxSizeBytes`, virus/content scan hook) → stores to Cloudflare R2 → enqueues `asset.process`.

- [ ] **Step 1: Write the failing test**

```ts
import { validateUpload } from "../src/jobs/upload";
describe("upload validation", () => {
  it("rejects unsupported files", () => {
    expect(validateUpload("malware.exe", 1024, ["image/png", "model/gltf-binary"]).ok).toBe(false);
  });
  it("rejects oversized files", () => {
    expect(validateUpload("a.glb", 5_000_000_000, ["model/gltf-binary"], 1_000_000_000).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/queue test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
export interface UploadCheck { ok: boolean; reason?: string }
export function validateUpload(filename: string, bytes: number, allowedTypes: string[], maxBytes = 1_000_000_000): UploadCheck {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", glb: "model/gltf-binary", mp4: "video/mp4", webm: "video/webm", fbx: "model/fbx", max: "model/max" };
  if (!allowedTypes.includes(mimeMap[ext ?? ""] ?? "")) return { ok: false, reason: "type" };
  if (bytes > maxBytes) return { ok: false, reason: "size" };
  return { ok: true };
}
```

API route validates → stores via `getServiceClient().storage.from("assets").upload` → `enqueue(assets, "asset.process", { path, orgId, projectId })`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/queue test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/upload packages/queue/src/jobs/upload.ts packages/queue/test/upload.test.ts
git commit -m "feat(upload): add validated upload API route enqueuing asset processing"
```

---

### Task 3: Website auto-update (Content-as-Code)

**Files:**
- Create: `packages/database/src/content.ts`
- Create: `apps/agent-api/routes/content-update.ts`
- Create: `packages/queue/src/jobs/content-deploy.ts`
- Test: `packages/database/test/content.test.ts`

**Interfaces:**
- Consumes: `agent_runs` + `website_pages` (Phase 0/1 Task 2), Task 1 queue.
- Produces: `applyContentChange(db, pageSlug, content, actor)` (upserts `website_pages`), `requestContentDeploy(env)` (opens GitHub PR), `approveAndDeploy(env)` (merges → Vercel build).
- i18n: `website_pages` content updates carry a `locale` field (English base + translations), consistent with the i18n strategy — content agents write per-locale MDX.

- [ ] **Step 1: Write the failing test**

```ts
import { applyContentChange } from "../src/content";
describe("content-as-code", () => {
  it("upserts a page row", async () => {
    const db = { website_pages: { upsert: async (a: any) => a } };
    const r = await applyContentChange(db as any, "services", { title: "XR Services" }, "agent-9");
    expect(r.where.slug).toBe("services");
    expect(r.create.content).toEqual({ title: "XR Services" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
export async function applyContentChange(db: any, slug: string, content: unknown, actor: string) {
  return db.website_pages.upsert({
    where: { slug },
    create: { slug, content, updatedBy: actor },
    update: { content, updatedBy: actor },
  });
}
```

`content-deploy.ts`: job writes `content/<slug>.json` to the content repo, opens a PR (`PULL_REQUEST`), waits; `approveAndDeploy` merges PR and triggers Vercel deploy hook. Human approval gate enforced in `requestContentDeploy` (returns PR URL, no auto-merge); the PR body links a Vercel `/preview` URL so the rendered page is reviewed before the approval gate. Blog/service-page images upload via the Task 2 upload API → Supabase Storage (`website_pages` stores the public URL); R2 is used for heavy assets (video/GLB).

- **Time-boxed auto-approval:** non-critical content updates auto-approve (merge the PR) after 24h with no human review (configurable via env, e.g. `CONTENT_AUTO_APPROVE_HOURS`), so a solo-founder outage never blocks content updates. Critical changes (pricing, legal) always require manual approval.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/database test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/content.ts apps/agent-api/routes/content-update.ts packages/queue/src/jobs/content-deploy.ts packages/database/test/content.test.ts
git commit -m "feat(content): add Content-as-Code page upsert and PR-based deploy flow"
```

---

### Task 4: Universal MCP Connector

**Files:**
- Create: `packages/mcp/src/index.ts`
- Create: `packages/mcp/src/tools/registry.ts`
- Test: `packages/mcp/test/mcp.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `registerTool(name, fn)`, `executeTool(name, args)`; tool registry seeded with `supabase.query`, `github.create_pr`, `vercel.deploy`, `files.read_local`, `unreal.start_stream`, `llm.complete` (§10.4 diagram: dashboard ↔ Supabase/GitHub/Vercel/Files/Unreal/API LLMs).

- [ ] **Step 1: Write the failing test**

```ts
import { registerTool, executeTool } from "../src/index";
describe("mcp connector", () => {
  it("executes a registered tool", async () => {
    registerTool("echo.ping", async (a: any) => ({ pong: a }));
    expect(await executeTool("echo.ping", { id: 1 })).toEqual({ pong: { id: 1 } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/mcp test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
type ToolFn = (args: any) => Promise<unknown>;
const tools = new Map<string, ToolFn>();
export function registerTool(name: string, fn: ToolFn) { tools.set(name, fn); }
export async function executeTool(name: string, args: unknown) {
  const fn = tools.get(name);
  if (!fn) throw new Error(`tool not found: ${name}`);
  return fn(args);
}
```

`registry.ts` seeds the six tools above (stubs call real SDKs in production, env-guarded in tests).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/mcp test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp
git commit -m "feat(mcp): add Universal MCP Connector with tool registry"
```

---

### Task 5: CEO orchestrator (LangGraph) + 13-agent taxonomy

**Files:**
- Create: `apps/agent-api/src/orchestrator/graph.ts`
- Create: `apps/agent-api/src/agents/agents.ts` (13-agent manifest §10.1)
- Create: `apps/agent-api/src/routing/llm-router.ts`
- Test: `apps/agent-api/test/orchestrator.test.ts`

**Interfaces:**
- Consumes: Task 4 MCP connector, `agent_runs` table.
- Produces: `runMission(input)` (CEO plan → crew execution → persist), `agents` array (13 entries: CEO, Hermes, 5 service, and 7 internal incl. Website Developer/Finance/Analytics/QA/Support/Design/ops), `routeLlm(task)` returning `{ provider, model }` (§21.4 table).

- [ ] **Step 1: Write the failing test**

```ts
import { routeLlm } from "../src/routing/llm-router";
describe("llm router", () => {
  it("routes cheap tasks to gpt-4o-mini", () => {
    expect(routeLlm({ kind: "summarize", complexity: "low" }).model).toBe("gpt-4o-mini");
  });
  it("routes complex tasks to gpt-4.1", () => {
    expect(routeLlm({ kind: "qa-review", complexity: "high" }).model).toBe("gpt-4.1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/agent-api test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`llm-router.ts`:
```ts
export function routeLlm(task: { kind: string; complexity: "low" | "medium" | "high" }) {
  if (task.complexity === "high") return { provider: "openai", model: "gpt-4.1" };
  if (task.kind === "reasoning") return { provider: "openai", model: "o3-mini" };
  return { provider: "openai", model: "gpt-4o-mini" };
}
```

`agents.ts`: manifest array with `id, name, responsibility, tools[]` for all 13 agents (§10.1/§10.3). `graph.ts`: LangGraph StateGraph — `PLAN` (CEO) → `DISPATCH` (AgentGPT) → `EXECUTE` (via MCP) → `RECORD` (agent_runs) → `REVIEW`.

**AgentGPT dispatch API contract:** the CEO emits a dispatch message on PLAN → DISPATCH that each AgentGPT worker consumes, then replies when the run finishes:

```json
{
  "taskId": "run_01JX...",
  "objective": "Update the Services page copy per content/website_v2/services.json",
  "toolAllowlist": ["github.create_pr", "supabase.query"],
  "maxTokensPerRun": 4000,
  "input": { "slug": "services", "content": { "title": "XR Services" } },
  "priority": "high"
}
```

Expected return:

```json
{
  "taskId": "run_01JX...",
  "status": "done",
  "output": { "prUrl": "https://github.com/viztr/content/pull/42" },
  "usage": { "tokens": 3120, "costUsd": 0.012 }
}
```

`status` is `"done" | "failed"`; the CEO records `output`/`usage` into `agent_runs` and re-dispatches failed tasks with backoff (max 3 attempts) before surfacing to the admin.

- **FALLBACK / ESCALATE nodes:** the graph gains two additional nodes after `EXECUTE` — `FALLBACK` retries a failed task with an alternate model / lower-cost route (§21.4); `ESCALATE` marks the run `BLOCKED` and alerts the admin via `notify.send` (no silent failure). Escalated runs are visible in the admin panel and can be halted by the `/admin/agents/emergency-stop` route (M3 checkpoint).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/agent-api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/agent-api
git commit -m "feat(agents): add CEO LangGraph orchestrator, 13-agent manifest, LLM router"
```

---

### Task 6: Hermes Agent (local runner)

**Files:**
- Create: `apps/agent-api/src/hermes/runner.ts`
- Create: `scripts/hermes-launcher.bat`
- Create: `packages/mcp/src/tools/hermes.ts`
- Test: `apps/agent-api/test/hermes.test.ts`

**Interfaces:**
- Consumes: MCP `ollama.run` + `unreal.start_stream` tools.
- Produces: `startHermes(config)` (launches local process via `.bat`, health-checks `GET /health`), `runLocalJob(job)` (maps to local Unreal lanes), `.bat` launcher for the local workstation (§10.3/§21.6/§9.6).

- [ ] **Step 1: Write the failing test**

```ts
import { parseLauncherArgs } from "../src/hermes/runner";
describe("hermes runner", () => {
  it("parses launcher args", () => {
    expect(parseLauncherArgs("--stream --project villa")).toEqual({ stream: true, project: "villa" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/agent-api test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

`runner.ts`:
```ts
export function parseLauncherArgs(raw: string): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  const parts = raw.trim().split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("--")) {
      const key = parts[i].slice(2);
      const next = parts[i + 1];
      out[key] = next && !next.startsWith("--") ? (i++, next) : true;
    }
  }
  return out;
}
```

`hermes-launcher.bat`: sets env (WORKSTATION_ID, PROJECT_DIR), starts local agent process, prints health URL. `hermes.ts` MCP tool wraps `runLocalJob`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/agent-api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/agent-api/src/hermes scripts/hermes-launcher.bat packages/mcp/src/tools/hermes.ts apps/agent-api/test/hermes.test.ts
git commit -m "feat(hermes): add Hermes local runner, launcher, and MCP tool"
```

---

### Task 7: Connect / Publish workflow

**Files:**
- Create: `packages/database/src/publish.ts`
- Create: `apps/web/app/api/publish/route.ts`
- Create: `apps/web/components/publish/publish-button.tsx`
- Test: `packages/database/test/publish.test.ts`

**Interfaces:**
- Consumes: QA gate (Task 8), MCP `vercel.deploy`, `github.create_pr`.
- Produces: `canPublish(db, projectId)` (project APPROVED + QA passed), `publishProject(db, env, projectId, actor)` (build → deploy → status row), `publishStatus(db, projectId)`.

- [ ] **Step 1: Write the failing test**

```ts
import { canPublish } from "../src/publish";
describe("publish", () => {
  it("blocks publish before approval and QA", async () => {
    const db = { project: { findFirst: async () => ({ status: "IN_PROGRESS", qaPassed: false }) } };
    expect(await canPublish(db as any, "p1")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/database test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
export async function canPublish(db: any, projectId: string): Promise<boolean> {
  const p = await db.project.findFirst({ where: { id: projectId } });
  return p.status === "APPROVED" && p.qaPassed === true;
}
export async function publishProject(db: any, projectId: string, actor: string) {
  if (!(await canPublish(db, projectId))) throw new Error("publish gate failed");
  await db.project.update({ where: { id: projectId }, data: { status: "PUBLISHED", publishedBy: actor, publishedAt: new Date() } });
  return { ok: true, status: "PUBLISHED" };
}
```

`publish-button.tsx`: checks `canPublish` → "Publish" (enabled) vs "Awaiting QA/Approval" (disabled + reason). API route calls `publishProject`, then MCP `vercel.deploy`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/database test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/publish.ts apps/web/app/api/publish apps/web/components/publish packages/database/test/publish.test.ts
git commit -m "feat(publish): add QA-gated publish flow with status tracking"
```

---

### Task 8: Automated QA gate

**Files:**
- Create: `packages/qa/src/checks.ts`
- Create: `packages/qa/src/report.ts`
- Test: `packages/qa/test/qa.test.ts`

**Interfaces:**
- Consumes: MCP `files.read_local`, project assets.
- Produces: `runQaChecks(project)` → `{ checks: [{ name, pass }], passed }` — link/assets integrity, render thumbnails, GLB size cap (≤8–10MB §11.5), performance budget; `saveQaReport(db, projectId, report)` flipping `project.qaPassed`.

- [ ] **Step 1: Write the failing test**

```ts
import { runQaChecks } from "../src/checks";
describe("qa checks", () => {
  it("fails when GLB exceeds size cap", async () => {
    const r = await runQaChecks({ assets: [{ kind: "glb", bytes: 12_000_000 }] } as any);
    expect(r.passed).toBe(false);
    expect(r.checks.find((c: any) => c.name === "glb-size")?.pass).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @viztr/qa test`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
export async function runQaChecks(project: { assets: Array<{ kind: string; bytes: number }> }) {
  const checks = [
    { name: "glb-size", pass: project.assets.every((a) => a.kind !== "glb" || a.bytes <= 10_000_000) },
    { name: "has-render-thumb", pass: project.assets.some((a) => a.kind === "thumb") },
  ];
  return { checks, passed: checks.every((c) => c.pass) };
}
```

`report.ts` persists to `qa_reports` and sets `project.qaPassed`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @viztr/qa test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/qa
git commit -m "feat(qa): add automated QA checks and report persistence"
```

---

### Checkpoint: M3 Definition of Done

- [ ] Jobs flow: upload → process → render → notify via BullMQ.
- [ ] Content-as-Code updates open PRs; deploy only after approval.
- [ ] CEO graph plans and dispatches; every run in `agent_runs`.
- [ ] Hermes `.bat` launches local runner; health-check passes.
- [ ] Publish button blocked until APPROVED + QA passed; publish updates status.
- [ ] Emergency stop: admin `/admin/agents/emergency-stop` route halts all agent runs (marks active `agent_runs` CANCELLED, blocks new DISPATCH) per §18.4 governance.
- [ ] §25 tracker rows 29 updated.
