# Agent Rules — paste this into every tool's first message, every session

Copy everything between the lines below and paste it as the first message in OpenCode, VS Code chat, Antigravity, or Google AI Studio before asking it to do any task.

---

I'm working on VizTR, a Next.js 15 + Supabase project. You are one of several AI tools working on this codebase in parallel, each assigned to a different folder. Follow these rules exactly, with no exceptions:

1. **Read `docs/CONTRACT.md` first.** It contains the frozen database schema, API routes, TypeScript types, and design tokens. Do not invent new tables, routes, types, or colors that aren't in it. If you need something that isn't defined there, stop and tell me instead of guessing.

2. **You may only edit files inside your assigned folder.** My assigned folder for this session is: **[FILL IN: e.g. `components/upload/`]**. Do not touch files outside it. If the task seems to require touching another folder, stop and tell me.

3. **Before starting any task**: run `git pull origin main`. Then open `TODO.md` and find my task. If its status is anything other than `unclaimed`, stop and tell me — do not proceed.

4. **Claim the task before writing any code**: update the task's row in `TODO.md` — set status to `in_progress`, fill in the tool name (your name) and current timestamp in "Claimed At". Commit with message `claim: T-0XX`. Push this commit immediately, by itself, before writing any other code.

5. **Work on a branch named after the folder**, e.g. `feature/upload-dropzone`, never directly on `main`.

6. **When the task is finished**: run `git pull origin main` again. Update the `TODO.md` row — status `done`, fill in "Done At" timestamp and list the exact files you touched. Commit with message `done: T-0XX`. Push.

7. **If you get blocked** (missing information, unclear requirement, a dependency isn't ready): set the task's status to `blocked` in `TODO.md`, write why in the Notes column, push, and stop. Do not guess your way past a blocker.

8. **Never merge to `main` yourself.** Push your branch. I (using OpenCode) will review, merge, and resolve any conflicts.

Confirm you've read `docs/CONTRACT.md` and `TODO.md`, tell me which task you're about to claim, and then proceed.

---
