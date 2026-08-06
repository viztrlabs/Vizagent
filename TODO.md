# VizTR — Shared Task Log

**This file is the single source of truth for who is doing what, right now.**
Every tool reads this before starting work and writes to it before AND after doing work.
Do not skip steps. Do not work on a task that isn't `unclaimed`.

---

## How to use this file (read this every session)

1. `git pull origin main` — always, before anything else, every single time.
2. Find your assigned task below. If its status is anything other than `unclaimed`, STOP. Do not touch it. Pick a different unclaimed task assigned to you, or ask the human what to do next.
3. If unclaimed: change status to `in_progress`, fill in your tool name and the current timestamp, commit with message `claim: T-0XX`, and push **immediately** — before writing any other code.
4. Do the actual work, only inside your assigned folder (see CONTRACT.md for folder ownership).
5. When finished: `git pull origin main` again, update the row to `done`, fill in the end timestamp and the list of files you touched, commit with message `done: T-0XX`, and push.
6. If you get blocked (missing info, broken dependency, unclear spec) — set status to `blocked`, write why in the Notes column, and push. Do not leave a task silently abandoned as `in_progress`.

**Status values**: `unclaimed` · `in_progress` · `blocked` · `done`

---

## Task Log

| Task ID | Task | Assigned Tool | Folder | Status | Claimed At | Done At | Files Touched | Notes |
|---------|------|---------------|--------|--------|------------|---------|----------------|-------|
| T-001 | Initialize Next.js 16 + repo structure | OpenCode | / (root) | done | — | 2026-08-06 | package.json, next.config.ts, tsconfig.json | Completed |
| T-002 | Setup Prisma schema + Supabase + run migrations | OpenCode | / (root) | done | — | 2026-08-06 | prisma/, lib/supabase/ | Completed |
| T-003 | Install dependencies + configure Tailwind tokens | OpenCode | / (root) | done | — | 2026-08-06 | package.json, tailwind.config.ts, globals.css | Completed |
| T-004 | Create TypeScript types + Zod validations | OpenCode | / (root) | done | — | 2026-08-06 | lib/types.ts, lib/validations.ts, lib/xr/validation.ts | Completed |
| T-005 | Zustand store with undo/redo + auto-save | OpenCode | / (root) | done | — | 2026-08-06 | lib/store/configurator-store.ts | Completed |
| T-006 | Babylon.js canvas + input handler | OpenCode | / (root) | done | — | 2026-08-06 | components/configurator/BabylonCanvas.tsx, lib/xr/input-handler.ts | Completed |
| T-007 | Configurator panels (materials, lighting, hotspots, export, AR) | OpenCode | / (root) | done | — | 2026-08-06 | components/configurator/*.tsx | Completed |
| T-008 | Main configurator page layout + sidebar + toolbar | OpenCode | / (root) | done | — | 2026-08-06 | app/configurator/[projectId]/, components/configurator/Sidebar.tsx, Toolbar.tsx | Completed |
| T-009 | XR assets + configurations API routes | OpenCode | / (root) | done | — | 2026-08-06 | app/api/xr/ | Completed |
| T-010 | WebRTC pixel streaming API routes | OpenCode | / (root) | done | — | 2026-08-06 | app/api/streams/ | Completed |
| T-011 | Stream viewer components | OpenCode | / (root) | done | — | 2026-08-06 | components/stream/ | Completed |
| T-012 | Read-only view page | OpenCode | / (root) | done | — | 2026-08-06 | app/view/[configId]/ | Completed |
| T-013 | Configurator session API routes | OpenCode | / (root) | done | — | 2026-08-06 | app/api/configurator/sessions/ | Completed |
| T-014 | Keyboard shortcuts + polish | OpenCode | / (root) | done | — | 2026-08-06 | components/configurator/BabylonCanvas.tsx | Completed |
| T-015 | Basic marketing pages | OpenCode | / (root) | done | — | 2026-08-06 | app/(marketing)/ | Completed |
| T-016 | Google Calendar sync on booking | OpenCode | / (root) | done | — | 2026-08-06 | lib/google-calendar.ts, app/api/bookings/ | Completed |
| T-017 | Automated reminder emails (Vercel Cron) | OpenCode | / (root) | done | — | 2026-08-06 | app/api/cron/session-reminders/, lib/emails/reminder.ts, vercel.json | Completed |
| T-018 | Client portal page + session management | OpenCode | / (root) | done | — | 2026-08-06 | app/portal/page.tsx, components/portal/SessionCard.tsx | Completed |
| T-019 | NextAuth v5 config + Google OAuth | OpenCode | / (root) | done | — | 2026-08-06 | lib/auth.ts, app/api/auth/[...nextauth]/, app/auth/signin/ | Completed |
| T-020 | Seed database with sample data | OpenCode | / (root) | done | — | 2026-08-06 | prisma/seed.ts | Completed |
| T-021 | Fix TypeScript errors + React error #299 | OpenCode | / (root) | done | — | 2026-08-06 | Multiple files | Completed |
| T-022 | Deploy to Vercel | OpenCode | / (root) | done | — | 2026-08-06 | vercel.json | Completed — https://vizagent-liard.vercel.app |
| T-023 | Responsive design — Marketing pages | Antigravity | app/(marketing)/ | done | 2026-08-07 01:54 | 2026-08-07 01:56 | app/(marketing)/page.tsx, app/(marketing)/layout.tsx, components/Footer.tsx | Landing page, nav, CTA buttons responsive |
| T-024 | Responsive design — Auth pages | Antigravity | app/(auth)/, app/auth/ | unclaimed | — | — | — | Signin/signup forms responsive |
| T-025 | Responsive design — Dashboard + Projects | Antigravity | app/(dashboard)/, app/projects/ | unclaimed | — | — | — | Dashboard, project list, create project |
| T-026 | Responsive design — Configurator | Antigravity | components/configurator/ | unclaimed | — | — | — | Mobile bottom sheet, touch controls |
| T-027 | Responsive design — Portal + Booking | Antigravity | app/portal/, app/book/, components/portal/ | unclaimed | — | — | — | Session cards, booking form |
| T-028 | GitHub Actions CI (lint + build + test) | OpenCode | .github/workflows/ | unclaimed | — | — | — | Should exist before first merge to main |
| T-029 | Final integration pass + Vercel deploy verification | OpenCode | / (root) | unclaimed | — | — | — | Do this last |

*(Add new rows as new tasks come up. Never delete a `done` row — it's your project history. Never renumber existing IDs.)*

---

## Currently in progress (quick glance)

*Nothing yet — this section is a convenience summary. The table above is the source of truth; update this list whenever a task's status changes.*

---

## Blocked tasks (needs human input)

*None yet.*
