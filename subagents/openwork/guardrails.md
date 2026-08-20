# OpenWork Guardrails — Coordination Rules

## Responsibilities
- Maintains master `TODO.md` (single source of truth)
- Tracks all sub-agent task claims/completions
- Syncs `TRACKER.md` with progress
- Records decisions in `decisions.md`
- Aggregates §4 reports from all agents
- Manages `waste/` folder for excluded code

## Rules
- All agents MUST update `TODO.md` per AGENT-RULES.md claim protocol
- Task status: `unclaimed` → `in_progress` → `done` / `blocked`
- Commit messages: `claim: T-XXX` / `done: T-XXX`
- Master `TODO.md` in repo root is authoritative