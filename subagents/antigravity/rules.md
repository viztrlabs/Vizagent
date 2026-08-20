# Antigravity Rules

## Scope
- Track 1: Public 3D Website + Admin Content Engine
- Track 3: Admin & Content Engine (parallel with Track 1)
- Assigned folder: `subagents/antigravity/implementation/`

## Workflow
1. Lead provides Implementation Brief (with Stitch design if needed)
2. Run brief in Antigravity
3. Output lands in VSCode → Lead reviews against guardrails
4. Approve → commit → push branch
5. Update `TODO.md` with task status

## Constraints
- NEVER edit files outside `subagents/antigravity/implementation/` and target app folders
- NEVER commit secrets
- Run `pnpm typecheck && pnpm test` before reporting PASS
- Work on branch named after feature (e.g., `feature/public-site-home-hero`)