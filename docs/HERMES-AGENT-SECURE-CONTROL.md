# Hermes Agent — Secure Local Workstation Control (Architecture)
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** Proposed for ADR

> **Purpose:** Design the Hermes Agent's connection from the super admin's **local GPU workstation** to the VizTR SaaS, with:
> - **Super-admin-only, password-protected** connection
> - **Area control** — Hermes can only change *selected* modules (portfolio, webxr, webar, vr, virtual tour, pixel streaming, etc.)
> - **Full controlled control** of the website for development + changes
> - **Versioning, rollback, and undo** for every change

---

## 1. Security Requirements (from product owner)

| Requirement | Meaning | Implication |
|---|---|---|
| Local workstation source | Hermes runs on the admin's own machine, initiating an outbound connection | No inbound firewall/NAT holes; use a reverse tunnel (Cloudflare Tunnel — already in locked stack) |
| Super admin only | Only the `super_admin` role may pair, control, or authorize Hermes | RBAC gate on every pair/approve/rollback action; `middleware.ts` role check |
| Password protected | Mutating actions require the super admin's approval/password | Approval-token (OTP) + device authentication on every mutation |
| Area control | Hermes modifies only the modules the admin selects (portfolio, webxr, webar, vr, virtual tour, pixel streaming, content, design) | **Deny-by-default scope token** per workstation listing allowed areas |
| Full control + rollback | Hermes can make code/content changes, always undoable | Every change is a **versioned, snapshot-backed, reversible** operation |
| Undo on error | If something goes wrong, restore the previous state | Change ledger + before/after snapshots + rollback console |

---

## 2. Connection Model (Reverse Tunnel, Outbound)

```
[ Local GPU Workstation ]
   Hermes CLI (Node)  ──outbound──▶  cloudflared quick tunnel  ──▶  https://<random>.trycloudflare.com
   - Blender headless                     │
   - UE5 + coturn (signaling)             │  (or a *named tunnel* for stable endpoint)
   - Ollama (local LLMs)                  ▼
                       [ Cloudflare Tunnel / WAF ]
                             │
 [ VizTR SaaS ]  ◀─control intents────  Railway (BullMQ outbox) + Vercel (API/auth/approval UI)
```

- **Outbound only** — the workstation never opens inbound ports; `cloudflared` establishes the tunnel. Works behind NAT/firewalls.
- **Named tunnel** (with `trycloudflare` for dev, a named origin for stable access) maps a stable URL to Hermes' local dev server + signaling + health endpoint.
- **Watchdog heartbeat** — Hermes posts a signed heartbeat (device ID + timestamp) every ~15s; the platform marks the workstation **offline** if absent > 60s, revoking live command capacity.

---

## 3. Pairing & Authentication (Super-Admin-Only)

**First-pair flow (in-app, super_admin only):**
1. Admin signs into the VizTR Console (Supabase Auth, role `super_admin`).
2. Console → "Workstations" → **Add workstation** → platform generates a **pairing code + device secret** (TTL 10 min, single-use).
3. Admin enters the pairing code on the workstation's Hermes CLI (or Hermes shows its random pin that the admin confirms in-app — mutual pairing).
4. On success, Supabase stores a **device row**: `device_id`, hashed device token (never plaintext), allowlist `{ areas: [...] }`, status `active`, last_seen.
5. Hermes receives a **device-scoped long-lived token** (stored in a restricted file / OS keychain on the workstation, mode 0600).

**Authentication on every request:**
- **Transport** — HTTPS/WSS end-to-end through Cloudflare Tunnel (TLS 1.3 in transit). (Optionally require **client certificate / mTLS** for extra safety.)
- **AuthN** — `Authorization: Bearer <device token>` verified against the hashed token server-side.
- **AuthZ (area)** — the request's **scope token** (JWT signed with `{device_id, areas}`) is checked: `requested_area ∈ scope.areas`, deny-by-default otherwise.
- **Approval (mutation)** — for any change that modifies state, the platform requires a **super-admin approval token**: super admin clicks "Authorize" in the console (or re-enters their password), generating a short-TTL (5 min) one-time approval token. Hermes includes it, or the platform holds the intent in a queue pending admin approval.

**Rotation & revocation:**
- Device token rotation on interval + on security event.
- **Emergency stop** — admin disconnects in one click: set device `status=revoked`, rotate secret, clear scope; all pending Hermes commands fail closed.
- Audit: every pair, auth, approval, revoke, and command logged to the `audit_log`.

---

## 4. Area Control (Deny-by-Default Scope Sandbox)

**Module areas** map Hermes' abilities to VizTR modules:

| Area id | Covers |
|---|---|
| `portfolio` | Portfolio grid items, showcase pages, project cards |
| `content` | Content-engine pages / sections / blocks (draft/publish/versions) |
| `webxr` | WebXR scene, scene-understanding, camera/animation config |
| `webar` | Marker / markerless AR config, targets, QR assets |
| `vr` | Standalone VR build config (Quest/Pico/Vision Pro) |
| `virtual-tour` | 360 tour config, hotspots, scenes, Marzipano wiring |
| `pixel-streaming` | UE5/Cirrus/latency/dev stream config, GPU job queue |
| `design` | Design tokens, theme, glass, portfolio styling |
| `billing`, `auth`, `admin`, `security` | **Always excluded** from Hermes scope → policy-gated to human + other agents only |

**Per-workstation scope:**
- Admin assigns which areas Hermes may modify (e.g., "portfolio + virtual tour only"). Stored on the device row as `areas: ["portfolio","virtual-tour"]`.
- **Policy gateway** sits in front of every MCP tool & command. Each tool is tagged with the area(s) it affects (reuses `mcp-tools.json` categories). Gateway logic:

```
ALLOW tool.call(actor, args)
  IF  actor.device in active_devices
  AND requested_area ∈ actor.scope.areas        # deny-by-default
  AND guardrails.allowlist[tool] == true        # no destructive/spend tools
  AND (tool.destructive == false  OR  approvalToken.valid)
```

- Anything not explicitly allowed is denied. Billing, auth, admin, security tools are hard-blocked for Hermes regardless of scope.

---

## 5. Versioning, Rollback & Undo

**Change ledger — single source of undo:**
- New `change` table (Supabase): `{id, area, actor, type, before (JSONB), after (JSONB), diff, status, created_at, approved_by, rollback_of}`.
- Every successful mutation writes a ledger row **with the before-snapshot**.

**Two mutation paths, both versioned:**

| Path | Change | Snapshot | Rollback |
|---|---|---|---|
| **Content/config** (DB-backed) | Page/section/block, tour config, portfolio item, tokens | JSONB deep copy of the record before apply + version bump on the content/version table | Restore `before` snapshot to the record; mark `rollback_of`; version bumped again (undo is itself versioned) |
| **Code/dev** (via Hermes) | Source-level change, build, deploy | Hermes commits to a branch + creates a **version tag** (`hermes-<device>-<n>`) + manifest of touched paths | Redeploy the prior tag / `git revert`; deploy pipeline rejects if not tagged |

**Flow for a Hermes change (proposed → applied → undoable):**
1. Admin grants a **work order** or Hermes proposes an **area-scoped change** (with a dry-run diff/preview).
2. Policy gateway verifies scope + guardrails.
3. **Snapshot taken** (before-state of every target record/path).
4. If the change type is sensitive or configured "requires approval" → super admin approves with an approval token / password.
5. Apply → write ledger + `after` snapshot → bump version → notify admin.
6. **On error:** admin clicks **Undo** → restores the `before` snapshot (or redeploys prior tag) in ≤ one action → ledger marked.

**Rollback console (admin):**
- List changes per area/device/time.
- For each, show diff + a one-click **Undo/Rollback**.
- Time-travel: restore any prior version of a content record from the version table.
- Anything Hermes can do, the admin can undo from the UI — even if Hermes is offline.

---

## 6. Guardrails (inherited + Hermes-specific)

- **Never auto-execute** without approval: spending, deploying to production, sending contracts/invoices, sharing private data, editing `billing`/`auth`/`security` areas.
- Per-device + per-area **spend/op caps** and daily change limits.
- **Process isolation on workstation:** Blender/UE5/scripts run as isolated subprocesses with a memory/CPU ceiling and a **path allowlist** — Hermes cannot touch files outside the connected project dirs for the areas it controls.
- **Emergency stop** is always available and takes effect server-side within one heartbeat.
- Full **audit log** of every command, approval, and rollback (ties into M12 admin console).

---

## 7. Deployment & Open Questions

**Where it lives:** Hermes CLI + local runner under `apps/local-runner` + `packages/agents/` (Hermes spec); served by Railway workers (outbox/queue) + Vercel (approval UI, API). Supabase stores device, scope, ledger, audit rows.

**ADR decisions to lock before build (Phase 4/5):**
1. Named vs quick tunnel for stable endpoint → **named tunnel** for production.
2. mTLS required, or HTTPS + device token sufficient → **recommend HTTPS + device token + optional client cert**.
3. Approval granularity: password re-entry vs OTP vs TOTP for every mutation → **TOTP/approval token** recommended; password fallback.
4. Undo semantics for code path: `git revert` vs redeploy-tag → **redeploy prior tag** as primary, revert as fallback.
5. Hermes LLM backend: Ollama local (recommended, free, private) + optional cloud fallback.

---

## 8. Test Plan (requires)

- Pairing expiry + single-use; revocation takes effect within 1 heartbeat.
- Scope denial: Hermes with `["portfolio"]` cannot touch `virtual-tour` or `billing`.
- Every mutation creates a ledger row with a `before` snapshot; Undo restores exact prior state.
- Emergency stop clears all pending commands and denies new ones.
- Approval token expiry rejects late/duplicate approval.
- Audit log completeness for a simulated support case.