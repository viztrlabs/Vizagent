# VizTR — Database Schema (SCHEMA)
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** Locked (target)

> Implements the FINAL stack (Supabase PostgreSQL + Prisma + RLS). Extends the repo's existing Prisma schema. UUID PKs; all tables carry `tenant_id`; RLS enabled. `is_placeholder` flag where content may be procedural.

---

## 1. Conventions
- PK: `uuid` default `gen_random_uuid()`.
- Timestamps: `created_at`, `updated_at`; optional `deleted_at` (soft delete).
- Every business table has `tenant_id` (workspace). `users` reference `tenant_id` nullable (super_admin/system may be tenant-less).
- JSONB for flexible config (hotspots, permissions, snapshots).
- RLS via `app.current_tenant` + `app.current_role` (Supabase setting), except service-role paths.

## 2. Identity & Access (M2)
```
enum UserRole { SUPER_ADMIN ADMIN USER CLIENT }

User          id, tenant_id?, email(uniq), name, role: UserRole,
              auth_uid? (Supabase JWT), created_at, updated_at
Workspace     id, name, slug, billing_tier, created_by
WorkspaceMember id, workspace_id, user_id, role, status(invited/active)
Session (booking) id, project_id?, host, guest, date, time_from, time_to,
              start_at?, google_event_id, status, notes      # existing
AuditLog      id, tenant_id, actor (user_id|device|agent), action, area, meta(JSONB), ip, created_at
```

## 3. Projects & Assets (M3/M4)
```
Project   id, tenant_id, name, description, status(draft/active/archived),
          deadline?, budget?, owner_id, settings(JSONB)
ProjectMember id, project_id, user_id, role
Asset     id, tenant_id, project_id, type(360|glb|fbx|video), url(R2), status,
          size_bytes, mime, dimensions, checks(JSONB), created_at
MediaAsset (public content/media) id, url(content/base), alt, is_placeholder, project_id?
```

## 4. XR (M5/M6/M10)
```
XrAsset   id, tenant_id, project_id, mode(webxr|webar|vr|tour|stream), status,
          scene_url, thumbnail, share_token, revoke_at?, view_count, created_at
Configuration id, tenant_id, project_id, mode, data(JSONB), version
Interaction  id, configuration_id, type(hotspot|light|camera|branch|animation),
             state(JSONB), order
Hotspot   id, interaction_id, x,y, scene_id?, icon?, label?      # Marzipano/Babylon
XRShareLink id, token(uniq), xr_asset_id, enabled, expires_at?, created_by
```

## 5. QA & Publish (M7/M8)
```
QAReport  id, tenant_id, project_id, status(pass|fail), summary,
          checks(JSONB)[name,passed,message,severity], started_at, completed_at
Deployment id, tenant_id, project_id, status(building|live|rolledback|failed),
          url, commit, tag?, qa_report_id, approved_by?, created_at
Approval  id, tenant_id, ref_type(project|deployment|content|agent), ref_id,
          status(pending|approved|rejected), approver_id, token?, created_at
```

## 6. Content Engine (M9)
```
Page      id, tenant_id, slug(uniq), title, status(draft|published), is_placeholder,
          meta(JSONB)[title,desc,og], version, published_rev, published_at, created_by
Section   id, page_id, type, config(JSONB), order, status
Block     id, section_id, type, props(JSONB), order, is_placeholder
ContentVersion id, ref_type(page|section|block), ref_id, revision, snapshot(JSONB),
          actor, reason, created_at      # undo/rollback source
```

## 7. Billing (M14)
```
Subscription id, tenant_id, provider(stripe|razorpay), customer_id, plan(free|pro|studio|enterprise),
             status, current_period_end, created_at
UsageMetric id, tenant_id, kind(gpu_min|storage_gb|bandwidth_gb|journeys), amount, period, created_at
Invoice   id, tenant_id, provider, invoice_no, amount, currency, status, issued_at, due_at
```

## 8. Agents (M15)
```
Task          id, tenant_id, type, status(queued|running|blocked|done|failed),
              payload(JSONB), result(JSONB), agent?, area, parent?, created_at
AgentRun      id, task_id, agent_id, provider, model, prompt_tokens, cost_usd,
              status, started_at, completed_at
AgentMemory   id, agent_id, key, content, embedding(vector(768)), created_at   # pgvector, RAG
AgentApproval id, task_id, area, action, status(pending|approved|rejected), approved_by, reason
```

## 9. Devices / Local GPU-CPU (F18 — NEW)
```
Device      id, tenant_id, name, kind(workstation), status(active|revoked|offline),
            device_token_hash, scope_areas(JSONB)[portfolio,webxr,…],
            last_seen_at, paired_by, paired_at
LocalSync   id, tenant_id, device_id, job_type, status(synced|processing|failed),
            data(JSONB), synced_at     # workstation state + job results
```

## 10. Communications & CRM (M13/M16)
```
Conversation id, tenant_id, topic, ref?, created_at
Message   id, conversation_id, sender_type(user|agent|system), body, attachments, created_at
Lead      id, tenant_id, name, email, source, stage, value, notes, created_at
Activity  id, tenant_id, lead_id|project_id, type, data, created_at
ContactInquiry id, name, email, message, project_type?, source, created_at
Booking   (see Session) + calendar events
```

## 11. Consents (F19 — NEW)
```
ConsentRecord id, ref_id(anon visitor id or user_id, nullable), scope(functional|analytics|preferences),
              value(bool), source(page), revision?, created_at
(SSR reads a signed anonymous consent cookie; ConsentRecord stores audit of the choice.)
```

## 12. RLS Matrix
| Table | RULE |
|---|---|
| User | self + workspace admins + super_admin |
| Workspace/Member | member or super_admin |
| Project/Asset/XrAsset/QA/Deployment/Approval | **tenant_id = app.current_tenant** (+ role escalation) |
| Content (Page/Section/Block/Version) | tenant (studio) ; public drafts hidden, published public |
| Subscription/Usage/Invoice | tenant admins |
| Task/AgentRun/Memory | tenant (agents via service role) |
| Device | super_admin only |
| ConsentRecord | own row (anon) |
| AuditLog | admin + super_admin |

**Isolation reminder:** repositories already enforce `tenant_id` in where-clauses; RLS is defense-in-depth. Keep both.

## 13. Migration approach
Start from the repo's existing `prisma/schema.prisma` (User, Project, Asset, QAReport, Deployment, XrAsset, Configuration, ConfiguratorSession, Viewer, Subscription, Session). Add: Workspace+Members; switch `role` to enum; add Content tables, Agent tables, Device/LocalSync, ConsentRecord, CRM, Usage/Invoice, AuditLog. Add RLS policies as a SQL migration. Keep all tables Supabase-Postgres compatible (pgvector extension for `vector(768)`).