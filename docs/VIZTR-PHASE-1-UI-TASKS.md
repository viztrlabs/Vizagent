# VIZTR — Phase 1: UI Implementation Tasks (Updated)

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Act Mode — Phase 1 with UI Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Task 1: Monorepo Setup](#2-task-1-monorepo-setup)
3. [Task 2: Next.js App Setup](#3-task-2-nextjs-app-setup)
4. [Task 3: Database Schema](#4-task-3-database-schema)
5. [Task 4: Authentication System](#5-task-4-authentication-system)
6. [Task 5: Design System](#6-task-5-design-system)
7. [Task 6: Marketing Site Layout](#7-task-6-marketing-site-layout)
8. [Task 7: Dashboard Layout](#8-task-7-dashboard-layout)
9. [Task 8: Client Portal Layout](#9-task-8-client-portal-layout)
10. [Task 9: Auth Pages](#10-task-9-auth-pages)
11. [Task 10: Error Pages](#11-task-10-error-pages)
12. [Task 11: Legal Pages](#12-task-11-legal-pages)
13. [Task 12: Cookie Consent](#13-task-12-cookie-consent)

---

## 1. Overview

Phase 1 focuses on establishing the foundation of VizTR with complete UI implementation. This updated version includes detailed UI implementation tasks with TDD approach.

### 1.1 Phase 1 Scope

| Area | Tasks | Duration |
|------|-------|----------|
| Monorepo Setup | 1 | 2 days |
| Next.js Apps | 1 | 3 days |
| Database Schema | 1 | 3 days |
| Authentication | 1 | 4 days |
| Design System | 1 | 3 days |
| Marketing Layout | 1 | 2 days |
| Dashboard Layout | 1 | 3 days |
| Client Portal Layout | 1 | 2 days |
| Auth Pages | 1 | 3 days |
| Error Pages | 1 | 1 day |
| Legal Pages | 1 | 1 day |
| Cookie Consent | 1 | 1 day |
| **Total** | **12** | **28 days** |

---

## 2. Task 1: Monorepo Setup

**Task ID:** PHASE1-01
**Duration:** 2 days
**Dependencies:** None

### 2.1 Description

Initialize the monorepo with Turborepo, configure package management, and set up development tooling.

### 2.2 TDD Approach

#### Test Cases

```typescript
// packages/config/turbo.test.ts
describe('Turborepo Configuration', () => {
  test('turbo.json exists and is valid', () => {
    const turboConfig = readFileSync('turbo.json', 'utf8')
    expect(JSON.parse(turboConfig)).toHaveProperty('pipeline')
  })

  test('package.json has workspaces configured', () => {
    const packageJson = readFileSync('package.json', 'utf8')
    const config = JSON.parse(packageJson)
    expect(config.workspaces).toBeDefined()
  })
})
```

### 2.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Initialize npm workspace root | 2 hours |
| 2 | Install Turborepo | 1 hour |
| 3 | Configure turbo.json pipeline | 2 hours |
| 4 | Setup ESLint + Prettier | 3 hours |
| 5 | Configure TypeScript base | 2 hours |
| 6 | Setup Husky + lint-staged | 2 hours |
| 7 | Create .gitignore | 1 hour |
| 8 | Verify monorepo structure | 1 hour |

### 2.4 Acceptance Criteria

- [ ] Turborepo installed and configured
- [ ] Workspaces configured in package.json
- [ ] ESLint + Prettier working across all packages
- [ ] TypeScript base configuration shared
- [ ] Git hooks configured with Husky
- [ ] All packages can be built with `turbo build`

### 2.5 Checkpoints

```
□ Checkpoint 1: Root package.json with workspaces
□ Checkpoint 2: turbo.json with pipeline configured
□ Checkpoint 3: ESLint + Prettier working
□ Checkpoint 4: TypeScript base config shared
□ Checkpoint 5: Git hooks configured
```

---

## 3. Task 2: Next.js App Setup

**Task ID:** PHASE1-02
**Duration:** 3 days
**Dependencies:** PHASE1-01

### 3.1 Description

Create three Next.js 14+ applications (web, admin, client) with App Router, configure routing, and establish app-specific settings.

### 3.2 TDD Approach

#### Test Cases

```typescript
// apps/web/app.test.ts
describe('Web App', () => {
  test('app renders homepage', async () => {
    render(<App />)
    expect(screen.getByText('VizTR')).toBeInTheDocument()
  })

  test('navigation links work', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Portfolio'))
    expect(window.location.pathname).toBe('/portfolio')
  })
})
```

### 3.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create apps/web with create-next-app | 2 hours |
| 2 | Create apps/admin with create-next-app | 2 hours |
| 3 | Create apps/client with create-next-app | 2 hours |
| 4 | Configure App Router structure | 3 hours |
| 5 | Setup app-specific layouts | 4 hours |
| 6 | Configure environment variables | 2 hours |
| 7 | Setup next.config.js for each app | 2 hours |
| 8 | Verify apps can run independently | 2 hours |

### 3.4 Acceptance Criteria

- [ ] Three Next.js apps created (web, admin, client)
- [ ] App Router configured for each app
- [ ] Basic layouts created for each app
- [ ] Environment variables configured
- [ ] Apps can run with `npm run dev`

### 3.5 Checkpoints

```
□ Checkpoint 1: apps/web created and running
□ Checkpoint 2: apps/admin created and running
□ Checkpoint 3: apps/client created and running
□ Checkpoint 4: App Router configured
□ Checkpoint 5: Basic layouts working
```

---

## 4. Task 3: Database Schema

**Task ID:** PHASE1-03
**Duration:** 3 days
**Dependencies:** PHASE1-02

### 4.1 Description

Create Prisma schema with 100 models, setup PostgreSQL database, and configure migrations.

### 4.2 TDD Approach

#### Test Cases

```typescript
// packages/database/prisma.test.ts
describe('Database Schema', () => {
  test('User model exists', async () => {
    const user = await prisma.user.findFirst()
    expect(user).toBeDefined()
  })

  test('Project model exists', async () => {
    const project = await prisma.project.findFirst()
    expect(project).toBeDefined()
  })

  test('Settings model exists', async () => {
    const settings = await prisma.settings.findFirst()
    expect(settings).toBeDefined()
  })
})
```

### 4.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create packages/database | 2 hours |
| 2 | Initialize Prisma with PostgreSQL | 2 hours |
| 3 | Create core models (User, Project, Client) | 4 hours |
| 4 | Create billing models (Invoice, Payment) | 3 hours |
| 5 | Create AI models (AiPrompt, AiTemplate) | 3 hours |
| 6 | Create CMS models (Blog, Faq, Testimonial) | 3 hours |
| 7 | Create settings models (Settings, Navigation) | 2 hours |
| 8 | Run initial migration | 1 hour |
| 9 | Seed database with demo data | 2 hours |

### 4.4 Acceptance Criteria

- [ ] 100 models created in Prisma schema
- [ ] PostgreSQL database configured
- [ ] Migrations can run successfully
- [ ] Demo data seeded
- [ ] Prisma Studio accessible

### 4.5 Checkpoints

```
□ Checkpoint 1: Core models (User, Project, Client)
□ Checkpoint 2: Billing models (Invoice, Payment)
□ Checkpoint 3: AI models (AiPrompt, AiTemplate)
□ Checkpoint 4: CMS models (Blog, Faq, Testimonial)
□ Checkpoint 5: Settings models (Settings, Navigation)
□ Checkpoint 6: Migration runs successfully
□ Checkpoint 7: Demo data seeded
```

---

## 5. Task 4: Authentication System

**Task ID:** PHASE1-04
**Duration:** 4 days
**Dependencies:** PHASE1-03

### 5.1 Description

Implement Supabase Auth with role-based access control, magic link support, and session management.

### 5.2 TDD Approach

#### Test Cases

```typescript
// packages/auth/auth.test.ts
describe('Authentication', () => {
  test('user can sign in with email/password', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(error).toBeNull()
    expect(data.user).toBeDefined()
  })

  test('user can sign in with magic link', async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email: 'test@example.com'
    })
    expect(error).toBeNull()
  })

  test('user can sign out', async () => {
    const { error } = await supabase.auth.signOut()
    expect(error).toBeNull()
  })
})
```

### 5.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Setup Supabase project | 2 hours |
| 2 | Create packages/auth | 2 hours |
| 3 | Implement sign in flow | 4 hours |
| 4 | Implement sign up flow | 4 hours |
| 5 | Implement magic link flow | 3 hours |
| 6 | Implement password reset flow | 3 hours |
| 7 | Implement session management | 3 hours |
| 8 | Create AuthContext provider | 3 hours |
| 9 | Create ProtectedRoute component | 2 hours |
| 10 | Test all auth flows | 4 hours |

### 5.4 Acceptance Criteria

- [ ] Email/password authentication working
- [ ] Magic link authentication working
- [ ] Password reset flow working
- [ ] Session management working
- [ ] Role-based access control implemented
- [ ] Protected routes working

### 5.5 Checkpoints

```
□ Checkpoint 1: Supabase configured
□ Checkpoint 2: Email/password auth working
□ Checkpoint 3: Magic link auth working
□ Checkpoint 4: Password reset working
□ Checkpoint 5: Session management working
□ Checkpoint 6: Role-based access control working
```

---

## 6. Task 5: Design System

**Task ID:** PHASE1-05
**Duration:** 3 days
**Dependencies:** PHASE1-02

### 6.1 Description

Create shared design system with Radix UI primitives, Tailwind CSS, and Framer Motion.

### 6.2 TDD Approach

#### Test Cases

```typescript
// packages/ui/components.test.tsx
describe('Design System', () => {
  test('Button component renders', () => {
    render(<Button>Click me</Button />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  test('Button variants work', () => {
    render(<Button variant="primary">Primary</Button />)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })

  test('Input component renders', () => {
    render(<Input label="Name" />)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })
})
```

### 6.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create packages/ui | 2 hours |
| 2 | Install Radix UI primitives | 2 hours |
| 3 | Configure Tailwind CSS | 3 hours |
| 4 | Create Button component | 3 hours |
| 5 | Create Input component | 2 hours |
| 6 | Create Select component | 2 hours |
| 7 | Create Card component | 2 hours |
| 8 | Create Modal component | 3 hours |
| 9 | Create Toast component | 2 hours |
| 10 | Create DataTable component | 4 hours |
| 11 | Create Skeleton component | 1 hour |
| 12 | Create EmptyState component | 1 hour |
| 13 | Setup Storybook | 3 hours |

### 6.4 Acceptance Criteria

- [ ] 20+ UI components created
- [ ] All components documented in Storybook
- [ ] Tailwind CSS configured with custom theme
- [ ] Design tokens defined
- [ ] Components are accessible (WCAG 2.1 AA)

### 6.5 Checkpoints

```
□ Checkpoint 1: packages/ui created
□ Checkpoint 2: Tailwind CSS configured
□ Checkpoint 3: Button component working
□ Checkpoint 4: Input component working
□ Checkpoint 5: Select component working
□ Checkpoint 6: Card component working
□ Checkpoint 7: Modal component working
□ Checkpoint 8: DataTable component working
□ Checkpoint 9: Storybook configured
```

---

## 7. Task 6: Marketing Site Layout

**Task ID:** PHASE1-06
**Duration:** 2 days
**Dependencies:** PHASE1-05

### 7.1 Description

Create marketing site layout with Header, Footer, and navigation components.

### 7.2 TDD Approach

#### Test Cases

```typescript
// apps/web/components/layout.test.tsx
describe('Marketing Layout', () => {
  test('Header renders with logo', () => {
    render(<Header />)
    expect(screen.getByAltText('VizTR')).toBeInTheDocument()
  })

  test('Navigation links work', () => {
    render(<Header />)
    fireEvent.click(screen.getByText('Portfolio'))
    expect(window.location.pathname).toBe('/portfolio')
  })

  test('Footer renders with links', () => {
    render(<Footer />)
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })
})
```

### 7.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create Header component | 4 hours |
| 2 | Create navigation menu | 3 hours |
| 3 | Create mobile hamburger menu | 3 hours |
| 4 | Create Footer component | 3 hours |
| 5 | Create Breadcrumbs component | 2 hours |
| 6 | Create marketing layout | 2 hours |
| 7 | Test responsive behavior | 2 hours |

### 7.4 Acceptance Criteria

- [ ] Header with navigation working
- [ ] Mobile menu working
- [ ] Footer with links working
- [ ] Responsive design working
- [ ] Accessibility compliant

### 7.5 Checkpoints

```
□ Checkpoint 1: Header component working
□ Checkpoint 2: Navigation menu working
□ Checkpoint 3: Mobile menu working
□ Checkpoint 4: Footer component working
□ Checkpoint 5: Responsive design working
```

---

## 8. Task 7: Dashboard Layout

**Task ID:** PHASE1-07
**Duration:** 3 days
**Dependencies:** PHASE1-05

### 8.1 Description

Create admin dashboard layout with sidebar, topbar, and content area.

### 8.2 TDD Approach

#### Test Cases

```typescript
// apps/admin/components/layout.test.tsx
describe('Dashboard Layout', () => {
  test('Sidebar renders with navigation', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('TopBar renders with user info', () => {
    render(<TopBar />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  test('Sidebar collapses on mobile', () => {
    render(<Sidebar />)
    fireEvent.click(screen.getByTestId('sidebar-toggle'))
    expect(screen.getByTestId('sidebar')).toHaveClass('collapsed')
  })
})
```

### 8.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create Sidebar component | 4 hours |
| 2 | Create navigation items | 3 hours |
| 3 | Create TopBar component | 3 hours |
| 4 | Create user menu | 2 hours |
| 5 | Create dashboard layout | 3 hours |
| 6 | Implement sidebar collapse | 2 hours |
| 7 | Test responsive behavior | 3 hours |

### 8.4 Acceptance Criteria

- [ ] Sidebar with navigation working
- [ ] TopBar with user menu working
- [ ] Sidebar collapse working
- [ ] Responsive design working
- [ ] Role-based navigation working

### 8.5 Checkpoints

```
□ Checkpoint 1: Sidebar component working
□ Checkpoint 2: Navigation items working
□ Checkpoint 3: TopBar component working
□ Checkpoint 4: User menu working
□ Checkpoint 5: Sidebar collapse working
□ Checkpoint 6: Responsive design working
```

---

## 9. Task 8: Client Portal Layout

**Task ID:** PHASE1-08
**Duration:** 2 days
**Dependencies:** PHASE1-05

### 9.1 Description

Create client portal layout with simplified sidebar and navigation.

### 9.2 TDD Approach

#### Test Cases

```typescript
// apps/client/components/layout.test.tsx
describe('Client Portal Layout', () => {
  test('Portal Sidebar renders', () => {
    render(<PortalSidebar />)
    expect(screen.getByText('My Projects')).toBeInTheDocument()
  })

  test('Portal TopBar renders', () => {
    render(<PortalTopBar />)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })
})
```

### 9.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create PortalSidebar component | 3 hours |
| 2 | Create PortalTopBar component | 2 hours |
| 3 | Create portal layout | 3 hours |
| 4 | Test responsive behavior | 2 hours |

### 9.4 Acceptance Criteria

- [ ] Portal sidebar working
- [ ] Portal topbar working
- [ ] Responsive design working

### 9.5 Checkpoints

```
□ Checkpoint 1: PortalSidebar working
□ Checkpoint 2: PortalTopBar working
□ Checkpoint 3: Portal layout working
□ Checkpoint 4: Responsive design working
```

---

## 10. Task 9: Auth Pages

**Task ID:** PHASE1-09
**Duration:** 3 days
**Dependencies:** PHASE1-04, PHASE1-05

### 10.1 Description

Create authentication pages (login, register, password reset, magic link).

### 10.2 TDD Approach

#### Test Cases

```typescript
// apps/admin/app/login.test.tsx
describe('Login Page', () => {
  test('login form renders', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  test('form validates inputs', async () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign In'))
    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
  })

  test('form submits successfully', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByText('Sign In'))
    expect(mockSignIn).toHaveBeenCalled()
  })
})
```

### 10.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create admin login page | 3 hours |
| 2 | Create admin register page | 3 hours |
| 3 | Create client login page | 2 hours |
| 4 | Create magic link page | 2 hours |
| 5 | Create password reset page | 2 hours |
| 6 | Create verification page | 2 hours |
| 7 | Test all auth flows | 3 hours |

### 10.4 Acceptance Criteria

- [ ] Admin login page working
- [ ] Admin register page working
- [ ] Client login page working
- [ ] Magic link flow working
- [ ] Password reset flow working
- [ ] Email verification working

### 10.5 Checkpoints

```
□ Checkpoint 1: Admin login page working
□ Checkpoint 2: Admin register page working
□ Checkpoint 3: Client login page working
□ Checkpoint 4: Magic link flow working
□ Checkpoint 5: Password reset flow working
□ Checkpoint 6: Email verification working
```

---

## 11. Task 10: Error Pages

**Task ID:** PHASE1-10
**Duration:** 1 day
**Dependencies:** PHASE1-05

### 11.1 Description

Create error pages (404, 500, 403, 429).

### 11.2 TDD Approach

#### Test Cases

```typescript
// apps/web/app/not-found.test.tsx
describe('Error Pages', () => {
  test('404 page renders', () => {
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  test('500 page renders', () => {
    render(<ServerError />)
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
```

### 11.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create 404 page | 1 hour |
| 2 | Create 500 page | 1 hour |
| 3 | Create 403 page | 1 hour |
| 4 | Create 429 page | 1 hour |
| 5 | Test error pages | 1 hour |

### 11.4 Acceptance Criteria

- [ ] 404 page working
- [ ] 500 page working
- [ ] 403 page working
- [ ] 429 page working

### 11.5 Checkpoints

```
□ Checkpoint 1: 404 page working
□ Checkpoint 2: 500 page working
□ Checkpoint 3: 403 page working
□ Checkpoint 4: 429 page working
```

---

## 12. Task 11: Legal Pages

**Task ID:** PHASE1-11
**Duration:** 1 day
**Dependencies:** PHASE1-06

### 12.1 Description

Create legal pages (Privacy Policy, Terms of Service, Cookie Policy).

### 12.2 TDD Approach

#### Test Cases

```typescript
// apps/web/app/legal/privacy.test.tsx
describe('Legal Pages', () => {
  test('Privacy Policy page renders', () => {
    render(<PrivacyPolicy />)
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  test('Terms of Service page renders', () => {
    render(<TermsOfService />)
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })
})
```

### 12.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create Privacy Policy page | 1 hour |
| 2 | Create Terms of Service page | 1 hour |
| 3 | Create Cookie Policy page | 1 hour |
| 4 | Test legal pages | 1 hour |

### 12.4 Acceptance Criteria

- [ ] Privacy Policy page working
- [ ] Terms of Service page working
- [ ] Cookie Policy page working

### 12.5 Checkpoints

```
□ Checkpoint 1: Privacy Policy page working
□ Checkpoint 2: Terms of Service page working
□ Checkpoint 3: Cookie Policy page working
```

---

## 13. Task 12: Cookie Consent

**Task ID:** PHASE1-12
**Duration:** 1 day
**Dependencies:** PHASE1-06

### 13.1 Description

Implement cookie consent banner and preferences modal.

### 13.2 TDD Approach

#### Test Cases

```typescript
// packages/ui/components/cookie-consent.test.tsx
describe('Cookie Consent', () => {
  test('cookie consent banner renders', () => {
    render(<CookieConsent />)
    expect(screen.getByText('We use cookies')).toBeInTheDocument()
  })

  test('accept all button works', () => {
    render(<CookieConsent />)
    fireEvent.click(screen.getByText('Accept All'))
    expect(mockAcceptAll).toHaveBeenCalled()
  })

  test('cookie preferences modal opens', () => {
    render(<CookieConsent />)
    fireEvent.click(screen.getByText('Customize'))
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
  })
})
```

### 13.3 Implementation Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1 | Create CookieConsent component | 2 hours |
| 2 | Create CookiePreferences modal | 2 hours |
| 3 | Implement cookie storage | 1 hour |
| 4 | Test cookie consent | 1 hour |

### 13.4 Acceptance Criteria

- [ ] Cookie consent banner working
- [ ] Cookie preferences modal working
- [ ] Cookie storage working
- [ ] User preferences saved

### 13.5 Checkpoints

```
□ Checkpoint 1: Cookie consent banner working
□ Checkpoint 2: Cookie preferences modal working
□ Checkpoint 3: Cookie storage working
□ Checkpoint 4: User preferences saved
```

---

## Appendix: Phase 1 Task Summary

### Task Dependencies

```
PHASE1-01 (Monorepo)
    ↓
PHASE1-02 (Next.js Apps)
    ↓
PHASE1-03 (Database Schema) ← PHASE1-02
    ↓
PHASE1-04 (Authentication) ← PHASE1-03
    ↓
PHASE1-05 (Design System) ← PHASE1-02
    ↓
PHASE1-06 (Marketing Layout) ← PHASE1-05
PHASE1-07 (Dashboard Layout) ← PHASE1-05
PHASE1-08 (Client Portal Layout) ← PHASE1-05
    ↓
PHASE1-09 (Auth Pages) ← PHASE1-04, PHASE1-05
PHASE1-10 (Error Pages) ← PHASE1-05
PHASE1-11 (Legal Pages) ← PHASE1-06
PHASE1-12 (Cookie Consent) ← PHASE1-06
```

### Critical Path

```
PHASE1-01 → PHASE1-02 → PHASE1-03 → PHASE1-04 → PHASE1-09
```

### Deliverables

| Deliverable | Task |
|-------------|------|
| Turborepo monorepo | PHASE1-01 |
| Three Next.js apps | PHASE1-02 |
| 100 database models | PHASE1-03 |
| Authentication system | PHASE1-04 |
| 20+ UI components | PHASE1-05 |
| Marketing site layout | PHASE1-06 |
| Dashboard layout | PHASE1-07 |
| Client portal layout | PHASE1-08 |
| Auth pages | PHASE1-09 |
| Error pages | PHASE1-10 |
| Legal pages | PHASE1-11 |
| Cookie consent | PHASE1-12 |

---

**End of VIZTR-PHASE-1-UI-TASKS.md**
