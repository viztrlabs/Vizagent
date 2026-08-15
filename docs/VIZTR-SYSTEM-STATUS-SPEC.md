# VIZTR — System Status Page Specification

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Immediate Action - Required for SLA Compliance

---

## Table of Contents

1. [Overview](#1-overview)
2. [Public System Status Page (`/system-status`)](#2-public-system-status-page-system-status)
3. [Admin Status Dashboard (`/admin/status`)](#3-admin-status-dashboard-adminstatus)
4. [Service Health Monitoring](#4-service-health-monitoring)
5. [Incident Management](#5-incident-management)
6. [SLA Tracking](#6-sla-tracking)
7. [Status Page Components](#7-status-page-components)

---

## 1. Overview

The System Status page provides real-time visibility into platform health for both public users and administrators. This is **required for SLA compliance** and builds trust with customers.

### 1.1 Status Page Types

| Page | Target Audience | Purpose |
|------|-----------------|---------|
| **Public Status** | All users | Transparent system health visibility |
| **Admin Status** | Administrators | Detailed operational metrics |
| **Incident History** | All users | Past incidents and resolutions |

---

## 2. Public System Status Page (`/system-status`)

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  VizTR System Status                                            │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Overall Status                                           │ │
│  │                                                           │ │
│  │  🟢 All Systems Operational                               │ │
│  │                                                           │ │
│  │  Last updated: 2 minutes ago                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Core Services                                            │ │
│  │                                                           │ │
│  │  🟢 API Gateway          │ Operational │ 99.98% uptime   │ │
│  │  🟢 Authentication       │ Operational │ 99.99% uptime   │ │
│  │  🟢 Database             │ Operational │ 99.99% uptime   │ │
│  │  🟢 File Storage         │ Operational │ 99.97% uptime   │ │
│  │  🟢 CDN                  │ Operational │ 99.99% uptime   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AI Services                                              │ │
│  │                                                           │ │
│  │  🟢 AI Rendering         │ Operational │ 99.95% uptime   │ │
│  │  🟢 AI Agents            │ Operational │ 99.92% uptime   │ │
│  │  🟢 Prompt Processing    │ Operational │ 99.98% uptime   │ │
│  │  🟡 Model Inference      │ Degraded    │ 98.50% uptime   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  XR Services                                              │ │
│  │                                                           │ │
│  │  🟢 WebXR Viewer         │ Operational │ 99.99% uptime   │ │
│  │  🟢 WebAR Viewer         │ Operational │ 99.98% uptime   │ │
│  │  🟢 VR Streaming         │ Operational │ 99.95% uptime   │ │
│  │  🟢 Token Delivery       │ Operational │ 99.99% uptime   │ │
│  │  🟢 Pixel Streaming      │ Operational │ 99.90% uptime   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Performance Metrics                                      │ │
│  │                                                           │ │
│  │  API Response Time: 145ms (p95)                          │ │
│  │  Error Rate: 0.02%                                        │ │
│  │  Throughput: 1,234 requests/second                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Upcoming Maintenance                                     │ │
│  │                                                           │ │
│  │  📅 Aug 10, 2026 02:00-04:00 UTC                         │ │
│  │  Database maintenance (estimated 30 minutes)             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Subscribe to Updates                                     │ │
│  │                                                           │ │
│  │  Email: [________________] [Subscribe]                    │ │
│  │  SMS:   [________________] [Subscribe]                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  90-Day History                                           │ │
│  │                                                           │ │
│  │  Month    │ Uptime    │ Incidents │ MTTR                 │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Aug 2026 │ 99.98%   │ 0         │ -                    │ │
│  │  Jul 2026 │ 99.95%   │ 2         │ 45 min               │ │
│  │  Jun 2026 │ 99.99%   │ 0         │ -                    │ │
│  │  May 2026 │ 99.97%   │ 1         │ 30 min               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Status Icons

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| Operational | 🟢 | Green | Service is fully operational |
| Degraded | 🟡 | Yellow | Service is experiencing issues |
| Partial Outage | 🟠 | Orange | Service is partially unavailable |
| Major Outage | 🔴 | Red | Service is completely unavailable |
| Maintenance | 🔵 | Blue | Service is under maintenance |

---

## 3. Admin Status Dashboard (`/admin/status`)

### 3.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  System Status Dashboard                        [Refresh] [Export]│
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Services] [Metrics] [Incidents] [Maintenance]     │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  System Health Score                                      │ │
│  │                                                           │ │
│  │  Score: 99.8/100                                          │ │
│  │  ████████████████████████████████████████░░░░░░░░░░░░░░░  │ │
│  │                                                           │ │
│  │  Status: OPERATIONAL                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Real-Time Metrics                                        │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ Requests/s  │ │ Error Rate  │ │ P95 Latency │        │ │
│  │  │ 1,234       │ │ 0.02%       │ │ 145ms       │        │ │
│  │  │ ↑ +5%       │ │ ↓ -0.01%    │ │ ↓ -12ms     │        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ Active Conns│ │ Queue Depth │ │ CPU Usage   │        │ │
│  │  │ 456         │ │ 23          │ │ 45%         │        │ │
│  │  │ ↑ +12       │ │ ↓ -5        │ │ ↓ -2%       │        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Service Grid                                             │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Service        │ Status  │ Uptime  │ Latency │ Err │  │ │
│  │  │  ─────────────────────────────────────────────────── │  │ │
│  │  │  API Gateway    │ 🟢 OK   │ 99.98%  │ 45ms    │ 0.1%│  │ │
│  │  │  Auth Service   │ 🟢 OK   │ 99.99%  │ 32ms    │ 0.0%│  │ │
│  │  │  PostgreSQL     │ 🟢 OK   │ 99.99%  │ 12ms    │ 0.0%│  │ │
│  │  │  Redis Cache    │ 🟢 OK   │ 99.99%  │ 5ms     │ 0.0%│  │ │
│  │  │  S3 Storage     │ 🟢 OK   │ 99.97%  │ 89ms    │ 0.2%│  │ │
│  │  │  AI Service     │ 🟡 WARN │ 99.92%  │ 234ms   │ 1.5%│  │ │
│  │  │  XR Engine      │ 🟢 OK   │ 99.95%  │ 156ms   │ 0.3%│  │ │
│  │  │  Email Service  │ 🟢 OK   │ 99.99%  │ 120ms   │ 0.0%│  │ │
│  │  │  Webhooks       │ 🟢 OK   │ 99.98%  │ 89ms    │ 0.1%│  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Uptime Graph (Last 24 hours)                             │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  00:00    06:00    12:00    18:00    Now                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Service Health Monitoring

### 4.1 Service Health Structure

```tsx
interface ServiceHealth {
  id: string
  name: string
  description: string
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance'
  
  // Metrics
  uptime: number // percentage
  latency: {
    current: number
    p50: number
    p95: number
    p99: number
  }
  errorRate: number // percentage
  throughput: number // requests per second
  
  // Dependencies
  dependencies: string[]
  
  // Health Check
  lastChecked: string
  healthCheckUrl: string
  
  // Incident History
  recentIncidents: Incident[]
}

interface Incident {
  id: string
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'minor' | 'major' | 'critical'
  startTime: string
  endTime?: string
  updates: IncidentUpdate[]
  affectedServices: string[]
}

interface IncidentUpdate {
  id: string
  timestamp: string
  message: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
}
```

### 4.2 Service Dependencies Map

```
┌─────────────────────────────────────────────────────────────────┐
│  Service Dependencies                                          │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Dependency Graph                                         │ │
│  │                                                           │ │
│  │  ┌─────────────┐                                         │ │
│  │  │ API Gateway │                                         │ │
│  │  └──────┬──────┘                                         │ │
│  │         │                                                │ │
│  │    ┌────┴────┐                                           │ │
│  │    │         │                                           │ │
│  │    ▼         ▼                                           │ │
│  │  ┌─────┐  ┌─────┐                                       │ │
│  │  │Auth │  │ DB  │                                       │ │
│  │  └──┬──┘  └──┬──┘                                       │ │
│  │     │        │                                           │ │
│  │     ▼        ▼                                           │ │
│  │  ┌─────┐  ┌─────┐                                       │ │
│  │  │Redis│  │ S3  │                                       │ │
│  │  └─────┘  └─────┘                                       │ │
│  │                                                           │ │
│  │  ─────────────────────────────────────────────────────── │ │
│  │                                                           │ │
│  │  ┌─────────────┐                                         │ │
│  │  │ AI Service  │                                         │ │
│  │  └──────┬──────┘                                         │ │
│  │         │                                                │ │
│  │    ┌────┴────┐                                           │ │
│  │    │         │                                           │ │
│  │    ▼         ▼                                           │ │
│  │  ┌─────┐  ┌─────┐                                       │ │
│  │  │OpenAI│ │Claude│                                       │ │
│  │  └─────┘  └─────┘                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Incident Management

### 5.1 Incident Creation

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Incident                                       [×]     │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Title:          [________________]                            │
│  Severity:       [Minor ▾]                                     │
│  Affected Services: ☑ API Gateway  ☐ Auth  ☐ Database         │
│                                                                 │
│  Description:                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [________________]                                       │ │
│  │ [________________]                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Status:           [Investigating ▾]                           │
│  Notify Users:     [██████████] Enabled                       │
│  Notify Email:     [________________]                          │
│  Notify SMS:       [________________]                          │
│                                                                 │
│                              [Cancel]  [Create Incident]       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Incident Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│  Incident: API Gateway Elevated Error Rates                    │
│─────────────────────────────────────────────────────────────────│
│  Status: 🔍 Investigating  │  Severity: Major  │  Started: 2h ago│
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Timeline                                                 │ │
│  │                                                           │ │
│  │  ● 14:00 │ Investigating │ Initial investigation started │ │
│  │  │       │               │                               │ │
│  │  ● 14:15 │ Identified    │ Root cause: Database connection│ │
│  │  │       │               │ pool exhaustion               │ │
│  │  │       │               │                               │ │
│  │  ● 14:30 │ Monitoring    │ Fix deployed, monitoring      │ │
│  │  │       │               │                               │ │
│  │  ○ 14:45 │ Resolved      │ Pending confirmation          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Affected Users                                           │ │
│  │                                                           │ │
│  │  Total Affected: 234 users                               │ │
│  │  Error Rate During Incident: 12%                         │ │
│  │  Duration: 45 minutes                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Add Update                                               │ │
│  │                                                           │ │
│  │  Status: [Monitoring ▾]                                   │ │
│  │  Message: [________________]                              │ │
│  │  [Post Update]                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Resolve Incident]  [Export Report]                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. SLA Tracking

### 6.1 SLA Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  SLA Performance                               [Last 30 days ▾]│
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  SLA Targets vs Actual                                    │ │
│  │                                                           │ │
│  │  Metric          │ Target │ Actual │ Status │ Trend       │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Uptime          │ 99.9%  │ 99.98% │ ✅ MET │ ↑ +0.02%   │ │
│  │  API Latency     │ <200ms │ 145ms  │ ✅ MET │ ↓ -12ms    │ │
│  │  Error Rate      │ <0.1%  │ 0.02%  │ ✅ MET │ ↓ -0.01%   │ │
│  │  Incident MTTR   │ <30min │ 25min  │ ✅ MET │ ↓ -5min    │ │
│  │  Support Response│ <1hr   │ 45min  │ ✅ MET │ ↓ -10min   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  SLA Credit Calculations                                  │ │
│  │                                                           │ │
│  │  Current SLA: 99.98%                                      │ │
│  │  Required: 99.9%                                          │ │
│  │  Buffer: 0.08%                                            │ │
│  │                                                           │ │
│  │  Status: ✅ No credits due                                │ │
│  │                                                           │ │
│  │  If SLA drops below 99.9%:                               │ │
│  │  • 99.0% - 99.9%: 10% credit                            │ │
│  │  • 95.0% - 99.0%: 25% credit                            │ │
│  │  • Below 95.0%: 50% credit                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Uptime History (12 months)                               │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Month    │ Uptime    │ Incidents │ MTTR            │  │ │
│  │  │  ─────────────────────────────────────────────────  │  │ │
│  │  │  Aug 2026 │ 99.98%   │ 0         │ -               │  │ │
│  │  │  Jul 2026 │ 99.95%   │ 2         │ 45 min          │  │ │
│  │  │  Jun 2026 │ 99.99%   │ 0         │ -               │  │ │
│  │  │  May 2026 │ 99.97%   │ 1         │ 30 min          │  │ │
│  │  │  Apr 2026 │ 99.99%   │ 0         │ -               │  │ │
│  │  │  Mar 2026 │ 99.98%   │ 1         │ 15 min          │  │ │
│  │  │  Feb 2026 │ 99.99%   │ 0         │ -               │  │ │
│  │  │  Jan 2026 │ 99.97%   │ 2         │ 40 min          │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Status Page Components

### A.1 StatusBadge Component

```tsx
interface StatusBadgeProps {
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}
```

### A.2 ServiceCard Component

```tsx
interface ServiceCardProps {
  service: ServiceHealth
  showMetrics?: boolean
  showDependencies?: boolean
}
```

### A.3 IncidentTimeline Component

```tsx
interface IncidentTimelineProps {
  incident: Incident
  showUpdates?: boolean
  showAffectedUsers?: boolean
}
```

### A.4 UptimeGraph Component

```tsx
interface UptimeGraphProps {
  data: UptimeData[]
  timeRange: '24h' | '7d' | '30d' | '90d'
  showIncidents?: boolean
}

interface UptimeData {
  timestamp: string
  uptime: number
  incidents?: Incident[]
}
```

### A.5 SLADashboard Component

```tsx
interface SLADashboardProps {
  metrics: SLAMetric[]
  timeRange: '30d' | '90d' | '12m'
}

interface SLAMetric {
  name: string
  target: number
  actual: number
  unit: string
  trend: 'up' | 'down' | 'stable'
}
```

---

**End of VIZTR-SYSTEM-STATUS-SPEC.md**
