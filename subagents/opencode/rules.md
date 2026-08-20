# OpenCode Rules

## Scope
- Track 2: XR World Console (all 5 services)
- Assigned folder: `subagents/opencode/implementation/`

## Workflow
1. Lead provides Implementation Brief
2. Run `opencode_start` with task prompt
3. Output lands in VSCode → Lead reviews against guardrails
4. Approve → commit → push branch
5. Update `TODO.md` with task status

## Constraints
- NEVER edit files outside assigned scope
- NEVER commit secrets
- Run `pnpm typecheck && pnpm test` before reporting PASS
- Work on branch named after feature (e.g., `feature/xr-console-webxr`)