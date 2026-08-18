# PostHog Analytics Implementation Plan

**Date:** 2026-08-18
**Spec:** `docs/superpowers/specs/2026-08-18-posthog-analytics-design.md`
**Status:** Complete

## Tasks

### Core Library (Tasks 1-5)

- [x] **Task 1:** Install `posthog-node` and create `lib/analytics/server.ts` wrapper with batch config
- [x] **Task 2:** Create `lib/analytics/client.ts` with `useAnalytics()` hook (consent-gated)
- [x] **Task 3:** Create `app/api/track/route.ts` POST endpoint with auth enrichment
- [x] **Task 4:** Update `proxy.ts` with `X-Analytics-Consent` header
- [x] **Task 5:** Add `docker-compose.posthog.yml` for self-hosted deployment

### Instrumentation (Tasks 6-9)

- [x] **Task 6:** Instrument `SignUpForm.tsx` with signup_started/completed/failed
- [x] **Task 7:** Create `OnboardingWizard` with onboarding_step_completed/completed
- [x] **Task 8:** Instrument asset upload and deployment publish routes
- [x] **Task 9:** Instrument Stripe checkout and webhook routes

### Verification (Tasks 10-12)

- [x] **Task 10:** Write unit tests for `/api/track` endpoint
- [x] **Task 11:** Generate event dictionary documentation
- [x] **Task 12:** Final verification (tsc, vitest, audit)

## Files Created

| File | Purpose |
|------|---------|
| `lib/analytics/events.ts` | Event name types + property interfaces |
| `lib/analytics/server.ts` | PostHog Node SDK wrapper |
| `lib/analytics/client.ts` | Client-side `useAnalytics()` hook |
| `app/api/track/route.ts` | POST endpoint for event tracking |
| `app/api/track/route.test.ts` | Unit tests (3 tests) |
| `components/onboarding/OnboardingWizard.tsx` | 5-step onboarding wizard |
| `docker-compose.posthog.yml` | PostHog self-hosted deployment |
| `docs/analytics/event-dictionary.md` | Event reference documentation |
| `docs/superpowers/specs/2026-08-18-posthog-analytics-design.md` | Design spec |
| `docs/superpowers/plans/2026-08-18-posthog-analytics-implementation.md` | This plan |

## Files Modified

| File | Changes |
|------|---------|
| `proxy.ts` | Added `X-Analytics-Consent` header |
| `app/auth/signup/SignUpForm.tsx` | Added signup event tracking |
| `app/auth/signin/SignInForm.tsx` | Added login_failed tracking + forgot password link |
| `app/api/assets/upload/complete/route.ts` | Added asset_uploaded tracking |
| `app/api/deployments/publish/route.ts` | Added deployment_published tracking |
| `app/api/payments/checkout/route.ts` | Added checkout_started tracking |
| `app/api/payments/webhook/route.ts` | Added checkout_completed, subscription_changed, payment_failed |
| `.env.example` | Added PostHog env vars |
| `package.json` | Added `posthog-node` dependency |

## Verification Results

- `pnpm tsc --noEmit` → 0 analytics errors
- `pnpm vitest run app/api/track/route.test.ts` → 3/3 pass
- All 12 events verified present via grep audit