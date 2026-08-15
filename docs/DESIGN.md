# VizTR — Design System (DESIGN)
**Version:** 1.0 | **Date:** 2026-08-10 | **Status:** Locked (VIZTR-UXUI-DESIGN-SYSTEM.md + additions)

> Applies the FINAL stack (Tailwind + shadcn/ui). More interaction/detail than the earlier doc; includes the **cookie-consent modal** and **demo gate** visuals.

---

## 1. Principles
- **Cinematic + functional.** The 3D hero is the "stage"; chrome stays clear and fast (glass).
- **Dual theme everywhere** — dark / light / auto, system-follow + persisted override.
- **Performance is design.** No heavy 3D on marketing chrome; lazy-load engines; shear budgets meet Lighthouse ≥90.
- **Every content surface is `is_placeholder`-aware** (procedural placeholders swapped for real content later).

## 2. Tokens (single source: `tailwind.config.ts` + CSS variables)

**Color**
| Token | Dark | Light |
|---|---|---|
| `bg-base` | #0a0a0f | #f7f7fa |
| `bg-surface` | #12121a | #ffffff |
| `text-primary` | #f5f7ff | #13131a |
| `text-secondary` | #9ca3b8 | #52525e |
| `accent-cyan` | #00e5ff | #007b87 (deepened) |
| `accent-violet` | #7c3aed | #6d28d9 (deepened) |
| `glass-bg` | rgba(255,255,255,0.05) | rgba(0,0,0,0.04) |
| `glass-border` | rgba(255,255,255,0.12) | rgba(0,0,0,0.10) |

**Typeface** — Space Grotesk (display), Inter (body/UI), JetBrains Mono (technical labels). Loaded via `next/font` + preconnect (perf).

**Radius** — 8 / 12 / 16 / 24 px. **Spacing** — 4 px base scale. **Shadow** — layered, low-opacity.

## 3. Glassmorphism
```
.glass { background: var(--glass-bg); backdrop-filter: blur(16px) saturate(140%);
         border: 1px solid var(--glass-border); border-top-color: rgba(255,255,255,.18);
         box-shadow: 0 8px 32px rgba(0,0,0,.18); }
/* solid fallback when backdrop-filter unsupported */
```

## 4. UI Kit (shadcn + glass)
`Button` (primary/outline/ghost/danger) · `Badge` · `Card` (glass) · `Modal` · `Toggle` · `ProgressBar` · `Timeline` · `UploadZone` · `ThemeToggle` · `LoadingSpinner` · `Tooltip` · `Tabs` · `Input/Select/Textarea` · `Table/DataTable` · `Toast` · `Skeleton`.

Accessibility: focus-visible rings; aria-labels; keyboard nav; reduced-motion respected.

## 5. Motion system
- **Framer Motion + GSAP + Lenis** (smooth scroll).
- Deep-breathing pulse on hero accent; scroll-driven camera (hero); staggered reveal for section headers; micro-interactions on nav/CTA.
- Motion budgets: <300ms micro; hero (WebGL) target 60fps; everything pauses under `prefers-reduced-motion`.

## 6. Layout & Pages
- **Root:** glass fixed nav (logo, dropdowns, ThemeToggle, Demo CTA [gated by consent], AuthButton), footer (links, consent-manage link, socials).
- **Home:** cinematic 3D hero (dark in both themes) + DualPositioning + ServicesGrid + XRProductsSection + Benefits + PortfolioPreview + Testimonials + FAQ + CTA.
- **Marketing pages** (`about/services/xr·5/portfolio/blog/contact/pricing/legal`): content-engine driven, glass cards, section headers, SEO meta.
- **Dashboard:** sidebar shell (role-conditional), metric cards, data tables, revenue chart, GPU monitor, log stream, live task board, XR link generator, pixel-streaming control.
- **Viewers:** full-screen, minimal chrome, per-engine (Marzipano/Babylon/MindAR/WebRTC), loading/skeleton + error states.
- **Auth:** centered glass card forms (Supabase).

## 7. XR experience design
- WebXR/VR: in-scene UI (hotspot markers, teleport, AR panel), comfort settings (vignette, snap turn), 90 fps target.
- Virtual Tour: Marzipano, hotspot glow, floorplan mini-map, custom hotspot icons, audio.
- Pixel Streaming: minimal overlay (latency/metrics toggleable), controls for quality. Loading fallbacks before engine boots.

## 8. Cookie Consent Modal (F19)
- **Blocking-first**: appears on first visit; backdrop; card in brand style; cannot dismiss without choosing.
- Title/body: what VizTR stores (essential vs analytics), links to **privacy-policy** & **terms**.
- Buttons: **Accept all** (primary) · **Reject non-essential** (ghost) · **Manage preferences** (link → sheet toggles: Functional / Analytics / Preferences).
- Choice stored (cookie + zustand); revocable via footer "Cookie preferences".
- **Demo CTA reflects consent state:** when not chosen → shows a small 🔒 "Accept cookies to view demo" tooltip/disabled state.

## 9. Placeholder strategy
- `is_placeholder: true` content flagged in admin; rendered as elegant procedural placeholders in public site; swapped via CMS when real content added.

## 10. Dark/Light parity checklist
- Glass adapts; accent deepens in light for AA contrast; 3D hero stays dark in both; text/links meet contrast; charts themed via tokens; images have matching treatments.