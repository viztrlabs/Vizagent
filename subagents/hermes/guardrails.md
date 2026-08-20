# Hermes Guardrails — Local Execution & Platform Compliance

## Scope
- ONLY runs on local workstation (RTX 1050ti + Cloudflare Tunnel)
- Local GPU tasks: Unreal Pixel Streaming, Blender optimization, asset validation
- Local tunnel: Cloudflare Tunnel for local ↔ cloud bridge
- Local QA: asset validation, Unreal status checks
- Reports status to CEO Agent via MCP

## Hard Constraints
- NEVER print/commit `.env` secrets
- NEVER `pnpm install/add/remove`, `migrate`, `commit`, `push`, `deploy` without Lead asking
- NEVER edit files outside assigned scope
- NO web browsing unless explicitly asked
- All outputs return §4 Standard Report Format

## Platform Compliance
- Uses same design tokens (synced via `packages/design-tokens`)
- API calls go through Supabase/Next.js routes — no direct DB access
- MCP tools for cloud operations (Supabase, GitHub, Vercel, Unreal, LLM)
- BullMQ worker for async jobs (QA, emails, calendar sync)

## Review Gate
- Every Hermes task: Lead writes prompt (§8 template) → You paste in Hermes terminal → Returns §4 report
- Lead integrates results, updates `TODO.md` + `TRACKER.md`