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
| T-001 | Initialize Next.js 15 + repo structure + CI skeleton | OpenCode | / (root) | in_progress | 2026-08-06T15:45:00Z | — | — | Do this first, before any other task starts |
| T-002 | Create Supabase project + run schema from CONTRACT.md | OpenCode | / (root) | unclaimed | — | — | — | Depends on T-001 |
| T-003 | Landing page — hero, tagline, CTA | Google AI Studio | app/(marketing)/ | unclaimed | — | — | — | Depends on T-001 |
| T-004 | Waitlist form component + API route | Google AI Studio | app/(marketing)/, app/api/waitlist/ | unclaimed | — | — | — | Depends on T-002 |
| T-005 | Pricing section (static, Free/Pro/Studio) | Google AI Studio | app/(marketing)/ | unclaimed | — | — | — | Depends on T-003 |
| T-006 | Signup + login pages | Antigravity | app/(auth)/ | unclaimed | — | — | — | Depends on T-002 |
| T-007 | Dashboard shell (sidebar, header, layout) | Antigravity | app/(dashboard)/ | unclaimed | — | — | — | Depends on T-002 |
| T-008 | Project CRUD pages (list, create, edit, delete) | Antigravity | app/(dashboard)/projects/ | unclaimed | — | — | — | Depends on T-007 |
| T-009 | Upload dropzone component + presigned URL flow | VS Code | components/upload/ | unclaimed | — | — | — | Depends on T-002 |
| T-010 | Virtual Tour viewer (Three.js sphere + orbit controls) | VS Code | components/viewer/ | unclaimed | — | — | — | Depends on T-002 |
| T-011 | QA checklist logic (5 automated checks) | VS Code | lib/qa/ | unclaimed | — | — | — | Depends on T-009 |
| T-012 | Publish button + gate (blocked unless QA passed) | Antigravity | app/(dashboard)/projects/[id]/ | unclaimed | — | — | — | Depends on T-011 |
| T-013 | Public viewer page (no auth required) | VS Code | app/(public)/tour/ | unclaimed | — | — | — | Depends on T-010 |
| T-014 | GitHub Actions CI (lint + build + test) | OpenCode | .github/workflows/ | unclaimed | — | — | — | Should exist before first merge to main |
| T-015 | Final integration pass + Vercel deploy verification | OpenCode | / (root) | unclaimed | — | — | — | Do this last |

*(Add new rows as new tasks come up. Never delete a `done` row — it's your project history. Never renumber existing IDs.)*

---

## Currently in progress (quick glance)

*Nothing yet — this section is a convenience summary. The table above is the source of truth; update this list whenever a task's status changes.*

---

## Blocked tasks (needs human input)

*None yet.*
