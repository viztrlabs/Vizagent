# VSCode Workflow — Track 6

Assigned folder for review and merge work. Tasks are listed in `TODO.md`.

Workflow:

1. Lead assigns a task from `subagents/vscode/TODO.md`.
2. Claim it: set status to `in_progress`, fill `Claimed At`, commit `claim: T-XXX`, and push immediately.
3. Execute the task in the assigned folder.
4. Run `pnpm typecheck && pnpm test` locally before reporting completion.
5. Update `TODO.md`: set status to `done`, fill `Done At` and exact `Files Touched`, commit `done: T-XXX`, and push.
6. If blocked, set status to `blocked`, explain the blocker in `Notes`, and push.
7. The lead reviews in VSCode, resolves conflicts, and merges to `main`.
8. OpenWork aggregates completed and blocked reports into `docs/TRACKER.md`.
