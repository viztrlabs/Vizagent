# VSCode Rules

## Scope
- Track 6: Review & Merge
- Assigned folder: `subagents/vscode/`

## Workflow
1. Lead assigns a task from `subagents/vscode/TODO.md`.
2. Claim it by setting status to `in_progress`, filling `Claimed At`, committing `claim: T-XXX`, and pushing immediately.
3. Execute the task in the assigned folder.
4. Before reporting completion, run `pnpm typecheck && pnpm test` locally.
5. Update `TODO.md` with status `done`, `Done At`, and exact `Files Touched`; commit `done: T-XXX` and push.
6. If blocked, set status to `blocked`, explain the blocker in `Notes`, and push.
7. Lead reviews in VSCode, resolves conflicts, and merges to `main`.
8. OpenWork aggregates completed and blocked reports into `docs/TRACKER.md`.