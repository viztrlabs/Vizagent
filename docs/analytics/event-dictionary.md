# Analytics Event Dictionary

Source: `lib/analytics/events.ts`

## Authentication Events

| Event | Property | Type | Description |
|-------|----------|------|-------------|
| `signup_started` | `method` | `'email' \| 'oauth'` | Signup method |
| `signup_started` | `referrer` | `string` | Page referrer |
| `signup_completed` | `method` | `string` | Signup method used |
| `signup_failed` | `error_code` | `string` | Error code from auth |
| `signup_failed` | `method` | `string` | Signup method attempted |
| `login_failed` | `reason` | `'invalid_credentials' \| 'mfa_required' \| 'account_locked' \| 'unknown'` | Failure reason |

## Onboarding Events

| Event | Property | Type | Description |
|-------|----------|------|-------------|
| `onboarding_step_completed` | `step` | `number` | Step number (1-indexed) |
| `onboarding_step_completed` | `step_name` | `'welcome' \| 'project_setup' \| 'first_asset' \| 'publish' \| 'team_invite'` | Step identifier |
| `onboarding_completed` | `duration_ms` | `number` | Total onboarding time |
| `onboarding_completed` | `steps_completed` | `number` | Number of steps completed |

## Core Action Events

| Event | Property | Type | Description |
|-------|----------|------|-------------|
| `asset_uploaded` | `asset_id` | `string` | Asset UUID |
| `asset_uploaded` | `asset_type` | `'model' \| 'texture' \| 'scene' \| 'environment' \| 'other'` | Asset type |
| `asset_uploaded` | `file_size_mb` | `number` | File size in MB |
| `deployment_published` | `deployment_id` | `string` | Deployment UUID |
| `deployment_published` | `project_id` | `string` | Project UUID |
| `deployment_published` | `xr_mode` | `'tour' \| 'webxr' \| 'web_ar' \| 'vr' \| 'pixel_streaming'` | XR mode used |

## Monetization Events

| Event | Property | Type | Description |
|-------|----------|------|-------------|
| `checkout_started` | `plan_id` | `string` | Stripe price ID |
| `checkout_started` | `amount` | `number` | Amount in dollars |
| `checkout_started` | `currency` | `string` | Currency code |
| `checkout_completed` | `plan_id` | `string` | Stripe price ID |
| `checkout_completed` | `amount` | `number` | Amount in dollars |
| `checkout_completed` | `currency` | `string` | Currency code |
| `checkout_completed` | `subscription_id` | `string` | Stripe subscription ID |
| `subscription_changed` | `plan_id` | `string` | New plan ID |
| `subscription_changed` | `previous_plan_id` | `string \| null` | Old plan ID |
| `subscription_changed` | `subscription_id` | `string` | Stripe subscription ID |
| `subscription_changed` | `change_type` | `'upgrade' \| 'downgrade' \| 'cancel' \| 'resume'` | Change direction |
| `payment_failed` | `error_code` | `string` | Stripe error code |
| `payment_failed` | `invoice_id` | `string` | Stripe invoice ID |

## Server-Enriched Properties (Automatic)

| Property | Type | Description |
|----------|------|-------------|
| `user_id` | `string` | Authenticated user ID |
| `tenant_id` | `string` | Tenant ID |
| `session_id` | `string` | Browser session ID |
| `$lib` | `string` | Always `'viztr-server'` |
| `$lib_version` | `string` | Library version |