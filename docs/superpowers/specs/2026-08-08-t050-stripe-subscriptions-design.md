# T-050 — Stripe Subscription Payments

**Date:** 2026-08-08
**Status:** Approved design
**Task:** T-050 (Payment integration: Stripe subscriptions)

## Overview

Recurring subscription billing via Stripe Checkout + Customer Portal. Three tiers
mapped to the book-page service prices. Subscription state synced to a
`Subscription` table via Stripe webhooks.

## Decisions

| Decision | Choice |
|----------|--------|
| Billing model | Recurring subscription |
| Tiers | Starter $299/mo, Pro $499/mo, Enterprise $799/mo |
| Stripe integration | Checkout (signup) + Customer Portal (management) |

## Architecture

### New files

```
prisma/migrations/YYYYMMDDHHMMSS_add_subscription/   # Subscription model
lib/stripe/server.ts                                  # Stripe SDK + helpers
lib/stripe/tiers.ts                                   # tier/price config + limits
lib/stripe/server.test.ts                             # unit tests (mock Stripe)
app/api/payments/checkout/route.ts                    # POST create checkout session
app/api/payments/portal/route.ts                      # POST create portal session
app/api/payments/webhook/route.ts                     # POST Stripe webhook handler
app/(marketing)/pricing/page.tsx                      # pricing page with Subscribe buttons
lib/server/repositories/subscription.repository.ts    # Subscription CRUD (tenant-scoped)
```

### Subscription model

```
model Subscription {
  id                 String   @id @default(uuid())
  userId             String   @map("user_userId")
  tenantId           String   @map("tenant_id")
  stripeCustomerId   String   @unique @map("stripe_customer_id")
  stripeSubscriptionId String  @unique @map("stripe_subscription_id")
  stripePriceId      String   @map("stripe_price_id")
  tier               String
  status             String
  currentPeriodStart DateTime? @map("current_period_start")
  currentPeriodEnd   DateTime? @map("current_period_end")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt

  @@index([tenantId])
  @@index([userId])
  @@map("subscriptions")
}
```

### Tiers

Price IDs from env (`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`).
Feature limits per tier enforced in app logic (project count, storage, collaborators).

### Flow

1. User picks tier → `POST /api/payments/checkout` → creates Stripe Checkout session → redirect to Stripe.
2. Stripe processes payment → `checkout.session.completed` webhook → activate Subscription.
3. User manages plan → `POST /api/payments/portal` → Customer Portal session → redirect.
4. Plan changes / cancellations → `customer.subscription.updated/deleted` webhooks → sync.

### Error handling

- Webhook signature verification (fail closed).
- Idempotent subscription activation.
- Checkout requires authenticated user with tenantId.

### Testing

- `lib/stripe/server.test.ts`: tier mapping, price-id lookup, session param assembly — mock Stripe SDK.

## Out of scope

- Proration UI, coupon codes, tax (Stripe handles via Dashboard config).
- Invoicing UI (Customer Portal covers it).
- Usage-based metering.
- Subscription gating middleware on existing routes (follow-up task).

## Depends on

- T-016/T-017 (booking flow, where subscription could gate features)
- T-032 (tenant_id RLS)
- T-036 (BullMQ queue pattern for webhook processing)
