# OpenCode Implementation — Track 2

Assigned folder for XR World Console work. One subfolder per claimed task (e.g. `t2.1-unified-xr-console/`).

Workflow (see `subagents/opencode/rules.md`):
1. Lead assigns task from `subagents/opencode/TODO.md`
2. Claim: set status `in_progress`, fill Claimed At, commit `claim: T-XXX`
3. Execute the task in this folder
4. Update: status `done`, fill Done At + Files Touched, commit `done: T-XXX`, push
5. If blocked: status `blocked`, explain in Notes, push
6. OpenWork aggregates reports into `docs/TRACKER.md` (section 2b)