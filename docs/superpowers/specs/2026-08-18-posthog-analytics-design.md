# PostHog Analytics Design Spec

**Date:** 2026-08-18
**Status:** Implemented

## Overview

Self-hosted PostHog analytics for VizTR with server-side event tracking, consent gating, and privacy-first design.

## Architecture

```
Client (useAnalytics hook)
  -> POST /api/track (validates consent cookie, event name, enriches with auth)
    -> PostHog Node SDK (server-side capture with batching)
      -> Self-hosted PostHog instance (Docker Compose)
```

## Consent Model

- Client reads `viztr-cookie-consent` from localStorage
- Only sends events when consent = `'accepted'`
- Server validates consent via `viztr-cookie-consent` cookie (set by proxy.ts)
- Unauthenticated requests to `/api/track` return 401

## Events (12 P1)

### Authentication (3)
| Event | Trigger | Properties |
|-------|---------|------------|
| `signup_started` | User clicks "Sign up" | method, referrer |
| `signup_completed` | Account created | method |
| `signup_failed` | Auth error | error_code, method |

### Onboarding (2)
| Event | Trigger | Properties |
|-------|---------|------------|
| `onboarding_step_completed` | Step completed | step, step_name |
| `onboarding_completed` | All steps done | duration_ms, steps_completed |

### Core Actions (2)
| Event | Trigger | Properties |
|-------|---------|------------|
| `asset_uploaded` | Upload complete | asset_id, asset_type, file_size_mb |
| `deployment_published` | Deploy succeeds | deployment_id, project_id, xr_mode |

### Monetization (4)
| Event | Trigger | Properties |
|-------|---------|------------|
| `checkout_started` | Stripe checkout created | plan_id, amount, currency |
| `checkout_completed` | Stripe webhook received | plan_id, amount, currency, subscription_id |
| `subscription_changed` | Subscription updated | plan_id, previous_plan_id, subscription_id, change_type |
| `payment_failed` | Invoice payment failed | error_code, invoice_id |

### Error (1)
| Event | Trigger | Properties |
|-------|---------|------------|
| `login_failed` | Sign-in error | reason |

## Server-Enriched Properties

All events automatically include: user_id, tenant_id, session_id, $lib, $lib_version.

## Privacy

- No PII in event properties (email, names excluded)
- PostHog configured with `POSTHOG_DISABLE_GEOIP=1`, `POSTHOG_DISABLE_SESSION_RECORDING=1`
- User identified only by internal UUID, not email
- Session ID from `viztr-session-id` cookie (random UUID)