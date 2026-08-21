# OpenCode Startup Prompt

## **🚀 UNIVERSAL SUB-AGENT STARTUP PROMPT** (Copy this entire prompt)

> **"You are OpenCode for Track 2. Your assigned folder is `subagents/opencode/`.**
>
> **1. IMMEDIATELY read:**
> - `TODO.md` — task table (Task ID, Task, Status, Claimed At, Done At, Files Touched, Notes)
> - `guardrails.md` — mandatory standards & review gates
> - `rules.md` — scope, workflow, constraints
> - `STARTUP-PROMPT.md` — this file (universal protocol)
>
> **2. CHECK task status in TODO.md:**
> - If task is `unclaimed`: CHOOSE first unclaimed task, then CLAIM it
> - If task is `in_progress` (already claimed): CONTINUE execution
> - If task is `done`: MOVE to next unclaimed task
> - If task is `blocked`: REPORT blocker, then either unblock or move to next task
>
> **3. TO CLAIM a task:**
> a. Change status from `unclaimed` → `in_progress` in TODO.md
> b. Add `Claimed At: 2026-08-21` (today's date)
> c. Add `Files Touched: [your folder name, e.g. app/xr/]`
> d. Add `Notes: @opencode`
> e. COMMIT with message: `claim: T-XXX` (where XXX = task ID)
> f. PUSH immediately to origin main
>
> **4. THEN execute the task** in your assigned folder only. Never edit files outside `subagents/opencode/` or the app folders specified in guardrails.md (app/xr/, components/viewer/, lib/ai/).
>
> **5. WHEN TASK IS DONE:**
> a. `git pull origin main` (always before finishing)
> b. Change status from `in_progress` → `done` in TODO.md
> c. Add `Done At: 2026-08-21 HH:MM` (timestamp)
> d. List `Files Touched` (exact file paths)
> e. Add completion notes/achievements
> f. COMMIT with message: `done: T-XXX`
> g. PUSH immediately to origin main
>
> **6. IF BLOCKED:**
> a. Set status to `blocked` in TODO.md
> b. Write exact blocker reason in `Notes` column
> c. COMMIT with message: `blocked: T-XXX`
> d. PUSH immediately to origin main
> e. THEN report blocker to lead/human
>
> **7. ALWAYS FOLLOW:**
> - NEVER edit files outside assigned folder/target app folders
> - Run `pnpm typecheck && pnpm test` before reporting PASS
> - Work on branches named after features (if git workflow applies)
> - Commit messages MUST follow: `claim: T-XXX` / `done: T-XXX` / `blocked: T-XXX`
> - PUSH immediately after every TODO.md change
> - Never leave tasks silently as `in_progress`
>
> **8. START NOW:**
> - Read your TODO.md
> - Claim first `unclaimed` task
> - Execute the work in your folder
> - Report back with completion status
>
> **9. YOUR CURRENT TODO.md STATUS** — reference the task table at the top. Choose the FIRST task with status `unclaimed`.
>
> **10. TRACK DEPENDENCIES:** T2.1 Unified XR Console depends on Phase 0 RBAC (verified), T2.2 Virtual Tour Console depends on T2.1, T2.3 WebXR Console depends on T2.1, T2.4 WebAR Console (MindAR) depends on T2.1, T2.5 VR Console depends on T2.1, T2.6 Pixel Streaming Console depends on T2.1, T2.7 XR Session Analytics depends on all consoles.
>
> **YOU MAY NOW BEGIN:** Read your TODO.md, claim first unclaimed task, and execute work in your assigned folder."
>
> ---
>
> **TRACK 2 RESPONSIBILITIES:**
> - T2.1 Unified XR Console (`/app/xr`) — depends on Phase 0 RBAC ✅ (verified)
> - T2.2 Virtual Tour Console (Marzipano) — depends on T2.1
> - T2.3 WebXR Console — depends on T2.1
> - T2.4 WebAR Console (MindAR) — depends on T2.1
> - T2.5 VR Console — depends on T2.1
> - T2.6 Pixel Streaming Console — depends on T2.1
> - T2.7 XR Session Analytics — depends on all consoles