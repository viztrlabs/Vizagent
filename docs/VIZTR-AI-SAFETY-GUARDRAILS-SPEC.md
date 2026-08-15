# VIZTR — AI Safety & Guardrails Page Specification

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Immediate Action - Required for Production AI

---

## Table of Contents

1. [Overview](#1-overview)
2. [AI Safety Hub (`/ai/safety`)](#2-ai-safety-hub-aisafety)
3. [Content Filtering](#3-content-filtering)
4. [Output Validation](#4-output-validation)
5. [Blocked Topics & Keywords](#5-blocked-topics-keywords)
6. [Compliance Rules](#6-compliance-rules)
7. [Audit Logging](#7-audit-logging)
8. [Safety Metrics Dashboard](#8-safety-metrics-dashboard)

---

## 1. Overview

The AI Safety & Guardrails page provides comprehensive controls to ensure all AI-generated content meets quality, compliance, and safety standards. This is **required for production AI** deployment.

### 1.1 Safety Layers

| Layer | Purpose | Implementation |
|-------|---------|----------------|
| **Input Filtering** | Prevent harmful prompts | Keyword blocking, prompt validation |
| **Output Validation** | Ensure safe outputs | Content scoring, topic detection |
| **Rate Limiting** | Prevent abuse | Per-user, per-agent limits |
| **Audit Logging** | Track all AI activity | Complete activity log |
| **Human Review** | Catch edge cases | Approval queue for sensitive content |

---

## 2. AI Safety Hub (`/ai/safety`)

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Safety & Guardrails                                         │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [Content Filter] [Validation] [Compliance] [Audit] │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Safety Status                                            │ │
│  │                                                           │ │
│  │  🟢 All Systems Operational                               │ │
│  │                                                           │ │
│  │  Content Filter: Active     │ Blocked Today: 23          │ │
│  │  Output Validation: Active  │ Flagged Today: 12          │ │
│  │  Rate Limiting: Active      │ Throttled Today: 8         │ │
│  │  Audit Logging: Active      │ Events Today: 1,234        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Recent Safety Events                                     │ │
│  │                                                           │ │
│  │  ⚠️ 14:32 │ Content blocked: Harmful language detected   │ │
│  │  ⚠️ 14:15 │ Output flagged: Potential bias detected      │ │
│  │  ✅ 14:10 │ Rate limit applied: User exceeded quota       │ │
│  │  ✅ 14:05 │ Audit log: Agent task completed               │ │
│  │  ⚠️ 13:58 │ Content blocked: Blocked topic detected      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Safety Metrics (Last 24 hours)                           │ │
│  │                                                           │ │
│  │  Total Requests: 12,345                                   │ │
│  │  Blocked: 23 (0.19%)                                      │ │
│  │  Flagged: 12 (0.10%)                                      │ │
│  │  Throttled: 8 (0.06%)                                     │ │
│  │  Passed: 12,302 (99.65%)                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Content Filtering

### 3.1 Content Filter Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│  Content Filtering Configuration                               │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Filter Settings                                          │ │
│  │                                                           │ │
│  │  Content Filter:        [██████████] Enabled              │ │
│  │  Strict Mode:           [          ] Disabled             │ │
│  │  Block Harassment:      [██████████] Enabled              │ │
│  │  Block Hate Speech:     [██████████] Enabled              │ │
│  │  Block Violence:        [██████████] Enabled              │ │
│  │  Block Sexual Content:  [██████████] Enabled              │ │
│  │  Block Self-Harm:       [██████████] Enabled              │ │
│  │  Block Spam:            [██████████] Enabled              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Sensitivity Levels                                       │ │
│  │                                                           │ │
│  │  Low:     Only block clearly harmful content              │ │
│  │  Medium:  Block potentially harmful content (default)     │ │
│  │  High:    Block any questionable content                  │ │
│  │                                                           │ │
│  │  Current Level: [Medium ▾]                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Custom Filter Rules                                      │ │
│  │                                                           │ │
│  │  Rule 1: Block competitor names in AI output              │ │
│  │  Rule 2: Block personal information (PII)                 │ │
│  │  Rule 3: Block financial advice                           │ │
│  │  Rule 4: Block medical advice                             │ │
│  │                                                           │ │
│  │  [+ Add Custom Rule]                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Save Configuration]              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Content Filter Structure

```tsx
interface ContentFilterConfig {
  enabled: boolean
  strictMode: boolean
  
  // Category Filters
  categories: {
    harassment: boolean
    hateSpeech: boolean
    violence: boolean
    sexualContent: boolean
    selfHarm: boolean
    spam: boolean
    pii: boolean
    financialAdvice: boolean
    medicalAdvice: boolean
  }
  
  // Sensitivity
  sensitivityLevel: 'low' | 'medium' | 'high'
  
  // Custom Rules
  customRules: FilterRule[]
}

interface FilterRule {
  id: string
  name: string
  pattern: string
  action: 'block' | 'flag' | 'replace'
  replacement?: string
  enabled: boolean
}
```

---

## 4. Output Validation

### 4.1 Output Validation Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  Output Validation Rules                                       │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Quality Checks                                           │ │
│  │                                                           │ │
│  │  ☑ Minimum length: 100 characters                        │ │
│  │  ☑ Maximum length: 10,000 characters                     │ │
│  │  ☑ No repetition check                                   │ │
│  │  ☑ Coherence check                                       │ │
│  │  ☑ Relevance check                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Bias Detection                                           │ │
│  │                                                           │ │
│  │  ☑ Gender bias detection                                 │ │
│  │  ☑ Racial bias detection                                 │ │
│  │  ☑ Age bias detection                                    │ │
│  │  ☑ Socioeconomic bias detection                          │ │
│  │  ☑ Geographic bias detection                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Factual Accuracy                                         │ │
│  │                                                           │ │
│  │  ☑ Citation verification                                 │ │
│  │  ☑ Data accuracy check                                   │ │
│  │  ☑ Technical specification validation                    │ │
│  │  ☑ Price/quote accuracy                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Brand Compliance                                         │ │
│  │                                                           │ │
│  │  ☑ Tone consistency                                      │ │
│  │  ☑ Terminology adherence                                 │ │
│  │  ☑ Competitor mention blocking                           │ │
│  │  ☑ Legal disclaimer inclusion                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Validation Actions                                       │ │
│  │                                                           │ │
│  │  On Failure: [Flag for Review ▾]                          │ │
│  │                                                           │ │
│  │  Options:                                                 │ │
│  │  • Flag for human review                                 │ │
│  │  • Auto-reject and regenerate                            │ │
│  │  • Log and allow                                        │ │
│  │  • Block and notify                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Save Configuration]              │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Validation Structure

```tsx
interface OutputValidationConfig {
  qualityChecks: {
    minLength: number
    maxLength: number
    repetitionCheck: boolean
    coherenceCheck: boolean
    relevanceCheck: boolean
  }
  
  biasDetection: {
    gender: boolean
    racial: boolean
    age: boolean
    socioeconomic: boolean
    geographic: boolean
  }
  
  factualAccuracy: {
    citationVerification: boolean
    dataAccuracy: boolean
    technicalSpecs: boolean
    pricingAccuracy: boolean
  }
  
  brandCompliance: {
    toneConsistency: boolean
    terminologyAdherence: boolean
    competitorBlocking: boolean
    legalDisclaimers: boolean
  }
  
  onFailure: 'flag' | 'reject' | 'log' | 'block'
}
```

---

## 5. Blocked Topics & Keywords

### 5.1 Blocked Topics Management

```
┌─────────────────────────────────────────────────────────────────┐
│  Blocked Topics & Keywords                      [+ Add Block]  │
│─────────────────────────────────────────────────────────────────│
│  [Topics] [Keywords] [Patterns] [Whitelist]                   │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Blocked Topics                                           │ │
│  │                                                           │ │
│  │  ☑ Politics and government                                │ │
│  │  ☑ Religious content                                      │ │
│  │  ☑ Adult/sexual content                                   │ │
│  │  ☑ Violence and gore                                     │ │
│  │  ☑ Drug use                                               │ │
│  │  ☑ Weapons                                               │ │
│  │  ☑ Competitor names                                      │ │
│  │  ☑ Illegal activities                                    │ │
│  │                                                           │ │
│  │  [+ Add Custom Topic]                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Blocked Keywords                                         │ │
│  │                                                           │ │
│  │  Keyword          │ Category    │ Action    │ Added       │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  competitor1      │ Brand       │ Block     │ 2026-07-01  │ │
│  │  competitor2      │ Brand       │ Block     │ 2026-07-01  │ │
│  │  hate speech term │ Safety      │ Block     │ 2026-07-15  │ │
│  │  profanity word   │ Safety      │ Replace   │ 2026-07-15  │ │
│  │                                                           │ │
│  │  [+ Add Keyword]                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Regex Patterns                                           │ │
│  │                                                           │ │
│  │  Pattern                    │ Action    │ Description    │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  \b\d{3}-\d{2}-\d{4}\b     │ Block     │ SSN pattern    │ │
│  │  \b\d{16}\b                 │ Block     │ Credit card    │ │
│  │  \b[A-Za-z0-9._%+-]+@...   │ Flag      │ Email pattern  │ │
│  │                                                           │ │
│  │  [+ Add Pattern]                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Whitelist (Override Blocks)                              │ │
│  │                                                           │ │
│  │  Term               │ Reason                             │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  "architecture"     │ Contains "arch" - safe term        │ │
│  │  "design"           │ Safe term                          │ │
│  │                                                           │ │
│  │  [+ Add to Whitelist]                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Compliance Rules

### 6.1 Compliance Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│  Compliance Rules                                              │
│─────────────────────────────────────────────────────────────────│
│  [GDPR] [CCPA] [Industry] [Custom]                           │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  GDPR Compliance                                          │ │
│  │                                                           │ │
│  │  ☑ Data minimization                                     │ │
│  │  ☑ Right to erasure support                              │ │
│  │  ☑ Consent management                                    │ │
│  │  ☑ Data portability                                      │ │
│  │  ☑ Privacy by design                                     │ │
│  │                                                           │ │
│  │  Data Retention: [90 days ▾]                              │ │
│  │  Auto-delete PII: [██████████] Enabled                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CCPA Compliance                                          │ │
│  │                                                           │ │
│  │  ☑ Do Not Sell My Data                                   │ │
│  │  ☑ Opt-out of data sharing                               │ │
│  │  ☑ Data access requests                                  │ │
│  │  ☑ Data deletion requests                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Industry Compliance                                      │ │
│  │                                                           │ │
│  │  Architecture Standards:                                  │ │
│  │  ☑ AIA compliance                                        │ │
│  │  ☑ RIBA guidelines                                       │ │
│  │  ☑ Building code references                              │ │
│  │                                                           │ │
│  │  Data Security:                                           │ │
│  │  ☑ SOC 2 Type II                                         │ │
│  │  ☑ ISO 27001                                             │ │
│  │  ☑ HIPAA (if applicable)                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Custom Compliance Rules                                  │ │
│  │                                                           │ │
│  │  Rule 1: All quotes must include disclaimer               │ │
│  │  Rule 2: Technical specs must be verified                 │ │
│  │  Rule 3: Client names must be authorized                  │ │
│  │                                                           │ │
│  │  [+ Add Custom Rule]                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Save Configuration]              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Audit Logging

### 7.1 Audit Log Viewer

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Audit Log                                    [Export CSV]   │
│─────────────────────────────────────────────────────────────────│
│  [All] [Content] [Validation] [Safety] [Compliance]           │
│  [Date Range] [User] [Agent] [Search...]                     │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Audit Entries                                            │ │
│  │                                                           │ │
│  │  14:32:15 │ Content    │ Copywriter │ Blog post generated│ │
│  │  14:32:16 │ Validation │ Copywriter │ Quality: 95%      │ │
│  │  14:30:00 │ Safety     │ System     │ Content blocked    │ │
│  │  14:25:00 │ Compliance │ 3D Modeler │ Specs verified    │ │
│  │  14:20:00 │ Content    │ SEO        │ Keywords optimized│ │
│  │  14:15:00 │ Safety     │ System     │ Rate limit applied│ │
│  │  14:10:00 │ Validation │ Interior   │ Bias check passed │ │
│  │  14:05:00 │ Content    │ Social     │ Posts generated   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Entry Details                                            │ │
│  │                                                           │ │
│  │  Event ID: evt_abc123                                     │ │
│  │  Timestamp: 2026-08-05 14:32:15                           │ │
│  │  Type: Content Generation                                 │ │
│  │  Agent: Copywriter                                        │ │
│  │  User: john@archvizstudio.com                             │ │
│  │  Task ID: task_xyz789                                     │ │
│  │                                                           │ │
│  │  Input Summary:                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Write blog post about Modern Villa project...       │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  Output Summary:                                          │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Generated 1,234 tokens of content                    │  │ │
│  │  │ Quality Score: 95%                                   │  │ │
│  │  │ Bias Score: 0%                                       │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  Metadata:                                                │ │
│  │  • Model: GPT-4o                                         │ │
│  │  • Tokens: 1,234                                         │ │
│  │  • Latency: 32s                                          │ │
│  │  • Cost: $0.023                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Pagination                                               │ │
│  │  Showing 1-100 of 12,345 entries                          │ │
│  │  < 1 2 3 4 5 ... 124 >                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Audit Log Structure

```tsx
interface AuditLogEntry {
  id: string
  timestamp: string
  type: 'content' | 'validation' | 'safety' | 'compliance' | 'system'
  agent: string
  user: string
  taskId: string
  action: string
  result: 'success' | 'blocked' | 'flagged' | 'error'
  details: {
    input?: string
    output?: string
    metrics?: {
      tokens?: number
      latency?: number
      cost?: number
      qualityScore?: number
      biasScore?: number
    }
    metadata?: Record<string, any>
  }
  ipAddress?: string
  userAgent?: string
}
```

---

## 8. Safety Metrics Dashboard

### 8.1 Safety Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│  Safety Analytics                             [Last 7 days ▾]  │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Safety Score                                             │ │
│  │                                                           │ │
│  │  Overall Score: 98.5/100                                  │ │
│  │  ████████████████████████████████████████░░░░░░░░░░░░░░░  │ │
│  │                                                           │ │
│  │  Content Safety: 99.2%                                    │ │
│  │  Output Quality: 97.8%                                    │ │
│  │  Compliance: 98.5%                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Blocked Content Breakdown                                │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Pie Chart                                          │  │ │
│  │  │  Harassment: 15%                                    │  │ │
│  │  │  Hate Speech: 10%                                   │  │ │
│  │  │  Violence: 20%                                      │  │ │
│  │  │  Sexual Content: 25%                                │  │ │
│  │  │  PII: 15%                                           │  │ │
│  │  │  Other: 15%                                         │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Validation Failures Over Time                            │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Line Chart: Failures per day                       │  │ │
│  │  │  Aug 1: 12  │ Aug 2: 8   │ Aug 3: 15              │  │ │
│  │  │  Aug 4: 10  │ Aug 5: 5   │                         │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Top Flagged Content Types                                │ │
│  │                                                           │ │
│  │  Type              │ Count │ % Total │ Trend             │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Bias Detection    │ 45    │ 35%     │ -12% ↓           │ │
│  │  Quality Issues    │ 32    │ 25%     │ -8% ↓            │ │
│  │  Factual Errors    │ 28    │ 22%     │ +5% ↑            │ │
│  │  Brand Violations  │ 23    │ 18%     │ -15% ↓           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Safety Components

### A.1 ContentFilterConfig Component

```tsx
interface ContentFilterConfigProps {
  config: ContentFilterConfig
  onChange: (config: ContentFilterConfig) => void
  onSave: () => Promise<void>
}
```

### A.2 OutputValidationConfig Component

```tsx
interface OutputValidationConfigProps {
  config: OutputValidationConfig
  onChange: (config: OutputValidationConfig) => void
  onSave: () => Promise<void>
}
```

### A.3 BlockedTopicsManager Component

```tsx
interface BlockedTopicsManagerProps {
  topics: string[]
  keywords: BlockedKeyword[]
  patterns: BlockedPattern[]
  whitelist: string[]
  onUpdate: (updates: BlockedTopicsUpdate) => void
}
```

### A.4 AuditLogViewer Component

```tsx
interface AuditLogViewerProps {
  entries: AuditLogEntry[]
  filters: AuditLogFilters
  onFilterChange: (filters: AuditLogFilters) => void
  onExport: (format: 'csv' | 'json') => void
  pagination: PaginationProps
}
```

### A.5 SafetyMetricsDashboard Component

```tsx
interface SafetyMetricsDashboardProps {
  metrics: SafetyMetrics
  timeRange: '24h' | '7d' | '30d' | '90d'
  onTimeRangeChange: (range: string) => void
}
```

---

**End of VIZTR-AI-SAFETY-GUARDRAILS-SPEC.md**
