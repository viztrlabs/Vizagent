# VIZTR — Dashboard Pages Specification

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Act Mode — UI Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Agency Dashboard (`/dashboard`)](#2-agency-dashboard-dashboard)
3. [Projects List (`/projects`)](#3-projects-list-projects)
4. [Project Detail (`/projects/[id]`)](#4-project-detail-projectsid)
5. [Clients List (`/clients`)](#5-clients-list-clients)
6. [Client Detail (`/clients/[id]`)](#6-client-detail-clientsid)
7. [Model Library (`/models`)](#7-model-library-models)
8. [Billing Overview (`/billing`)](#8-billing-overview-billing)
9. [Messages Center (`/messages`)](#9-messages-center-messages)
10. [Bookings List (`/bookings`)](#10-bookings-list-bookings)
11. [Analytics Overview (`/analytics`)](#11-analytics-overview-analytics)
12. [Client Dashboard (`/dashboard` - Client Portal)](#12-client-dashboard-dashboard---client-portal)
13. [Client Projects (`/projects` - Client Portal)](#13-client-projects-projects---client-portal)
14. [Client Invoices (`/invoices` - Client Portal)](#14-client-invoices-invoices---client-portal)
15. [Superadmin Dashboard (`/admin`)](#15-superadmin-dashboard-admin)

---

## 1. Overview

Each dashboard page follows a consistent structure:

```tsx
export default function PageName() {
  return (
    <PageContainer>
      <PageHeader
        title="Page Title"
        description="Optional description"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Page Name' }]}
        actions={<Button>Create New</Button>}
      />
      <PageContent>{/* Page-specific content */}</PageContent>
    </PageContainer>
  )
}
```

---

## 2. Agency Dashboard (`/dashboard`)

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                    [Last 30 days ▾] │
│─────────────────────────────────────────────────────────────────│
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Revenue │  │ Projects│  │ Clients │  │ AI Usage│           │
│  │ $12,450 │  │ 12      │  │ 28      │  │ 1,234   │           │
│  │ +12% ↑  │  │ +3 ↑    │  │ +5 ↑    │  │ +45% ↑  │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │  Recent Projects           │  │  Recent Activity           │ │
│  │  ┌──────────────────────┐  │  │  ┌──────────────────────┐  │ │
│  │  │ Project A    Active  │  │  │  │ John uploaded file   │  │ │
│  │  │ Project B    Review  │  │  │  │ AI render complete   │  │ │
│  │  │ Project C    Draft   │  │  │  │ Invoice paid         │  │ │
│  │  └──────────────────────┘  │  │  └──────────────────────┘  │ │
│  │  [View All Projects →]    │  │  [View All Activity →]    │ │
│  └────────────────────────────┘  └────────────────────────────┘ │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Revenue Chart (Last 12 months)                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Stats Cards

| Metric | Value | Trend | Calculation |
|--------|-------|-------|-------------|
| Revenue | $12,450 | +12% | Sum of paid invoices (last 30d) |
| Active Projects | 12 | +3 | Projects with status=ACTIVE |
| Total Clients | 28 | +5 | Unique clients with ACTIVE status |
| AI Usage | 1,234 | +45% | AI operations count (last 30d) |

### 2.3 Recent Projects List

| Column | Width | Content |
|--------|-------|---------|
| Thumbnail | 60px | Project cover image |
| Name | flex | Project title (link to detail) |
| Status | 100px | Badge (Active/Review/Draft) |
| Progress | 120px | Progress bar |
| Updated | 100px | Relative time (e.g., "2h ago") |

### 2.4 Recent Activity Feed

| Item | Icon | Description |
|------|------|-------------|
| File Upload | `Upload` | "[User] uploaded [filename]" |
| AI Render | `Sparkles` | "AI render completed for [project]" |
| Invoice Paid | `DollarSign` | "Invoice #[id] paid by [client]" |
| Comment | `MessageSquare` | "[User] commented on [project]" |
| Status Change | `RefreshCw` | "[Project] moved to [status]" |

### 2.5 Revenue Chart

- **Type:** Area chart (Recharts)
- **X-axis:** Last 12 months
- **Y-axis:** Revenue ($)
- **Data:** Monthly revenue aggregation
- **Hover:** Tooltip with exact amount and date

---

## 3. Projects List (`/projects`)

### 3.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Projects                                       [+ New Project] │
│─────────────────────────────────────────────────────────────────│
│  [Search...]  [Status ▾]  [Client ▾]  [Date Range]  [Export] │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Name          │ Status   │ Client │ Progress │ Updated   │ │
│  │────────────────────────────────────────────────────────────│ │
│  │  ☐ Project A   │ Active   │ AC Corp│ ████ 75% │ 2h ago    │ │
│  │  ☐ Project B   │ Review   │ XYZ Ltd│ ███ 60%  │ 1d ago    │ │
│  │  ☐ Project C   │ Draft    │ AC Corp│ █ 20%    │ 3d ago    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  Showing 1-10 of 42 projects         < 1 2 3 4 5 >             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Table Columns

| Column | Width | Sortable | Filter |
|--------|-------|----------|--------|
| Checkbox | 40px | No | No |
| Thumbnail | 60px | No | No |
| Name | flex | Yes | Text search |
| Status | 100px | Yes | Dropdown |
| Client | 120px | Yes | Dropdown |
| Progress | 120px | No | No |
| Updated | 100px | Yes | Date range |
| Actions | 80px | No | No |

### 3.3 Filters

| Filter | Type | Options |
|--------|------|---------|
| Status | Multi-select | Active, Review, Completed, Draft, Archived |
| Client | Multi-select | List of clients |
| Date Range | Date picker | Start date - End date |
| Search | Text input | Searches name, description |

### 3.4 Bulk Actions

| Action | Icon | Description |
|--------|------|-------------|
| Delete | `Trash2` | Delete selected projects |
| Archive | `Archive` | Archive selected projects |
| Export | `Download` | Export as CSV |
| Assign Client | `UserPlus` | Assign to a client |

### 3.5 Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    📁 (FolderOpen icon)                   │  │
│  │                                                          │  │
│  │                  No projects yet                         │  │
│  │                                                          │  │
│  │      Create your first project to get started.           │  │
│  │                                                          │  │
│  │                    [+ New Project]                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Project Detail (`/projects/[id]`)

### 4.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Projects                                            │
│─────────────────────────────────────────────────────────────────│
│  Project A                              [Edit] [Delete] [Share]│
│  AC Corp · Last updated 2h ago                                  │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Files] [Models] [XR Settings] [Timeline] [Team]  │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Project Details Tab Content                              │ │
│  │  (Changes based on selected tab)                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Tabs

| Tab | Content |
|-----|---------|
| Overview | Project description, status, dates, assignees |
| Files | File browser with upload/download |
| Models | 3D model viewer with Babylon.js |
| XR Settings | Token viewer configuration |
| Timeline | Project history timeline |
| Team | Team members and permissions |

### 4.3 Overview Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Status: Active                                                 │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Description          │  │  Details              │           │
│  │  Modern residential   │  │  Client: AC Corp      │           │
│  │  complex with 3D      │  │  Type: Residential    │           │
│  │  visualization...     │  │  Start: 2026-07-15    │           │
│  │                       │  │  Deadline: 2026-09-30 │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Progress: 75%                                             │ │
│  │  ████████████████████████████████████████                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Edit Details]  [Change Status]  [Archive]  [Delete]         │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Files Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Files                           [+ Upload] [New Folder]       │
│─────────────────────────────────────────────────────────────────│
│  📁 Renders/                                                3  │
│  📁 Models/                                                 5  │
│  📁 Documents/                                              2  │
│  📄 project-brief.pdf                          2.4 MB   1d ago │
│  🖼️ hero-render.png                          12.1 MB   3d ago │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Clients List (`/clients`)

### 5.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Clients                                        [+ Add Client]  │
│─────────────────────────────────────────────────────────────────│
│  [Search...]  [Status ▾]  [Sort by ▾]                         │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Name          │ Email        │ Projects │ Status │ Plan   │ │
│  │────────────────────────────────────────────────────────────│ │
│  │  🏢 AC Corp     │ ac@corp.com  │ 3        │ Active │ Pro    │ │
│  │  🏢 XYZ Ltd     │ xy@xyz.com   │ 1        │ Active │ Basic  │ │
│  │  🏢 ABC Inc     │ ab@abc.com   │ 0        │ Lead   │ -      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  Showing 1-10 of 28 clients           < 1 2 3 >               │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Table Columns

| Column | Width | Sortable | Filter |
|--------|-------|----------|--------|
| Avatar | 40px | No | No |
| Name | flex | Yes | Text search |
| Email | 180px | Yes | No |
| Projects | 80px | Yes | No |
| Status | 100px | Yes | Dropdown |
| Plan | 100px | Yes | Dropdown |
| Actions | 80px | No | No |

### 5.3 Client Card View

```
┌─────────────────────────────────────────────────────────────────┐
│  ☐ AC Corp                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🏢 Logo                         Status: Active          │  │
│  │                                                          │  │
│  │  ac@corp.com                                            │  │
│  │                                                          │  │
│  │  Projects: 3    Plan: Pro                               │  │
│  │  Last active: 2h ago                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Client Detail (`/clients/[id]`)

### 6.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Clients                                             │
│─────────────────────────────────────────────────────────────────│
│  AC Corp                                [Edit] [Archive]       │
│  ac@corp.com · Pro Plan · Active                               │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Projects] [Invoices] [Messages] [Settings]       │
│─────────────────────────────────────────────────────────────────│
│  (Tab content based on selection)                               │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Overview Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Client Information                                            │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Contact Details      │  │  Account Details      │           │
│  │  Name: AC Corp        │  │  Plan: Pro            │           │
│  │  Email: ac@corp.com   │  │  Status: Active       │           │
│  │  Phone: +1 555-1234   │  │  Created: 2026-06-01  │           │
│  │  Address: 123 Main St │  │  Last Active: 2h ago  │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Projects (3)                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Project A  │ Active  │ 75%  │ 2h ago               │  │ │
│  │  │ Project B  │ Review  │ 60%  │ 1d ago               │  │ │
│  │  │ Project C  │ Draft   │ 20%  │ 3d ago               │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Model Library (`/models`)

### 7.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  3D Models                                [+ Upload Model]      │
│─────────────────────────────────────────────────────────────────│
│  [Search...]  [Type ▾]  [Tags ▾]  [Grid] [List]              │
│─────────────────────────────────────────────────────────────────│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │           │
│  │  │ Model │  │  │  │ Model │  │  │  │ Model │  │           │
│  │  │  1    │  │  │  │  2    │  │  │  │  3    │  │           │
│  │  └───────┘  │  │  └───────┘  │  │  └───────┘  │           │
│  │  Chair.glb  │  │  Table.fbx  │  │  Sofa.obj   │           │
│  │  2.4 MB     │  │  5.1 MB     │  │  3.2 MB     │           │
│  │  1d ago     │  │  3d ago     │  │  1w ago     │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Model Card

```
┌─────────────────┐
│  ┌───────────┐  │
│  │  3D       │  │
│  │  Preview  │  │
│  └───────────┘  │
│                  │
│  Model Name     │
│  2.4 MB · 1d ago│
│  ─────────────  │
│  [View] [Edit] [Delete]
└─────────────────┘
```

### 7.3 Upload Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Upload 3D Model                                         [×]   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ⬆️ (Upload icon)                         │ │
│  │                                                            │ │
│  │      Drag and drop your model here                        │ │
│  │      or [Choose File]                                      │ │
│  │                                                            │ │
│  │      Supports: GLB, GLTF, FBX, OBJ, STL                  │ │
│  │      Max size: 100 MB                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Name: [________________]                                       │
│  Description: [________________]                               │
│  Tags: [________________] (comma-separated)                     │
│                                                                 │
│                              [Cancel]  [Upload]                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Billing Overview (`/billing`)

### 8.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Billing                                                      │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Invoices] [Plans] [Payment Methods]              │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Current Plan: Pro                                         │ │
│  │  $49/month · Renews Aug 15, 2026                          │ │
│  │  [Upgrade Plan]  [Manage Subscription]                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  This Month            │  │  Last 12 Months       │           │
│  │  Revenue: $12,450     │  │  Revenue: $142,800   │           │
│  │  Invoices: 12         │  │  Invoices: 156       │           │
│  │  Pending: 2           │  │  Paid: 148           │           │
│  │  Overdue: 0           │  │  Overdue: 8          │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Recent Invoices                                          │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ #INV-001  │ AC Corp     │ $2,500  │ Paid   │ 2d ago │  │ │
│  │  │ #INV-002  │ XYZ Ltd     │ $1,800  │ Pending│ 3d ago │  │ │
│  │  │ #INV-003  │ ABC Inc     │ $3,200  │ Paid   │ 1w ago │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  [View All Invoices →]                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Messages Center (`/messages`)

### 9.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Messages                                                     │
│─────────────────────────────────────────────────────────────────│
│  ┌──────────────────────┐  ┌──────────────────────────────────┐│
│  │  Conversations       │  │  Chat Window                     ││
│  │──────────────────────│  │                                  ││
│  │  🔴 AC Corp          │  │  AC Corp                        ││
│  │     Latest message.. │  │  ────────────────────────────── ││
│  │                      │  │                                  ││
│  │  ○ XYZ Ltd           │  │  John: Hi, when will the render ││
│  │     Latest message.. │  │  be ready?                      ││
│  │                      │  │                                  ││
│  │  ○ ABC Inc           │  │  You:预计完成时间是明天下午。    ││
│  │     Latest message.. │  │  I'll send you the link.        ││
│  │                      │  │                                  ││
│  │                      │  │  ┌──────────────────────────┐   ││
│  │                      │  │  │ Type a message...    [→] │   ││
│  │                      │  │  └──────────────────────────┘   ││
│  └──────────────────────┘  └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Bookings List (`/bookings`)

### 10.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Bookings                                  [+ New Booking]      │
│─────────────────────────────────────────────────────────────────│
│  [List] [Calendar]  [Status ▾]  [Date Range]                  │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  List View                                                │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Client     │ Date       │ Time    │ Status │ Type   │  │ │
│  │  │──────────────────────────────────────────────────────│  │ │
│  │  │ AC Corp    │ Aug 10     │ 2:00 PM │ Confirmed│ Zoom │  │ │
│  │  │ XYZ Ltd    │ Aug 12     │ 10:00 AM│ Pending │ On-site│ │ │
│  │  │ ABC Inc    │ Aug 15     │ 3:00 PM │ Confirmed│ Zoom │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Calendar View (August 2026)                               │ │
│  │  ┌───┬───┬───┬───┬───┬───┬───┐                           │ │
│  │  │Sun│Mon│Tue│Wed│Thu│Fri│Sat│                           │ │
│  │  ├───┼───┼───┼───┼───┼───┼───┤                           │ │
│  │  │   │   │   │   │   │ 1 │ 2 │                           │ │
│  │  │   │   │   │   │   │   │   │                           │ │
│  │  ├───┼───┼───┼───┼───┼───┼───┤                           │ │
│  │  │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │                           │ │
│  │  │   │   │   │   │   │   │   │                           │ │
│  │  ├───┼───┼───┼───┼───┼───┼───┤                           │ │
│  │  │10 │11 │12 │13 │14 │15 │16 │                           │ │
│  │  │●  │   │●  │   │   │●  │   │                           │ │
│  │  └───┴───┴───┴───┴───┴───┴───┘                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Analytics Overview (`/analytics`)

### 11.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics                          [Last 30 days ▾] [Export]  │
│─────────────────────────────────────────────────────────────────│
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Page Views           │  │  Unique Visitors      │           │
│  │  45,234              │  │  12,456               │           │
│  │  +15% ↑              │  │  +8% ↑                │           │
│  └──────────────────────┘  └──────────────────────┘           │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Avg. Session         │  │  Bounce Rate          │           │
│  │  4:32                │  │  32%                  │           │
│  │  +5% ↑               │  │  -3% ↓                │           │
│  └──────────────────────┘  └──────────────────────┘           │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Traffic Sources (Pie Chart)                              │ │
│  │  Direct: 45%                                              │ │
│  │  Organic Search: 32%                                      │ │
│  │  Social: 15%                                              │ │
│  │  Referral: 8%                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Top Pages                                                │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ /portfolio/project-a │ 1,234 views │ 4:56 avg time  │  │ │
│  │  │ /portfolio/project-b │ 987 views   │ 3:42 avg time  │  │ │
│  │  │ /                   │ 876 views   │ 2:15 avg time  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Client Dashboard (`/dashboard` - Client Portal)

### 12.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Welcome back, Jane!                                           │
│  Here's an overview of your projects.                          │
│─────────────────────────────────────────────────────────────────│
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Active Projects      │  │  Pending Tasks        │           │
│  │  2                    │  │  3                    │           │
│  └──────────────────────┘  └──────────────────────┘           │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Messages             │  │  Upcoming Bookings    │           │
│  │  5 (2 unread)        │  │  1                    │           │
│  └──────────────────────┘  └──────────────────────┘           │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Recent Activity                                          │ │
│  │  • AI render completed for Project A - 2h ago            │ │
│  │  • New message from ArchViz Studio - 1d ago              │ │
│  │  • Invoice #INV-001 paid - 3d ago                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Active Projects                                          │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Project A │ Active │ 75% │ Last activity: 2h ago   │  │ │
│  │  │ [View Project →]                                     │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Client Projects (`/projects` - Client Portal)

### 13.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  My Projects                                                   │
│─────────────────────────────────────────────────────────────────│
│  [Search...]  [Status ▾]                                       │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Project Cards                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │ Project A   │  │ Project B   │  │ Project C   │       │ │
│  │  │ ████████████│  │ ████████████│  │ ████        │       │ │
│  │  │ 75%         │  │ 60%         │  │ 20%         │       │ │
│  │  │ Active      │  │ Review      │  │ Draft       │       │ │
│  │  │ [View →]    │  │ [View →]    │  │ [View →]    │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Client Invoices (`/invoices` - Client Portal)

### 14.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Invoices                                                      │
│─────────────────────────────────────────────────────────────────│
│  [All] [Paid] [Pending] [Overdue]                             │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  #INV-001  │ Project A  │ $2,500  │ Paid   │ 2d ago      │ │
│  │            │             │         │        │ [Download ↓]│ │
│  │────────────────────────────────────────────────────────────│ │
│  │  #INV-002  │ Project B  │ $1,800  │ Pending│ 5d ago      │ │
│  │            │             │         │        │ [Pay Now →] │ │
│  │────────────────────────────────────────────────────────────│ │
│  │  #INV-003  │ Project C  │ $3,200  │ Paid   │ 1w ago      │ │
│  │            │             │         │        │ [Download ↓]│ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. Superadmin Dashboard (`/admin`)

### 15.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Superadmin Dashboard                              🔧 Superadmin│
│─────────────────────────────────────────────────────────────────│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Agencies    │  │  Users       │  │  Revenue     │           │
│  │  12          │  │  156         │  │  $45,234    │           │
│  │  +2 ↑        │  │  +23 ↑       │  │  +18% ↑     │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Platform Health                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │  Uptime       │  │  API Latency  │  │  Error Rate  │    │ │
│  │  │  99.98%       │  │  145ms        │  │  0.02%       │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Top Agencies by Revenue                                  │ │
│  │  1. ArchViz Studio   │ $12,450 │ 12 projects            │ │
│  │  2. Design Masters   │ $8,230  │ 8 projects             │ │
│  │  3. Visual Pro       │ $5,670  │ 6 projects             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Component Specifications

### A.1 StatsCard Component

```tsx
interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}
```

### A.2 DataTable Component

```tsx
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  pagination?: boolean
  sorting?: boolean
  filtering?: boolean
  bulkActions?: BulkAction[]
  emptyState?: EmptyStateProps
  loading?: boolean
}
```

### A.3 ActivityFeed Component

```tsx
interface ActivityFeedProps {
  items: ActivityItem[]
  maxItems?: number
  showViewAll?: boolean
}

interface ActivityItem {
  id: string
  type: 'upload' | 'render' | 'invoice' | 'comment' | 'status'
  user: string
  description: string
  timestamp: string
  icon: LucideIcon
}
```

---

**End of VIZTR-DASHBOARD-PAGES-SPEC.md**
