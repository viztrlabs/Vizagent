# VizTR — Project Rules
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** Governing

> Non-negotiable rules for every contributor, agent, and change. Priority: **Security > Correctness > Performance > Consistency > Speed.**

---

## 1. Tech-stack authority
1. **The FINAL tech stack is `TECHSPEC.md`. It cannot be overridden by reference/design documents.**
2. If a reference doc (e.g., a file-structure blueprint) conflicts with the locked stack, the file-structure doc is **design-flow only**. Route through this rule set.
3. Tech-stack changes require an ADR + stakeholder approval (no unilateral swaps).

## 2. Completion
4. Complete Build is locked. Do not reintroduce lean/validation-first MVP framing (user rejected it).
5. Build order is phased but everything ships: all 18 modules (M1–M18), all 5 XR modes, all agents/dashboards, content engine, billing, full security.

## 3. Security (highest priority)
6. **Never auto-execute** agent actions that: spend money, deploy to production, send contracts/invoices, share private data. ✓ requires human approval.
7. Role enforcement is **server-side only**. Never trust client roles; derive from Supabase `app_metadata.role`.
8. **RLS on all tables**; repositories ALSO enforce `tenant_id` in where-clauses (defense-in-depth).
9. Never log, print, or hardcode secrets/tokens. Use Supabase Vault/env; no secrets in code or `.env*` tracked.
10. Uploads via presigned short-TTL URLs; validate type/size; scan; cap size.
11. **Hermes is super-admin-only + password/OTP-protected + area-scoped + rollback-safe** (`HERMES-AGENT-SECURE-CONTROL.md`). Deny-by-default area control; emergency stop always available.
12. Consent gate (F19): demo CTA and non-essential cookies require prior consent. Respect user choice; revocable.

## 4. Performance
13. Meet budgets: WebXR 60/30/90 fps; pixel latency <100ms; Lighthouse ≥90.
14. Immutable cache on static assets ONLY — never on HTML/API routes.
15. Fonts via `next/font` + preconnect; no render-blocking `@import`.
16. Heavy 3D engines are **route-split**; never loaded on marketing chrome.
17. Add Lighthouse + bundle analytics to CI so perf regressions fail the build.

## 5. Design consistency
18. Use the locked tokens (`DESIGN.md`): Space Grotesk/Inter/JetBrains Mono; dual dark/light/auto; glass; radius 8/12/16/24; cyan #00e5ff + violet #7c3aed.
19. No hardcoded colors/fonts/radius in components — use tokens.
20. `is_placeholder` content renders as elegant procedural placeholders until swapped via CMS.

## 6. Code & engineering
21. **TypeScript strict**; type everything; no `any` without justification.
22. Server layering: route → service → repository → (Prisma/R2/external). Keep Prisma usage server-side only.
23. Follow repo/queue/worker pattern for async work (BullMQ). Long tasks never run inside a request response.
24. Prefer shadcn/ui base components; annotate custom components in Storybook.
25. Write tests for critical paths (upload→QA→approve→publish→share; agent guardrails).

## 7. Git & workflow
26. Branch-per-task from `main`; small PRs; PR requires passing lint+tsc+tests+preview.
27. Conventional commit style. Feature-flag risky changes.
28. Secret scanning (gitleaks) runs in CI and fails the build.

## 8. Change control
29. Any change to locked scope/stack/design requires: written justification → Tech Lead + Product Owner approval → doc version bump → team communication.
30. Every code release is **versioned + reversible** (deploy tags / content versions / change ledger) — an operator can always undo.

## 9. Documentation
31. Keep planning docs in sync with reality (update `TRACKER.md` as work lands).
32. New features/major flows get a short entry in PRD + relevant spec + schema if data-bearing.
33. When in doubt, ask — do not ship a wrong-technical-stack assumption silently.