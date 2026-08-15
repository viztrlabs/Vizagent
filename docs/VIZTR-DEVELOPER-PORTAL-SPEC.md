# VIZTR — Developer Portal Specification

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Act Mode — UI Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Developer Hub (`/developer`)](#2-developer-hub-developer)
3. [API Key Management (`/developer/api-keys`)](#3-api-key-management-developerapi-keys)
4. [Webhook Configuration (`/developer/webhooks`)](#4-webhook-configuration-developerwebhooks)
5. [API Documentation Viewer (`/developer/docs`)](#5-api-documentation-viewer-developerdocs)
6. [API Reference](#6-api-reference)
7. [Webhook Events](#7-webhook-events)
8. [Security Considerations](#8-security-considerations)

---

## 1. Overview

The Developer Portal provides agency developers with tools to integrate with the VizTR platform:

- **API Keys:** Create and manage API keys for authentication
- **Webhooks:** Configure real-time event notifications
- **API Docs:** Interactive API documentation with code examples

### 1.1 Access Control

| Role | Access |
|------|--------|
| Superadmin | Full access to all developer features |
| Admin | Full access to developer features |
| Editor | Read-only access to API docs |
| Viewer | No access |
| Client | No access |

---

## 2. Developer Hub (`/developer`)

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Developer Portal                                              │
│─────────────────────────────────────────────────────────────────│
│  [Overview] [API Keys] [Webhooks] [Docs]                      │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Welcome to the Developer Portal                          │ │
│  │                                                           │ │
│  │  Integrate with VizTR using our REST API and webhooks.    │ │
│  │  Manage API keys, configure webhooks, and explore docs.   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  Quick Start          │  │  API Status           │           │
│  │                       │  │                       │           │
│  │  1. Create API Key    │  │  🟢 All Systems       │           │
│  │  2. Make First Call   │  │  Uptime: 99.98%       │           │
│  │  3. Setup Webhooks    │  │  Latency: 145ms       │           │
│  │                       │  │                       │           │
│  │  [Get Started →]     │  │  [View Status →]      │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Recent API Activity                                      │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  GET /api/v1/projects     │ 200 OK   │ 2h ago       │  │ │
│  │  │  POST /api/v1/models      │ 201 Created │ 3h ago    │  │ │
│  │  │  GET /api/v1/clients      │ 200 OK   │ 5h ago       │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  [View Full Activity Log →]                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Popular Endpoints                                        │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │  Projects   │  │  Models     │  │  Clients    │       │ │
│  │  │  [Docs →]   │  │  [Docs →]   │  │  [Docs →]   │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. API Key Management (`/developer/api-keys`)

### 3.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  API Keys                                    [+ Create API Key] │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Your API Keys                                            │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  🔑 Production Key                                  │  │ │
│  │  │     Prefix: vtz_prod_xxxxxxxxxxxx                   │  │ │
│  │  │     Created: 2026-07-15                             │  │ │
│  │  │     Last Used: 2h ago                               │  │ │
│  │  │     Scopes: read, write                             │  │ │
│  │  │     [View]  [Regenerate]  [Revoke]                  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  🔑 Development Key                                 │  │ │
│  │  │     Prefix: vtz_dev_xxxxxxxxxxxxx                   │  │ │
│  │  │     Created: 2026-06-01                             │  │ │
│  │  │     Last Used: 5d ago                               │  │ │
│  │  │     Scopes: read                                   │  │ │
│  │  │     [View]  [Regenerate]  [Revoke]                  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Usage This Month                                     │ │
│  │                                                           │ │
│  │  Requests: 12,456                                         │ │
│  │  Rate Limit: 1,000/hour                                   │ │
│  │  Remaining: 854/hour                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Create API Key Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Create API Key                                          [×]   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Key Name:         [________________]                          │
│  Description:      [________________]                          │
│  Environment:      [Production ▾]                               │
│                                                                 │
│  Scopes:                                                        │
│  ☑ Read (GET requests)                                         │
│  ☑ Write (POST, PUT, DELETE requests)                          │
│  ☐ Admin (Full access)                                         │
│                                                                 │
│  Rate Limit:    [1000 requests/hour_]                          │
│  Expires:       [Never ▾]                                      │
│                                                                 │
│  ⚠️ The API key will only be shown once. Please save it.       │
│                                                                 │
│                              [Cancel]  [Create Key]            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 API Key Structure

```tsx
interface ApiKey {
  id: string
  name: string
  prefix: string
  scopes: ApiScope[]
  environment: 'production' | 'development'
  rateLimit: number
  expiresAt?: string
  lastUsedAt?: string
  createdAt: string
  createdBy: string
}

type ApiScope = 'read' | 'write' | 'admin'
```

### 3.4 API Key Display

```
┌─────────────────────────────────────────────────────────────────┐
│  API Key Created Successfully                                  │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ⚠️ IMPORTANT: Save this key now. You won't be able to see it  │
│  again.                                                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  vtz_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Copy to Clipboard]                                           │
│                                                                 │
│  Usage Example:                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  curl -H "Authorization: Bearer vtz_prod_..." \          │ │
│  │       https://api.viztr.io/api/v1/projects                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [I've saved my key]               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Webhook Configuration (`/developer/webhooks`)

### 4.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Webhooks                                   [+ Add Webhook]     │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Active Webhooks                                          │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  🔔 Project Updates                                 │  │ │
│  │  │     URL: https://myapp.com/webhooks/viztr           │  │ │
│  │  │     Events: project.created, project.updated        │  │ │
│  │  │     Status: Active                                   │  │ │
│  │  │     Last Triggered: 2h ago                          │  │ │
│  │  │     Success Rate: 99.5%                             │  │ │
│  │  │     [Edit]  [Test]  [View Logs]  [Delete]           │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  🔔 Invoice Events                                  │  │ │
│  │  │     URL: https://myapp.com/webhooks/invoices        │  │ │
│  │  │     Events: invoice.created, payment.received       │  │ │
│  │  │     Status: Active                                   │  │ │
│  │  │     Last Triggered: 1d ago                          │  │ │
│  │  │     Success Rate: 100%                              │  │ │
│  │  │     [Edit]  [Test]  [View Logs]  [Delete]           │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Webhook Statistics (Last 30 days)                        │ │
│  │                                                           │ │
│  │  Total Events: 1,234                                     │ │
│  │  Successful: 1,228 (99.5%)                               │ │
│  │  Failed: 6 (0.5%)                                        │ │
│  │  Avg Response Time: 245ms                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Create/Edit Webhook Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Add Webhook                                             [×]   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Webhook Name:     [________________]                          │
│  Endpoint URL:     [https://myapp.com/webhooks/viztr_]         │
│  Description:      [________________]                          │
│                                                                 │
│  Events:                                                        │
│  ☑ project.created                                            │
│  ☑ project.updated                                            │
│  ☑ project.completed                                          │
│  ☑ invoice.created                                            │
│  ☑ invoice.paid                                               │
│  ☐ client.created                                             │
│  ☐ model.uploaded                                             │
│  ☐ render.completed                                           │
│                                                                 │
│  Secret:          [________________] [Generate]                │
│  (Used to verify webhook signatures)                           │
│                                                                 │
│  Retry Policy:                                                  │
│  Max Retries:     [3]                                          │
│  Retry Interval:  [60 seconds ▾]                               │
│                                                                 │
│  Status:           [██████████] Active                         │
│                                                                 │
│                              [Cancel]  [Save Webhook]          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Webhook Payload Structure

```tsx
interface WebhookPayload {
  id: string
  event: string
  timestamp: string
  data: Record<string, any>
  signature: string
}

// Example payload
{
  "id": "evt_1234567890",
  "event": "project.created",
  "timestamp": "2026-08-05T14:30:00Z",
  "data": {
    "projectId": "proj_abc123",
    "name": "Modern Villa",
    "clientId": "client_xyz789",
    "status": "DRAFT"
  },
  "signature": "sha256=..."
}
```

### 4.4 Webhook Verification

```tsx
// Verification example in Node.js
import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  )
}
```

### 4.5 Webhook Logs View

```
┌─────────────────────────────────────────────────────────────────┐
│  Webhook Logs: Project Updates                    [← Back]     │
│─────────────────────────────────────────────────────────────────│
│  [All] [Success] [Failed] [Retrying]                          │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Timestamp        │ Event              │ Status │ Duration│ │
│  │────────────────────────────────────────────────────────────│ │
│  │  2026-08-05 14:30 │ project.created    │ ✅ 200  │ 245ms  │ │
│  │  2026-08-05 12:15 │ project.updated    │ ✅ 200  │ 189ms  │ │
│  │  2026-08-05 10:00 │ project.completed  │ ❌ 500  │ 5000ms │ │
│  │  2026-08-05 10:00 │ project.completed  │ 🔄 200  │ 312ms  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Request Details                                          │ │
│  │                                                           │ │
│  │  Event: project.created                                   │ │
│  │  Timestamp: 2026-08-05T14:30:00Z                         │ │
│  │                                                           │ │
│  │  Request Headers:                                         │ │
│  │  Content-Type: application/json                          │ │
│  │  X-Webhook-Signature: sha256=...                         │ │
│  │                                                           │ │
│  │  Request Body:                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ {                                                    │  │ │
│  │  │   "event": "project.created",                       │  │ │
│  │  │   "data": { ... }                                    │  │ │
│  │  │ }                                                    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  Response:                                                │ │
│  │  Status: 200 OK                                           │ │
│  │  Body: {"received": true}                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. API Documentation Viewer (`/developer/docs`)

### 5.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  API Documentation                                              │
│─────────────────────────────────────────────────────────────────│
│  [Authentication] [Projects] [Models] [Clients] [Invoices]    │
│  [Bookings] [Messages] [Files] [Webhooks] [Errors]            │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Sidebar Navigation                                       │ │
│  │                                                           │ │
│  │  ▼ Authentication                                         │ │
│  │    • Overview                                             │ │
│  │    • API Keys                                             │ │
│  │    • OAuth 2.0                                            │ │
│  │                                                           │ │
│  │  ▼ Projects                                               │ │
│  │    • List Projects                                        │ │
│  │    • Get Project                                          │ │
│  │    • Create Project                                       │ │
│  │    • Update Project                                       │ │
│  │    • Delete Project                                       │ │
│  │                                                           │ │
│  │  ▼ Models                                                 │ │
│  │    • List Models                                          │ │
│  │    • Upload Model                                         │ │
│  │    • Get Model                                            │ │
│  │    • Delete Model                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Reference Content                                    │ │
│  │                                                           │ │
│  │  # List Projects                                         │ │
│  │                                                           │ │
│  │  `GET /api/v1/projects`                                  │ │
│  │                                                           │ │
│  │  Returns a paginated list of projects for the agency.     │ │
│  │                                                           │ │
│  │  ## Query Parameters                                     │ │
│  │                                                           │ │
│  │  | Parameter | Type   | Required | Description          | │
│  │  |-----------|--------|----------|----------------------│ │
│  │  | page      | number | No       | Page number (1-100)  │ │
│  │  | limit     | number | No       | Items per page (1-50)│ │
│  │  | status    | string | No       | Filter by status     │ │
│  │  | search    | string | No       | Search by name       │ │
│  │                                                           │ │
│  │  ## Response                                             │ │
│  │                                                           │ │
│  │  ```json                                                  │ │
│  │  {                                                       │ │
│  │    "data": [                                             │ │
│  │      {                                                   │ │
│  │        "id": "proj_abc123",                             │ │
│  │        "name": "Modern Villa",                          │ │
│  │        "status": "ACTIVE",                              │ │
│  │        "createdAt": "2026-07-15T10:00:00Z"             │ │
│  │      }                                                   │ │
│  │    ],                                                    │ │
│  │    "pagination": {                                       │ │
│  │      "page": 1,                                          │ │
│  │      "limit": 10,                                        │ │
│  │      "total": 42                                         │ │
│  │    }                                                     │ │
│  │  }                                                       │ │
│  │  ```                                                     │ │
│  │                                                           │ │
│  │  ## Code Examples                                        │ │
│  │                                                           │ │
│  │  ### cURL                                               │ │
│  │  ```bash                                                 │ │
│  │  curl -H "Authorization: Bearer vtz_prod_..." \         │ │
│  │       https://api.viztr.io/api/v1/projects               │ │
│  │  ```                                                     │ │
│  │                                                           │ │
│  │  ### JavaScript                                         │ │
│  │  ```javascript                                          │ │
│  │  const response = await fetch(                           │ │
│  │    'https://api.viztr.io/api/v1/projects',              │ │
│  │    {                                                     │ │
│  │      headers: {                                          │ │
│  │        'Authorization': 'Bearer vtz_prod_...'           │ │
│  │      }                                                   │ │
│  │    }                                                     │ │
│  │  )                                                       │ │
│  │  const data = await response.json()                      │ │
│  │  ```                                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Interactive API Console

```
┌─────────────────────────────────────────────────────────────────┐
│  API Console                                                   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Method: [GET ▾]  URL: [/api/v1/projects_________]  [Send]    │
│                                                                 │
│  Headers:                                                       │
│  Authorization: [Bearer vtz_prod_...________________]          │
│  Content-Type:  [application/json___________________]          │
│                                                                 │
│  Query Parameters:                                              │
│  page:   [1________________]                                   │
│  limit:  [10________________]                                  │
│  status: [ACTIVE____________]                                  │
│                                                                 │
│  Response:                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Status: 200 OK (245ms)                                  │ │
│  │                                                           │ │
│  │  {                                                       │ │
│  │    "data": [...],                                        │ │
│  │    "pagination": {...}                                   │ │
│  │  }                                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. API Reference

### 6.1 Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/token` | POST | Get access token |
| `/api/v1/auth/refresh` | POST | Refresh access token |

### 6.2 Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/projects` | GET | List projects |
| `/api/v1/projects/:id` | GET | Get project |
| `/api/v1/projects` | POST | Create project |
| `/api/v1/projects/:id` | PUT | Update project |
| `/api/v1/projects/:id` | DELETE | Delete project |
| `/api/v1/projects/:id/models` | GET | Get project models |
| `/api/v1/projects/:id/xr` | GET | Get XR settings |
| `/api/v1/projects/:id/xr` | PUT | Update XR settings |

### 6.3 Models

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/models` | GET | List models |
| `/api/v1/models/:id` | GET | Get model |
| `/api/v1/models` | POST | Upload model |
| `/api/v1/models/:id` | DELETE | Delete model |
| `/api/v1/models/:id/versions` | GET | List versions |

### 6.4 Clients

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/clients` | GET | List clients |
| `/api/v1/clients/:id` | GET | Get client |
| `/api/v1/clients` | POST | Create client |
| `/api/v1/clients/:id` | PUT | Update client |
| `/api/v1/clients/:id` | DELETE | Delete client |

### 6.5 Invoices

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/invoices` | GET | List invoices |
| `/api/v1/invoices/:id` | GET | Get invoice |
| `/api/v1/invoices` | POST | Create invoice |
| `/api/v1/invoices/:id/send` | POST | Send invoice |
| `/api/v1/invoices/:id/pay` | POST | Record payment |

### 6.6 Bookings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/bookings` | GET | List bookings |
| `/api/v1/bookings/:id` | GET | Get booking |
| `/api/v1/bookings` | POST | Create booking |
| `/api/v1/bookings/:id` | PUT | Update booking |
| `/api/v1/bookings/:id/cancel` | POST | Cancel booking |

### 6.7 Messages

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/messages` | GET | List messages |
| `/api/v1/messages/:id` | GET | Get message |
| `/api/v1/messages` | POST | Send message |
| `/api/v1/messages/:id/read` | POST | Mark as read |

### 6.8 Files

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/files` | GET | List files |
| `/api/v1/files/:id` | GET | Get file |
| `/api/v1/files/upload` | POST | Upload file |
| `/api/v1/files/:id` | DELETE | Delete file |
| `/api/v1/files/:id/download` | GET | Download file |

### 6.9 Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/webhooks` | GET | List webhooks |
| `/api/v1/webhooks/:id` | GET | Get webhook |
| `/api/v1/webhooks` | POST | Create webhook |
| `/api/v1/webhooks/:id` | PUT | Update webhook |
| `/api/v1/webhooks/:id` | DELETE | Delete webhook |
| `/api/v1/webhooks/:id/test` | POST | Test webhook |
| `/api/v1/webhooks/:id/logs` | GET | Get webhook logs |

---

## 7. Webhook Events

### 7.1 Event Types

| Event | Description |
|-------|-------------|
| `project.created` | New project created |
| `project.updated` | Project updated |
| `project.completed` | Project marked as completed |
| `project.deleted` | Project deleted |
| `model.uploaded` | New model uploaded |
| `model.processed` | Model processing completed |
| `model.deleted` | Model deleted |
| `client.created` | New client created |
| `client.updated` | Client updated |
| `client.deleted` | Client deleted |
| `invoice.created` | New invoice created |
| `invoice.sent` | Invoice sent to client |
| `invoice.paid` | Invoice payment received |
| `invoice.overdue` | Invoice overdue |
| `booking.created` | New booking created |
| `booking.confirmed` | Booking confirmed |
| `booking.cancelled` | Booking cancelled |
| `render.completed` | AI render completed |
| `render.failed` | AI render failed |
| `message.received` | New message received |

### 7.2 Event Payloads

```tsx
// Project Created
interface ProjectCreatedEvent {
  event: 'project.created'
  data: {
    projectId: string
    name: string
    clientId: string
    status: 'DRAFT'
    createdAt: string
  }
}

// Invoice Paid
interface InvoicePaidEvent {
  event: 'invoice.paid'
  data: {
    invoiceId: string
    projectId: string
    clientId: string
    amount: number
    currency: string
    paidAt: string
  }
}

// Render Completed
interface RenderCompletedEvent {
  event: 'render.completed'
  data: {
    renderId: string
    projectId: string
    modelId: string
    promptId: string
    outputUrl: string
    tokensUsed: number
    completedAt: string
  }
}
```

---

## 8. Security Considerations

### 8.1 API Key Security

| Practice | Description |
|----------|-------------|
| Secure Storage | Store API keys in environment variables |
| Key Rotation | Rotate keys regularly (every 90 days) |
| Least Privilege | Use minimum required scopes |
| Monitor Usage | Review API usage logs regularly |
| Revoke Unused | Revoke keys no longer in use |

### 8.2 Webhook Security

| Practice | Description |
|----------|-------------|
| HTTPS Only | Use HTTPS endpoints only |
| Verify Signatures | Always verify webhook signatures |
| Validate Payloads | Validate payload structure |
| Rate Limiting | Implement rate limiting on your endpoint |
| Idempotency | Handle duplicate events gracefully |

### 8.3 Rate Limits

| Tier | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Free | 100 | 1,000 |
| Pro | 1,000 | 10,000 |
| Enterprise | 10,000 | 100,000 |

---

## Appendix: Developer Components

### A.1 ApiKeyCard Component

```tsx
interface ApiKeyCardProps {
  apiKey: ApiKey
  onView: (id: string) => void
  onRegenerate: (id: string) => void
  onRevoke: (id: string) => void
}
```

### A.2 WebhookCard Component

```tsx
interface WebhookCardProps {
  webhook: Webhook
  onEdit: (id: string) => void
  onTest: (id: string) => void
  onViewLogs: (id: string) => void
  onDelete: (id: string) => void
}
```

### A.3 ApiDocsSidebar Component

```tsx
interface ApiDocsSidebarProps {
  sections: ApiDocSection[]
  activeSection: string
  onNavigate: (sectionId: string) => void
}

interface ApiDocSection {
  id: string
  title: string
  children?: ApiDocSection[]
}
```

### A.4 ApiConsole Component

```tsx
interface ApiConsoleProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  headers: Record<string, string>
  body?: string
  onSend: (request: ApiRequest) => Promise<ApiResponse>
}
```

---

**End of VIZTR-DEVELOPER-PORTAL-SPEC.md**
