# VizTR — Agent Coordination System
**Version:** 1.0 | **Date:** 2026-08-11 | **Status:** Active
**Lead agent:** Claude (this session) — orchestrator, architect, integrator.

> Operating model: **Lead plans → subagents execute on the host → structured reports → lead integrates → TRACKER/memory updated → next task.** One lead, one source of truth (`docs/`), no two agents editing the same file.

---

## 1. Team Roster

| Agent | Where it runs | Role | Best at |
|---|---|---|---|
| **Claude (Lead)** | Claude desktop (mounted repo) | Architect, planner, integrator | Specs, architecture, repo edits (create/overwrite), docs, TRACKER, memory, orchestration |
| **Hermes** | Your local workstation (host terminal) | Host executor — "my hands" | pnpm/lint/tsc/build/test, git ops, file deletions the sandbox can't do, dev server, local GPU/CPU tasks |
| **opencode** | Your terminal (host) | Parallel implementer | Coding features per spec, running its own tests, multi-file edits |
| **VSCode** | Your editor | Review & commit surface | Human-in-the-loop: diffs, merge conflicts, commit, quick manual fixes |
| **Google Antigravity** | Gemini agent | Second opinion / research | Code review, security & perf analysis, alternative implementations, test generation, "does the current design hold up?" |

**Why this split:** the Claude sandbox can **create/overwrite files but cannot delete them** and can't run the host toolchain cleanly. Hermes/opencode cover that gap on the real machine. Antigravity adds an independent review voice. VSCode keeps you in control of merges.

---

## 2. Division of Labor

| Capability | Owner |
|---|---|
| Architecture, tech-stack authority, ADRs | Lead (Claude) — never subagents |
| Writing specs / prompts for subagents | Lead |
| Editing the mounted repo (create/overwrite) | Lead |
| Deleting files (sandbox can't) | **Host only** — Hermes or you |
| Running pnpm / tests / build on real host | Hermes (or opencode) |
| Git commit / push / deploy | Hermes + **you approve** (never auto) |
| Code review / perf / security review | Antigravity (or opencode as second pair of eyes) |
| Merging, final sign-off | **You**, in VSCode |

---

## 3. Handoff Protocol — every prompt must include 6 blocks

A subagent gets a **standalone, self-contained prompt** (it has no memory of this chat). Always include:

1. **ROLE** — who the agent is, which repo, which tech stack.
2. **KNOWN STATE** — what's already true (completed phases, pre-existing failures). The agent must NOT re-litigate this.
3. **SCOPE** — exact paths/commands. Explicitly list what is **out of scope**.
4. **HARD CONSTRAINTS** — never print `.env` secrets, never `install/migrate/commit/push/deploy` without the lead asking, never run destructive git, stay in scope, no web unless asked.
5. **TASK** — numbered, unambiguous steps. "Do NOT fix anything — report" where fixes are a separate task.
6. **REPORT FORMAT** — a fixed structure the agent must return (see §4), so the lead can parse it fast.

---

## 4. Standard Report Format (every subagent returns this)

```
VERDICT: PASS | PARTIAL | FAIL
- <command1>: exit <code>, NEW errors: <count>
  file:line — message
- <command2>: exit <code>, NEW errors: <count>
  ...
- KNOWN errors confirmed: <list>
- Unexpected / needs lead: <none or description>
```

Rules: **NEW** = not on the KNOWN-STATE list. Never skip reporting an unexpected error, never "fix it and move on" — surface it verbatim to the lead.

---

## 5. Workflow & Feedback Loop

```
1. Lead breaks the milestone into tasks, writes specs
2. Lead hands a prompt to a subagent (or parallel to several, §6)
3. Subagent executes on host, returns the §4 report
4. Lead integrates results, updates docs/TRACKER.md + memory
5. Lead decides: next task, or loop back to the failing one
```

Anything that touches **auth, schema, config, or core architecture** serializes through the lead. Never let two agents edit the same file at the same time.

---

## 6. Parallelization Rules

- **Independent** tasks (e.g., "review the design" + "implement this page") → run opencode and Antigravity **in parallel**; lead merges.
- **Dependent** tasks (e.g., migration → tests) → serialize.
- **Shared core** (auth, Prisma schema, middleware, next.config) → lead only.
- **Test run on host** always after a code change, before reporting PASS.

---

## 7. Current Task — Hermes prompt (lint + typecheck verification)

Copy-paste the block below into Hermes. It is the immediate handoff for closing out M0.1.

```
ROLE: You are Hermes, the super-admin local workstation agent for the VizTR repo
at C:\Users\Arch_Viz\Desktop\VizAgent (Next.js 16.3 App Router, TypeScript strict,
pnpm). This is a READ-ONLY verification task for the completed M0.1 auth cutover.

KNOWN STATE (do not re-litigate):
- NextAuth fully removed: package.json, pnpm-lock.yaml, lib/auth.ts,
  app/api/auth/[...nextauth]/, components/providers.tsx all gone.
- Auth now runs through Supabase: lib/supabase/server-client.ts,
  lib/auth/session.ts, middleware.ts, getTenantId() rewired.
- EXPECTED pre-existing failures ONLY:
    a) @types/pg missing — 'pg' is imported in lib/db/server.ts and lib/supabase/server.ts.
    b) vitest globals — vitest.config.ts has no globals:true, so tests using
       describe/it/expect without imports may error.
  NOTE: @sentry/nextjs is NOT expected anymore (dependency removed during the
  rollback). If any @sentry/nextjs error appears, it is NEW, not known.

SCOPE: C:\Users\Arch_Viz\Desktop\VizAgent only. Nothing else.

HARD CONSTRAINTS:
- NEVER print or commit .env / .env.local contents or any secret value.
- Do NOT run pnpm install / add / remove. Do NOT migrate, commit, push, or deploy.
- Do NOT modify any file. This is read-only verification.
- No web browsing. Stay in the repo.

TASK:
1. cd C:\Users\Arch_Viz\Desktop\VizAgent
2. Run: pnpm lint        → record exit code + first 20 errors
3. Run: pnpm typecheck   → record exit code + first 20 errors
4. Classify every error as KNOWN (list a or b above) or NEW.
5. Do NOT auto-fix anything. Report only.

REPORT (return exactly this shape):
VERDICT: PASS | PARTIAL | FAIL
- lint: exit <code>, NEW errors: <count>
  <file:line — message>
- typecheck: exit <code>, NEW errors: <count>
  <file:line — message>
- KNOWN errors confirmed: <list>
- Anything needing the lead's attention: <none or description>
```

---

## 8. Reusable prompt template (for future tasks)

```
ROLE: You are <HERMES|OPENCODE|ANTIGRAVITY> for the VizTR repo at
C:\Users\Arch_Viz\Desktop\VizAgent (Next.js 16.3 App Router, TypeScript strict, pnpm).
Task: <what it is>  |  Lead: Claude  |  Source: docs/<SPEC-REFERENCE>.

KNOWN STATE: <phases done, pre-existing failures, locked decisions from RULES.md>.

SCOPE: <exact paths/commands>  |  OUT OF SCOPE: <explicit list>.

HARD CONSTRAINTS:
- NEVER print or commit .env/.env.local secrets.
- Do NOT install/migrate/commit/push/deploy unless the task explicitly says so.
- Do NOT edit files outside SCOPE. Stay in the repo. No web unless asked.
- <task-specific constraints, e.g. "read-only", "no auto-fix">

TASK:
1. ...
2. ...

REPORT:
VERDICT: PASS | PARTIAL | FAIL
- <command>: exit <code>, NEW errors: <count>
- KNOWN errors confirmed: <list>
- Needs lead decision: <none | description>
```

---

## 9. Standing rules for every subagent

1. Follow `docs/RULES.md` — security > correctness > performance > consistency > speed.
2. Server-side role enforcement only; never trust client roles.
3. No secret in code/logs/commits. No auto-deploy, no auto-spend.
4. If a prompt is ambiguous, stop and ask the lead — do not improvise a destructive fix.
5. Reports are the contract. Return the §4 shape.
