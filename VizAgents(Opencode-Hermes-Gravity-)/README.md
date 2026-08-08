# VizTR — Multi-tool Dev Pipeline Starter

This repo is set up so five different AI tools (OpenCode, VS Code, Antigravity,
Google AI Studio, and CI as "Hermes") can each work on different parts of the
same app without conflicting or duplicating work.

## The 3 files that make this work

| File | Purpose |
|------|---------|
| `docs/CONTRACT.md` | The frozen rulebook — schema, API routes, types, design tokens, folder ownership. Paste into every tool's context. |
| `TODO.md` | The shared task log. Every tool claims a task here before starting, and marks it done when finished. |
| `AGENT-RULES.md` | The exact instruction block to paste as the first message in every tool, every session. |

## Daily workflow (you, the human)

1. Open `TODO.md`, decide what needs doing next, assign a task ID to a tool.
2. Open that tool, paste the block from `AGENT-RULES.md`, fill in the assigned folder, and tell it which task ID to work on.
3. Let it claim the task, do the work, push its branch.
4. When you're ready to integrate: open **OpenCode**, tell it to pull all open feature branches, resolve any conflicts, and merge to `main`.
5. GitHub Actions (`.github/workflows/ci.yml`) runs lint + typecheck + build + test automatically.
6. If CI passes, Vercel auto-deploys. If CI fails, nothing goes live — fix it in OpenCode before retrying.

## Folder ownership (also in CONTRACT.md)

- `app/(marketing)/` → Google AI Studio
- `app/(auth)/`, `app/(dashboard)/` → Antigravity
- `components/upload/`, `components/viewer/`, `lib/qa/`, `app/(public)/tour/` → VS Code
- Everything else (root config, `app/api/`, `lib/supabase/`, CI) → OpenCode only

## Rule of thumb

If a tool ever wants to touch a file outside its assigned folder, or add a
database table / API route / color that isn't in `CONTRACT.md` — it should
stop and flag it in `TODO.md`, not just do it. You are the only integration
point. Nothing merges to `main` except through OpenCode.
