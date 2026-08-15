# VizTR — Agent Orchestration Flow

> **Source**: §10 of `VIZTR-COMPLETE-FEATURES.md` (AI Agent System) + Phase 3 Task 5.
> VizTR is 100% planning-phase; this describes the intended 13-agent system.

---

## 1. The 13-Agent System (§10.1)

```
CEO Agent (Orchestrator — LangGraph, online/cloud)
├── Hermes Agent (Local Controller — API-provider LLMs to the cloud stack)
├── Service Agents (XR Generation — 5):  WebXR · WebAR · VR · Virtual Tour · Pixel Streaming
└── Internal Agents (Platform Services — 7):  Website Developer · Finance · Analytics ·
    QA (PRE-PUBLISH GATE) · Support · Design · Sales
```

Ownership split: **LangGraph** owns the CEO workflow (planning, approvals, publish
controls); **AgentGPT** owns the 12 specialized agents (always-online browser multi-agent);
**Hermes** runs local execution (`apps/local-runner`). All agents share the **Universal MCP
Connector** (`packages/mcp`) tool layer.

## 2. Execution Loop (LangGraph StateGraph)

```
 USER COMMAND → [PLAN] CEO classifies request → creates project/task plan
   ↓
 [DISPATCH] CEO emits dispatch → AgentGPT worker (12) + Hermes (local), via MCP
   ↓
 [EXECUTE]  Agent runs tools → emits done | failed
   ↓
 [RECORD]   Run persisted to `agent_runs` (agent, status, input, output, usage)
   ↓
 [REVIEW]   CEO quality check + Cloud QA Agent preview check
   │
   ├─ ok ────► [APPROVAL] human approves → [PUBLISH]
   │
   └─ failed ► [FALLBACK] retry w/ alternate model / cheaper route (max 3, backoff)
                   ↓
               [ESCALATE] run → BLOCKED, admin alert via notify.send; halt via
               /admin/agents/emergency-stop (marks runs CANCELLED, blocks DISPATCH)  §18.4
```

**Guardrails (§10.3/§10.7)**: `spend_money`, `deploy_production`, `send_contracts`,
`send_invoices`, `share_private_data` never auto-execute — all require human approval
(per-agent tool allowlists + full audit logging on every decision/invocation).

## 3. Content-as-Code Publish Gate (§10.9)

```
Website Developer Agent → MDX/page draft → GitHub PR → QA (links, SEO)
    → human approval (or 24h auto-approve for non-critical, CONTENT_AUTO_APPROVE_HOURS)
    → merge → Vercel deploy → Analytics Agent checks performance
```

Critical content (pricing, legal) always requires manual approval — never auto-merge.

## 4. LLM Smart Routing (§21.4)

Cloud-only via API providers. Priority chain (§10.2):
`OmniRoute → OpenAI (GPT-4.1) → OpenRouter → Groq → Host URL`

`routeLlm(task)` returns `{ provider, model }`:

| Task | Model |
|------|-------|
| Dashboard CRUD / status / UI | gpt-4o-mini (fast/cheap) |
| Code generation | Qwen2.5-Coder / DeepSeek Coder |
| CEO planning & reasoning | OpenAI gpt-4.1 (or Qwen3) |
| Complex multi-step decisions | OpenAI o3-mini |
| Local automation (Hermes) | API small fast models (via OmniRoute) |
| Production QA | OpenAI + rule-based checks |
| Embeddings / RAG | nomic-embed-text (768 dims) |

Config: `providers: { planning: 'gpt-4.1', chat: 'gpt-4o-mini', code: 'qwen2.5-coder', embeddings: 'nomic-embed-text' }`.

## 5. Per-Agent Token Budget

Each AgentGPT dispatch message carries a **`maxTokensPerRun`** budget (e.g. 4000) plus a
`toolAllowlist` and `priority`. A run stops — `agent_runs.status` flips to `FAILED` — once
the budget or credit limit is exceeded (§18.4). Usage is recorded back on completion:

```json
{ "taskId": "run_01JX...", "objective": "Update Services page copy",
  "toolAllowlist": ["github.create_pr", "supabase.query"],
  "maxTokensPerRun": 4000, "input": { "slug": "services" }, "priority": "high" }
```

Reply: `{ "taskId", "status": "done", "output": { "prUrl": "..." }, "usage": { "tokens": 3120, "costUsd": 0.012 } }`. Failed tasks retry with backoff (max 3) before surfacing to the admin; `agent_runs` rows archive to cold storage after 90 days (Phase 6).

---

*Cross-refs: §10.1–10.9, §21.4, §18.4; Phase 3 Tasks 3–5; Phase 6 (agent_runs archival).*
