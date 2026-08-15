# VizTR Prompt Engineering System — Orchestration & Command Briefs

> **Purpose:** Defines how the VizTR website is built with prompt engineering across multiple tools, with Claude (me) as the lead orchestrator. Establishes the pipeline, the master prompt template, and the per-tool command briefs.
>
> **Status:** Adopted — August 10, 2026.

---

## 1. The Role Model (Who Leads What)

| Participant | Role |
|---|---|
| **Claude (me)** | **Lead architect & orchestrator.** Owns architecture, design-system enforcement, shared-package code, code review, and final QA. I produce every brief and judge every result. |
| **Google Stitch** | **Frontend design concept generation.** Takes my Stitch briefs, produces visual design concepts/mockups. |
| **Google Antigravity** | Agentic IDE — implementation executor for generated designs. |
| **OpenCode** | Terminal AI coding agent — implementation executor (alternate/fast path). |
| **VSCode** | The working editor where all output lands and is reviewed. |
| **Hermes Agent** | Local workstation agent — runs local tasks (asset processing, 3D pipelines, local previews) on the GPU workstation. |
| **You** | Decision-maker + approver. You run the external tools and decide when to switch execution paths. |

**The one rule:** every tool receives a **brief** (never an open-ended instruction), and everything it returns comes back to me for review before it enters the codebase. I am the consistency gate.

---

## 2. The Pipeline

```
[1] I write a Command Brief (Stitch brief for design, or Implementation brief for code)
    |
[2] You run the brief in the appropriate tool:
        Design:  Google Stitch
        Code:    Google Antigravity / OpenCode (VSCode as the editor)
        Local:   Hermes Agent (assets, 3D, previews)
    |
[3] The tool's output lands in the workspace folder (VSCode picks it up)
    |
[4] I review it against the Design System + blueprint → fixes or approves
    |
[5] Approved code → committed → deployed (Vercel)
    |
[6] If you are NOT satisfied → we re-plan (see §6)
```

---

## 3. Master Prompt Template (Injected Into Every Brief)

Every brief carries the same context block so no tool can drift from the system. Use this skeleton:

```text
PROJECT: VizTR — AI-powered ArchViz XR SaaS platform.
DESIGN SYSTEM: See VIZTR-UXUI-DESIGN-SYSTEM.md (dual theme dark/light/auto, glass,
  Space Grotesk + Inter + JetBrains Mono, cyan #00e5ff + violet #7c3aed,
  cinematic dark 3D hero in both themes, rounded 8-24px, 4px spacing scale).
ARCHITECTURE: See VIZTR-SAAS-PLATFORM-BLUEPRINT.md (page map, 4 roles, content engine).
STACK: Next.js 16.2 + React + TypeScript + Tailwind + shadcn/ui + Framer Motion + GSAP.
TASK: {specific deliverable}
SCOPE: {exact file/component/route — nothing outside}
CONSTRAINTS: {a11y, reduced-motion, perf budget, placeholder content}
OUTPUT: {exact format: file names, component names, what to return}
```

---

## 4. Stitch Brief — Frontend Design (Google Stitch)

Used first, per your flow: "Google Stitch for frontend design, then implement the same."

Each Stitch brief specifies:

- **Page/section** (e.g., Home hero, Services hub, XR World landing).
- **Design intent** — the "wow" moment: breathing hero, 3D tilt cards, glass panels, scroll-driven camera.
- **Layout constraints** — 12-col grid, max-width1280, sections listed in order.
- **Theme behavior** — must be specified for dark AND light.
- **Component names** — must match the inventory in the Design System so implementation maps 1:1.
- **Content** — placeholder copy/markup rules (is_placeholder convention).

**Rule:** Stitch output is treated as a *proposal*. I adapt it to the design tokens and finalize before implementation — never implemented verbatim.

---

## 5. Implementation Brief — Code (Antigravity / OpenCode / VSCode)

Used second: implement the approved design. Each implementation brief specifies:

- **Files to create/modify** (exact paths under `apps/web` or `packages/shared-ui`).
- **Component list** with their props and design-token usage.
- **Animation spec** — which motion belongs where (Framer Motion vs GSAP), respecting reduced-motion.
- **Data shape** — what comes from the content engine (Supabase) vs. static.
- **Acceptance criteria** — what "done" means (build passes, no type errors, a11y, 60fps).

**Rule:** implementation output returns to me for review. I run the design-system compliance check and fix or reject.

---

## 6. Feedback & Re-plan Path (Your "Not Satisfied" Lever)

If at any point my results don't meet your bar, this is the switch we agreed on:

1. You say what's wrong (or just "not satisfied").
2. We decide the lever: **Re-brief** (tighter prompt), **Switch executor** (me → Antigravity/OpenCode for the next chunk), or **Stitch-first** (new design concept before any code).
3. I rewrite the brief accordingly and we continue.

No friction: the briefs are the single source of truth, so switching executors mid-phase is cheap — the next tool just picks up the same brief.

---

## 7. Consistency Guarantees

- Every brief injects the **Master Prompt Template** (§3) — no tool ever sees a context-free ask.
- **Design tokens live in code** (`packages/design-tokens`) and are referenced, never hardcoded.
- All components must map to the **Design System inventory** — no ad-hoc naming.
- Placeholder content carries `is_placeholder: true` so real content swaps cleanly.
- **I review everything** before it merges — the human (you) approves only once.

---

## 8. Phase A Execution Example (Mini Sample Brief)

**Stitch brief — Home hero:**

```text
PROJECT: VizTR (as §3 template).
TASK: Design the Home page hero section.
DESIGN INTENT: Cinematic. 3D architectural scene as the stage (dark in BOTH themes),
  glass navbar floating over it, deep-breathing glow on a 6-8s cycle, headline
  "Architecture, rendered live." + two CTA pills, scroll cue at bottom.
LAYOUT: Full-viewport. 12-col grid. Nav top (glass). Headline center-left. CTA row below.
THEME: Hero stays dark; chrome adapts via tokens. Specify both.
COMPONENTS: Preloader, Navbar, Hero3D, ScrollCue, CTASection.
CONTENT: Placeholder copy only (is_placeholder: true).
OUTPUT: Section layout + motion notes + component breakdown. No code yet.
```

**Then the Implementation brief** (after you run Stitch) converts that into exact files, components, and motion under `apps/web/app/page.tsx`.

---

## 9. What I Need Back From Each Run

| Tool | Return to me |
|---|---|
| Stitch | The generated design (export/image/URL) + any component notes |
| Antigravity / OpenCode | The code diff or files landed in the workspace |
| Hermes Agent | Status + logs + preview URL for local/3D tasks |
| VSCode | Any manual edits you made (so I review the actual state) |

---

*Version 1.0 — August 10, 2026*
