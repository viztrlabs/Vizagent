# VIZTR — AI Configuration UI Specification

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Act Mode — UI Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [AI Hub (`/ai`)](#2-ai-hub-ai)
3. [Prompt Studio (`/ai/studio`)](#3-prompt-studio-aistudio)
4. [LLM Router (`/ai/router`)](#4-llm-router-ai router)
5. [AI Usage Analytics (`/ai/usage`)](#5-ai-usage-analytics-aiusage)
6. [AI Templates (`/ai/templates`)](#6-ai-templates-aitemplates)
7. [AI Integration Points](#7-ai-integration-points)

---

## 1. Overview

The AI Configuration UI provides comprehensive control over AI features including:

- **Prompt Studio:** Create and manage custom AI prompts for different rendering styles
- **LLM Router:** Configure which AI models to use for different tasks
- **Usage Analytics:** Monitor AI consumption, costs, and performance
- **Templates:** Pre-built prompts and configurations for common use cases

### 1.1 Navigation Structure

```
AI
├── Hub (Overview dashboard)
├── Prompt Studio
│   ├── My Prompts
│   ├── Create Prompt
│   └── Prompt Tester
├── LLM Router
│   ├── Model Configuration
│   ├── Routing Rules
│   └── Fallback Chains
├── Usage Analytics
│   ├── Overview
│   ├── Cost Analysis
│   └── Performance Metrics
└── Templates
    ├── Rendering Styles
    ├── Design Prompts
    └── Custom Templates
```

---

## 2. AI Hub (`/ai`)

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Hub                                                        │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Prompt Studio] [LLM Router] [Usage] [Templates]  │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AI Usage Summary (Last 30 days)                          │ │
│  │                                                           │ │
│  │  Total Operations: 1,234                                  │ │
│  │  Tokens Used: 2.4M                                        │ │
│  │  Estimated Cost: $45.67                                   │ │
│  │  Success Rate: 98.5%                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Quick Actions                                            │ │
│  │                                                           │ │
│  │  [+ Create New Prompt]  [View Usage]  [Test Prompt]       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Recent Prompts                                           │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Modern Interior Render    │ GPT-4    │ 2h ago      │  │ │
│  │  │  Exterior Architectural    │ Claude   │ 1d ago      │  │ │
│  │  │  Product Visualization     │ GPT-4    │ 3d ago      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  [View All Prompts →]                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AI Model Status                                          │ │
│  │                                                           │ │
│  │  🟢 GPT-4o      │ Operational │ 145ms avg               │ │
│  │  🟢 Claude 3.5  │ Operational │ 132ms avg               │ │
│  │  🟡 Gemini Pro  │ Degraded    │ 234ms avg               │ │
│  │  🔴 Llama 3.1   │ Offline     │ -                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Stats Cards

| Metric | Value | Description |
|--------|-------|-------------|
| Total Operations | 1,234 | AI operations in last 30 days |
| Tokens Used | 2.4M | Total tokens consumed |
| Estimated Cost | $45.67 | Estimated cost based on usage |
| Success Rate | 98.5% | Percentage of successful operations |

---

## 3. Prompt Studio (`/ai/studio`)

### 3.1 Prompt List View

```
┌─────────────────────────────────────────────────────────────────┐
│  Prompt Studio                               [+ Create Prompt]  │
│─────────────────────────────────────────────────────────────────│
│  [Search...]  [Category ▾]  [Model ▾]  [Sort by ▾]           │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Name            │ Category   │ Model  │ Uses  │ Updated  │ │
│  │────────────────────────────────────────────────────────────│ │
│  │  Modern Interior │ Rendering  │ GPT-4  │ 45    │ 2h ago   │ │
│  │  Exterior Arch   │ Rendering  │ Claude │ 32    │ 1d ago   │ │
│  │  Product Shot    │ Rendering  │ GPT-4  │ 28    │ 3d ago   │ │
│  │  Landscape       │ Design     │ GPT-4  │ 15    │ 1w ago   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  Showing 1-10 of 24 prompts           < 1 2 3 >               │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Create/Edit Prompt View

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Prompt Studio                                       │
│─────────────────────────────────────────────────────────────────│
│  Create New Prompt                                             │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Prompt Details                                           │ │
│  │                                                           │ │
│  │  Name:           [Modern Interior Render_________]        │ │
│  │  Description:    [AI prompt for modern interior scenes___] │ │
│  │  Category:       [Rendering ▾]                            │ │
│  │  Model:          [GPT-4 ▾]                                │ │
│  │  Temperature:    [0.7]                                    │ │
│  │  Max Tokens:     [2000]                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  System Prompt                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ You are an expert architectural renderer. Generate  │  │ │
│  │  │ photorealistic renders for modern interior spaces... │  │ │
│  │  │                                                      │  │ │
│  │  │ {style} - Insert style parameter                    │  │ │
│  │  │ {lighting} - Insert lighting condition              │  │ │
│  │  │ {materials} - Insert material palette               │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Parameters                                              │ │
│  │                                                           │ │
│  │  ┌─────────────┬───────────────┬─────────────────────┐    │ │
│  │  │ Name        │ Type          │ Description         │    │ │
│  │  ├─────────────┼───────────────┼─────────────────────┤    │ │
│  │  │ style       │ Select        │ Rendering style     │    │ │
│  │  │ lighting    │ Select        │ Lighting condition  │    │ │
│  │  │ materials   │ Multi-select  │ Material palette    │    │ │
│  │  └─────────────┴───────────────┴─────────────────────┘    │ │
│  │                                                           │ │
│  │  [+ Add Parameter]                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Test Prompt                                             │ │
│  │                                                           │ │
│  │  Input Parameters:                                        │ │
│  │  style: [Modern Minimalist ▾]                             │ │
│  │  lighting: [Natural Daylight ▾]                           │ │
│  │  materials: [Wood, Concrete, Glass]                       │ │
│  │                                                           │ │
│  │  [Test Prompt]                                            │ │
│  │                                                           │ │
│  │  Output:                                                  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Generate a photorealistic render of a modern        │  │ │
│  │  │ minimalist interior with natural daylight,          │  │ │
│  │  │ featuring wood, concrete, and glass materials...    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Cancel]  [Save Prompt]           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Prompt Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| style | Select | Rendering style | Modern, Classic, Minimalist |
| lighting | Select | Lighting condition | Daylight, Evening, Dramatic |
| materials | Multi-select | Material palette | Wood, Concrete, Glass |
| camera | Select | Camera angle | Wide, Close-up, Aerial |
| mood | Select | Overall mood | Warm, Cool, Professional |
| resolution | Select | Output resolution | 1024x1024, 2048x2048 |

### 3.4 Prompt Testing Interface

```tsx
interface PromptTestProps {
  promptId: string
  parameters: PromptParameter[]
  onTest: (params: Record<string, any>) => Promise<TestResult>
}

interface TestResult {
  output: string
  tokensUsed: number
  latency: number
  cost: number
  model: string
}
```

---

## 4. LLM Router (`/ai/router`)

### 4.1 Model Configuration View

```
┌─────────────────────────────────────────────────────────────────┐
│  LLM Router                                                     │
│─────────────────────────────────────────────────────────────────│
│  [Models] [Routing Rules] [Fallback Chains]                    │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Available Models                                         │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  🟢 GPT-4o (OpenAI)                                │  │ │
│  │  │     Status: Operational                             │  │ │
│  │  │     Cost: $0.005/1K tokens                          │  │ │
│  │  │     Max Tokens: 128,000                             │  │ │
│  │  │     [Configure]  [Test]  [Disable]                  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  🟢 Claude 3.5 Sonnet (Anthropic)                   │  │ │
│  │  │     Status: Operational                             │  │ │
│  │  │     Cost: $0.003/1K tokens                          │  │ │
│  │  │     Max Tokens: 200,000                             │  │ │
│  │  │     [Configure]  [Test]  [Disable]                  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  🟡 Gemini Pro (Google)                             │  │ │
│  │  │     Status: Degraded Performance                    │  │ │
│  │  │     Cost: $0.0025/1K tokens                         │  │ │
│  │  │     Max Tokens: 32,000                              │  │ │
│  │  │     [Configure]  [Test]  [Disable]                  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [+ Add Custom Model]                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Routing Rules View

```
┌─────────────────────────────────────────────────────────────────┐
│  Routing Rules                                [+ Add Rule]      │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Rule Name        │ Task Type      │ Model   │ Priority   │ │
│  │────────────────────────────────────────────────────────────│ │
│  │  Primary Render   │ Rendering      │ GPT-4o  │ 1          │ │
│  │  Design Assist    │ Design         │ Claude  │ 1          │ │
│  │  Quick Preview    │ Preview        │ Gemini  │ 1          │ │
│  │  Cost Optimized   │ All            │ Llama   │ 2          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Edit Rule: Primary Render                                │ │
│  │                                                           │ │
│  │  Rule Name:      [Primary Render_________]                │ │
│  │  Task Type:      [Rendering ▾]                            │ │
│  │  Primary Model:  [GPT-4o ▾]                               │ │
│  │  Fallback Model: [Claude 3.5 ▾]                           │ │
│  │  Max Retries:    [3]                                      │ │
│  │  Timeout (ms):   [30000]                                  │ │
│  │                                                           │ │
│  │  Conditions:                                               │ │
│  │  • Token limit < 100,000                                  │ │
│  │  • Model status = operational                             │ │
│  │                                                           │ │
│  │  [Save Rule]  [Delete Rule]                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Fallback Chains View

```
┌─────────────────────────────────────────────────────────────────┐
│  Fallback Chains                             [+ Add Chain]      │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Chain: Default Rendering Chain                           │ │
│  │                                                           │ │
│  │  1. GPT-4o ──→ 2. Claude 3.5 ──→ 3. Gemini Pro          │ │
│  │                                                           │ │
│  │  [Edit Chain]  [Test Chain]  [Delete]                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Chain: Cost Optimized Chain                              │ │
│  │                                                           │ │
│  │  1. Llama 3.1 ──→ 2. Gemini Pro ──→ 3. GPT-4o            │ │
│  │                                                           │ │
│  │  [Edit Chain]  [Test Chain]  [Delete]                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Routing Rule Structure

```tsx
interface RoutingRule {
  id: string
  name: string
  taskType: 'rendering' | 'design' | 'preview' | 'analysis' | 'all'
  primaryModel: string
  fallbackModel: string
  maxRetries: number
  timeoutMs: number
  conditions: RoutingCondition[]
  priority: number
}

interface RoutingCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains'
  value: string | number
}
```

---

## 5. AI Usage Analytics (`/ai/usage`)

### 5.1 Overview Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Usage Analytics                       [Last 30 days ▾]     │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Cost Analysis] [Performance] [Errors]            │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Total Operations     │  │  Tokens Used          │           │
│  │  1,234               │  │  2.4M                 │           │
│  │  +12% ↑              │  │  +15% ↑               │           │
│  └──────────────────────┘  └──────────────────────┘           │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Estimated Cost       │  │  Success Rate         │           │
│  │  $45.67              │  │  98.5%                │           │
│  │  +8% ↑               │  │  +0.5% ↑              │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Usage Over Time (Line Chart)                             │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  X-axis: Last 30 days                                     │ │
│  │  Y-axis: Operations count                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Usage by Model (Pie Chart)                               │ │
│  │                                                           │ │
│  │  GPT-4o: 45%                                              │ │
│  │  Claude 3.5: 35%                                          │ │
│  │  Gemini Pro: 15%                                          │ │
│  │  Llama 3.1: 5%                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Cost Analysis Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Cost Analysis                              [Last 30 days ▾]   │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Cost Breakdown by Model                                  │ │
│  │                                                           │ │
│  │  Model         │ Operations │ Tokens   │ Cost    │ % Total│ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  GPT-4o        │ 555        │ 1.1M     │ $25.50  │ 56%    │ │
│  │  Claude 3.5    │ 432        │ 840K     │ $14.28  │ 31%    │ │
│  │  Gemini Pro    │ 185        │ 360K     │ $4.50   │ 10%    │ │
│  │  Llama 3.1     │ 62         │ 100K     │ $1.39   │ 3%     │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Total         │ 1,234      │ 2.4M     │ $45.67  │ 100%   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Cost Trend (Line Chart)                                  │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  X-axis: Last 30 days                                     │ │
│  │  Y-axis: Cost ($)                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Budget Usage                                             │ │
│  │                                                           │ │
│  │  Monthly Budget: $100.00                                  │ │
│  │  Used: $45.67 (45.7%)                                     │ │
│  │  Remaining: $54.33                                        │ │
│  │                                                           │ │
│  │  ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  │                                                           │ │
│  │  Projected: $68.50 (based on current usage)               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Performance Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Performance Metrics                       [Last 30 days ▾]    │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Latency by Model                                         │ │
│  │                                                           │ │
│  │  Model         │ Avg Latency │ P95 Latency │ P99 Latency │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  GPT-4o        │ 145ms       │ 230ms       │ 450ms       │ │
│  │  Claude 3.5    │ 132ms       │ 210ms       │ 380ms       │ │
│  │  Gemini Pro    │ 234ms       │ 420ms       │ 650ms       │ │
│  │  Llama 3.1     │ 180ms       │ 320ms       │ 520ms       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Latency Distribution (Histogram)                         │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  │  ████████████████████████████████████████████████   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  X-axis: Latency (ms)                                     │ │
│  │  Y-axis: Request count                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Success Rate by Task Type                                │ │
│  │                                                           │ │
│  │  Rendering: 99.2%                                         │ │
│  │  Design: 98.8%                                            │ │
│  │  Preview: 97.5%                                           │ │
│  │  Analysis: 99.5%                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Errors Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Error Analysis                             [Last 30 days ▾]   │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Error Summary                                            │ │
│  │                                                           │ │
│  │  Total Errors: 18                                         │ │
│  │  Error Rate: 1.5%                                         │ │
│  │  Most Common: Rate limit exceeded (42%)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Error Breakdown                                          │ │
│  │                                                           │ │
│  │  Error Type            │ Count │ % Total │ Last Seen      │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Rate limit exceeded   │ 8     │ 44%     │ 2h ago         │ │
│  │  Timeout               │ 5     │ 28%     │ 1d ago         │ │
│  │  Invalid request       │ 3     │ 17%     │ 3d ago         │ │
│  │  Model unavailable     │ 2     │ 11%     │ 5d ago         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Recent Errors                                            │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  2h ago │ GPT-4o │ Rate limit exceeded              │  │ │
│  │  │  1d ago │ Gemini │ Timeout after 30s                │  │ │
│  │  │  3d ago │ Claude │ Invalid prompt format            │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  [View Full Error Log]                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. AI Templates (`/ai/templates`)

### 6.1 Template Categories

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Templates                                                  │
│─────────────────────────────────────────────────────────────────│
│  [Rendering Styles] [Design Prompts] [Custom Templates]        │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Rendering Styles                                         │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │  Modern     │  │  Classic    │  │  Minimalist │       │ │
│  │  │  ─────────  │  │  ─────────  │  │  ─────────  │       │ │
│  │  │  Photoreal  │  │  Traditional│  │  Clean      │       │ │
│  │  │  [Use]      │  │  [Use]      │  │  [Use]      │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │  Dramatic   │  │  Warm       │  │  Cool       │       │ │
│  │  │  ─────────  │  │  ─────────  │  │  ─────────  │       │ │
│  │  │  High Contr │  │  Cozy       │  │  Professional│      │ │
│  │  │  [Use]      │  │  [Use]      │  │  [Use]      │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Design Prompts                                           │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │  Space Plan │  │  Material   │  │  Lighting   │       │ │
│  │  │  ─────────  │  │  ─────────  │  │  ─────────  │       │ │
│  │  │  Layout     │  │  Palette    │  │  Design     │       │ │
│  │  │  [Use]      │  │  [Use]      │  │  [Use]      │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [+ Create Custom Template]                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Template Card Structure

```tsx
interface TemplateCardProps {
  id: string
  name: string
  description: string
  category: 'rendering' | 'design' | 'custom'
  previewImage?: string
  promptPreview: string
  onUse: (templateId: string) => void
  onEdit?: (templateId: string) => void
}
```

### 6.3 Create Custom Template Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Custom Template                                  [×]   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Template Name:    [________________]                          │
│  Description:      [________________]                          │
│  Category:         [Custom ▾]                                   │
│                                                                 │
│  Prompt Template:                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [________________]                                       │ │
│  │  [________________]                                       │ │
│  │  [________________]                                       │ │
│  │  [________________]                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Variables:                                                     │
│  • {subject} - Main subject of the render                      │
│  • {style} - Rendering style                                   │
│  • {lighting} - Lighting condition                             │
│                                                                 │
│                              [Cancel]  [Save Template]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. AI Integration Points

### 7.1 Project XR Settings Integration

When configuring XR settings for a project, users can select AI prompts:

```tsx
// In projects/[id]/xr/page.tsx
const XrSettingsPage = () => {
  return (
    <XrSettingsForm>
      <AiPromptSelect
        label="AI Rendering Prompt"
        category="rendering"
        onChange={handlePromptChange}
      />
      <AiModelSelect
        label="AI Model"
        onChange={handleModelChange}
      />
    </XrSettingsForm>
  )
}
```

### 7.2 Batch Processing Integration

AI prompts can be used for batch processing multiple models:

```tsx
// In models/batch-ai/page.tsx
const BatchAiPage = () => {
  return (
    <BatchProcessingForm>
      <AiPromptSelect
        label="Select AI Prompt"
        multiple={false}
      />
      <ModelList
        selectable={true}
        maxSelection={10}
      />
      <Button type="submit">
        Process {selectedModels.length} Models
      </Button>
    </BatchProcessingForm>
  )
}
```

### 7.3 Client Portal AI Access

Clients can view AI renders but not configure prompts:

```tsx
// In client portal - view only
const ClientAiView = () => {
  return (
    <AiRendersGallery
      projectId={projectId}
      readonly={true}
      showMetadata={true}
    />
  )
}
```

---

## Appendix: AI Component Specifications

### A.1 AiPromptSelect Component

```tsx
interface AiPromptSelectProps {
  label: string
  category?: 'rendering' | 'design' | 'all'
  value?: string
  onChange: (promptId: string) => void
  error?: string
  disabled?: boolean
}
```

### A.2 AiModelSelect Component

```tsx
interface AiModelSelectProps {
  label: string
  value?: string
  onChange: (modelId: string) => void
  showStatus?: boolean
  error?: string
}
```

### A.3 AiUsageChart Component

```tsx
interface AiUsageChartProps {
  data: UsageData[]
  timeRange: '7d' | '30d' | '90d'
  metrics: ('operations' | 'tokens' | 'cost' | 'latency')[]
}
```

### A.4 AiCostBreakdown Component

```tsx
interface AiCostBreakdownProps {
  costs: CostByModel[]
  totalBudget: number
  showProjection?: boolean
}
```

---

**End of VIZTR-AI-CONFIGURATION-UI-SPEC.md**
