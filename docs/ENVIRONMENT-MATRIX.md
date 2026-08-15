# VizTR — Environment Variable Matrix

> **Status**: Planning-time matrix. VizTR is 100% in the planning phase — `.env.example` is planned but not yet generated (Phase 0/1 Task 7). **Secrets are never committed.** `.env.example` holds placeholders only, and a secret-scan CI job (`scripts/scan-env-secrets.mjs`, Phase 0/1) blocks pushes containing real keys (§18/§27.9).

---

## 1. Environment Conventions

| Environment | Sources | Where Configured |
|-------------|---------|------------------|
| **Local** | `.env.local` (root, not committed) | Phase 0/1 Task 7; Docker Postgres/Redis + `supabase start` |
| **Preview** | Vercel Preview env + Supabase preview DB + CI secrets | Per-PR deploy; `2026-08-05-phase0-1-foundation.md` |
| **Production** | Vercel prod env + Supabase prod project | Wired in Phase 6 Task 5 (`prisma migrate deploy`) |

- **Scope rule**: `NEXT_PUBLIC_*` vars are inlined into the client bundle and must never hold secrets. Everything else stays server-side.
- **Rotation**: service-role, Stripe live, and R2 secrets rotate every 90 days (§11.4) and immediately on any suspected leak.
- **Naming**: `R2_*` and `CLOUDFLARE_R2_*` prefixes are aliases — pick one per repo and stay consistent.
- **Failure mode**: missing required secrets fail startup loudly; optional ones (e.g. `CONTENT_AUTO_APPROVE_HOURS`) fall back to documented defaults.

## 2. Variable Matrix

| Variable | Local | Preview | Production | Secret? | Notes |
|----------|-------|---------|------------|---------|-------|
| `DATABASE_URL` | local Postgres 5432 | Supabase preview pooler | Supabase prod pooler | **Yes** | Prisma `url` = PgBouncer pooler (transaction mode) |
| `DIRECT_URL` | local Postgres | preview direct URL | prod direct URL | **Yes** | Prisma `directUrl` for `migrate`/Studio only (Phase 6) |
| `REDIS_URL` | `redis://localhost:6379` | Upstash/Railway preview | prod Redis (Sentinel/Cluster) | **Yes** | BullMQ queue, cache, sessions, rate-limit counters |
| `JWT_SECRET` | dev secret | preview secret | prod secret | **Yes** | JWT signing (Supabase/Next); rotate every 90 days (§11.4) |
| `SUPABASE_URL` | `http://localhost:54321` | `https://preview.ref.supabase.co` | `https://prod.ref.supabase.co` | No | Server-side project URL (URL itself is public) |
| `SUPABASE_ANON_KEY` | local anon | preview anon | prod anon | No | Public API key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | local service-role | preview service-role | prod service-role | **Yes** | Server-only; bypasses RLS — never in client bundles |
| `NEXT_PUBLIC_SUPABASE_URL` | local | preview | prod | No | Client-exposed browser Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local | preview | prod | No | Client-exposed anon key |
| `SUPABASE_STORAGE_BUCKET` | `viztr-docs` | `viztr-docs` | `viztr-docs` | No | Text/docs bucket (§27.4); heavy media on R2 |
| `OPENAI_API_KEY` | `sk-test-*` | preview key | prod key | **Yes** | LLM (gpt-4o-mini / gpt-4.1 / o3-mini, §21.6) |
| `STABLE_DIFFUSION_API_KEY` | — | preview key | prod key | **Yes** | AI image/style generation (planned, §27.5) |
| `OMNROUTE_API_KEY` | — | preview key | prod key | **Yes** | LLM smart routing (OmniRoute → OpenAI → OpenRouter → Groq, §21.6) |
| `RESEND_API_KEY` | test key | preview key | prod key | **Yes** | Transactional email — **primary** provider (§9.2) |
| `SENDGRID_API_KEY` | — | — | — | **Yes** | Planned email alternative; not in current stack (§9.2) |
| `TWILIO_AUTH_TOKEN` | test token | preview token | prod token | **Yes** | SMS/OTP + booking reminders (§20) |
| `STRIPE_SECRET_KEY` | `sk_test_*` | `sk_test_*` | `sk_live_*` | **Yes** | Checkout, subscriptions, usage billing (§14.3) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_*` | `whsec_test_*` | `whsec_live_*` | **Yes** | Webhook signature verification (idempotent handler) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_*` | `pk_test_*` | `pk_live_*` | No | Client-side Stripe (Checkout) |
| `MARKETPLACE_FEE_PCT` | `0.15` | `0.15` | `0.15` | No | Platform fee default; tunable without deploy (Phase 5 Task 5) |
| `R2_ACCOUNT_ID` | set | set | set | No | Cloudflare R2 account id (`CLOUDFLARE_R2_*` alias ok) |
| `R2_ACCESS_KEY_ID` | set | set | set | **Yes** | S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | set | set | set | **Yes** | S3-compatible secret key |
| `R2_BUCKET` | `viztr-assets` | `viztr-assets` | `viztr-assets` | No | 3D/heavy asset bucket (§27.4) |
| `COTURN_SERVER` | `turn:localhost:3478` | — | `turn:turn.viztr.com:3478` | No | TURN relay endpoint for Pixel Streaming (§9.6) |
| `COTURN_STATIC_AUTH_SECRET` | set | — | set | **Yes** | Static auth secret for TURN credential pairs |
| `COTURN_REALM` | `viztr.local` | — | `viztr.com` | No | TURN realm |
| `CONTENT_AUTO_APPROVE_HOURS` | `24` | `24` | `24` | No | Time-boxed auto-approval for non-critical content (Phase 3 Task 3) |
| `SFU_URL` | `ws://localhost:8866` | preview SFU | prod SFU | No | Pixel Streaming signaling broker (node-mediasoup / ion-sfu) |
| `WORKSTATION_ID` | `ws-01` | — | `ws-01..N` | No | Hermes `.bat` launcher identity (Phase 3 Task 6) |
| `PROJECT_DIR` | `D:\VizTRProjects\...` | — | — | No | Local UE5 project path (`.bat`) |
| `VERCEL_TOKEN` | — | set (CI) | set (CI) | **Yes** | Deploy API token (§27.5) |
| `VERCEL_ORG_ID` | — | set | set | No | Vercel team id |
| `VERCEL_PROJECT_ID` | — | set | set | No | Per-app project ids (web/admin/portal/xr) |
| `NEXT_PUBLIC_SENTRY_DSN` | set | set | set | No | Error tracking DSN |
| `SENTRY_AUTH_TOKEN` | — | set (CI) | set (CI) | **Yes** | Sourcemap/release upload |
| `NEXT_PUBLIC_POSTHOG_KEY` | set | set | set | No | Product analytics (Phase 5 Task 3) |
| `GOOGLE_CLIENT_ID` | set | set | set | No | Google OAuth — primary config lives in the Supabase dashboard (§18.1) |
| `GOOGLE_CLIENT_SECRET` | set | set | set | **Yes** | Google OAuth client secret |

## 3. Secret Handling & CI

- **Never commit**: no `sk_live_`, `sk_test_`, `whsec_`, or `SUPABASE_SERVICE_ROLE_KEY` values in the repo; `.env.example` ships placeholders only.
- **CI gate**: `node scripts/scan-env-secrets.mjs` (and the PowerShell variant `scripts/scan-env-secrets.ps1`, Phase 6 Task 1) runs on every push/PR and fails the build on matches (§18/§27.9).
- **Provider config**: Google OAuth credentials are entered in the Supabase dashboard rather than app env; the app-side vars are optional conveniences (§18.1).
- **Never log or echo** any `Secret? = Yes` value; keep preview and production values isolated per environment.

---

*Reference docs: `VIZTR-COMPLETE-FEATURES.md` (§9.6, §18, §27.4–§27.9), Starter guide §2.3, Phase 0/1 Task 7, Phase 3 Task 3, Phase 5 Tasks 1/5/7, Phase 6 Task 5.*
