# VIZTR — Platform Operations Dashboard Specification

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Immediate Action - Required for Superadmin

---

## Table of Contents

1. [Overview](#1-overview)
2. [Operations Hub (`/admin/operations`)](#2-operations-hub-adminoperations)
3. [Queue Management](#3-queue-management)
4. [Job Processing Monitor](#4-job-processing-monitor)
5. [Storage Analytics](#5-storage-analytics)
6. [CDN Performance](#6-cdn-performance)
7. [Database Operations](#7-database-operations)
8. [Infrastructure Metrics](#8-infrastructure-metrics)

---

## 1. Overview

The Platform Operations dashboard provides Superadmins with deep visibility into system operations, queue management, job processing, and infrastructure health. This is **required for Superadmin** to manage platform operations effectively.

### 1.1 Operations Areas

| Area | Purpose | Key Metrics |
|------|---------|-------------|
| **Queue Management** | Monitor job queues | Depth, throughput, failed jobs |
| **Job Processing** | Track async jobs | Success rate, latency, retries |
| **Storage** | Monitor file storage | Usage, growth, cleanup |
| **CDN** | Track content delivery | Hit rate, bandwidth, errors |
| **Database** | Monitor DB operations | Connections, queries, locks |
| **Infrastructure** | System resources | CPU, memory, disk, network |

---

## 2. Operations Hub (`/admin/operations`)

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Platform Operations                           [Refresh] [Export]│
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Queues] [Jobs] [Storage] [CDN] [Database] [Infra] │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Operations Health Score                                  │ │
│  │                                                           │ │
│  │  Score: 98.5/100                                          │ │
│  │  ████████████████████████████████████████░░░░░░░░░░░░░░░  │ │
│  │                                                           │ │
│  │  Status: HEALTHY                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Quick Stats                                              │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ Queue Depth │ │ Active Jobs │ │ Failed Jobs │        │ │
│  │  │ 23          │ │ 45          │ │ 2           │        │ │
│  │  │ ↓ -5        │ │ ↑ +12       │ │ ↓ -1        │        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ Storage     │ │ CDN Bandwidth│ │ DB Queries │        │ │
│  │  │ 2.4 TB      │ │ 1.2 TB/mo   │ │ 45K/sec    │        │ │
│  │  │ ↑ +120GB    │ │ ↑ +50GB     │ │ ↑ +2K      │        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Active Alerts                                            │ │
│  │                                                           │ │
│  │  ⚠️ Warning: Queue depth approaching threshold (80%)     │ │
│  │  ⚠️ Warning: Storage quota 75% used                      │ │
│  │  ✅ Resolved: Database connection pool restored           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Recent Operations                                        │ │
│  │                                                           │ │
│  │  14:32:15 │ Job Queue │ Processed 45 render jobs         │ │
│  │  14:30:00 │ Storage   │ Cleaned up 2.3GB temp files      │ │
│  │  14:25:00 │ CDN       │ Cache invalidated for 12 assets  │ │
│  │  14:20:00 │ Database  │ Backup completed (1.2GB)         │ │
│  │  14:15:00 │ Queue     │ Retried 3 failed jobs            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Queue Management

### 3.1 Queue Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Queue Management                              [Purge All Queues]│
│─────────────────────────────────────────────────────────────────│
│  [All Queues] [Active] [Paused] [Failed]                       │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Queue Overview                                           │ │
│  │                                                           │ │
│  │  Queue          │ Depth │ Processing │ Failed │ Status    │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  render-queue   │ 12    │ 3          │ 0      │ 🟢 Active│ │
│  │  ai-queue       │ 8     │ 2          │ 1      │ 🟢 Active│ │
│  │  email-queue    │ 3     │ 1          │ 0      │ 🟢 Active│ │
│  │  webhook-queue  │ 15    │ 5          │ 1      │ 🟡 High  │ │
│  │  upload-queue   │ 5     │ 2          │ 0      │ 🟢 Active│ │
│  │  export-queue   │ 0     │ 0          │ 0      │ 🟢 Idle  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Queue Depth Over Time                                    │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Line Chart: Queue depth over last 24 hours         │  │ │
│  │  │                                                      │  │ │
│  │  │  render-queue: ████████████████████████████         │  │ │
│  │  │  ai-queue:     ████████████████                     │  │ │
│  │  │  webhook-queue:████████████████████████████████     │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Queue Actions                                            │ │
│  │                                                           │ │
│  │  Queue: [render-queue ▾]                                  │ │
│  │                                                           │ │
│  │  [Pause Queue]  [Resume Queue]  [Purge Queue]            │ │
│  │  [Retry Failed]  [View Jobs]  [Configure]                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Queue Structure

```tsx
interface Queue {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'idle' | 'error'
  
  // Metrics
  depth: number
  processing: number
  failed: number
  completed: number
  
  // Configuration
  concurrency: number
  retryAttempts: number
  retryDelay: number
  timeout: number
  
  // Performance
  avgProcessingTime: number
  throughput: number // jobs per minute
  
  // Health
  lastProcessed: string
  errorRate: number
}
```

---

## 4. Job Processing Monitor

### 4.1 Job Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Job Processing Monitor                                        │
│─────────────────────────────────────────────────────────────────│
│  [All Jobs] [Running] [Completed] [Failed] [Queued]           │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Job Statistics                                           │ │
│  │                                                           │ │
│  │  Total Jobs: 12,345                                       │ │
│  │  Running: 45      Completed: 12,298    Failed: 2         │ │
│  │  Queued: 23       Average Time: 45s                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Active Jobs                                              │ │
│  │                                                           │ │
│  │  Job ID      │ Type      │ Status  │ Started  │ Duration │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  job_abc123  │ render    │ 🔄 Run  │ 2m ago   │ 120s     │ │
│  │  job_def456  │ ai-render │ 🔄 Run  │ 3m ago   │ 180s     │ │
│  │  job_ghi789  │ export    │ 🔄 Run  │ 5m ago   │ 300s     │ │
│  │  job_jkl012  │ email     │ ⏳ Queue│ -        │ -        │ │
│  │  job_mno345  │ webhook   │ ⏳ Queue│ -        │ -        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Job Types Distribution                                   │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Pie Chart: Job types                               │  │ │
│  │  │                                                      │  │ │
│  │  │  Render: 45%                                         │  │ │
│  │  │  AI: 25%                                             │  │ │
│  │  │  Export: 15%                                         │  │ │
│  │  │  Email: 10%                                          │  │ │
│  │  │  Webhook: 5%                                         │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Failed Jobs                                              │ │
│  │                                                           │ │
│  │  Job ID      │ Type    │ Error           │ Retries │ Time │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  job_xyz789  │ render  │ Timeout         │ 3/3     │ 2h   │ │
│  │  job_uvw012  │ ai      │ Model overload  │ 2/3     │ 1h   │ │
│  │                                                           │ │
│  │  [Retry All Failed]  [View Error Logs]                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Storage Analytics

### 5.1 Storage Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Storage Analytics                            [Cleanup Files]   │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [By Type] [By Project] [Growth] [Cleanup]         │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Storage Overview                                         │ │
│  │                                                           │ │
│  │  Total Storage: 2.4 TB / 5 TB (48%)                      │ │
│  │  ████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  │                                                           │ │
│  │  Models: 1.2 TB (50%)                                    │ │
│  │  Renders: 800 GB (33%)                                   │ │
│  │  Documents: 200 GB (8%)                                  │ │
│  │  Temp Files: 200 GB (8%)                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Storage by Project                                       │ │
│  │                                                           │ │
│  │  Project        │ Size    │ % Total │ Last Modified      │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Modern Villa   │ 450 GB  │ 18.7%   │ 2h ago            │ │
│  │  City Tower     │ 380 GB  │ 15.8%   │ 1d ago            │ │
│  │  Beach House    │ 320 GB  │ 13.3%   │ 3d ago            │ │
│  │  Office Complex │ 280 GB  │ 11.7%   │ 1w ago            │ │
│  │  Others         │ 970 GB  │ 40.4%   │ -                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Storage Growth (Last 30 days)                            │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Line Chart: Storage growth over time               │  │ │
│  │  │                                                      │  │ │
│  │  │  Start: 2.1 TB  │  End: 2.4 TB  │  Growth: +300GB  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Cleanup Rules                                            │ │
│  │                                                           │ │
│  │  ☑ Auto-delete temp files older than 7 days              │ │
│  │  ☑ Archive projects inactive for 90 days                 │ │
│  │  ☑ Compress files larger than 100MB                      │ │
│  │  ☑ Delete duplicate files                                │ │
│  │                                                           │ │
│  │  Last Cleanup: 2026-08-05 02:00 UTC                      │ │
│  │  Space Recovered: 2.3 GB                                 │ │
│  │                                                           │ │
│  │  [Run Cleanup Now]  [Configure Rules]                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. CDN Performance

### 6.1 CDN Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  CDN Performance                              [Last 24 hours ▾] │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Bandwidth] [Cache] [Errors] [Geography]          │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CDN Metrics                                              │ │
│  │                                                           │ │
│  │  Bandwidth: 1.2 TB / month                               │ │
│  │  Requests: 45.2M / month                                 │ │
│  │  Cache Hit Rate: 98.5%                                   │ │
│  │  Error Rate: 0.02%                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Bandwidth Over Time                                      │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Line Chart: Bandwidth usage over 24 hours          │  │ │
│  │  │                                                      │  │ │
│  │  │  Peak: 12:00 - 14:00 UTC (85 GB/hour)              │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Cache Performance                                        │ │
│  │                                                           │ │
│  │  Cache Hits: 44.5M (98.5%)                               │ │
│  │  Cache Misses: 680K (1.5%)                               │ │
│  │                                                           │ │
│  │  Top Cached Assets:                                       │ │
│  │  • /models/*.glb - 12.3M hits                            │ │
│  │  • /renders/*.png - 8.7M hits                            │ │
│  │  • /assets/*.js - 6.2M hits                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Top Errors                                               │ │
│  │                                                           │ │
│  │  Status │ Count │ % Total │ Last Occurrence              │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  404    │ 45K   │ 65%     │ 5 min ago                    │ │
│  │  500    │ 12K   │ 17%     │ 10 min ago                   │ │
│  │  403    │ 8K    │ 12%     │ 15 min ago                   │ │
│  │  503    │ 4K    │ 6%      │ 20 min ago                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Database Operations

### 7.1 Database Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Database Operations                         [Last 24 hours ▾]  │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Queries] [Connections] [Locks] [Replication]      │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Database Metrics                                         │ │
│  │                                                           │ │
│  │  Connections: 45 / 100                                    │ │
│  │  Queries/sec: 45K                                         │ │
│  │  Cache Hit Ratio: 99.2%                                  │ │
│  │  Avg Query Time: 12ms                                    │ │
│  │  Database Size: 256 GB                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Connection Pool                                          │ │
│  │                                                           │ │
│  │  Active: 45    Idle: 30    Waiting: 0                    │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Bar Chart: Connection usage over time              │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Slow Queries                                             │ │
│  │                                                           │ │
│  │  Query                          │ Time   │ Calls │ Impact │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  SELECT * FROM projects WHERE.. │ 2.3s   │ 45    │ High   │ │
│  │  UPDATE users SET ...           │ 1.8s   │ 23    │ Medium │ │
│  │  SELECT * FROM models JOIN...   │ 1.5s   │ 67    │ Medium │ │
│  │                                                           │ │
│  │  [View All Slow Queries]  [Optimize Suggestions]          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Replication Status                                       │ │
│  │                                                           │ │
│  │  Primary:  🟢 Healthy    │ Lag: 0ms                      │ │
│  │  Replica1: 🟢 Healthy    │ Lag: 12ms                     │ │
│  │  Replica2: 🟢 Healthy    │ Lag: 15ms                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Infrastructure Metrics

### 8.1 Infrastructure Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Infrastructure Metrics                       [Last 24 hours ▾] │
│─────────────────────────────────────────────────────────────────│
│  [CPU] [Memory] [Disk] [Network] [Services]                   │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  System Resources                                         │ │
│  │                                                           │ │
│  │  CPU Usage: 45%                                           │ │
│  │  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  │                                                           │ │
│  │  Memory Usage: 68%                                        │ │
│  │  ████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░  │ │
│  │                                                           │ │
│  │  Disk Usage: 42%                                          │ │
│  │  ██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  │                                                           │ │
│  │  Network I/O: 125 MB/s                                    │ │
│  │  ████████████████████████████████████████████████░░░░░░░  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Service Instances                                        │ │
│  │                                                           │ │
│  │  Service        │ Instances │ CPU    │ Memory │ Status    │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  API Gateway    │ 3         │ 45%    │ 2.1 GB │ 🟢 OK    │ │
│  │  AI Service     │ 2         │ 78%    │ 4.2 GB │ 🟡 High  │ │
│  │  XR Engine      │ 2         │ 32%    │ 1.8 GB │ 🟢 OK    │ │
│  │  Worker Pool    │ 4         │ 56%    │ 3.5 GB │ 🟢 OK    │ │
│  │  Scheduler      │ 1         │ 12%    │ 512 MB │ 🟢 OK    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Resource Alerts                                          │ │
│  │                                                           │ │
│  │  ⚠️ AI Service CPU usage above 75%                       │ │
│  │  ⚠️ Memory usage approaching 70% threshold               │ │
│  │  ✅ Disk cleanup completed                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Scaling Recommendations                                  │ │
│ │                                                           │ │
│  │  Current Load: Normal                                    │ │
│  │  Recommended: No action needed                           │ │
│  │                                                           │ │
│  │  Auto-scaling: Enabled                                   │ │
│  │  Min Instances: 2                                        │ │
│  │  Max Instances: 10                                       │ │
│  │  Scale-up Threshold: 75% CPU                             │ │
│  │  Scale-down Threshold: 30% CPU                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Operations Components

### A.1 QueueCard Component

```tsx
interface QueueCardProps {
  queue: Queue
  onPause: (id: string) => void
  onResume: (id: string) => void
  onPurge: (id: string) => void
  onConfigure: (id: string) => void
}
```

### A.2 JobTable Component

```tsx
interface JobTableProps {
  jobs: Job[]
  filters: JobFilters
  onFilterChange: (filters: JobFilters) => void
  onRetry: (jobId: string) => void
  onCancel: (jobId: string) => void
  pagination: PaginationProps
}
```

### A.3 StorageChart Component

```tsx
interface StorageChartProps {
  data: StorageData[]
  timeRange: '24h' | '7d' | '30d' | '90d'
  groupBy: 'type' | 'project' | 'date'
}
```

### A.4 CdnMetrics Component

```tsx
interface CdnMetricsProps {
  metrics: CdnMetrics
  timeRange: '24h' | '7d' | '30d'
  onRefresh: () => void
}

interface CdnMetrics {
  bandwidth: number
  requests: number
  hitRate: number
  errorRate: number
  topErrors: CdnError[]
}
```

### A.5 DatabaseMonitor Component

```tsx
interface DatabaseMonitorProps {
  metrics: DatabaseMetrics
  onRefresh: () => void
  onOptimize: () => void
}

interface DatabaseMetrics {
  connections: ConnectionPool
  queriesPerSecond: number
  avgQueryTime: number
  cacheHitRatio: number
  slowQueries: SlowQuery[]
  replication: ReplicationStatus[]
}
```

### A.6 InfrastructureOverview Component

```tsx
interface InfrastructureOverviewProps {
  resources: SystemResources
  services: ServiceInstance[]
  alerts: Alert[]
  recommendations: ScalingRecommendation[]
}

interface SystemResources {
  cpu: number
  memory: number
  disk: number
  network: number
}
```

---

**End of VIZTR-PLATFORM-OPERATIONS-SPEC.md**
