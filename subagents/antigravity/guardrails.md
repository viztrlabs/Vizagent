# Antigravity Guardrails — Design System Compliance

## Mandatory
- ALL components use design tokens from `packages/design-tokens` (CSS custom properties)
- Dual theme: dark/light/auto — hero stays cinematic dark in BOTH themes
- Glass system: `backdrop-filter: blur(16px) saturate(140%)` + border + top-edge highlight
- Typography: Space Grotesk (display), Inter (body), JetBrains Mono (technical)
- Accents: Cyan #00e5ff, Violet #7c3aed (deepened in light mode for contrast)
- Radius: 8/12/16/24/full; Spacing: 4px base scale
- `prefers-reduced-motion`: disable breathing/camera/drift; keep static fades
- WCAG 2.1 AA: contrast ≥4.5:1 both themes, focus-visible rings in accent color

## Component Rules
- Use shadcn/ui primitives (Radix) — no custom accessible components
- Forward refs, `data-testid` support, className merge
- Lazy-load heavy 3D components (Babylon, Marzipano)
- Code-split 3D bundles — only load on demand

## Review Gate
- Every Antigravity output reviewed by Lead against design tokens before merge
- Stitch output = proposal only; Lead adapts to tokens before implementation