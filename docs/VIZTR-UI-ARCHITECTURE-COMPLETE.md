# VIZTR — Complete UI Architecture

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Act Mode — UI Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Next.js App Router Structure](#2-nextjs-app-router-structure)
3. [Route Map — All 47 Pages](#3-route-map--all-47-pages)
4. [Navigation System](#4-navigation-system)
5. [Layout Hierarchy](#5-layout-hierarchy)
6. [Shared Component Library](#6-shared-component-library)
7. [Design Token System](#7-design-token-system)
8. [Responsive Behavior](#8-responsive-behavior)
9. [Loading States & Skeletons](#9-loading-states--skeletons)
10. [Empty States](#10-empty-states)
11. [Error Boundaries](#11-error-boundaries)
12. [Accessibility Requirements](#12-accessibility-requirements)
13. [Route Guards & Permissions](#13-route-guards--permissions)

---

## 1. Overview

VizTR uses **Next.js 14+ App Router** with a monorepo structure containing three separate apps:

| App | Domain | Purpose |
|-----|--------|---------|
| `apps/web` | `viztr.io` | Marketing site, portfolio showcase, public views |
| `apps/admin` | `viztr.io/admin` | Agency management dashboard, superadmin panel |
| `apps/client` | `viztr.io/client` | Client portal, project viewing, token delivery |

### Technology Stack (UI Layer)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router, RSC) |
| Styling | Tailwind CSS 3.4+ |
| Components | Radix UI Primitives + Custom |
| Animation | Framer Motion 11+ |
| State | Zustand (client) + React Query (server) |
| Forms | React Hook Form + Zod validation |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Icons | Lucide React |
| 3D/XR | Babylon.js (single core engine) |
| Panorama | Marzipano (carve-out) |

---

## 2. Next.js App Router Structure

```
apps/
├── web/                          # Marketing site
│   ├── app/
│   │   ├── layout.tsx            # Root layout (marketing)
│   │   ├── page.tsx              # Homepage
│   │   ├── portfolio/
│   │   │   ├── page.tsx          # Portfolio grid
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Project detail
│   │   ├── services/
│   │   │   ├── page.tsx          # Services overview
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Service detail
│   │   ├── about/
│   │   │   ├── page.tsx          # About page
│   │   │   └── team/
│   │   │       └── page.tsx      # Team page
│   │   ├── careers/
│   │   │   └── page.tsx          # Careers page
│   │   ├── blog/
│   │   │   ├── page.tsx          # Blog listing
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx      # Blog post
│   │   │   └── category/
│   │   │       └── [slug]/
│   │   │           └── page.tsx  # Blog category
│   │   ├── pricing/
│   │   │   └── page.tsx          # Pricing page
│   │   ├── contact/
│   │   │   └── page.tsx          # Contact page
│   │   ├── xr/
│   │   │   ├── page.tsx          # XR World hub
│   │   │   ├── viewer/
│   │   │   │   └── page.tsx      # Token viewer entry
│   │   │   └── [token]/
│   │   │       └── page.tsx      # Token viewer
│   │   ├── showcase/
│   │   │   └── page.tsx          # XR showcase
│   │   ├── legal/
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx      # Privacy policy
│   │   │   ├── terms/
│   │   │   │   └── page.tsx      # Terms of service
│   │   │   └── cookie/
│   │   │       └── page.tsx      # Cookie policy
│   │   └── sitemap.ts            # Dynamic sitemap
│   └── components/
│       ├── layout/               # Header, Footer, Nav
│       ├── sections/             # Homepage sections
│       └── ui/                   # Shared UI components
│
├── admin/                        # Admin dashboard
│   ├── app/
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── page.tsx              # Redirect to /dashboard
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Admin login
│   │   │   └── register/
│   │   │       └── page.tsx      # Agency registration
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Dashboard shell
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Main dashboard
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx      # Projects list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # New project
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx  # Project detail
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── models/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── xr/
│   │   │   │       │   └── page.tsx  # XR settings
│   │   │   │       ├── timeline/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── files/
│   │   │   │           └── page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx      # Clients list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Client detail
│   │   │   ├── models/
│   │   │   │   ├── page.tsx      # Model library
│   │   │   │   └── upload/
│   │   │   │       └── page.tsx  # Upload model
│   │   │   ├── ai/
│   │   │   │   ├── page.tsx      # AI hub
│   │   │   │   ├── studio/
│   │   │   │   │   └── page.tsx  # Prompt studio
│   │   │   │   ├── router/
│   │   │   │   │   └── page.tsx  # LLM router config
│   │   │   │   ├── usage/
│   │   │   │   │   └── page.tsx  # Usage analytics
│   │   │   │   └── templates/
│   │   │   │       └── page.tsx  # Prompt templates
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx      # Billing overview
│   │   │   │   ├── invoices/
│   │   │   │   │   └── page.tsx  # Invoice list
│   │   │   │   └── plans/
│   │   │   │       └── page.tsx  # Plan management
│   │   │   ├── messages/
│   │   │   │   └── page.tsx      # Messages center
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx      # Bookings list
│   │   │   │   └── calendar/
│   │   │   │       └── page.tsx  # Calendar view
│   │   │   ├── analytics/
│   │   │   │   ├── page.tsx      # Analytics overview
│   │   │   │   └── reports/
│   │   │   │       └── page.tsx  # Reports
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx      # Settings hub
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx  # Profile settings
│   │   │   │   ├── agency/
│   │   │   │   │   └── page.tsx  # Agency settings
│   │   │   │   ├── branding/
│   │   │   │   │   └── page.tsx  # White-label branding
│   │   │   │   ├── notifications/
│   │   │   │   │   └── page.tsx  # Notification prefs
│   │   │   │   ├── integrations/
│   │   │   │   │   └── page.tsx  # Integrations
│   │   │   │   ├── security/
│   │   │   │   │   └── page.tsx  # Security settings
│   │   │   │   └── team/
│   │   │   │       └── page.tsx  # Team management
│   │   │   └── developer/
│   │   │       ├── page.tsx      # Developer hub
│   │   │       ├── api-keys/
│   │   │       │   └── page.tsx  # API key management
│   │   │       ├── webhooks/
│   │   │       │   └── page.tsx  # Webhook config
│   │   │       └── docs/
│   │   │           └── page.tsx  # API docs viewer
│   │   └── (superadmin)/
│   │       ├── layout.tsx        # Superadmin shell
│   │       ├── admin/
│   │       │   ├── page.tsx      # Admin dashboard
│   │       │   ├── agencies/
│   │       │   │   ├── page.tsx  # Agency management
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx
│   │       │   ├── users/
│   │       │   │   ├── page.tsx  # User management
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx
│   │       │   ├── billing/
│   │       │   │   └── page.tsx  # Platform billing
│   │       │   ├── platform/
│   │       │   │   ├── page.tsx  # Platform settings
│   │       │   │   └── features/
│   │       │   │       └── page.tsx
│   │       │   └── support/
│   │       │       └── page.tsx  # Support queue
│   │       └── settings/
│   │           ├── page.tsx      # Superadmin settings
│   │           └── security/
│   │               └── page.tsx
│   └── components/
│       ├── dashboard/            # Dashboard widgets
│       ├── settings/             # Settings forms
│       └── ui/                   # Shared UI components
│
└── client/                       # Client portal
    ├── app/
    │   ├── layout.tsx            # Client layout
    │   ├── page.tsx              # Redirect to /dashboard
    │   ├── (auth)/
    │   │   ├── login/
    │   │   │   └── page.tsx      # Client login
    │   │   └── magic-link/
    │   │       └── page.tsx      # Magic link auth
    │   ├── (portal)/
    │   │   ├── layout.tsx        # Portal shell
    │   │   ├── dashboard/
    │   │   │   └── page.tsx      # Client dashboard
    │   │   ├── projects/
    │   │   │   ├── page.tsx      # My projects
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx  # Project overview
    │   │   │       ├── timeline/
    │   │   │       │   └── page.tsx
    │   │   │       ├── files/
    │   │   │       │   └── page.tsx
    │   │   │       ├── feedback/
    │   │   │       │   └── page.tsx
    │   │   │       └── xr/
    │   │   │           └── page.tsx  # XR viewer
    │   │   ├── messages/
    │   │   │   └── page.tsx      # Messages
    │   │   ├── invoices/
    │   │   │   ├── page.tsx      # Invoice list
    │   │   │   └── [id]/
    │   │   │       └── page.tsx  # Invoice detail
    │   │   ├── bookings/
    │   │   │   └── page.tsx      # My bookings
    │   │   └── settings/
    │   │       ├── page.tsx      # Profile
    │   │       └── billing/
    │   │           └── page.tsx  # Billing settings
    │   └── (token)/
    │       └── viewer/
    │           ├── page.tsx      # Token entry
    │           └── [token]/
    │               └── page.tsx  # Token viewer
    └── components/
        ├── portal/               # Portal components
        └── ui/                   # Shared UI components
```

---

## 3. Route Map — All 55 Pages

### 3.1 Public Marketing Pages (`apps/web`)

| # | Route | Page | Auth | Role | Layout |
|---|-------|------|------|------|--------|
| 1 | `/` | Homepage | No | Public | Marketing |
| 2 | `/portfolio` | Portfolio Grid | No | Public | Marketing |
| 3 | `/portfolio/[slug]` | Project Detail | No | Public | Marketing |
| 4 | `/services` | Services Overview | No | Public | Marketing |
| 5 | `/services/[slug]` | Service Detail | No | Public | Marketing |
| 6 | `/about` | About | No | Public | Marketing |
| 7 | `/about/team` | Team | No | Public | Marketing |
| 8 | `/careers` | Careers | No | Public | Marketing |
| 9 | `/blog` | Blog Listing | No | Public | Marketing |
| 10 | `/blog/[slug]` | Blog Post | No | Public | Marketing |
| 11 | `/blog/category/[slug]` | Blog Category | No | Public | Marketing |
| 12 | `/pricing` | Pricing | No | Public | Marketing |
| 13 | `/contact` | Contact | No | Public | Marketing |
| 14 | `/xr` | XR World Hub | No | Public | Marketing |
| 15 | `/xr/viewer` | Token Viewer Entry | No | Public | Marketing |
| 16 | `/xr/[token]` | Token Viewer | No | Public | Marketing |
| 17 | `/showcase` | XR Showcase | No | Public | Marketing |
| 18 | `/system-status` | System Status | No | Public | Marketing |
| 19 | `/legal/privacy` | Privacy Policy | No | Public | Marketing |
| 20 | `/legal/terms` | Terms of Service | No | Public | Marketing |
| 21 | `/legal/cookie` | Cookie Policy | No | Public | Marketing |

### 3.2 Admin Dashboard Pages (`apps/admin`)

| # | Route | Page | Auth | Role | Layout |
|---|-------|------|------|------|--------|
| 21 | `/login` | Admin Login | No | Public | Auth |
| 22 | `/register` | Agency Registration | No | Public | Auth |
| 23 | `/dashboard` | Main Dashboard | Yes | Admin+ | Dashboard |
| 24 | `/projects` | Projects List | Yes | Admin+ | Dashboard |
| 25 | `/projects/new` | New Project | Yes | Admin+ | Dashboard |
| 26 | `/projects/[id]` | Project Detail | Yes | Admin+ | Dashboard |
| 27 | `/projects/[id]/xr` | XR Settings | Yes | Admin+ | Dashboard |
| 28 | `/clients` | Clients List | Yes | Admin+ | Dashboard |
| 29 | `/clients/[id]` | Client Detail | Yes | Admin+ | Dashboard |
| 30 | `/models` | Model Library | Yes | Admin+ | Dashboard |
| 31 | `/ai` | AI Hub | Yes | Admin+ | Dashboard |
| 32 | `/ai/studio` | Prompt Studio | Yes | Admin+ | Dashboard |
| 33 | `/ai/router` | LLM Router | Yes | Admin+ | Dashboard |
| 34 | `/ai/usage` | AI Usage Analytics | Yes | Admin+ | Dashboard |
| 35 | `/ai/agents` | AI Agent Configuration | Yes | Admin+ | Dashboard |
| 36 | `/ai/safety` | AI Safety & Guardrails | Yes | Admin+ | Dashboard |
| 37 | `/billing` | Billing Overview | Yes | Admin+ | Dashboard |
| 38 | `/messages` | Messages Center | Yes | Admin+ | Dashboard |
| 39 | `/bookings` | Bookings List | Yes | Admin+ | Dashboard |
| 40 | `/analytics` | Analytics Overview | Yes | Admin+ | Dashboard |
| 41 | `/settings` | Settings Hub | Yes | Admin+ | Dashboard |
| 42 | `/settings/profile` | Profile Settings | Yes | Admin+ | Dashboard |
| 43 | `/settings/agency` | Agency Settings | Yes | Admin+ | Dashboard |
| 44 | `/settings/branding` | White-label Branding | Yes | Admin+ | Dashboard |
| 45 | `/developer` | Developer Hub | Yes | Admin+ | Dashboard |
| 46 | `/developer/api-keys` | API Key Management | Yes | Admin+ | Dashboard |
| 47 | `/developer/webhooks` | Webhook Config | Yes | Admin+ | Dashboard |
| 48 | `/developer/docs` | API Docs Viewer | Yes | Admin+ | Dashboard |
| 49 | `/admin` | Superadmin Dashboard | Yes | Superadmin | Superadmin |
| 50 | `/admin/operations` | Platform Operations | Yes | Superadmin | Superadmin |

### 3.3 Client Portal Pages (`apps/client`)

| # | Route | Page | Auth | Role | Layout |
|---|-------|------|------|------|--------|
| 48 | `/login` | Client Login | No | Public | Auth |
| 49 | `/magic-link` | Magic Link Auth | No | Public | Auth |
| 50 | `/dashboard` | Client Dashboard | Yes | Client | Portal |
| 51 | `/projects` | My Projects | Yes | Client | Portal |
| 52 | `/projects/[id]` | Project Overview | Yes | Client | Portal |
| 53 | `/projects/[id]/timeline` | Project Timeline | Yes | Client | Portal |
| 54 | `/projects/[id]/files` | Project Files | Yes | Client | Portal |
| 55 | `/projects/[id]/feedback` | Project Feedback | Yes | Client | Portal |
| 56 | `/projects/[id]/xr` | Project XR Viewer | Yes | Client | Portal |
| 57 | `/messages` | Messages | Yes | Client | Portal |
| 58 | `/invoices` | Invoices List | Yes | Client | Portal |
| 59 | `/invoices/[id]` | Invoice Detail | Yes | Client | Portal |
| 60 | `/bookings` | My Bookings | Yes | Client | Portal |
| 61 | `/settings` | Profile | Yes | Client | Portal |
| 62 | `/settings/billing` | Billing Settings | Yes | Client | Portal |
| 63 | `/viewer/[token]` | Token Viewer | No | Public | Token |

---

## 4. Navigation System

### 4.1 Marketing Header (`apps/web`)

```
┌─────────────────────────────────────────────────────────────┐
│  Logo    Portfolio  Services  XR World  Blog  Pricing      │
│                    About ▾     ↓                           │
│                              ├── About                     │
│                              ├── Team                      │
│                              └── Careers                   │
│                                                          │
│                                        [Contact] [Login]  │
└─────────────────────────────────────────────────────────────┘
```

**Mobile:** Hamburger menu with slide-in drawer.

### 4.2 Admin Dashboard Sidebar (`apps/admin`)

```
┌──────────────────────────────────────┐
│  Logo (or Agency Logo if white-label)│
│──────────────────────────────────────│
│  Dashboard                          │
│──────────────────────────────────────│
│  Projects                          │
│  Clients                           │
│  Models                            │
│──────────────────────────────────────│
│  AI ▾                              │
│  ├── Hub                           │
│  ├── Prompt Studio                 │
│  ├── LLM Router                    │
│  ├── Usage                         │
│  ├── Agent Config                  │
│  └── Safety & Guardrails           │
│──────────────────────────────────────│
│  Billing                           │
│  Messages                          │
│  Bookings                          │
│  Analytics                         │
│──────────────────────────────────────│
│  Settings ▾                        │
│  ├── Profile                       │
│  ├── Agency                        │
│  ├── Branding                      │
│  ├── Notifications                 │
│  ├── Integrations                  │
│  ├── Security                      │
│  └── Team                          │
│──────────────────────────────────────│
│  Developer ▾                       │
│  ├── API Keys                      │
│  ├── Webhooks                      │
│  └── Docs                          │
│──────────────────────────────────────│
│  ┌──────────────────────────────┐   │
│  │  Avatar  John Doe            │   │
│  │  Agency: ArchViz Studio      │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

### 4.3 Client Portal Sidebar (`apps/client`)

```
┌──────────────────────────────────────┐
│  Logo (or Agency Logo)              │
│──────────────────────────────────────│
│  Dashboard                          │
│──────────────────────────────────────│
│  My Projects ▾                      │
│  ├── Project A                     │
│  ├── Project B                     │
│  └── View All                      │
│──────────────────────────────────────│
│  Messages                          │
│  Invoices                          │
│  Bookings                          │
│──────────────────────────────────────│
│  Settings ▾                        │
│  ├── Profile                       │
│  └── Billing                       │
│──────────────────────────────────────│
│  ┌──────────────────────────────┐   │
│  │  Avatar  Jane Smith          │   │
│  │  Client: ABC Corp            │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

### 4.4 Superadmin Sidebar (`apps/admin`)

```
┌──────────────────────────────────────┐
│  Logo (VizTR Platform)              │
│  🔧 SUPERADMIN                      │
│──────────────────────────────────────│
│  Dashboard                          │
│──────────────────────────────────────│
│  Agencies                          │
│  Users                             │
│  Platform Billing                  │
│  Platform Settings                 │
│  Feature Flags                     │
│  Operations                        │
│──────────────────────────────────────│
│  Support Queue                     │
│──────────────────────────────────────│
│  [Switch to Admin View]            │
└──────────────────────────────────────┘
```

---

## 5. Layout Hierarchy

### 5.1 Marketing Layout (`apps/web`)

```tsx
// apps/web/app/layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  )
}
```

### 5.2 Dashboard Layout (`apps/admin`)

```tsx
// apps/admin/app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <Sidebar />
      <div className="flex-1">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </AuthProvider>
  )
}
```

### 5.3 Client Portal Layout (`apps/client`)

```tsx
// apps/client/app/(portal)/layout.tsx
export default function PortalLayout({ children }) {
  return (
    <AuthProvider>
      <PortalSidebar />
      <div className="flex-1">
        <PortalTopBar />
        <main className="p-6">{children}</main>
      </div>
    </AuthProvider>
  )
}
```

---

## 6. Shared Component Library

### 6.1 Primitives (`packages/ui`)

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant`, `size`, `loading`, `disabled` | Primary actions |
| `Input` | `label`, `error`, `icon`, `type` | Form inputs |
| `Select` | `label`, `options`, `value`, `onChange` | Dropdowns |
| `Badge` | `variant`, `size` | Status indicators |
| `Avatar` | `src`, `name`, `size` | User avatars |
| `Card` | `variant`, `padding` | Content containers |
| `Modal` | `open`, `onClose`, `title` | Dialog overlays |
| `Toast` | `variant`, `message` | Notifications |
| `Tooltip` | `content`, `position` | Hover hints |
| `Skeleton` | `width`, `height`, `variant` | Loading states |
| `EmptyState` | `icon`, `title`, `description` | No-data states |

### 6.2 Data Display (`packages/ui`)

| Component | Description |
|-----------|-------------|
| `DataTable` | TanStack Table wrapper with sorting, filtering, pagination |
| `StatsCard` | Metric display with trend indicator |
| `ProgressBar` | Linear progress indicator |
| `Timeline` | Vertical timeline for project history |
| `FileCard` | File display with preview and actions |
| `ModelPreview` | 3D model thumbnail (Babylon.js snapshot) |

### 6.3 Layout Components (`packages/ui`)

| Component | Description |
|-----------|-------------|
| `PageHeader` | Page title + breadcrumbs + actions |
| `PageContainer` | Responsive page wrapper |
| `Sidebar` | Collapsible sidebar navigation |
| `TopBar` | Top navigation with search and user menu |
| `Tabs` | Tabbed navigation |
| `Accordion` | Expandable sections |
| `Breadcrumb` | Navigation breadcrumbs |

### 6.4 Form Components (`packages/ui`)

| Component | Description |
|-----------|-------------|
| `Form` | React Hook Form wrapper |
| `FormField` | Label + input + error message |
| `FileUpload` | Drag-and-drop file upload |
| `DatePicker` | Calendar date picker |
| `TimePicker` | Time selection |
| `RichTextEditor` | Markdown/WYSIWYG editor |
| `ColorPicker` | Color selection with presets |
| `Toggle` | On/off switch |

---

## 7. Design Token System

### 7.1 Color Palette

```css
:root {
  /* Primary */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Neutral */
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  /* Status */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### 7.2 Typography Scale

| Token | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| `display-lg` | 3rem | 700 | 1.2 | Hero headings |
| `display-md` | 2.25rem | 700 | 1.2 | Section headings |
| `display-sm` | 1.875rem | 600 | 1.3 | Page titles |
| `heading-lg` | 1.5rem | 600 | 1.3 | Card headings |
| `heading-md` | 1.25rem | 600 | 1.4 | Subheadings |
| `body-lg` | 1.125rem | 400 | 1.6 | Large body text |
| `body-md` | 1rem | 400 | 1.5 | Body text |
| `body-sm` | 0.875rem | 400 | 1.5 | Small body text |
| `caption` | 0.75rem | 400 | 1.4 | Captions/labels |
| `mono` | 0.875rem | 400 | 1.5 | Code blocks |

### 7.3 Spacing Scale

| Token | Value |
|-------|-------|
| `space-1` | 0.25rem (4px) |
| `space-2` | 0.5rem (8px) |
| `space-3` | 0.75rem (12px) |
| `space-4` | 1rem (16px) |
| `space-5` | 1.25rem (20px) |
| `space-6` | 1.5rem (24px) |
| `space-8` | 2rem (32px) |
| `space-10` | 2.5rem (40px) |
| `space-12` | 3rem (48px) |
| `space-16` | 4rem (64px) |

---

## 8. Responsive Behavior

### 8.1 Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Small desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

### 8.2 Layout Behavior

| Screen | Marketing | Dashboard | Client Portal |
|--------|-----------|-----------|---------------|
| Mobile (<768px) | Full-width, hamburger nav | Collapsible sidebar | Collapsible sidebar |
| Tablet (768-1024px) | Full-width, hamburger nav | Collapsible sidebar | Collapsible sidebar |
| Desktop (>1024px) | Full-width, full nav | Sidebar + content | Sidebar + content |

---

## 9. Loading States & Skeletons

### 9.1 Page-Level Loading

```tsx
// Suspense boundaries for each route
export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsPageSkeleton />}>
      <ProjectsContent />
    </Suspense>
  )
}
```

### 9.2 Component-Level Skeletons

| Component | Skeleton Pattern |
|-----------|-----------------|
| `DataTable` | 5 rows of rectangle placeholders |
| `StatsCard` | Single rectangle with shimmer |
| `ProjectCard` | Image + 2 text lines |
| `ModelPreview` | 3D cube placeholder |
| `Timeline` | 3 vertical dots + lines |
| `FileCard` | Icon + 2 text lines |

---

## 10. Empty States

| Context | Icon | Title | Action |
|---------|------|-------|--------|
| No projects | `FolderOpen` | "No projects yet" | "Create your first project" |
| No clients | `Users` | "No clients" | "Add your first client" |
| No messages | `MessageSquare` | "No messages" | "Start a conversation" |
| No invoices | `FileText` | "No invoices" | "Create an invoice" |
| No models | `Box` | "No 3D models" | "Upload a model" |
| No bookings | `Calendar` | "No bookings" | "Schedule a meeting" |
| No results | `Search` | "No results found" | "Try different filters" |

---

## 11. Error Boundaries

### 11.1 Global Error Boundary

```tsx
// apps/web/app/error.tsx
'use client'
export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <AlertTriangle className="w-12 h-12 text-error" />
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

### 11.2 Not Found

```tsx
// apps/web/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>404</h1>
      <p>Page not found</p>
      <Link href="/">Go home</Link>
    </div>
  )
}
```

---

## 12. Accessibility Requirements

### 12.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | 4.5:1 minimum for normal text, 3:1 for large text |
| Keyboard navigation | All interactive elements focusable and operable |
| Screen reader | ARIA labels on all icons, landmark roles, live regions |
| Focus indicators | Visible focus ring on all interactive elements |
| Alt text | Required on all images |
| Skip links | "Skip to main content" on all pages |
| Form labels | Associated with inputs via `htmlFor` |
| Error messages | Announced via `aria-live="polite"` |

### 12.2 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + K` | Command palette |
| `⌘/Ctrl + /` | Toggle sidebar |
| `Esc` | Close modal/drawer |
| `Tab` | Next focusable element |
| `Shift + Tab` | Previous focusable element |

---

## 13. Route Guards & Permissions

### 13.1 Auth Guard Middleware

```ts
// apps/admin/middleware.ts
const protectedRoutes = ['/dashboard', '/projects', '/clients', '/ai', '/billing', '/settings', '/developer']
const superadminRoutes = ['/admin']

export function middleware(request) {
  const session = getSession(request)

  if (!session && protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session?.role !== 'SUPERADMIN' && superadminRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}
```

### 13.2 Role-Based Access

| Role | Accessible Routes |
|------|-------------------|
| `PUBLIC` | `/`, `/portfolio/*`, `/services/*`, `/blog/*`, `/pricing`, `/contact`, `/xr/*`, `/legal/*` |
| `CLIENT` | Client portal only (`/dashboard`, `/projects`, `/messages`, `/invoices`, `/bookings`, `/settings`) |
| `ADMIN` | All admin routes except superadmin |
| `SUPERADMIN` | All routes including `/admin/*` |

---

## Appendix A: Page Component Structure

### A.1 Homepage Sections

```tsx
// apps/web/app/page.tsx
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProjects />
      <ServicesOverview />
      <XrWorldShowcase />
      <Testimonials />
      <BlogPreview />
      <PricingPreview />
      <CtaSection />
    </>
  )
}
```

### A.2 Dashboard Page Structure

```tsx
// apps/admin/app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" breadcrumbs={[{ label: 'Home' }]} />
      <StatsRow />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentProjects />
        <RecentActivity />
      </div>
    </>
  )
}
```

---

**End of VIZTR-UI-ARCHITECTURE-COMPLETE.md**
