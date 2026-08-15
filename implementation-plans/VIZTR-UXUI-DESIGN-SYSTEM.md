# VizTR UX/UI Design System — Direction & Spec

> **Purpose:** Locks the UX/UI design direction for the entire VizTR platform (public site + dashboards) before planning. Companion to `VIZTR-SAAS-PLATFORM-BLUEPRINT.md` and the design tokens in `VIZTR-COMPLETE-FEATURES.md`.
>
> **Status:** Direction locked — August 10, 2026.

---

## 1. Locked Design Direction

| Decision | Choice |
|---|---|
| **Theme** | Dual theme: **dark / light / auto** (system-follow), glass throughout |
| **Aesthetic** | Cinematic dark + light glass — frosted panels, glowing cyan/violet accents, architectural grid, deep spatial feel |
| **Display font** | Space Grotesk |
| **Body / UI font** | Inter |
| **Mono / technical** | JetBrains Mono (labels, coordinates, stats, data) |
| **Accent colors** | Cyan `#00e5ff`, Violet `#7c3aed` (kept across both themes) |
| **Portfolio content** | Procedural placeholders first; real content swapped later via admin |
| **Motion** | Deep-breathing hero, scroll-driven camera, staggered reveals, 60fps budget, reduced-motion support |

---

## 2. Dual Theme Strategy (Dark / Light / Auto)

- A **theme provider** reads `prefers-color-scheme` (auto) with a manual override toggle stored in state (persisted).
- **Semantic tokens** drive every surface — components never hardcode color.
- **The 3D stage rule:** the 3D hero and XR canvases stay **cinematic dark in both themes**. They are the "theater"; the glass chrome around them adapts to the theme. This preserves the wow-effect in light mode and is the standard pattern for immersive product sites.
- Dashboard and public site share the same token system — one design language, two environments.

### Theme surface map

| Token | Dark theme | Light theme |
|---|---|---|
| `bg-base` | near-black `#0a0a0f` | soft white `#f7f7fa` |
| `bg-surface` | `#12121a` (raised) | `#ffffff` (raised) |
| `text-primary` | `#f4f4f7` | `#12121a` |
| `text-secondary` | `#a1a1b0` | `#5c5c6e` |
| `accent-cyan` | `#00e5ff` | `#00a8c8` (deepened for contrast) |
| `accent-violet` | `#7c3aed` | `#6d28d9` (deepened for contrast) |
| `glass-bg` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.55)` |
| `glass-border` | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.08)` |

*(Exact values finalized in the token file during Phase C; these are the working contract.)*

---

## 3. Typography System

| Role | Font | Usage |
|---|---|---|
| Display | **Space Grotesk** 600/700 | Headlines, hero titles, section headers, numbers |
| Body / UI | **Inter** 400/500/600 | Paragraphs, nav, buttons, forms, dashboard tables |
| Mono / technical | **JetBrains Mono** 400/500 | Labels, coordinates, stats, timestamps, code, data chips |

- Type scale: `display-xl` (hero) → `display-lg` → `display-md` → `h1..h6` → `body-lg/md/sm` → `caption` → `micro` (mono labels).
- Fluid type via `clamp()` for display sizes so the hero scales with viewport.
- Line-height: display 1.05–1.15, body 1.5–1.6. Tracking: display slightly tight (−0.02em), mono slightly wide (+0.06em).

---

## 4. Glass System

Glass is the signature surface treatment (both themes).

- **Default glass:** `background: var(--glass-bg)` + `backdrop-filter: blur(16px) saturate(140%)` + `border: 1px solid var(--glass-border)` + subtle top-edge highlight.
- **Elevated glass** (modals, sticky nav, cards on hover): blur(24px), stronger border, soft shadow.
- **Glass fallback:** where `backdrop-filter` is unsupported, fall back to a 95% opaque surface color (never broken text).
- Glass is used on: nav, hero overlay chrome, service cards, stat panels, dashboard sidebar, modals, code/data chips.

---

## 5. Layout & Geometry

- **Grid:** 12-column, max-width 1280px (site), 1440px (dashboard). 24px gutters, 16px on mobile.
- **Radius scale:** `sm 8` / `md 12` / `lg 16` / `xl 24` / `full` — architectural, slightly generous.
- **Spacing scale:** 4px base → 4/8/12/16/24/32/48/64/96/128.
- **Shadows:** soft ambient + colored glow for accents (`0 0 32px rgba(0,229,255,0.25)` on hover states only).

---

## 6. Component Inventory

**Site components:** Hero3D, Preloader, Navbar (glass, theme toggle), ServicePillarCard (Studio / XR World), ServiceCard, XRLaunchCard, PortfolioCard, PortfolioFilter, CaseStudy, StatsBar, TestimonialCard, ProcessSteps, FeatureRow, FAQAccordion, ContactForm, Footer, DemoLauncher, ThemeToggle, BlogCard.

**Dashboard components:** AppShell (sidebar + topbar), RoleNav, KPIStat, DataTable, ChartCard, KanbanBoard (CRM), MilestoneTimeline, ApprovalCard, UploadZone (3D assets), XRConsoleGrid (5 services), BlockEditor (page builder), BlockPalette, BlockProperties, PublishBar, VersionHistory, AIChatPanel, BillingTable, UserRoleBadge.

---

## 7. Motion System (Wow Effects)

From the blueprint §7 — refined for dual theme:

1. **Deep-breathing hero:** 6–8s sine cycle on scale/glow. In light mode the glow softens (accent opacity reduced) to protect readability.
2. **Scroll-driven camera** through the 3D scene (desktop; disabled/simplified on mobile).
3. **Reveals:** staggered fade/rise/tilt; respect `prefers-reduced-motion` (falls back to fade only).
4. **3D tilt cards:** Studio & XR service cards tilt + glow on cursor.
5. **Preloader:** cinematic logo mark while the WebGL scene warms.
6. **Hover energy:** buttons lift + accent glow; links underline-sweep.
7. **Dashboard motion:** restrained — quick fades/slides only, never playful. Dashboards must feel precise, not flashy.

---

## 8. Placeholder Strategy (No Real Content Yet)

Because we design with placeholders first, they must look intentional:

- **Portfolio/hero placeholders:** procedural 3D renders (geometry + gradients + fog) generated in Babylon.js or as styled SVG — architectural abstract scenes in cyan/violet. No stock photos.
- **Team/photos:** duotone gradient avatars with initials.
- **Case study text:** realistic lorem-style copy with real structure (brief → process → result + stats) so the admin swap is trivial.
- Every placeholder is marked in the content model as `is_placeholder: true` and replaced via the admin when real assets arrive.

---

## 9. Accessibility Checklist (Dual Theme)

- Contrast ≥ 4.5:1 for body text in **both** themes (accent colors deepened in light mode to pass).
- `prefers-reduced-motion`: disable breathing/camera/drift; keep static fades.
- Theme toggle labeled; auto theme respects OS.
- Glass readability fallback where backdrop-filter unsupported.
- Focus-visible rings in accent color on both themes.
- 3D scenes always have non-3D fallback content (text + static image) for SEO/accessibility.

---

## 10. What This Unlocks

This spec feeds directly into planning and Phase C build:

- Design tokens file → `packages/design-tokens` (dual-theme semantic tokens).
- `packages/shared-ui` component build order follows the inventory in §6.
- Hero3D proof-of-concept becomes the first Babylon.js integration.
- Content model gains `is_placeholder` flag.

---

*Design system version 1.0 — August 10, 2026*
