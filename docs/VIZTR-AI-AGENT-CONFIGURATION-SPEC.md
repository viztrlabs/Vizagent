# VIZTR — AI Agent Configuration Page Specification

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Immediate Action - Critical

---

## Table of Contents

1. [Overview](#1-overview)
2. [AI Agent Hub (`/ai/agents`)](#2-ai-agent-hub-aiagents)
3. [Agent Configuration Modal](#3-agent-configuration-modal)
4. [Agent Task Assignment](#4-agent-task-assignment)
5. [Agent Performance Monitoring](#5-agent-performance-monitoring)
6. [Agent Logs & Debugging](#6-agent-logs-debugging)
7. [13 Agent Types Reference](#7-13-agent-types-reference)

---

## 1. Overview

The AI Agent Configuration page provides comprehensive control over VizTR's 13-agent autonomous system. This is **critical** for managing the platform's AI capabilities.

### 1.1 Agent Categories

| Category | Agents | Purpose |
|----------|--------|---------|
| **Content** | Copywriter, SEO Specialist, Social Media | Content generation and optimization |
| **Design** | Interior Designer, Landscape Architect, Style Curator | Design recommendations |
| **Technical** | 3D Modeler, VR/AR Developer, QA Engineer | Technical implementation |
| **Business** | Client Coordinator, Project Manager, Pricing Analyst | Business operations |
| **Analytics** | Performance Analyst, User Researcher | Data analysis |

---

## 2. AI Agent Hub (`/ai/agents`)

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Agent Configuration                                         │
│─────────────────────────────────────────────────────────────────│
│  [All Agents] [Active] [Inactive] [Error]  [Search...]        │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Agent Statistics                                         │ │
│  │                                                           │ │
│  │  Total Agents: 13    Active: 10    Inactive: 2    Error: 1│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Agent Grid                                               │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ 🟢 Copywriter│ │ 🟢 SEO      │ │ 🟢 Social   │        │ │
│  │  │ Active      │ │ Active      │ │ Active      │        │ │
│  │  │ Tasks: 45   │ │ Tasks: 32   │ │ Tasks: 28   │        │ │
│  │  │ [Configure] │ │ [Configure] │ │ [Configure] │        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ 🟢 Interior │ │ 🟢 Landscape│ │ 🟢 Style    │        │ │
│  │  │ Active      │ │ Active      │ │ Active      │        │ │
│  │  │ Tasks: 38   │ │ Tasks: 22   │ │ Tasks: 15   │        │ │
│  │  │ [Configure] │ │ [Configure] │ │ [Configure] │        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ 🟢 3D Model │ │ 🟢 VR/AR    │ │ 🔴 QA       │        │ │
│  │  │ Active      │ │ Active      │ │ Error       │        │ │
│  │  │ Tasks: 52   │ │ Tasks: 41   │ │ Last: 2h ago│        │ │
│  │  │ [Configure] │ │ [Configure] │ │ [View Error]│        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ 🟢 Client   │ │ 🟢 Project  │ │ ⚪ Pricing  │        │ │
│  │  │ Active      │ │ Active      │ │ Inactive    │        │ │
│  │  │ Tasks: 67   │ │ Tasks: 54   │ │ Last: 3d ago│        │ │
│  │  │ [Configure] │ │ [Configure] │ │ [Activate]  │        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  │                                                           │ │
│  │  ┌─────────────┐ ┌─────────────┐                         │ │
│  │  │ 🟢 Performance│ │ ⚪ User   │                         │ │
│  │  │ Active      │ │ Inactive    │                         │ │
│  │  │ Tasks: 29   │ │ Last: 1w ago│                         │ │
│  │  │ [Configure] │ │ [Activate]  │                         │ │
│  │  └─────────────┘ └─────────────┘                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [+ Create Custom Agent]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Agent Card Structure

```tsx
interface AgentCardProps {
  id: string
  name: string
  type: AgentType
  status: 'active' | 'inactive' | 'error' | 'maintenance'
  tasksCompleted: number
  lastActive: string
  healthScore: number
  onConfigure: (id: string) => void
  onViewLogs: (id: string) => void
}

type AgentType = 
  | 'copywriter'
  | 'seo_specialist'
  | 'social_media'
  | 'interior_designer'
  | 'landscape_architect'
  | 'style_curator'
  | '3d_modeler'
  | 'vr_ar_developer'
  | 'qa_engineer'
  | 'client_coordinator'
  | 'project_manager'
  | 'pricing_analyst'
  | 'performance_analyst'
```

---

## 3. Agent Configuration Modal

### 3.1 Modal Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Configure Agent: Copywriter                            [×]   │
│─────────────────────────────────────────────────────────────────│
│  [General] [Capabilities] [Limits] [Integrations] [Advanced]  │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  General Settings                                         │ │
│  │                                                           │ │
│  │  Agent Name:     [Copywriter_______________]              │ │
│  │  Description:    [Generates marketing copy and blog___]   │ │
│  │  Status:         [██████████] Active                      │ │
│  │                                                           │ │
│  │  Avatar:         [Upload Avatar]                          │ │
│  │                                                           │ │
│  │  Model:          [GPT-4o ▾]                               │ │
│  │  Temperature:    [0.7] ────────────○─────────── 1.0      │ │
│  │  Max Tokens:     [4096]                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Capabilities                                             │ │
│  │                                                           │ │
│  │  ☑ Content Generation                                     │ │
│  │  ☑ Blog Writing                                           │ │
│  │  ☑ Social Media Posts                                     │ │
│  │  ☑ Email Templates                                        │ │
│  │  ☑ Product Descriptions                                   │ │
│  │  ☐ Code Generation                                        │ │
│  │  ☐ Data Analysis                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Rate Limits                                              │ │
│  │                                                           │ │
│  │  Tasks per Hour:     [100]                                │ │
│  │  Tasks per Day:      [1000]                               │ │
│  │  Max Concurrent:     [5]                                  │ │
│  │  Timeout (seconds):  [120]                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Custom Instructions (System Prompt)                      │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ You are VizTR's expert copywriter specializing in   │  │ │
│  │  │ architectural visualization content. Generate       │  │ │
│  │  │ compelling, SEO-optimized copy for:                 │  │ │
│  │  │ - Portfolio case studies                            │  │ │
│  │  │ - Service descriptions                              │  │ │
│  │  │ - Blog articles                                     │  │ │
│  │  │ - Social media content                              │  │ │
│  │  │                                                     │  │ │
│  │  │ Maintain a professional, innovative tone that       │  │ │
│  │  │ reflects VizTR's brand identity.                   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Cancel]  [Save Configuration]    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Agent Configuration Structure

```tsx
interface AgentConfiguration {
  id: string
  name: string
  description: string
  type: AgentType
  status: 'active' | 'inactive' | 'error' | 'maintenance'
  
  // Model Configuration
  model: string
  temperature: number
  maxTokens: number
  
  // Capabilities
  capabilities: string[]
  
  // Rate Limits
  rateLimits: {
    perHour: number
    perDay: number
    maxConcurrent: number
    timeoutSeconds: number
  }
  
  // Custom Instructions
  systemPrompt: string
  
  // Integrations
  integrations: {
    enabledTools: string[]
    apiEndpoints: string[]
  }
  
  // Advanced
  fallbackModel: string
  retryAttempts: number
  loggingLevel: 'minimal' | 'standard' | 'verbose'
}
```

---

## 4. Agent Task Assignment

### 4.1 Task Assignment Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  Task Assignment                                    [+ New Task]│
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Manual Assignment                                        │ │
│  │                                                           │ │
│  │  Select Agent:  [Copywriter ▾]                            │ │
│  │  Task Type:     [Blog Article ▾]                          │ │
│  │  Priority:      [High ▾]                                  │ │
│  │                                                           │ │
│  │  Task Description:                                        │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Write a case study for the Modern Villa project.    │  │ │
│  │  │ Focus on the sustainable design elements and       │  │ │
│  │  │ natural lighting features.                          │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  Context:                                                 │ │
│  │  • Project: Modern Villa                                 │ │
│  │  • Client: AC Corp                                       │ │
│  │  • Deadline: 2026-08-10                                  │ │
│  │                                                           │ │
│  │  [Assign Task]                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Auto-Assignment Rules                                    │ │
│  │                                                           │ │
│  │  ☑ Enable auto-assignment                                 │ │
│  │                                                           │ │
│  │  Rule 1: Blog articles → Copywriter                       │ │
│  │  Rule 2: SEO optimization → SEO Specialist                │ │
│  │  Rule 3: Social posts → Social Media                      │ │
│  │  Rule 4: Interior renders → Interior Designer             │ │
│  │  Rule 5: 3D models → 3D Modeler                          │ │
│  │                                                           │ │
│  │  [+ Add Rule]                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Task Queue View

```
┌─────────────────────────────────────────────────────────────────┐
│  Task Queue                                                    │
│─────────────────────────────────────────────────────────────────│
│  [Pending] [In Progress] [Completed] [Failed]                 │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Pending Tasks (12)                                       │ │
│  │                                                           │ │
│  │  ☐ Write blog post        │ Copywriter  │ High    │ 2h   │ │
│  │  ☐ Optimize service page  │ SEO         │ Medium  │ 4h   │ │
│  │  ☐ Create social calendar │ Social      │ Low     │ 1d   │ │
│  │  ☐ Design interior mood   │ Interior    │ High    │ 3h   │ │
│  │  ☐ Generate 3D model      │ 3D Modeler  │ High    │ 6h   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  In Progress (5)                                          │ │
│  │                                                           │ │
│  │  🔄 Modern Villa case study │ Copywriter │ 45% │ 12m ago │ │
│  │  🔄 SEO audit report        │ SEO        │ 72% │ 30m ago │ │
│  │  🔄 Social media posts      │ Social     │ 20% │ 1h ago  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Agent Performance Monitoring

### 5.1 Performance Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Agent Performance Analytics                    [Last 7 days ▾]│
│─────────────────────────────────────────────────────────────────│
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Total Tasks          │  │  Success Rate         │           │
│  │  1,234               │  │  97.8%                │           │
│  │  +15% ↑              │  │  +0.5% ↑              │           │
│  └──────────────────────┘  └──────────────────────┘           │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Avg Response Time    │  │  Total Cost           │           │
│  │  45s                 │  │  $12.45               │           │
│  │  -8% ↓               │  │  +12% ↑               │           │
│  └──────────────────────┘  └──────────────────────┘           │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Agent Performance Comparison                             │ │
│  │                                                           │ │
│  │  Agent          │ Tasks │ Success │ Avg Time │ Cost      │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Copywriter     │ 456   │ 98.2%   │ 32s      │ $4.23    │ │
│  │  SEO Specialist │ 234   │ 97.5%   │ 45s      │ $3.12    │ │
│  │  Social Media   │ 189   │ 99.1%   │ 28s      │ $2.87    │ │
│  │  Interior       │ 312   │ 96.8%   │ 67s      │ $5.34    │ │
│  │  3D Modeler     │ 423   │ 95.2%   │ 120s     │ $8.76    │ │
│  │  VR/AR Dev      │ 156   │ 94.5%   │ 90s      │ $6.23    │ │
│  │  QA Engineer    │ 278   │ 99.6%   │ 15s      │ $1.23    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Tasks Over Time (Line Chart)                             │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Agent Logs & Debugging

### 6.1 Agent Logs View

```
┌─────────────────────────────────────────────────────────────────┐
│  Agent Logs: Copywriter                         [← Back]       │
│─────────────────────────────────────────────────────────────────│
│  [All] [Info] [Warning] [Error]  [Date Range]  [Search...]   │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  2026-08-05 14:32:15 │ INFO  │ Task started: Blog post   │ │
│  │  2026-08-05 14:32:16 │ INFO  │ Generating content...     │ │
│  │  2026-08-05 14:32:45 │ INFO  │ Content generated (1,234  │ │
│  │                      │       │ tokens, 32s)              │ │
│  │  2026-08-05 14:32:46 │ INFO  │ Task completed: Blog post │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  2026-08-05 14:15:22 │ WARN  │ Rate limit approaching    │ │
│  │  2026-08-05 14:15:22 │ WARN  │ 95/100 tasks per hour     │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  2026-08-05 13:45:00 │ ERROR │ Task failed: Timeout      │ │
│  │  2026-08-05 13:45:00 │ ERROR │ Agent: 3D Modeler         │ │
│  │  2026-08-05 13:45:00 │ ERROR │ Error: Request timeout    │ │
│  │                      │       │ after 120s                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Log Details                                              │ │
│  │                                                           │ │
│  │  Timestamp: 2026-08-05 14:32:15                           │ │
│  │  Level: INFO                                              │ │
│  │  Agent: Copywriter                                        │ │
│  │  Task ID: task_abc123                                     │ │
│  │                                                           │ │
│  │  Input:                                                   │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Write a case study for Modern Villa project...      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  Output:                                                  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ # Modern Villa: Sustainable Design Excellence       │  │ │
│  │  │                                                      │  │ │
│  │  │ This stunning residential project showcases...      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  Metrics:                                                 │ │
│  │  • Tokens Used: 1,234                                    │ │
│  │  • Latency: 32s                                          │ │
│  │  • Cost: $0.023                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. 13 Agent Types Reference

### 7.1 Agent Definitions

| # | Agent | Type | Primary Function | Default Model |
|---|-------|------|------------------|---------------|
| 1 | **Copywriter** | Content | Generates marketing copy, blog posts, case studies | GPT-4o |
| 2 | **SEO Specialist** | Content | Optimizes content for search engines | Claude 3.5 |
| 3 | **Social Media** | Content | Creates social media posts and calendars | GPT-4o |
| 4 | **Interior Designer** | Design | Provides interior design recommendations | Claude 3.5 |
| 5 | **Landscape Architect** | Design | Generates landscape design concepts | GPT-4o |
| 6 | **Style Curator** | Design | Curates design styles and mood boards | Claude 3.5 |
| 7 | **3D Modeler** | Technical | Creates and optimizes 3D models | GPT-4o |
| 8 | **VR/AR Developer** | Technical | Develops VR/AR experiences | Claude 3.5 |
| 9 | **QA Engineer** | Technical | Performs quality assurance checks | GPT-4o |
| 10 | **Client Coordinator** | Business | Manages client communications | Claude 3.5 |
| 11 | **Project Manager** | Business | Tracks project progress and deadlines | GPT-4o |
| 12 | **Pricing Analyst** | Business | Analyzes pricing and generates quotes | Claude 3.5 |
| 13 | **Performance Analyst** | Analytics | Analyzes platform performance metrics | GPT-4o |

### 7.2 Agent Configuration Structure

```tsx
interface Agent {
  id: string
  name: string
  type: AgentType
  description: string
  status: 'active' | 'inactive' | 'error' | 'maintenance'
  
  // Model Configuration
  model: string
  temperature: number
  maxTokens: number
  
  // Capabilities
  capabilities: string[]
  
  // Rate Limits
  rateLimits: {
    perHour: number
    perDay: number
    maxConcurrent: number
    timeoutSeconds: number
  }
  
  // Custom Instructions
  systemPrompt: string
  
  // Performance Metrics
  metrics: {
    tasksCompleted: number
    successRate: number
    avgResponseTime: number
    totalCost: number
    lastActive: string
  }
  
  // Health
  healthScore: number
  lastError?: string
  lastErrorTime?: string
}
```

### 7.3 Default System Prompts

```tsx
const defaultSystemPrompts: Record<AgentType, string> = {
  copywriter: `You are VizTR's expert copywriter specializing in architectural visualization content. Generate compelling, SEO-optimized copy for portfolio case studies, service descriptions, blog articles, and social media content. Maintain a professional, innovative tone that reflects VizTR's brand identity.`,
  
  seo_specialist: `You are VizTR's SEO specialist. Optimize all content for search engines while maintaining readability. Focus on architectural visualization keywords, local SEO, and technical SEO best practices.`,
  
  social_media: `You are VizTR's social media expert. Create engaging posts for LinkedIn, Instagram, Twitter, and Facebook. Focus on visual storytelling, project showcases, and industry insights.`,
  
  interior_designer: `You are VizTR's AI interior designer. Provide expert recommendations on interior design, material selection, color palettes, and spatial planning for architectural visualization projects.`,
  
  landscape_architect: `You are VizTR's AI landscape architect. Generate landscape design concepts, plant recommendations, and outdoor space planning for architectural projects.`,
  
  style_curator: `You are VizTR's style curator. Identify and recommend design styles, create mood boards, and maintain consistency across visual presentations.`,
  
  '3d_modeler': `You are VizTR's 3D modeling expert. Optimize 3D models for web delivery, suggest material applications, and ensure technical specifications meet web standards.`,
  
  vr_ar_developer: `You are VizTR's VR/AR development specialist. Configure WebXR experiences, optimize for different devices, and ensure immersive interactions work correctly.`,
  
  qa_engineer: `You are VizTR's QA engineer. Perform comprehensive quality checks on all deliverables, identify issues, and ensure specifications are met.`,
  
  client_coordinator: `You are VizTR's client coordinator. Manage client communications, schedule meetings, and ensure client satisfaction throughout project lifecycle.`,
  
  project_manager: `You are VizTR's project manager. Track project progress, manage deadlines, coordinate team efforts, and generate status reports.`,
  
  pricing_analyst: `You are VizTR's pricing analyst. Analyze project requirements, generate accurate quotes, and provide pricing recommendations based on complexity and scope.`,
  
  performance_analyst: `You are VizTR's performance analyst. Analyze platform metrics, identify trends, and provide actionable insights for optimization.`
}
```

---

## Appendix: Agent Components

### A.1 AgentCard Component

```tsx
interface AgentCardProps {
  agent: Agent
  onConfigure: (id: string) => void
  onViewLogs: (id: string) => void
  onToggleStatus: (id: string, status: 'active' | 'inactive') => void
}
```

### A.2 AgentConfigModal Component

```tsx
interface AgentConfigModalProps {
  agent: Agent
  open: boolean
  onClose: () => void
  onSave: (config: AgentConfiguration) => Promise<void>
}
```

### A.3 TaskAssignmentPanel Component

```tsx
interface TaskAssignmentPanelProps {
  agents: Agent[]
  onAssign: (taskId: string, agentId: string) => Promise<void>
  onBulkAssign: (assignments: TaskAssignment[]) => Promise<void>
}
```

### A.4 AgentPerformanceChart Component

```tsx
interface AgentPerformanceChartProps {
  agents: Agent[]
  timeRange: '24h' | '7d' | '30d' | '90d'
  metrics: ('tasks' | 'success' | 'latency' | 'cost')[]
}
```

---

**End of VIZTR-AI-AGENT-CONFIGURATION-SPEC.md**
